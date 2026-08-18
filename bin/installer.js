#!/usr/bin/env node

import readline from "node:readline";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import { execSync } from "node:child_process";
import { generateHtmlGuide } from "../src/docs/guide-generator.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

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

function checkTailscale() {
  try {
    const out = execSync("tailscale status", { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
    return out.length > 0;
  } catch {
    return false;
  }
}

function checkOpenSSH() {
  console.log("🔍 Auditing OpenSSH configuration...");
  try {
    const platform = process.platform;
    if (platform === "win32") {
      // Check if sshd is running on Windows
      const out = execSync("powershell -Command \"Get-Service sshd -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Status\"", { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
      if (out.trim() === "Running") {
        console.log("   ✅ Windows OpenSSH Server is installed and Running.");
      } else {
        console.log("   ⚠️ Windows OpenSSH Server is not running or not installed. (Optional for SSE, required for mosh/tmux fallback).");
      }
    } else if (platform === "darwin") {
      const out = execSync("sudo systemsetup -getremotelogin", { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
      if (out.includes("Remote Login: On")) {
        console.log("   ✅ macOS Remote Login (SSH) is enabled.");
      } else {
        console.log("   ⚠️ macOS Remote Login (SSH) is disabled. Enable it in Settings > Sharing.");
      }
    } else {
      const out = execSync("systemctl is-active sshd || systemctl is-active ssh", { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
      if (out.trim() === "active") {
        console.log("   ✅ Linux SSH Daemon is active.");
      } else {
        console.log("   ⚠️ Linux SSH Daemon is inactive.");
      }
    }
  } catch (err) {
    console.log("   ⚠️ Could not automatically verify OpenSSH status.");
  }
}

async function testTunnelConnection(host, port) {
  return new Promise((resolve) => {
    console.log(`\n🔌 Testing Tailscale tunnel to Workstation (http://${host}:${port}/health)...`);
    const req = http.get(`http://${host}:${port}/health`, { timeout: 5000 }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode === 200) {
          console.log("   ✅ Connection successful! Remote Gateway is ONLINE.");
          resolve(true);
        } else {
          console.log(`   ❌ Connection failed (HTTP ${res.statusCode}). Gateway might not be running yet.`);
          resolve(false);
        }
      });
    });
    
    req.on("error", (err) => {
      console.log(`   ❌ Tunnel test failed: ${err.message}.`);
      console.log(`   💡 Ensure the Workstation is turned on, Tailscale is connected, and the gateway is running.`);
      resolve(false);
    });
    
    req.on("timeout", () => {
      req.destroy();
      console.log(`   ❌ Tunnel test timed out. Tailscale might be disconnected or IP is wrong.`);
      resolve(false);
    });
  });
}

async function runWizard() {
  console.clear();
  console.log(`
=====================================================
🚀 BDB OS Remote Workspace – Setup Wizard (v1.0.1)
   Zero-Trust SSE Gateway & Mobile Thin-Client Setup
=====================================================
`);

  console.log("Checking Tailscale status...");
  const isTailscaleActive = checkTailscale();
  if (isTailscaleActive) {
    console.log("✅ Tailscale WireGuard Mesh is ACTIVE.\n");
  } else {
    console.log("⚠️  Tailscale CLI not detected or offline.");
    console.log("   Please ensure Tailscale is installed and logged in on both machines (https://tailscale.com).\n");
  }

  checkOpenSSH();

  console.log("\nHow do you want to configure THIS machine?");
  console.log("  [1] Workstation (Server Mode – Runs memB, Synapse, Filesystem & Zipper)");
  console.log("  [2] Laptop (Client Mode – Thin-Client with local Heimdall & Remote Bridge)");
  
  const choice = await ask("\nEnter choice [1 or 2]: ");

  if (choice.trim() === "1") {
    console.log("\n--- Configuring Workstation (Server Mode) ---");
    const port = (await ask("Enter server port (default 8000): ")) || "8000";
    const workspace = (await ask(`Enter workspace path (default ${path.join(os.homedir(), "bdb-dev")}): `)) || path.join(os.homedir(), "bdb-dev");

    console.log("\n📦 Generating Workstation Guide...");
    const guidePath = generateHtmlGuide("server", { port });

    console.log(`\n✅ Workstation Configuration Complete!`);
    console.log(`📄 Guide generated: ${guidePath}`);
    console.log(`\nTo start the gateway now, run:`);
    console.log(`   npx @hybridlabor-api/bdb-os-remote server --port ${port} --workspace "${workspace}"\n`);

  } else if (choice.trim() === "2") {
    console.log("\n--- Configuring Laptop (Client Mode) ---");
    const host = (await ask("Enter Workstation Tailscale Name/IP (e.g. noah-workstation): ")) || "noah-workstation";
    const port = (await ask("Enter Workstation port (default 8000): ")) || "8000";

    
    console.log("\nChoose Client Mode:");
    console.log("  [1] Standard Multiplexer (Recommended) - Loads one bridge that multiplexes all remote tools");
    console.log("  [2] Config Injector (Not Recommended) - Injects every remote server individually into local config");
    const clientMode = await ask("\nEnter choice [1 or 2]: ");

    const configPath = getClaudeConfigPath();
    console.log(`\nTarget Claude Desktop config: ${configPath}`);

    let currentConfig = { mcpServers: {} };
    try {
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, "utf-8");
        currentConfig = JSON.parse(raw);
        if (!currentConfig.mcpServers) currentConfig.mcpServers = {};
      }
    } catch {
      currentConfig = { mcpServers: {} };
    }

    // 1. Injected Local Heimdall Token Saver
    currentConfig.mcpServers["heimdall_token_saver"] = {
      command: "npx",
      args: ["-y", "@hybridlabor-api/heimdall-token-saver"]
    };

    // 2. Client Mode Logic
    if (clientMode.trim() === "2") {
      try {
        console.log(`\nFetching remote config from http://${host}:${port}/config...`);
        const res = await new Promise((resolve, reject) => {
          http.get(`http://${host}:${port}/config`, (res) => {
            let data = "";
            res.on("data", (chunk) => data += chunk);
            res.on("end", () => resolve(JSON.parse(data)));
          }).on("error", reject);
        });
        
        if (res.mcpServers) {
          for (const [mcpName, mcpConf] of Object.entries(res.mcpServers)) {
            if (mcpName === "heimdall_token_saver" || mcpName === "bdb_remote_gateway") continue;
            currentConfig.mcpServers[mcpName] = {
              command: "npx",
              args: ["-y", "@hybridlabor-api/bdb-os-remote", "client", "--host", host, "--port", port, "--target-mcp", mcpName]
            };
          }
        }
        console.log("✅ Injected local Heimdall Token Saver & individualized remote servers into Claude config.");
      } catch (e) {
        console.log("❌ Failed to fetch remote config:", e.message);
      }
    } else {
      currentConfig.mcpServers["bdb_remote_gateway"] = {
        command: "npx",
        args: ["-y", "@hybridlabor-api/bdb-os-remote", "client", "--host", host, "--port", port]
      };
      console.log("✅ Injected local Heimdall Token Saver & remote BDB Gateway into Claude config.");
    }


    console.log("\n📦 Generating Laptop Guide...");
    const guidePath = generateHtmlGuide("client", { tailscaleHost: host, port });

    await testTunnelConnection(host, port);

    console.log(`\n✅ Laptop Client Configuration Complete!`);
    console.log(`📄 Guide generated: ${guidePath}`);
    console.log(`💡 Restart Claude Desktop to activate the remote workstation tools!\n`);
  } else {
    console.log("❌ Invalid selection. Exiting.");
  }

  rl.close();
}

runWizard().catch((err) => {
  console.error("❌ Wizard error:", err.message);
  rl.close();
});
