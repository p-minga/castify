const { Client } = require('node-ssdp');
const discovered = new Map();
const client = new Client();

client.on('response', (headers, rinfo) => {
  const key = headers.LOCATION;
  if (!discovered.has(key)) {
    discovered.set(key, { headers, rinfo });
    console.log('New DLNA device found:', headers.SERVER, key);
  }
});

function startDiscovery() {
  setInterval(() => {
    client.search('urn:schemas-upnp-org:device:MediaRenderer:1');
  }, 2000);
}

function getDiscoveredDevices() {
  return Array.from(discovered.values());
}

module.exports = { startDiscovery, getDiscoveredDevices };
