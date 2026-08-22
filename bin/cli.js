#!/usr/bin/env node

import { BdbRemoteServer } from "../src/server/sse-server.js";
import { BdbRemoteProxy } from "../src/client/proxy.js";
import { pullProject } from "../src/client/clone.js";
import http from "node:http";

const args = process.argv.slice(2);
const command = args[0] || "help";

function parseFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].substring(2);
      const nextVal = argv[i + 1];
      if (nextVal && !nextVal.startsWith("--")) {
        flags[key] = nextVal;
        i++;
      } else {
        flags[key] = true;
      }
    }
  }
  return flags;
}

const flags = parseFlags(args.slice(1));

async function main() {
  switch (command) {
    case "installer":
    case "setup":
    case "wizard": {
      const { runWizard } = await import("./installer.js");
      await runWizard();
      break;
    }

    case "service": {
      const { ServiceManager } = await import("../src/server/service-manager.js");
      const subAction = args[1] || "status";
      const port = parseInt(flags.port, 10) || parseInt(process.env.PORT, 10) || parseInt(process.env.BDB_REMOTE_PORT, 10) || 9080;
      const workspace = flags.workspace || undefined;
      const sm = new ServiceManager({ port, workspace });

      switch (subAction) {
        case "install":
          sm.install();
          break;
        case "uninstall":
        case "remove":
          sm.uninstall();
          break;
        case "status":
          sm.status();
          break;
        default:
          console.log("Usage: bdb-remote service [install|uninstall|status] [--port 9080] [--workspace <path>]");
          break;
      }
      break;
    }

    case "server": {
      const port = parseInt(flags.port, 10) || parseInt(process.env.PORT, 10) || parseInt(process.env.BDB_REMOTE_PORT, 10) || 9080;
      const targetMcp = flags["target-mcp"] || null;
      const host = flags.host || "0.0.0.0";
      const workspace = flags.workspace || undefined;

      const server = new BdbRemoteServer({ port, host, workspaceDir: workspace });
      const info = await server.start();
      console.log(`\n🚀 BDB Remote SSE Gateway running on http://${info.host}:${info.port}`);
      console.log(`📂 Workspace root: ${info.workspace}`);
      console.log(`🔒 Bound to all interfaces (protected via Tailscale mesh)\n`);
      break;
    }

    case "client": {
      const host = flags.host || "127.0.0.1";
      const port = parseInt(flags.port, 10) || parseInt(process.env.PORT, 10) || parseInt(process.env.BDB_REMOTE_PORT, 10) || 9080;

      const proxy = new BdbRemoteProxy({ host, port, targetMcp });
      await proxy.start();
      break;
    }

    case "pull": {
      const projectName = args[1];
      if (!projectName || projectName.startsWith("--")) {
        console.error("❌ Usage: bdb-remote pull <project-name> [--host <ip>] [--port 9080]");
        process.exit(1);
      }
      await pullProject(projectName, {
        host: flags.host,
        port: parseInt(flags.port, 10) || parseInt(process.env.PORT, 10) || parseInt(process.env.BDB_REMOTE_PORT, 10) || 9080,
        dest: flags.dest
      });
      break;
    }

    case "status": {
      const host = flags.host || "127.0.0.1";
      const port = parseInt(flags.port, 10) || parseInt(process.env.PORT, 10) || parseInt(process.env.BDB_REMOTE_PORT, 10) || 9080;
      console.log(`🔍 Checking status of BDB Remote Gateway at http://${host}:${port}/health...`);

      http.get(`http://${host}:${port}/health`, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode === 200) {
            console.log("✅ Remote Gateway is ONLINE!");
            console.log(JSON.stringify(JSON.parse(data), null, 2));
          } else {
            console.error(`❌ Server returned error status: ${res.statusCode}`);
          }
        });
      }).on("error", (err) => {
        console.error(`❌ Could not connect to remote gateway: ${err.message}`);
      });
      break;
    }

    default: {
      console.log(`
BDB OS Remote Workspace CLI v1.0.0

Usage:
  bdb-remote server [--port 9080] [--workspace <path>]
    Start the remote SSE gateway daemon on the Workstation.

  bdb-remote client [--host <ip/magicdns>] [--port 9080]
    Run the stdio-to-SSE bridge for Claude Desktop on the Laptop.

  bdb-remote pull <project-name> [--host <ip/magicdns>] [--port 9080]
    Clone a workstation project archive onto the local laptop.

  bdb-remote status [--host <ip/magicdns>] [--port 9080]
    Check the health status of the remote gateway.

  bdb-remote service [install|uninstall|status] [--port 9080] [--workspace <path>]
    Manage the persistent OS autostart background daemon (LaunchAgent / Windows Task).

  bdb-remote ui
    Launch the BDB CONNECT Desktop Menubar App.

  bdb-remote-installer
    Launch the interactive setup wizard.
      `);
      break;
    }
  }
}

main().catch((err) => {
  console.error("❌ Fatal error:", err.message);
  process.exit(1);
});
