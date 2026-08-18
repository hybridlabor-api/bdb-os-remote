import fs from "fs";

const installerPath = "/Users/timrennings/bdb-dev/bdb-os-remote/bin/installer.js";
let content = fs.readFileSync(installerPath, "utf-8");

content = content.replace(
  'const configPath = getClaudeConfigPath();',
  `
    console.log("\\nChoose Client Mode:");
    console.log("  [1] Standard Multiplexer (Recommended) - Loads one bridge that multiplexes all remote tools");
    console.log("  [2] Config Injector (Not Recommended) - Injects every remote server individually into local config");
    const clientMode = await ask("\\nEnter choice [1 or 2]: ");

    const configPath = getClaudeConfigPath();`
);

content = content.replace(
  /\/\/ 2\. Injected Remote BDB Gateway via SSE Proxy[\s\S]*?console\.log\("✅ Injected local Heimdall Token Saver & remote BDB Gateway into Claude config\."\);/,
  `// 2. Client Mode Logic
    if (clientMode.trim() === "2") {
      try {
        console.log(\`\\nFetching remote config from http://\${host}:\${port}/config...\`);
        const res = await new Promise((resolve, reject) => {
          http.get(\`http://\${host}:\${port}/config\`, (res) => {
            let data = "";
            res.on("data", (chunk) => data += chunk);
            res.on("end", () => resolve(JSON.parse(data)));
          }).on("error", reject);
        });
        
        if (res.mcpServers) {
          for (const [mcpName, mcpConf] of Object.entries(res.mcpServers)) {
            if (mcpName === "heimdall_token_saver" || mcpName === "bdb_remote_gateway") continue;
            currentConfig.mcpServers[mcpName] = {
              command: "npx",
              args: ["-y", "@hybridlabor-api/bdb-os-remote", "client", "--host", host, "--port", port, "--target-mcp", mcpName]
            };
          }
        }
        console.log("✅ Injected local Heimdall Token Saver & individualized remote servers into Claude config.");
      } catch (e) {
        console.log("❌ Failed to fetch remote config:", e.message);
      }
    } else {
      currentConfig.mcpServers["bdb_remote_gateway"] = {
        command: "npx",
        args: ["-y", "@hybridlabor-api/bdb-os-remote", "client", "--host", host, "--port", port]
      };
      console.log("✅ Injected local Heimdall Token Saver & remote BDB Gateway into Claude config.");
    }
`
);

fs.writeFileSync(installerPath, content);
