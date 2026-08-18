import { TailscaleIntegration } from '../tailscale/tailscale.js';
import http from 'node:http';

export class BdbConnectSidecar {
  constructor(options = {}) {
    this.host = options.host || '127.0.0.1';
    this.port = options.port || 8000;
    this.targetGateway = options.targetGateway || 'http://gateway.tailnet.net:8000';
    this.ts = new TailscaleIntegration({ mode: options.tsMode || 'daemon' });
    this.server = null;
  }

  async start() {
    const tsIp = await this.ts.getMyIp();
    console.log(`Starting Sidecar. Tailscale IP detected: ${tsIp}`);

    this.server = http.createServer((req, res) => {
      // Local Compatibility Mock: intercept local stdio/HTTP from Claude
      // and tunnel it to the target gateway over Tailscale.
      console.log(`[Sidecar] Intercepting request for ${req.url}`);
      
      // Simulating tunnel to Gateway
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'tunneled', 
        message: 'Mock adapter bridged request to MCP Gateway',
        tailscale: tsIp 
      }));
    });

    return new Promise((resolve) => {
      this.server.listen(this.port, this.host, () => {
        resolve({ host: this.host, port: this.port });
      });
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
  }
}
