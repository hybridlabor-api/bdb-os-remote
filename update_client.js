import fs from "fs";

const proxyPath = "/Users/timrennings/bdb-dev/bdb-os-remote/src/client/proxy.js";
let proxyContent = fs.readFileSync(proxyPath, "utf-8");

proxyContent = proxyContent.replace(
  'this.port = options.port || 8000;',
  'this.port = options.port || 8000;\n    this.targetMcp = options.targetMcp || null;'
);

proxyContent = proxyContent.replace(
  'const data = JSON.stringify(payload);',
  'if (this.targetMcp) payload.targetMcp = this.targetMcp;\n      const data = JSON.stringify(payload);'
);

fs.writeFileSync(proxyPath, proxyContent);

const cliPath = "/Users/timrennings/bdb-dev/bdb-os-remote/bin/cli.js";
let cliContent = fs.readFileSync(cliPath, "utf-8");

cliContent = cliContent.replace(
  'const port = parseInt(flags.port, 10) || 8000;',
  'const port = parseInt(flags.port, 10) || 8000;\n      const targetMcp = flags["target-mcp"] || null;'
).replace(
  'const proxy = new BdbRemoteProxy({ host, port });',
  'const proxy = new BdbRemoteProxy({ host, port, targetMcp });'
);

fs.writeFileSync(cliPath, cliContent);
