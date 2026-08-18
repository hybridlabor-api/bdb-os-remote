import assert from "node:assert";
import http from "node:http";
import { BdbRemoteServer } from "../src/server/sse-server.js";

async function runTests() {
  console.log("🧪 Starting BDB Remote Gateway test suite...\n");

  const server = new BdbRemoteServer({ port: 8999, host: "127.0.0.1" });
  await server.start();
  console.log("✓ Server started on port 8999");

  // 1. Health check
  const healthRes = await new Promise((resolve) => {
    http.get("http://127.0.0.1:8999/health", (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(JSON.parse(data)));
    });
  });
  assert.strictEqual(healthRes.status, "ok");
  assert.strictEqual(healthRes.service, "bdb-os-remote-gateway");
  console.log("✓ /health check passed");

  // 2. Initialize JSON-RPC
  const initRes = await new Promise((resolve) => {
    const postData = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {}
    });
    const req = http.request(
      "http://127.0.0.1:8999/message",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData)
        }
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(JSON.parse(data)));
      }
    );
    req.write(postData);
    req.end();
  });
  assert.strictEqual(initRes.result.serverInfo.name, "bdb-os-remote-gateway");
  console.log("✓ JSON-RPC initialize passed");

  // 3. Tools list
  const toolsRes = await new Promise((resolve) => {
    const postData = JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {}
    });
    const req = http.request(
      "http://127.0.0.1:8999/message",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData)
        }
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(JSON.parse(data)));
      }
    );
    req.write(postData);
    req.end();
  });
  assert(Array.isArray(toolsRes.result.tools));
  assert(toolsRes.result.tools.some((t) => t.name === "clone_workstation_project"));
  assert(toolsRes.result.tools.some((t) => t.name === "workstation_memb_search"));
  console.log(`✓ JSON-RPC tools/list passed (${toolsRes.result.tools.length} tools registered)`);

  await server.stop();
  console.log("✓ Server stopped cleanly");

  console.log("\n🎉 All tests passed successfully!");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
