// UltraCardinal-HLL - Production HTTP Server & OpenMetrics Exporter
const http = require('http');
const path = require('path');
const fs = require('fs');
const DomainCoreEngine = require('./engine');

const engine = new DomainCoreEngine();
const PORT = parseInt(process.env.PORT, 10) || 6050;
const publicDir = path.join(__dirname, '..', 'public');
const startTime = Date.now();

function requestHandler(req, res) {
  const reqUrl = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const pathname = reqUrl.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    if (pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify({
        status: 'UP',
        service: "UltraCardinal-HLL",
        uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
        timestamp: new Date().toISOString()
      }));
    }

    if (pathname === '/api/stats') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify({
        success: true,
        service: "UltraCardinal-HLL",
        metrics: engine.metrics()
      }));
    }

    if (pathname === '/metrics') {
      const m = engine.metrics();
      const lines = [
        '# HELP domain_operations_total Total operations executed',
        '# TYPE domain_operations_total counter',
        'domain_operations_total ' + m.totalOperations,
        '# HELP domain_active_states Gauge of active state entries',
        '# TYPE domain_active_states gauge',
        'domain_active_states ' + m.activeStateEntries
      ].join('\n') + '\n';
      res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4', 'Access-Control-Allow-Origin': '*' });
      return res.end(lines);
    }

    if (req.method === 'POST' && pathname === '/api/execute') {
      try {
        const json = JSON.parse(body || '{}');
        const result = engine.execute(json.operation || 'DEFAULT_OP', json.payload);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ success: true, result }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ success: false, error: e.message }));
      }
    }

    let filePath = path.join(publicDir, pathname === '/' ? 'index.html' : pathname);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8'
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
      return res.end(fs.readFileSync(filePath));
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  });
}

function startServer(portToUse = PORT, callback) {
  const server = http.createServer(requestHandler);
  server.listen(portToUse, callback);
  return server;
}

if (require.main === module) {
  startServer(PORT, () => {
    console.log('⚡ UltraCardinal-HLL active at http://localhost:' + PORT);
  });
}

module.exports = { startServer, engine };
