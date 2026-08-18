# BDB CONNECT - Backend Schema & Architecture

## System Overview
BDB CONNECT is designed as a Zero-Trust MCP Gateway over Tailscale. It splits into two core components:

1. **BDB CONNECT Sidecar (Client)**
2. **MCP Gateway (Server)**

## Architecture Diagram
```mermaid
graph TD;
  Claude[Claude Desktop] -->|Local HTTP/Stdio| Sidecar[BDB CONNECT Sidecar]
  AGY[Antigravity CLI] -->|Local HTTP| Sidecar
  Sidecar -->|Tailscale Tunnel (100.x.x.x)| Gateway[MCP Gateway]
  Gateway -->|Dynamic Routing| Tools[Local Node/Agent Tools]
```

## Directory Structure
- `src/client/sidecar.js`: The local mock adapter that pretends to be an MCP server for local agents, tunneling requests.
- `src/server/gateway.js`: The central API validation layer. It checks `remoteAddress` to ensure requests come strictly from Tailscale nodes.
- `src/tailscale/tailscale.js`: Abstraction layer managing Tailscale state (Daemon fallback or Go `tsnet` integration).

## Security Model
- **Zero-Trust Validation:** The Gateway drops any request not originating from the `100.64.0.0/10` or `fd7a:115c:a1e0::/48` IP ranges.
- **SSO/API Keys (Upcoming):** Phase 2 will introduce API key headers or SSO tokens for fine-grained agent dispatching.
