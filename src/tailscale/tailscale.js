import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export class TailscaleIntegration {
  constructor(options = {}) {
    this.mode = options.mode || 'daemon'; // 'daemon' or 'tsnet'
  }

  async getStatus() {
    if (this.mode === 'tsnet') {
      // Placeholder for Go Subprocess implementation
      return { status: 'mocked_tsnet', ip: '100.x.x.x' };
    }

    try {
      const { stdout } = await execAsync('tailscale status --json');
      return JSON.parse(stdout);
    } catch (err) {
      console.warn('Tailscale daemon might not be running or installed.');
      return { error: err.message };
    }
  }

  async getMyIp() {
    if (this.mode === 'tsnet') {
      return '100.1.2.3'; // Mock tsnet IP
    }
    
    try {
      const { stdout } = await execAsync('tailscale ip -4');
      return stdout.trim();
    } catch (err) {
      return null;
    }
  }

  // Middleware for Gateway to validate incoming requests are from Tailscale IPs
  validateTailscaleIp(req) {
    const ip = req.socket.remoteAddress;
    // Basic IPv4 / IPv6 Tailscale range check (100.64.0.0/10 or fd7a:115c:a1e0::/48)
    if (ip && (ip.startsWith('100.') || ip.startsWith('::ffff:100.') || ip.startsWith('fd7a:'))) {
      return true;
    }
    return false;
  }
}
