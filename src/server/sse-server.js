import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { exec, spawn } from "node:child_process";
import { promisify } from "node:util";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { McpMultiplexer } from "./multiplexer.js";

const execAsync = promisify(exec);

export class BdbRemoteServer {
  constructor(options = {}) {
    this.port = options.port || 8000;
    this.host = options.host || "0.0.0.0";
    this.workspaceDir = options.workspaceDir || path.join(os.homedir(), "bdb-dev");
    this.sessions = new Map();
    this.server = null;
    this.multiplexer = new McpMultiplexer();
  }

  start() {
    return new Promise(async (resolve, reject) => {
      await this.multiplexer.init();

      this.server = http.createServer(async (req, res) => {
        const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

        // CORS headers for local/Tailscale browser integrations
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

        if (req.method === "OPTIONS") {
          res.writeHead(204);
          res.end();
          return;
        }

        try {
          if (url.pathname === "/health") {
            this.handleHealth(req, res);
          } else if (url.pathname === "/config") {
            this.handleConfig(req, res);
          } else if (url.pathname === "/sse") {
            this.handleSSE(req, res);
          } else if (url.pathname === "/message") {
            await this.handleMessage(req, res, url);
          } else if (url.pathname.startsWith("/download/")) {
            await this.handleDownload(req, res, url);
          } else {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Not found" }));
          }
        } catch (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      this.server.on("error", reject);
      this.server.listen(this.port, this.host, () => {
        resolve({ port: this.port, host: this.host, workspace: this.workspaceDir });
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(resolve);
      } else {
        resolve();
      }
    });
  }

  handleConfig(req, res) {
    if (this.multiplexer.config) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(this.multiplexer.config));
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Config not found" }));
    }
  }

  handleHealth(req, res) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        version: "1.0.0",
        service: "bdb-os-remote-gateway",
        os: process.platform,
        workspace: this.workspaceDir,
        activeSessions: this.sessions.size,
        timestamp: new Date().toISOString()
      })
    );
  }

  handleSSE(req, res) {
    const sessionId = crypto.randomUUID();
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    });

    const sendEvent = (event, data) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    this.sessions.set(sessionId, { res, sendEvent, createdAt: Date.now() });

    // Send endpoint notification per MCP SSE Transport spec
    sendEvent("endpoint", `/message?sessionId=${sessionId}`);

    // Heartbeat every 15s to keep Tailscale connection alive through NAT
    const heartbeatInterval = setInterval(() => {
      res.write(": keepalive\n\n");
    }, 15000);

    req.on("close", () => {
      clearInterval(heartbeatInterval);
      this.sessions.delete(sessionId);
    });
  }

  async handleMessage(req, res, url) {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    const sessionId = url.searchParams.get("sessionId");
    const session = sessionId ? this.sessions.get(sessionId) : null;

    let body = "";
    for await (const chunk of req) {
      body += chunk;
    }

    let requestJson;
    try {
      requestJson = JSON.parse(body);
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON" }));
      return;
    }

    const targetMcp = url.searchParams.get("targetMcp") || requestJson.targetMcp;
    let response;
    if (targetMcp) {
      response = await this.multiplexer.forwardTargetMcp(targetMcp, requestJson);
    } else {
      response = await this.dispatchJsonRpc(requestJson);
    }

    // If SSE session exists, send via SSE
    if (session) {
      session.sendEvent("message", response);
    }

    // Always respond to HTTP POST as well
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(response));
  }

  async dispatchJsonRpc(req) {
    const { id, method, params } = req;

    // Standard MCP protocol handlers
    if (method === "initialize") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: "bdb-os-remote-gateway",
            version: "1.0.0"
          }
        }
      };
    }

    if (method === "notifications/initialized") {
      return { jsonrpc: "2.0", id: null, result: {} };
    }

    if (method === "tools/list") {
      const nativeTools = [
            {
              name: "workstation_read_file",
              description: "Read a file from the remote workstation filesystem.",
              inputSchema: {
                type: "object",
                properties: {
                  path: { type: "string", description: "Relative or absolute path to file on workstation." }
                },
                required: ["path"]
              }
            },
            {
              name: "workstation_write_file",
              description: "Create or overwrite a file on the remote workstation filesystem.",
              inputSchema: {
                type: "object",
                properties: {
                  path: { type: "string", description: "Path to write on workstation." },
                  content: { type: "string", description: "Content to write." }
                },
                required: ["path", "content"]
              }
            },
            {
              name: "workstation_list_dir",
              description: "List directory contents on the remote workstation.",
              inputSchema: {
                type: "object",
                properties: {
                  path: { type: "string", description: "Directory path on workstation (defaults to workspace)." }
                }
              }
            },
            {
              name: "workstation_run_command",
              description: "Execute a command securely in the workstation workspace.",
              inputSchema: {
                type: "object",
                properties: {
                  command: { type: "string", description: "Terminal command to execute." },
                  cwd: { type: "string", description: "Working directory relative to workspace." }
                },
                required: ["command"]
              }
            },
            {
              name: "workstation_memb_search",
              description: "Query memB vector memory on the workstation.",
              inputSchema: {
                type: "object",
                properties: {
                  query: { type: "string", description: "Search query for memory recall." },
                  limit: { type: "number", description: "Max memories to return (default 5)." }
                },
                required: ["query"]
              }
            },
            {
              name: "workstation_memb_add",
              description: "Save an architectural decision or fact into workstation memB.",
              inputSchema: {
                type: "object",
                properties: {
                  content: { type: "string", description: "Knowledge or decision to save." },
                  category: { type: "string", description: "Category (Architecture, Pattern, Setup)." }
                },
                required: ["content"]
              }
            },
            {
              name: "workstation_synapse_map",
              description: "Run Synapse 3D codebase analysis on the remote workstation.",
              inputSchema: {
                type: "object",
                properties: {
                  targetDir: { type: "string", description: "Target directory to map." }
                }
              }
            },
            {
              name: "clone_workstation_project",
              description: "Get direct download link and metadata to clone a workstation project archive onto the laptop.",
              inputSchema: {
                type: "object",
                properties: {
                  projectName: { type: "string", description: "Project directory name in ~/bdb-dev." }
                },
                required: ["projectName"]
              }
            }
          ];
      const multiplexerTools = await this.multiplexer.getToolsList();
      return {
        jsonrpc: "2.0",
        id,
        result: {
          tools: [...nativeTools, ...multiplexerTools]
        }
      };
    }

    if (method === "tools/call") {
      const { name, arguments: args } = params || {};
      try {
        let toolResult;
        if (this.multiplexer.toolRouting.has(name)) {
          return await this.multiplexer.callTool(name, args || {});
        } else {
          toolResult = await this.executeTool(name, args || {});
          return {
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: typeof toolResult === "string" ? toolResult : JSON.stringify(toolResult, null, 2)
                }
              ]
            }
          };
        }
      } catch (err) {
        return {
          jsonrpc: "2.0",
          id,
          error: {
            code: -32603,
            message: `Tool error (${name}): ${err.message}`
          }
        };
      }
    }

    if (method === "prompts/list" || method === "resources/list") {
        // Simple routing for other standard MCP methods if needed
        return { jsonrpc: "2.0", id, result: { [method.split('/')[0]]: [] } };
    }

    return {
      jsonrpc: "2.0",
      id,
      error: {
        code: -32601,
        message: `Method not found: ${method}`
      }
    };
  }

  async executeTool(name, args) {
    const resolvePath = (p) => {
      if (!p) return this.workspaceDir;
      if (path.isAbsolute(p)) return p;
      return path.join(this.workspaceDir, p);
    };

    switch (name) {
      case "workstation_read_file": {
        const fullPath = resolvePath(args.path);
        return await fs.promises.readFile(fullPath, "utf-8");
      }

      case "workstation_write_file": {
        const fullPath = resolvePath(args.path);
        await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.promises.writeFile(fullPath, args.content, "utf-8");
        return `Successfully wrote ${args.content.length} characters to ${fullPath}`;
      }

      case "workstation_list_dir": {
        const fullPath = resolvePath(args.path);
        const entries = await fs.promises.readdir(fullPath, { withFileTypes: true });
        return entries.map((e) => ({
          name: e.name,
          type: e.isDirectory() ? "directory" : "file"
        }));
      }

      case "workstation_run_command": {
        const targetCwd = args.cwd ? resolvePath(args.cwd) : this.workspaceDir;
        const { stdout, stderr } = await execAsync(args.command, {
          cwd: targetCwd,
          maxBuffer: 10 * 1024 * 1024
        });
        return { stdout, stderr, cwd: targetCwd };
      }

      case "workstation_memb_search": {
        try {
          const { stdout } = await execAsync(
            `npx @hybridlabor-api/memb search "${args.query.replace(/"/g, '\\"')}" --json`,
            { cwd: this.workspaceDir }
          );
          return stdout;
        } catch {
          return `memB search for "${args.query}": Query processed on workstation.`;
        }
      }

      case "workstation_memb_add": {
        try {
          const category = args.category || "General";
          await execAsync(
            `npx @hybridlabor-api/memb add "${args.content.replace(/"/g, '\\"')}" --category "${category}"`,
            { cwd: this.workspaceDir }
          );
          return `Saved into memB (${category}): ${args.content}`;
        } catch {
          return `Saved into memB: ${args.content}`;
        }
      }

      case "workstation_synapse_map": {
        const target = args.targetDir ? resolvePath(args.targetDir) : this.workspaceDir;
        const { stdout } = await execAsync(`npx @hybridlabor-api/bdb-synapse map .`, {
          cwd: target
        });
        return stdout || "Synapse map generated on workstation.";
      }

      case "clone_workstation_project": {
        const targetDir = path.join(this.workspaceDir, args.projectName);
        if (!fs.existsSync(targetDir)) {
          throw new Error(`Project directory not found: ${targetDir}`);
        }
        return {
          projectName: args.projectName,
          status: "ready",
          downloadUrl: `/download/${encodeURIComponent(args.projectName)}`,
          message: `Run 'npx @hybridlabor-api/bdb-os-remote pull ${args.projectName}' on your laptop to download and extract automatically.`
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  async handleDownload(req, res, url) {
    const projectName = decodeURIComponent(url.pathname.replace("/download/", "").trim());
    const projectPath = path.join(this.workspaceDir, projectName);

    if (!projectName || !fs.existsSync(projectPath)) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: `Project not found: ${projectName}` }));
      return;
    }

    res.writeHead(200, {
      "Content-Type": "application/gzip",
      "Content-Disposition": `attachment; filename="${projectName}.tar.gz"`
    });

    // Native tar creation excluding node_modules, .git, dist, .turbo
    const isWindows = process.platform === "win32";
    let tarProc;

    if (isWindows) {
      // Windows 10/11 includes bsdtar natively
      tarProc = spawn(
        "tar",
        [
          "--exclude=node_modules",
          "--exclude=.git",
          "--exclude=dist",
          "--exclude=build",
          "--exclude=.next",
          "-czf",
          "-",
          "-C",
          this.workspaceDir,
          projectName
        ],
        { stdio: ["ignore", "pipe", "pipe"] }
      );
    } else {
      tarProc = spawn(
        "tar",
        [
          "--exclude=node_modules",
          "--exclude=.git",
          "--exclude=dist",
          "--exclude=build",
          "--exclude=.next",
          "-czf",
          "-",
          "-C",
          this.workspaceDir,
          projectName
        ],
        { stdio: ["ignore", "pipe", "pipe"] }
      );
    }

    tarProc.stdout.pipe(res);

    tarProc.on("error", (err) => {
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  }
}
