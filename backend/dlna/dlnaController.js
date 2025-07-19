const http = require('http');

function sendSoapRequest(controlUrl, serviceType, action, bodyXml, callback) {
  const soapEnvelope = 
`<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" 
            s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
  <s:Body>
    <u:${action} xmlns:u="${serviceType}">
      ${bodyXml}
    </u:${action}>
  </s:Body>
</s:Envelope>`;

  const url = new URL(controlUrl);
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset="utf-8"',
      'SOAPAction': `"${serviceType}#${action}"`,
      'Content-Length': Buffer.byteLength(soapEnvelope),
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        callback(null, data);
      } else {
        callback(new Error(`${action} failed with status ${res.statusCode}`));
      }
    });
  });

  req.on('error', (err) => callback(err));
  req.write(soapEnvelope);
  req.end();
}

function playMediaOnDlna(controlUrl, mediaUrl, callback) {
  const serviceType = 'urn:schemas-upnp-org:service:AVTransport:1';

  const setUriBody = `
    <InstanceID>0</InstanceID>
    <CurrentURI>${mediaUrl}</CurrentURI>
    <CurrentURIMetaData></CurrentURIMetaData>
  `;

  sendSoapRequest(controlUrl, serviceType, 'SetAVTransportURI', setUriBody, (err) => {
    if (err) return callback(err);

    const playBody = `
      <InstanceID>0</InstanceID>
      <Speed>1</Speed>
    `;

    sendSoapRequest(controlUrl, serviceType, 'Play', playBody, (err2) => {
      if (err2) return callback(err2);
      callback(null, 'DLNA media playback started');
    });
  });
}

module.exports = { playMediaOnDlna };


