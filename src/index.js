export { BdbRemoteServer } from "./server/sse-server.js";
export { BdbRemoteProxy } from "./client/proxy.js";
export { pullProject } from "./client/clone.js";
export { generateHtmlGuide } from "./docs/guide-generator.js";

// Automatically boot Electron Menubar App if running inside Electron runtime
if (process.versions && process.versions.electron) {
  import("./ui/main.js");
}
