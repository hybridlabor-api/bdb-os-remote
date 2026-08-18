# BDB OS Remote – Agent Operating Manual

This repository contains `@hybridlabor-api/bdb-os-remote`, the Zero-Trust SSE Gateway & Mobile Thin-Client Bridge for Claude Desktop and AI agents connecting over Tailscale.

## Documentation & Wiki
- Entrypoint: [.openwiki/quickstart.md](.openwiki/quickstart.md)
- Architecture & Design: [.openwiki/architecture.md](.openwiki/architecture.md)
- Conventions: [.openwiki/conventions.md](.openwiki/conventions.md)
- Release Notes: [.openwiki/release_notes.md](.openwiki/release_notes.md)
- Decisions: [.openwiki/decisions.md](.openwiki/decisions.md)

## Core Architecture
- **Server (`src/server/sse-server.js`)**: Runs on the stationary Windows/macOS Workstation, exposing MCP JSON-RPC over HTTP/SSE. Binds to port 8000 on the Tailscale network interface.
- **Client Proxy (`src/client/proxy.js`)**: Runs locally inside Claude Desktop as a `stdio` MCP server, proxying requests to the remote SSE endpoint.
- **Local Token Saver**: On the laptop client, `@hybridlabor-api/heimdall-token-saver` runs *locally* in Claude Desktop to compress outputs before sending to LLM APIs.
- **Clone Tool (`src/client/clone.js`)**: Provides `npx @hybridlabor-api/bdb-os-remote pull <project>` to download project archives on-the-fly without `node_modules`.

## Development Workflows
- Start server: `node bin/cli.js server --port 8000`
- Start client proxy: `node bin/cli.js client --host <tailscale-ip>`
- Run tests: `npm test`
