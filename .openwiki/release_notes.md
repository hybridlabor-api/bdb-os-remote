# Release Notes

## [v1.0.0] – 2026-08-18
### Initial Release
- **SSE Gateway (`src/server/sse-server.js`)**: Native HTTP/SSE server running on port 8000 bound to Tailscale.
- **Client Proxy (`src/client/proxy.js`)**: `stdio`-to-SSE MCP bridge for Claude Desktop.
- **Project Pull (`src/client/clone.js`)**: Fast tarball streaming for offline project clones without `node_modules`.
- **Setup Wizard (`bin/installer.js`)**: Interactive CLI installer supporting Workstation and Laptop configurations.
- **HTML Guides (`src/docs/guide-generator.js`)**: NotebookLM-style clean minimalist setup guides.
