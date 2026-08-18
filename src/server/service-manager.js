import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cliPath = path.resolve(__dirname, "../../bin/cli.js");
const nodePath = process.execPath;

const SERVICE_NAME_MAC = "com.hybridlabor.bdb-remote";
const SERVICE_NAME_WIN = "BDB-Remote-Gateway";
const SERVICE_NAME_LINUX = "bdb-remote.service";

export class ServiceManager {
  constructor(options = {}) {
    this.port = options.port || 8000;
    this.workspace = options.workspace || path.join(os.homedir(), "bdb-dev");
    this.platform = process.platform;
  }

  getPlistPath() {
    return path.join(os.homedir(), "Library", "LaunchAgents", `${SERVICE_NAME_MAC}.plist`);
  }

  getSystemdPath() {
    return path.join(os.homedir(), ".config", "systemd", "user", SERVICE_NAME_LINUX);
  }

  install() {
    console.log(`⚙️  Installing BDB Remote Gateway OS Service on ${this.platform}...`);
    if (this.platform === "darwin") {
      const plistPath = this.getPlistPath();
      const dir = path.dirname(plistPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const logsDir = path.join(os.homedir(), "Library", "Logs");
      const outLog = path.join(logsDir, "bdb-remote.stdout.log");
      const errLog = path.join(logsDir, "bdb-remote.stderr.log");

      const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${SERVICE_NAME_MAC}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${nodePath}</string>
        <string>${cliPath}</string>
        <string>server</string>
        <string>--port</string>
        <string>${this.port}</string>
        <string>--workspace</string>
        <string>${this.workspace}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${outLog}</string>
    <key>StandardErrorPath</key>
    <string>${errLog}</string>
</dict>
</plist>
`;
      fs.writeFileSync(plistPath, plistContent, "utf-8");

      try {
        execSync(`launchctl unload "${plistPath}" 2>/dev/null || true`, { stdio: "ignore" });
        execSync(`launchctl load -w "${plistPath}"`, { stdio: "inherit" });
        console.log(`✅ macOS LaunchAgent successfully installed & loaded!`);
        console.log(`📄 Plist: ${plistPath}`);
        console.log(`📝 Logs: ${outLog}`);
      } catch (err) {
        console.error(`❌ Failed to load LaunchAgent: ${err.message}`);
      }

    } else if (this.platform === "win32") {
      try {
        const psCmd = `schtasks /Create /TN "${SERVICE_NAME_WIN}" /TR "powershell -WindowStyle Hidden -Command \\"& '${nodePath}' '${cliPath}' server --port ${this.port} --workspace '${this.workspace}'\\"" /SC ONLOGON /F`;
        execSync(psCmd, { stdio: "inherit" });
        execSync(`schtasks /Run /TN "${SERVICE_NAME_WIN}"`, { stdio: "ignore" });
        console.log(`✅ Windows Scheduled Task '${SERVICE_NAME_WIN}' installed & started!`);
      } catch (err) {
        console.error(`❌ Failed to install Windows Task: ${err.message}`);
      }

    } else {
      const unitPath = this.getSystemdPath();
      const dir = path.dirname(unitPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const unitContent = `[Unit]
Description=BDB Remote SSE Gateway Daemon
After=network.target

[Service]
ExecStart=${nodePath} ${cliPath} server --port ${this.port} --workspace "${this.workspace}"
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
`;
      fs.writeFileSync(unitPath, unitContent, "utf-8");
      try {
        execSync("systemctl --user daemon-reload", { stdio: "inherit" });
        execSync(`systemctl --user enable --now ${SERVICE_NAME_LINUX}`, { stdio: "inherit" });
        console.log(`✅ Linux systemd user service enabled and started!`);
      } catch (err) {
        console.error(`❌ Failed to enable systemd service: ${err.message}`);
      }
    }
  }

  uninstall() {
    console.log(`🗑️  Uninstalling BDB Remote Gateway OS Service...`);
    if (this.platform === "darwin") {
      const plistPath = this.getPlistPath();
      try {
        execSync(`launchctl unload "${plistPath}" 2>/dev/null || true`, { stdio: "ignore" });
        if (fs.existsSync(plistPath)) fs.unlinkSync(plistPath);
        console.log(`✅ macOS LaunchAgent removed.`);
      } catch (err) {
        console.error(`❌ Error removing LaunchAgent: ${err.message}`);
      }
    } else if (this.platform === "win32") {
      try {
        execSync(`schtasks /End /TN "${SERVICE_NAME_WIN}" 2>nul || true`, { stdio: "ignore" });
        execSync(`schtasks /Delete /TN "${SERVICE_NAME_WIN}" /F`, { stdio: "inherit" });
        console.log(`✅ Windows Scheduled Task removed.`);
      } catch (err) {
        console.error(`❌ Error removing Windows Task: ${err.message}`);
      }
    } else {
      try {
        execSync(`systemctl --user disable --now ${SERVICE_NAME_LINUX} 2>/dev/null || true`, { stdio: "ignore" });
        const unitPath = this.getSystemdPath();
        if (fs.existsSync(unitPath)) fs.unlinkSync(unitPath);
        execSync("systemctl --user daemon-reload 2>/dev/null || true", { stdio: "ignore" });
        console.log(`✅ Linux systemd service removed.`);
      } catch (err) {
        console.error(`❌ Error removing systemd service: ${err.message}`);
      }
    }
  }

  status() {
    console.log(`🔍 Checking BDB Remote Gateway OS Service status...`);
    if (this.platform === "darwin") {
      try {
        const out = execSync(`launchctl list | grep ${SERVICE_NAME_MAC} || true`, { encoding: "utf-8" });
        if (out.trim()) {
          console.log(`✅ Service is REGISTERED in macOS launchd: ${out.trim()}`);
        } else {
          console.log(`ℹ️  Service is not currently registered in launchctl.`);
        }
      } catch (err) {
        console.log(`ℹ️  Service not found.`);
      }
    } else if (this.platform === "win32") {
      try {
        const out = execSync(`schtasks /Query /TN "${SERVICE_NAME_WIN}"`, { encoding: "utf-8" });
        console.log(out);
      } catch (err) {
        console.log(`ℹ️  Task '${SERVICE_NAME_WIN}' not found.`);
      }
    } else {
      try {
        const out = execSync(`systemctl --user status ${SERVICE_NAME_LINUX}`, { encoding: "utf-8" });
        console.log(out);
      } catch (err) {
        console.log(`ℹ️  systemd service not active.`);
      }
    }
  }
}
