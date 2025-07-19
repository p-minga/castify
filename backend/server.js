const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { Client } = require('node-ssdp');
const setupCastRoutes = require('./routes/castRoutes');

const PORT = 5000;
const client = new Client();
const discoveredDevices = new Set();

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const server = http.createServer((req, res) => {
  console.log('Request received:', req.url);

  if (req.url.startsWith('/media/')) {
    const fileName = path.basename(req.url);
    const filePath = path.join(__dirname, 'media', fileName);
    const stream = fs.createReadStream(filePath);

    stream.on('open', () => {
      res.writeHead(200);
      stream.pipe(res);
    });

    stream.on('error', () => {
      res.writeHead(404);
      res.end('File not found');
    });
  } else if (req.url.startsWith('/cast/') && req.method === 'POST') {
    setupCastRoutes(req, res);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello from Castify backend');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log(`Media server listening at: http://${ip}:${PORT}`);
});

client.on('response', (headers) => {
  const key = headers.LOCATION || headers.USN;
  if (!discoveredDevices.has(key)) {
    discoveredDevices.add(key);
    console.log('New device:', headers.SERVER || headers.ST || headers.USN, headers.LOCATION || '');
  }
});

setInterval(() => {
  client.search('ssdp:all');
}, 2000);