# Architecture Decisions (ADRs)

## ADR-001: Asymmetric Module Installation
- **Decision**: Install `@hybridlabor-api/heimdall-token-saver` *locally* on the client laptop, but run `memB`, `Synapse`, and filesystem tools *remotely* on the workstation.
- **Rationale**: Claude Desktop on the laptop submits prompts to the Anthropic API. Heimdall needs to filter and compress output locally before API egress. Computationally heavy tools (vector DB, 3D mapping) stay on the workstation.

## ADR-002: Native Tarball Streaming for Clone Tool
- **Decision**: Stream `.tar.gz` directly from the `/download/:project` endpoint excluding `node_modules`, `.git`, and `dist`.
- **Rationale**: Reduces archive size by ~90%, enabling project downloads in seconds even over ICE cellular connections.
