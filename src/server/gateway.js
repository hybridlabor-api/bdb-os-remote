import { TailscaleIntegration } from '../tailscale/tailscale.js';
import http from 'node:http';

export class BdbConnectGateway {
  constructor(options = {}) {
    this.port = options.port || 8000;
    this.host = options.host || '0.0.0.0';
    this.ts = new TailscaleIntegration({ mode: options.tsMode || 'daemon' });
    this.server = null;
  }

  async start() {
    this.server = http.createServer((req, res) => {
      const isValid = this.ts.validateTailscaleIp(req);
      
      if (!isValid && req.url !== '/health') {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Forbidden: Not a Tailscale IP' }));
        return;
      }

      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'online', role: 'mcp-gateway' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'success', message: 'Gateway processed request' }));
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
