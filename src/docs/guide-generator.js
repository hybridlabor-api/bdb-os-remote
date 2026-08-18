import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export function generateHtmlGuide(mode = "client", options = {}) {
  const isServer = mode === "server";
  const title = isServer ? "BDB OS Remote – Workstation Server Guide" : "BDB OS Remote – Laptop Client Guide";
  const tailscaleHost = options.tailscaleHost || "noah-workstation";
  const port = options.port || 8000;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    :root {
      --bg: #fafafa;
      --card-bg: #ffffff;
      --text: #171717;
      --text-muted: #737373;
      --border: #e5e5e5;
      --accent: #000000;
      --code-bg: #f4f4f5;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #09090b;
        --card-bg: #18181b;
        --text: #f4f4f5;
        --text-muted: #a1a1aa;
        --border: #27272a;
        --accent: #ffffff;
        --code-bg: #27272a;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 40px 20px;
    }
    .container {
      max-width: 840px;
      margin: 0 auto;
    }
    header {
      border-bottom: 2px solid var(--border);
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 8px; }
    .subtitle { color: var(--text-muted); font-size: 16px; }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      background: var(--code-bg);
      border: 1px solid var(--border);
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 12px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }
    h2 { font-size: 20px; font-weight: 600; margin-bottom: 16px; letter-spacing: -0.01em; }
    p { margin-bottom: 16px; color: var(--text); }
    ul, ol { margin-left: 20px; margin-bottom: 16px; }
    li { margin-bottom: 8px; }
    code {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
      font-size: 14px;
      background: var(--code-bg);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--border);
    }
    pre {
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      overflow-x: auto;
      margin-bottom: 16px;
    }
    pre code {
      background: none;
      padding: 0;
      border: none;
    }
    .callout {
      border-left: 4px solid var(--accent);
      background: var(--code-bg);
      padding: 16px;
      border-radius: 0 8px 8px 0;
      margin-bottom: 20px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    @media (max-width: 600px) {
      .grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${title}</h1>
      <div class="subtitle">Zero-Trust SSE Gateway for Claude Desktop & BDB OS over Tailscale</div>
      <span class="badge">${isServer ? "🖥️ SERVER MODE (WORKSTATION)" : "💻 CLIENT MODE (LAPTOP)"}</span>
    </header>

    ${
      isServer
        ? `
    <div class="card">
      <h2>🚀 Workstation Server Status</h2>
      <p>The BDB Remote SSE Gateway is configured to run on this machine.</p>
      <ul>
        <li><strong>Listening Port:</strong> <code>${port}</code></li>
        <li><strong>Tailscale Binding:</strong> Accessible via your Tailscale IP or MagicDNS</li>
        <li><strong>Connected Tools:</strong> Filesystem, memB Vector DB, Synapse 3D, and Project Zipper</li>
      </ul>
      <div class="callout">
        <strong>Autostart Command:</strong><br>
        <code>npx @hybridlabor-api/bdb-os-remote server --port ${port}</code>
      </div>
    </div>

    <div class="card">
      <h2>🔒 Security & Access</h2>
      <p>The server is strictly protected through the Tailscale WireGuard Mesh. No open router ports or public internet exposure is required.</p>
      <ol>
        <li>Verify Tailscale is active: <code>tailscale status</code></li>
        <li>Check health endpoint: <code>http://localhost:${port}/health</code></li>
      </ol>
    </div>
    `
        : `
    <div class="card">
      <h2>🚀 Laptop Client Configuration</h2>
      <p>Your laptop is set up as a mobile thin-client connecting to <code>${tailscaleHost}</code>.</p>
      <div class="callout">
        <strong>Asymmetric Architecture:</strong><br>
        • <strong>Heimdall Token Saver:</strong> Runs <em>locally</em> on this laptop to compress tokens before API calls.<br>
        • <strong>memB, Synapse & Workspace:</strong> Run <em>remotely</em> on the workstation over the SSE tunnel.
      </div>
    </div>

    <div class="card">
      <h2>📦 Project Cloning (ICE Offline Fallback)</h2>
      <p>If you anticipate losing cellular connection in long tunnels, you can clone any workstation project locally:</p>
      <pre><code>npx @hybridlabor-api/bdb-os-remote pull &lt;project-name&gt;</code></pre>
      <p>This pulls the project archive over Tailscale (excluding heavy <code>node_modules</code>) and extracts it directly into <code>~/bdb-dev-local/</code>.</p>
    </div>

    <div class="card">
      <h2>🧩 Claude Desktop Integration</h2>
      <p>Your <code>claude_desktop_config.json</code> has been configured automatically with the MCP SSE Bridge.</p>
      <pre><code>{
  "mcpServers": {
    "heimdall_token_saver": {
      "command": "npx",
      "args": ["-y", "@hybridlabor-api/heimdall-token-saver"]
    },
    "bdb_remote_gateway": {
      "command": "npx",
      "args": ["-y", "@hybridlabor-api/bdb-os-remote", "client", "--host", "${tailscaleHost}", "--port", "${port}"]
    }
  }
}</code></pre>
    </div>
    `
    }

    <div class="card">
      <h2>🛠️ Quick Troubleshooting</h2>
      <ul>
        <li><strong>Connection lost:</strong> Run <code>tailscale ping ${tailscaleHost}</code> to verify VPN tunnel.</li>
        <li><strong>Restart Gateway:</strong> Run <code>npx @hybridlabor-api/bdb-os-remote server</code> on the workstation.</li>
        <li><strong>Check status:</strong> Run <code>npx @hybridlabor-api/bdb-os-remote status --host ${tailscaleHost}</code>.</li>
      </ul>
    </div>
  </div>
</body>
</html>`;

  const filename = isServer ? "BDB_WORKSTATION_GUIDE.html" : "BDB_LAPTOP_CLIENT_GUIDE.html";
  const outputPath = path.join(os.homedir(), filename);
  fs.writeFileSync(outputPath, html, "utf-8");
  return outputPath;
}
