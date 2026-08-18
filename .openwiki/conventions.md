# Development Conventions

- **Code Style**: Modern ES Modules (ESM) with Node.js 18+ native built-in modules (`node:http`, `node:fs`, `node:path`, `node:child_process`).
- **Language**: English for all code, comments, documentation, and error messages.
- **Security**: No hardcoded IP addresses or secrets. Network endpoints must be bound to Tailscale interfaces.
- **Error Handling**: Graceful degradation with clear user instructions if Tailscale is disconnected.
