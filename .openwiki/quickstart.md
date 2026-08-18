# Quickstart Guide – BDB OS Remote

`@hybridlabor-api/bdb-os-remote` enables seamless, low-bandwidth remote AI development on stationary workstations from mobile laptops (e.g. while travelling on an ICE train).

## Installation

### Workstation Setup (Server Mode)
Run the interactive wizard on your stationary desktop:
```bash
npx @hybridlabor-api/bdb-os-remote installer
# Select [1] Workstation (Server Mode)
```
Or start directly:
```bash
npx @hybridlabor-api/bdb-os-remote server --port 8000
```

### Laptop Setup (Client Mode)
Run the wizard on your mobile laptop:
```bash
npx @hybridlabor-api/bdb-os-remote installer
# Select [2] Laptop (Client Mode)
# Enter your Workstation's Tailscale name (e.g. noah-workstation)
```
Restart Claude Desktop to load all remote tools!

## Project Cloning
To download any workstation project to your laptop for offline work:
```bash
npx @hybridlabor-api/bdb-os-remote pull <project-name>
```
