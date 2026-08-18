# BDB OS Remote v2.0 - Execution Plan

## Mission
Refactor des bestehenden `@hybridlabor-api/bdb-os-remote` (v1.1.0) Node.js-Projekts in die v2.0 Server/Client Architektur.
Das neue System nennt sich **BDB CONNECT** und dient als universelles MCP-Gateway (API) sowie als Tailscale-Sidecar (Client) für AGY, Codex und Claude.

## Phasen

### Phase 1: BDB CONNECT & Tailscale Fundament
**Zugewiesen an:** `Godmode_Engineering`
- **Ziel:** Ersetzen des statischen Installer-Workflows durch einen adaptiven BDB CONNECT Daemon/CLI.
- **Tasks:**
  - Evaluierung und Integration von `tsnet` / Tailscale in das Node-Backend.
  - SSH-Routing und Tunnel-Setup für den ausgehenden Traffic definieren.
  - Anlegen der Grundstruktur in `src/` für `src/client` und `src/server`.

### Phase 2: MCP Gateway (Die Cloud API) & Compatibility Adapter
**Zugewiesen an:** `Godmode_Engineering`
- **Ziel:** Die BDB Cloud API als universellen Proxy etablieren & Claude-Rückwärtskompatibilität.
- **Tasks:**
  - `src/server/gateway.js` mit strikter Zero-Trust Tailscale IP Validierung.
  - `src/client/sidecar.js` als Local Compatibility Mock für Claude Desktop, AGY und Codex.
  - `bin/installer.js` auf Multi-Platform Support (AGY / Codex / Claude) erweitern.

### Phase 3: UI/UX & Dispatching (BDB CONNECT Menüleisten-App)
**Zugewiesen an:** `Godmode_UI_UX`
- **Ziel:** Verpackung in eine native macOS Menüleisten-App via Electron/Menubar.
- **Tasks:**
  - `src/ui/` mit Tailwind Dark-Mode Popover im Tailscale-Look.
  - IPC-Kommunikation für Server Start/Stop Toggle.
  - `01_frontend_spec.md` dokumentieren.

### Phase 4: Quality Gate & Release
**Zugewiesen an:** `Godmode_Shipping`
- **Ziel:** Security Audit, Build & Release Packaging.
- **Tasks:**
  - Context Isolation & Preload Security Bridge in Electron härten.
  - `npm test` Verifikation.
  - macOS App Bundle Kompilierung via `electron-builder`.
