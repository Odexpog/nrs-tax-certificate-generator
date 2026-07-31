/* TEAM */
/* Developer: Dorocreate */
/* Site: https://dorocreate.com.ng */
/* Twitter: @dorocreate */
/* Location: Nigeria */
/* >> We are a creative agency helping ambitious brands build the clarity, structure, and digital experiences required to scale.<< */

/**
 * Pure Node.js Zero-Dependency Live API Proxy Server
 * Connects server-to-server to https://taxid.jrb.gov.ng/v1/resolve
 * Eliminates browser CORS rejections & HTTP 401 errors on any domain!
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8085;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API RELAY ENDPOINT: /api/resolve
  if (req.url === '/api/resolve' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      console.log('[SERVER PROXY RELAY] Request Body:', body);

      const targetOptions = {
        hostname: 'taxid.jrb.gov.ng',
        port: 443,
        path: '/v1/resolve',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://taxid.nrs.gov.ng/',
          'Origin': 'https://taxid.nrs.gov.ng'
        }
      };

      const proxyReq = https.request(targetOptions, proxyRes => {
        let proxyData = '';
        proxyRes.on('data', chunk => { proxyData += chunk.toString(); });
        proxyRes.on('end', () => {
          console.log(`[SERVER PROXY RELAY] Live Response HTTP ${proxyRes.statusCode}:`, proxyData);
          res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(proxyData);
        });
      });

      proxyReq.on('error', err => {
        console.error('[SERVER PROXY RELAY] Connection Error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Proxy connection error', message: err.message }));
      });

      proxyReq.write(body);
      proxyReq.end();
    });
    return;
  }

  // STATIC FILE SERVING
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 NRS Tax Certificate Suite Zero-Dependency Server`);
  console.log(`🌐 Running at http://localhost:${PORT}`);
  console.log(`====================================================`);
});
