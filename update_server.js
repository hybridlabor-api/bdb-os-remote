import fs from "fs";
import path from "path";

const sseServerPath = "/Users/timrennings/bdb-dev/bdb-os-remote/src/server/sse-server.js";
let content = fs.readFileSync(sseServerPath, "utf-8");

content = content.replace(
  'import crypto from "node:crypto";',
  'import crypto from "node:crypto";\nimport { McpMultiplexer } from "./multiplexer.js";'
);

content = content.replace(
  'this.server = null;',
  'this.server = null;\n    this.multiplexer = new McpMultiplexer();'
);

content = content.replace(
  'this.server = http.createServer(async (req, res) => {',
  'await this.multiplexer.init();\n\n      this.server = http.createServer(async (req, res) => {'
);

content = content.replace(
  'this.handleHealth(req, res);',
  'this.handleHealth(req, res);\n          } else if (url.pathname === "/config") {\n            this.handleConfig(req, res);'
);

content = content.replace(
  'handleHealth(req, res) {',
  'handleConfig(req, res) {\n    if (this.multiplexer.config) {\n      res.writeHead(200, { "Content-Type": "application/json" });\n      res.end(JSON.stringify(this.multiplexer.config));\n    } else {\n      res.writeHead(404, { "Content-Type": "application/json" });\n      res.end(JSON.stringify({ error: "Config not found" }));\n    }\n  }\n\n  handleHealth(req, res) {'
);

content = content.replace(
  'const response = await this.dispatchJsonRpc(requestJson);',
  'const targetMcp = url.searchParams.get("targetMcp") || requestJson.targetMcp;\n    let response;\n    if (targetMcp) {\n      response = await this.multiplexer.forwardTargetMcp(targetMcp, requestJson);\n    } else {\n      response = await this.dispatchJsonRpc(requestJson);\n    }'
);

content = content.replace(
  /if \(method === "tools\/list"\) \{\s*return \{\s*jsonrpc: "2\.0",\s*id,\s*result: \{\s*tools: \[([\s\S]*?)\]\s*\}\s*\};\s*\}/,
  `if (method === "tools/list") {
      const nativeTools = [$1];
      const multiplexerTools = await this.multiplexer.getToolsList();
      return {
        jsonrpc: "2.0",
        id,
        result: {
          tools: [...nativeTools, ...multiplexerTools]
        }
      };
    }`
);

content = content.replace(
  /if \(method === "tools\/call"\) \{[\s\S]*?return \{\s*jsonrpc: "2\.0",\s*id,\s*error: \{\s*code: -32601,\s*message: \`Method not found: \$\{method\}\`\s*\}\s*\};\s*\}/,
  `if (method === "tools/call") {
      const { name, arguments: args } = params || {};
      try {
        let toolResult;
        if (this.multiplexer.toolRouting.has(name)) {
          return await this.multiplexer.callTool(name, args || {});
        } else {
          toolResult = await this.executeTool(name, args || {});
          return {
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: typeof toolResult === "string" ? toolResult : JSON.stringify(toolResult, null, 2)
                }
              ]
            }
          };
        }
      } catch (err) {
        return {
          jsonrpc: "2.0",
          id,
          error: {
            code: -32603,
            message: \`Tool error (\${name}): \${err.message}\`
          }
        };
      }
    }

    if (method === "prompts/list" || method === "resources/list") {
        // Simple routing for other standard MCP methods if needed
        return { jsonrpc: "2.0", id, result: { [method.split('/')[0]]: [] } };
    }

    return {
      jsonrpc: "2.0",
      id,
      error: {
        code: -32601,
        message: \`Method not found: \${method}\`
      }
    };
  }`
);

fs.writeFileSync(sseServerPath, content);
