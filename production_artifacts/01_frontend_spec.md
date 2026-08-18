# BDB CONNECT - Frontend Specification (Phase 4)

## Overview
The BDB CONNECT frontend is a native macOS menubar app built with Electron and `menubar`. It provides a lightweight, Tailscale-like interface for managing the agent gateway.

## Architecture
- **Main Process**: Uses `menubar` to manage a tray icon and instantiate a frameless renderer window beneath it. Handles the lifecycle of `BDBConnectGateway`.
- **Renderer Process**: A plain HTML/Tailwind interface served with `nodeIntegration: true` to easily communicate with the main process.

## Aesthetics & Design Tokens
- **Style**: Dark mode, minimalist, "Anti-Slop".
- **Color Palette**:
  - Background: `bg-gray-900`
  - Border: `border-gray-800`
  - Highlight/Accent: `blue-500` / `blue-600`
  - Status Offline: `red-500`
  - Status Connecting: `yellow-500`
  - Status Online: `green-500`
- **Typography**: Tailwind defaults with mono font (`font-mono`) for IP addresses.

## Interface Elements
1. **Header**: 
   - Displays a glowing status indicator.
   - Shows the app title "BDB CONNECT".
2. **Identity Section**:
   - Displays the detected Tailscale IP.
   - Tag indicating the network type ("Tailscale").
3. **Mode Switch**:
   - A toggle button mimicking iOS/macOS switches.
   - Uses IPC (`ipcRenderer.send`) to trigger the main process to start/stop the server.
   - Displays synchronous UI state (yellow glow) until `server-status` is returned from IPC.
4. **Remote Dispatch**:
   - Simple text input for future use to push tasks into the tailnet.

## IPC Communication
- **Renderer -> Main**: `toggle-server` (boolean state)
- **Main -> Renderer**: `server-status` ({ status: 'running'|'stopped'|'error', info?: any })

## Next Steps
- Implement Tailscale IP auto-detection instead of static IP placeholder in the UI.
- Wire the dispatch input to trigger actual RPC actions.
- Package the app using `electron-builder`.
