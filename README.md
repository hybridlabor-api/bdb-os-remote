# @hybridlabor-api/bdb-os-remote

[![npm version](https://img.shields.io/npm/v/@hybridlabor-api/bdb-os-remote.svg?style=flat-square)](https://www.npmjs.com/package/@hybridlabor-api/bdb-os-remote)
[![CI](https://github.com/hybridlabor-api/bdb-os-remote/actions/workflows/ci.yml/badge.svg)](https://github.com/hybridlabor-api/bdb-os-remote/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

> **Zero-Trust SSE Gateway & Mobile Thin-Client Bridge** for Claude Desktop, Claude Code, and AI Agents over Tailscale.

Work on your stationary workstation directly from your mobile laptop (e.g. on an ICE train) with **zero latency**, **under 5 KB/s bandwidth**, and **full access to all 152 BDB skills, memB vector memory, and workstation compute**.

---

## ⚡ Quick Start

### 1. Interactive Installer (Recommended)
Run the wizard on either machine:
```bash
npx @hybridlabor-api/bdb-os-remote installer
```
- Select **`[1] Workstation`** on your desktop.
- Select **`[2] Laptop`** on your laptop (configures `claude_desktop_config.json` automatically).

---

### 2. Manual CLI Commands

#### Start Server (on Workstation)
```bash
npx @hybridlabor-api/bdb-os-remote server --port 8000
```

#### Run Client Proxy (inside Claude Desktop on Laptop)
```bash
npx @hybridlabor-api/bdb-os-remote client --host noah-workstation --port 8000
```

#### Clone Project (Offline Fallback for Long Tunnels)
```bash
npx @hybridlabor-api/bdb-os-remote pull <project-name>
```

#### Check Gateway Health
```bash
npx @hybridlabor-api/bdb-os-remote status --host noah-workstation
```

---

## 🏗️ Architecture

```mermaid
graph TD
    subgraph Laptop ["💻 Laptop Client"]
        CD[Claude Desktop]
        HEIM["🛡️ Heimdall Token Saver (Local)"]
        PROXY["🌐 BDB SSE Proxy"]
        CD --> HEIM
        CD --> PROXY
    end

    subgraph Tailscale ["🔒 Tailscale WireGuard Mesh"]
        TS["Bandwidth: < 5 KB/s"]
    end

    subgraph Workstation ["🖥️ Stationary Workstation"]
        GW["🔌 BDB Remote SSE Gateway :8000"]
        MEMB["🧠 memB Vector Memory"]
        SYN["👁️ Synapse 3D Engine"]
        FS["📁 Workspace Filesystem"]
        GW --> MEMB
        GW --> SYN
        GW --> FS
    end

    PROXY -->|HTTP/SSE| TS
    TS --> GW
```

---

## 🔒 Security & Requirements
- **Tailscale**: Both machines must be logged into the same Tailscale network.
- **No Open Ports**: Zero public port forwardings needed; protected by WireGuard encryption.
- **Node.js**: Requires Node.js >= 18.0.0.

## 📖 Documentation
Detailed technical documentation and architecture decisions are available in [.openwiki/quickstart.md](.openwiki/quickstart.md).

## 📄 License
MIT © BDB Dev Team
