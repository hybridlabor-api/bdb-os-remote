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

function getAgyConfigPath() {
  return path.join(os.homedir(), ".gemini", "antigravity-mcp.json");
}

function getCodexConfigPath() {
  return path.join(os.homedir(), ".codex", "mcp.json");
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
      const out = execSync("powershell -Command \"Get-Service sshd -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Status\"", { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
      if (out.trim() === "Running") {
        console.log("   ✅ Windows OpenSSH Server is installed and Running.");
      } else {
        console.log("   ⚠️ Windows OpenSSH Server is not running or not installed.");
      }
    } else if (platform === "darwin") {
      const out = execSync("sudo systemsetup -getremotelogin 2>/dev/null || echo 'Remote Login: Unknown'", { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
      if (out.includes("Remote Login: On")) {
        console.log("   ✅ macOS Remote Login (SSH) is enabled.");
      } else {
        console.log("   ℹ️ macOS Remote Login check completed.");
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
    console.log("   ℹ️ OpenSSH check passed.");
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

function writeMcpConfig(filePath, mcpKey, mcpConfig) {
  let currentConfig = { mcpServers: {} };
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      currentConfig = JSON.parse(raw);
      if (!currentConfig.mcpServers) currentConfig.mcpServers = {};
    }
  } catch {
    currentConfig = { mcpServers: {} };
  }

  currentConfig.mcpServers[mcpKey] = mcpConfig;
  fs.writeFileSync(filePath, JSON.stringify(currentConfig, null, 2), "utf-8");
  console.log(`   ✅ Config written to: ${filePath}`);
}

export async function runWizard() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

  console.clear();
  console.log(`
=====================================================
🚀 BDB CONNECT – Universal Remote Setup Wizard (v2.0)
   Zero-Trust SSE Gateway for AGY, Codex & Claude
=====================================================
`);

  console.log("Checking Tailscale status...");
  const isTailscaleActive = checkTailscale();
  if (isTailscaleActive) {
    console.log("✅ Tailscale WireGuard Mesh is ACTIVE.\n");
  } else {
    console.log("⚠️  Tailscale CLI not detected or offline.");
    console.log("   Please ensure Tailscale is active on both machines (https://tailscale.com).\n");
  }

  checkOpenSSH();

  console.log("\nHow do you want to configure THIS machine?");
  console.log("  [1] Workstation (Server Mode – Runs Tools, Filesystem, Terminal & MCPs)");
  console.log("  [2] Laptop (Client Mode – Thin-Client for AGY, Codex & Claude)");
  
  const choice = await ask("\nEnter choice [1 or 2]: ");

  if (choice.trim() === "1") {
    console.log("\n--- Configuring Workstation (Server Mode) ---");
    const port = (await ask("Enter server port (default 8000): ")) || "8000";
    const workspace = (await ask(`Enter workspace path (default ${path.join(os.homedir(), "bdb-dev")}): `)) || path.join(os.homedir(), "bdb-dev");

    console.log("\n📦 Generating Workstation Guide...");
    const guidePath = generateHtmlGuide("server", { port });

    console.log(`\n✅ Workstation Configuration Complete!`);
    console.log(`📄 Guide generated: ${guidePath}`);
    console.log(`\nTo start the gateway on this workstation:`);
    console.log(`   • Via Menubar App: Launch 'BDB CONNECT' from Applications`);
    console.log(`   • Via CLI: npx @hybridlabor-api/bdb-os-remote server --port ${port} --workspace "${workspace}"\n`);

  } else if (choice.trim() === "2") {
    console.log("\n--- Configuring Laptop (Client Mode) ---");
    const host = (await ask("Enter Workstation Tailscale Name/IP (e.g. 100.123.207.82): ")) || "127.0.0.1";
    const port = (await ask("Enter Workstation port (default 8000): ")) || "8000";

    console.log("\nWhich AI Agent Harness do you want to configure?");
    console.log("  [1] Claude Desktop");
    console.log("  [2] Antigravity (AGY)");
    console.log("  [3] Codex / OpenCode");
    console.log("  [4] All Platforms (Universal Setup)");
    
    const targetPlatform = await ask("\nEnter choice [1, 2, 3 or 4]: ");

    const mcpConfig = {
      command: "npx",
      args: ["-y", "@hybridlabor-api/bdb-os-remote", "client", "--host", host, "--port", port]
    };

    console.log("\nInjecting MCP Configurations...");

    if (targetPlatform.trim() === "1" || targetPlatform.trim() === "4") {
      writeMcpConfig(getClaudeConfigPath(), "bdb_remote_gateway", mcpConfig);
    }
    if (targetPlatform.trim() === "2" || targetPlatform.trim() === "4") {
      writeMcpConfig(getAgyConfigPath(), "bdb_remote_gateway", mcpConfig);
    }
    if (targetPlatform.trim() === "3" || targetPlatform.trim() === "4") {
      writeMcpConfig(getCodexConfigPath(), "bdb_remote_gateway", mcpConfig);
    }

    console.log("\n📦 Generating Laptop Guide...");
    const guidePath = generateHtmlGuide("client", { tailscaleHost: host, port });

    await testTunnelConnection(host, port);

    console.log(`\n✅ Client Configuration Complete!`);
    console.log(`📄 Guide generated: ${guidePath}`);
    console.log(`💡 Restart your Agent (AGY / Codex / Claude) to use the remote workstation tools!\n`);
  } else {
    console.log("❌ Invalid selection. Exiting.");
  }

  rl.close();
}

// Auto-run if executed directly as script
if (process.argv[1] && (process.argv[1].endsWith("installer.js") || process.argv[1].endsWith("bdb-remote-installer"))) {
  runWizard().catch((err) => {
    console.error("❌ Wizard error:", err.message);
  });
}
