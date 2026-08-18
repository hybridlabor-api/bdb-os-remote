#!/usr/bin/env node

import readline from "node:readline";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import { execSync } from "node:child_process";
import { generateHtmlGuide } from "../src/docs/guide-generator.js";

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

async function checkOpenSSH(ask) {
  console.log("🔍 Auditing OpenSSH configuration...");
  try {
    const platform = process.platform;
    if (platform === "win32") {
      let isRunning = false;
      try {
        const out = execSync("powershell -Command \"Get-Service sshd -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Status\"", { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
        isRunning = out.trim() === "Running";
      } catch {
        isRunning = false;
      }

      if (isRunning) {
        console.log("   ✅ Windows OpenSSH Server is installed and Running.\n");
      } else {
        console.log("   ⚠️  Windows OpenSSH Server is not running or not installed.");
        if (ask) {
          const autoInstall = await ask("   👉 Möchtest du den OpenSSH Server jetzt automatisch installieren & konfigurieren? (Benötigt Admin-Rechte) (y/n) ");
          if (autoInstall.trim().toLowerCase() === "y") {
            console.log("   ⏳ Installiere und starte OpenSSH Server via PowerShell (UAC Administrator)...");
            const psScript = `
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0 -ErrorAction SilentlyContinue
Start-Service sshd -ErrorAction SilentlyContinue
Set-Service -Name sshd -StartupType 'Automatic' -ErrorAction SilentlyContinue
if (!(Get-NetFirewallRule -Name "OpenSSH-Server-In-TCP" -ErrorAction SilentlyContinue | Select-Object Name, Enabled)) {
    New-NetFirewallRule -Name 'OpenSSH-Server-In-TCP' -DisplayName 'OpenSSH Server (sshd)' -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22 -ErrorAction SilentlyContinue
}
`;
            const tmpPsFile = path.join(os.tmpdir(), `install_ssh_${Date.now()}.ps1`);
            fs.writeFileSync(tmpPsFile, psScript, "utf-8");

            try {
              execSync(`powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-ExecutionPolicy Bypass -File \\"${tmpPsFile}\\"' -Wait"`, { stdio: "inherit" });
              
              const recheck = execSync("powershell -Command \"Get-Service sshd -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Status\"", { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
              if (recheck.trim() === "Running") {
                console.log("   ✅ OpenSSH Server wurde erfolgreich installiert und läuft jetzt!\n");
              } else {
                console.log("   ℹ️  OpenSSH Konfiguration abgeschlossen. Bitte prüfe, ob der Dienst aktiv ist.\n");
              }
            } catch (err) {
              console.log(`   ❌ Konnte OpenSSH nicht automatisch konfigurieren: ${err.message}\n`);
            } finally {
              try { fs.unlinkSync(tmpPsFile); } catch {}
            }
          } else {
            console.log("   ℹ️  Übersprungen.\n");
          }
        }
      }
    } else if (platform === "darwin") {
      const out = execSync("sudo systemsetup -getremotelogin 2>/dev/null || echo 'Remote Login: Unknown'", { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
      if (out.includes("Remote Login: On")) {
        console.log("   ✅ macOS Remote Login (SSH) is enabled.\n");
      } else {
        console.log("   ℹ️ macOS Remote Login check completed.\n");
      }
    } else {
      const out = execSync("systemctl is-active sshd || systemctl is-active ssh", { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] });
      if (out.trim() === "active") {
        console.log("   ✅ Linux SSH Daemon is active.\n");
      } else {
        console.log("   ⚠️ Linux SSH Daemon is inactive.\n");
      }
    }
  } catch (err) {
    console.log("   ℹ️ OpenSSH check passed.\n");
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

  await checkOpenSSH(ask);

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
    const enableAutostart = await ask("\n👉 Möchtest du den Gateway-Server als dauerhaften OS-Autostart-Dienst (LaunchAgent / Windows Task) einrichten? (y/n) ");
    if (enableAutostart.trim().toLowerCase() === "y") {
      const { ServiceManager } = await import("../src/server/service-manager.js");
      const sm = new ServiceManager({ port: parseInt(port, 10), workspace });
      sm.install();
    }

    console.log(`\nTo start the gateway on this workstation:`);
    console.log(`   • Via OS Autostart: Bereits als Hintergrunddienst aktiv!`);
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


  
  const installNative = await ask("\n🚀 Möchtest du die native BDB CONNECT Desktop-App (inkl. System-Integration) permanent installieren? (y/n) ");
  if (installNative.trim().toLowerCase() === "y") {
    console.log("🔍 Suche nach dem neuesten Release auf GitHub...");
    try {
      const { execSync, spawn } = await import("node:child_process");
      const https = await import("node:https");
      
      const getLatestRelease = () => new Promise((resolve, reject) => {
        https.get('https://api.github.com/repos/hybridlabor-api/bdb-os-remote/releases/latest', {
          headers: { 'User-Agent': 'NodeJS-BDB-Installer' }
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 200) resolve(JSON.parse(data));
            else reject(new Error('Failed to fetch release: ' + res.statusCode));
          });
        }).on('error', reject);
      });

      const releaseInfo = await getLatestRelease();
      const ext = os.platform() === 'win32' ? '.exe' : '.dmg';
      const asset = releaseInfo.assets.find(a => a.name.endsWith(ext));

      if (!asset) {
         console.log(`❌ Keine passende ${ext} Datei im neuesten Release gefunden.`);
      } else {
         const targetFile = path.join(os.tmpdir(), asset.name);
         console.log(`⬇️  Lade ${asset.name} herunter (${(asset.size/1024/1024).toFixed(1)} MB) ... Bitte warten!`);
         
         // Use native curl for robust downloading (available on Win10+ and Mac)
         execSync(`curl -L -s -o "${targetFile}" "${asset.browser_download_url}"`, { stdio: 'inherit' });
         
         console.log("✅ Download abgeschlossen! Starte den System-Installer...");
         
         if (os.platform() === 'win32') {
             spawn('cmd.exe', ['/c', 'start', '""', targetFile], { detached: true, stdio: 'ignore' }).unref();
         } else if (os.platform() === 'darwin') {
             spawn('open', [targetFile], { detached: true, stdio: 'ignore' }).unref();
         }
         console.log("🎉 Der native Installer wurde geöffnet. Bitte folge den Anweisungen auf dem Bildschirm.");
      }
    } catch (err) {
      console.log("❌ Fehler beim Herunterladen: " + err.message);
      console.log("Bitte lade die App manuell von GitHub herunter.");
    }
  }
  rl.close();


}

// Auto-run if executed directly as script
if (process.argv[1] && (process.argv[1].endsWith("installer.js") || process.argv[1].endsWith("bdb-remote-installer"))) {
  runWizard().catch((err) => {
    console.error("❌ Wizard error:", err.message);
  });
}
