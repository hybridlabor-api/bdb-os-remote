import http from "node:http";
import readline from "node:readline";

export class BdbRemoteProxy {
  constructor(options = {}) {
    this.host = options.host || "127.0.0.1";
    this.port = options.port || 8000;
    this.baseUrl = `http://${this.host}:${this.port}`;
    this.sessionId = null;
    this.connected = false;
  }

  async start() {
    this.initStdinListener();
  }

  initStdinListener() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    rl.on("line", async (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      try {
        const jsonRpcRequest = JSON.parse(trimmed);
        const response = await this.sendJsonRpc(jsonRpcRequest);
        if (response) {
          process.stdout.write(JSON.stringify(response) + "\n");
        }
      } catch (err) {
        process.stdout.write(
          JSON.stringify({
            jsonrpc: "2.0",
            id: null,
            error: {
              code: -32700,
              message: `Parse/Remote error: ${err.message}`
            }
          }) + "\n"
        );
      }
    });

    process.stdin.on("end", () => {
      process.exit(0);
    });
  }

  sendJsonRpc(payload) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(payload);
      const url = new URL(`${this.baseUrl}/message`);

      const req = http.request(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(data)
          },
          timeout: 30000
        },
        (res) => {
          let responseBody = "";
          res.on("data", (chunk) => {
            responseBody += chunk;
          });
          res.on("end", () => {
            try {
              const json = JSON.parse(responseBody);
              resolve(json);
            } catch {
              resolve({
                jsonrpc: "2.0",
                id: payload.id,
                error: { code: -32603, message: `Invalid response from remote: ${responseBody}` }
              });
            }
          });
        }
      );

      req.on("error", (err) => {
        resolve({
          jsonrpc: "2.0",
          id: payload.id,
          error: {
            code: -32000,
            message: `Remote workstation unreachable (${this.baseUrl}): ${err.message}. Check Tailscale connection.`
          }
        });
      });

      req.on("timeout", () => {
        req.destroy();
        resolve({
          jsonrpc: "2.0",
          id: payload.id,
          error: {
            code: -32000,
            message: `Remote workstation timeout (${this.baseUrl}). Cellular/train connection stalled.`
          }
        });
      });

      req.write(data);
      req.end();
    });
  }
}
