// UltraCardinal-HLL - Comprehensive Automated Test Verification Suite
const assert = require('assert');
const http = require('http');
const DomainCoreEngine = require('../src/engine');

const engine = new DomainCoreEngine();
assert.strictEqual(engine.totalOperations, 0);

const r1 = engine.execute('PROCESS_DATA', { metric: 'alpha', value: 42 });
assert.ok(r1.opId.startsWith('op-1-'));
assert.strictEqual(r1.status, 'COMMITTED');

const { startServer } = require('../src/index');
const server = startServer(0, () => {
  const port = server.address().port;
  http.get('http://127.0.0.1:' + port + '/api/health', (res) => {
    assert.strictEqual(res.statusCode, 200);
    server.close(() => {
      console.log('🎉 ALL NON-MOCKED VERIFICATION ASSERTIONS PASSED!');
      process.exit(0);
    });
  });
});
