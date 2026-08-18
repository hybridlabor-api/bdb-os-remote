import assert from 'node:assert';
import { BdbConnectGateway } from '../src/server/gateway.js';
import { BdbConnectSidecar } from '../src/client/sidecar.js';
import { TailscaleIntegration } from '../src/tailscale/tailscale.js';

async function runTests() {
  console.log('Running Tests...');

  // Test 1: Tailscale IP Validation
  const ts = new TailscaleIntegration();
  const mockReqValid = { socket: { remoteAddress: '100.111.222.333' } };
  const mockReqInvalid = { socket: { remoteAddress: '192.168.1.1' } };
  
  assert.strictEqual(ts.validateTailscaleIp(mockReqValid), true, 'Tailscale IP should be valid');
  assert.strictEqual(ts.validateTailscaleIp(mockReqInvalid), false, 'Local network IP should be invalid');

  // Test 2: Gateway instantiates and starts
  const gateway = new BdbConnectGateway({ port: 8001, tsMode: 'tsnet' });
  const gwInfo = await gateway.start();
  assert.strictEqual(gwInfo.port, 8001, 'Gateway should start on assigned port');
  gateway.stop();

  // Test 3: Sidecar instantiates and starts
  const sidecar = new BdbConnectSidecar({ port: 8002, tsMode: 'tsnet' });
  const scInfo = await sidecar.start();
  assert.strictEqual(scInfo.port, 8002, 'Sidecar should start on assigned port');
  sidecar.stop();

  console.log('✅ All tests passed!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
