# BDB CONNECT v2.1 — Services Dashboard Execution Plan

**Cycle:** /startcycle · **Trigger session:** BDB OS Dashboard discovery (2026-08-22)
**Baseline:** `d94b5dd` (v2.0.0, clean tree) · Snapshot branch: `snapshot/v2.0-pre-dashboard`
**Input artifacts:**
- `~/Downloads/BDB_OS_DASHBOARD_AUDIT/port_conflicts_and_autostart_audit.md` (port map + daemon gaps)

**Scope decisions from session:**
- ❌ Remote Dispatch: DROPPED (UI field stays as-is or gets removed in UI stream)
- ✅ Services Launcher (WebUI opener with health status, local + workstation scope)
- ✅ Module Update Monitor (npm drift for the 8 `@hybridlabor-api/*` modules)
- ✅ Port-default fix (`8000` → `9080`) to resolve CONFLICT-2

---

## Phase 1 — Decomposition (Planner_Orchestrator)

### Stream A: Backend & Architecture (Godmode_Engineering)

| # | Task | Files | Depends |
|---|---|---|---|
| A1 | Service registry loader + validator | `src/server/service-registry.js` (new). Reads `~/.config/bdb-connect/services.json`, falls back to built-in defaults per port map below | — |
| A2 | Health prober | In `service-registry.js`: concurrent `fetch` with 1 s timeout, TTL 30 s cache | A1 |
| A3 | Module update checker | `src/updater/module-updates.js` (new): local `package.json` version vs `npm view <name> version` + `git rev-list --count HEAD..@{u}`; cache TTL 6 h | — |
| A4 | Gateway endpoints | `sse-server.js`: `GET /v1/services`, `GET /v1/modules/updates` (behind existing zero-trust IP check) | A2, A3 |
| A5 | Port default fix | `gateway.js`, `sse-server.js`: default `8000` → `9080` | — |

**Default service registry (from audit artifact §4):**

```json
[
  { "name": "Agent Workspace", "url": "http://127.0.0.1:3101", "healthPath": "/readyz", "scope": "local" },
  { "name": "BDB CONNECT Gateway", "url": "http://127.0.0.1:9080", "healthPath": "/health", "scope": "local" },
  { "name": "Synapse 3D", "url": "http://127.0.0.1:7781", "healthPath": "/", "scope": "local" },
  { "name": "memB Dashboard", "url": "http://127.0.0.1:7790", "healthPath": "/", "scope": "local" },
  { "name": "memB API", "url": "http://127.0.0.1:8888", "healthPath": "/", "scope": "local" },
  { "name": "SaaS Console", "url": "http://127.0.0.1:7785", "healthPath": "/", "scope": "local" },
  { "name": "UniFi Panel", "url": "http://127.0.0.1:8085", "healthPath": "/", "scope": "local" }
]
```

Workstation scope: same list, host rewritten to the gateway's Tailscale IP when
fetched via `/v1/services` from a remote client.

### Stream B: Frontend / Electron UI (Godmode_UI_UX)

| # | Task | Files | Depends |
|---|---|---|---|
| B1 | IPC bridge | `preload.js`: channels `services:list`, `modules:getUpdates`, `services:open` | A4 |
| B2 | SERVICES section | `index.html`: status-dot rows (🟢/🔴), click → `shell.openExternal`, refresh button; Anti-Slop, existing purple/frosted-glass tokens | B1 |
| B3 | WORKSTATION SERVICES section | Same component, data via tailnet fetch of `/v1/services`; hidden when this machine IS the server | B1 |
| B4 | MODULES section + tray badge | Update badge count on rows `local → npm`; red dot on tray icon when >0 | B1 |
| B5 | Remove/repurpose dead Remote Dispatch field | `index.html` | — |

### Stream C: Media & EventTech — N/A (no media scope)

### Infra tasks (Engineering stream, post-merge)

| # | Task |
|---|---|
| I1 | LaunchAgent `com.bdb.memb.plist` (API :8888 + dashboard :7790) |
| I2 | LaunchAgent `com.bdb.synapse.plist` (`synapse serve --port 7781`) |

---

## Phase 2 — Parallel Execution Contract

- Hand-offs strictly via `production_artifacts/01_frontend_spec.md` and `02_backend_schema.md`
- Data contract: `{ services: [{ name, url, healthPath, scope, status, latencyMs }], modules: [{ name, localVer, npmVer, gitBehind, outdated }] }`

## Phase 3 — Quality Gate (Godmode_Shipping)

1. `npm test` extended: registry defaults valid JSON schema; prober mock; endpoint auth (non-Tailscale IP → 403)
2. Manual smoke: `npx electron .` → popover renders both sections, click-through opens browser
3. No hardcoded absolute user paths in shipped code (registry path via `os.homedir()`)
4. Gate: `Status: PASSED (100% Green)` → `04_release_report.md`

## Phase 4 — Release & Memory Sync (/ship)

1. openwiki sync: `.openwiki/architecture.md` + `release_notes.md` (v2.1.0)
2. memB ingest of new artifacts
3. Commit (conventional), tag `v2.1.0`, push private remote
