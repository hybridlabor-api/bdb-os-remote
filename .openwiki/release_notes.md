# Release Notes

## [v1.1.0] – 2026-08-18
### Bilingual Interactive Documentation & Enhancements
- **Bilingual User Manual (`docs/manual/index.html`)**: Complete, standalone bilingual (DE/EN) interactive manual featuring vector SVG diagrams, instant language switching, pre-flight interactive checklist, copy-to-clipboard terminal blocks, live search, and print optimization.
- **German Reference Manual (`docs/BDB_OS_Remote_Benutzerhandbuch.md`)**: Full markdown manual covering setup, connection modes, offline pull, troubleshooting, and glossary.
- **Asymmetric Token Saving**: Enhanced Heimdall integration for low-bandwidth environments.

## [v1.0.0] – 2026-08-18
### Initial Release
- **SSE Gateway (`src/server/sse-server.js`)**: Native HTTP/SSE server running on port 8000 bound to Tailscale.
- **Client Proxy (`src/client/proxy.js`)**: `stdio`-to-SSE MCP bridge for Claude Desktop.
- **Project Pull (`src/client/clone.js`)**: Fast tarball streaming for offline project clones without `node_modules`.
- **Setup Wizard (`bin/installer.js`)**: Interactive CLI installer supporting Workstation and Laptop configurations.
- **HTML Guides (`src/docs/guide-generator.js`)**: NotebookLM-style clean minimalist setup guides.
