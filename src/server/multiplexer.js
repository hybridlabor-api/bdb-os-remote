import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import readline from "node:readline";

function getClaudeConfigPath() {
  const platform = process.platform;
  if (platform === "win32") {
    const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
    return path.join(appData, "Claude", "claude_desktop_config.json");
  } else if (platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json");
  } else {
    return path.join(os.homedir(), ".config", "Claude", "claude_desktop_config.json");
  }
}

export class McpMultiplexer {
  constructor() {
    this.servers = new Map();
    this.toolRouting = new Map();
    this.requestPromises = new Map();
    this.config = null;
  }

  async init() {
    const configPath = getClaudeConfigPath();
    if (!fs.existsSync(configPath)) {
      console.warn(`[Multiplexer] No config found at ${configPath}`);
      return;
    }
    
    try {
      this.config = JSON.parse(await fs.promises.readFile(configPath, "utf-8"));
    } catch (e) {
      console.error(`[Multiplexer] Failed to parse config: ${e.message}`);
      return;
    }

    if (!this.config.mcpServers) return;

    for (const [name, serverConfig] of Object.entries(this.config.mcpServers)) {
      if (name === "heimdall_token_saver" || name === "bdb_remote_gateway") {
        continue;
      }
      this.spawnServer(name, serverConfig);
    }
  }

  spawnServer(name, serverConfig) {
    console.log(`[Multiplexer] Spawning ${name}...`);
    const env = { ...process.env, ...(serverConfig.env || {}) };
    const proc = spawn(serverConfig.command, serverConfig.args || [], {
      env,
      stdio: ["pipe", "pipe", "pipe"]
    });

    proc.stderr.on("data", (data) => {
      // Optional logging
    });

    proc.on("error", (err) => {
      console.error(`[Multiplexer] Server ${name} error:`, err);
    });

    proc.on("exit", (code) => {
      console.log(`[Multiplexer] Server ${name} exited with code ${code}`);
      this.servers.delete(name);
    });

    const rl = readline.createInterface({
      input: proc.stdout,
      terminal: false
    });

    rl.on("line", (line) => {
      if (!line.trim()) return;
      try {
        const msg = JSON.parse(line);
        if (msg.id !== undefined && this.requestPromises.has(msg.id)) {
          const { resolve, reject } = this.requestPromises.get(msg.id);
          this.requestPromises.delete(msg.id);
          if (msg.error) {
            reject(msg.error);
          } else {
            resolve(msg.result);
          }
        }
      } catch (e) {
        // Not a JSON RPC message or invalid JSON
      }
    });

    this.servers.set(name, proc);
    
    // Initialize standard protocol for tools discovery
    this.sendJsonRpc(name, "initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "bdb-multiplexer", version: "1.1.0" }
    }).then(() => {
      this.sendJsonRpc(name, "notifications/initialized", {}).catch(() => {});
      return this.sendJsonRpc(name, "tools/list", {});
    }).then((res) => {
      if (res && res.tools) {
        for (const tool of res.tools) {
          this.toolRouting.set(tool.name, name);
        }
        console.log(`[Multiplexer] Discovered ${res.tools.length} tools from ${name}`);
      }
    }).catch(err => {
      console.error(`[Multiplexer] Error initializing ${name}:`, err);
    });
  }

  sendJsonRpc(serverName, method, params) {
    return new Promise((resolve, reject) => {
      const proc = this.servers.get(serverName);
      if (!proc) {
        return reject(new Error(`Server ${serverName} not found or not running`));
      }
      const id = crypto.randomUUID();
      this.requestPromises.set(id, { resolve, reject });
      
      const payload = JSON.stringify({
        jsonrpc: "2.0",
        id,
        method,
        params
      });
      
      proc.stdin.write(payload + "\n");
    });
  }

  async getToolsList() {
    let allTools = [];
    for (const [name, proc] of this.servers.entries()) {
      try {
        const res = await this.sendJsonRpc(name, "tools/list", {});
        if (res && res.tools) {
          allTools = allTools.concat(res.tools);
          for (const tool of res.tools) {
            this.toolRouting.set(tool.name, name);
          }
        }
      } catch (e) {
        console.warn(`[Multiplexer] Failed to get tools from ${name}:`, e.message);
      }
    }
    return allTools;
  }

  async callTool(name, args) {
    const serverName = this.toolRouting.get(name);
    if (!serverName) {
      throw new Error(`Tool ${name} not found in any multiplexed server`);
    }
    return await this.sendJsonRpc(serverName, "tools/call", { name, arguments: args });
  }

  async forwardTargetMcp(serverName, requestJson) {
    if (!this.servers.has(serverName)) {
      throw new Error(`Target MCP server ${serverName} not running`);
    }
    const proc = this.servers.get(serverName);
    
    // For direct forwarding, we wrap the result directly since it's passing through
    return new Promise((resolve, reject) => {
       const originalId = requestJson.id;
       const id = crypto.randomUUID();
       this.requestPromises.set(id, { resolve: (res) => resolve({ jsonrpc: "2.0", id: originalId, result: res }), reject: (err) => resolve({ jsonrpc: "2.0", id: originalId, error: err }) });
       const payload = JSON.stringify({ ...requestJson, id });
       proc.stdin.write(payload + "\n");
    });
  }
}
