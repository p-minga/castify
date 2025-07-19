const http = require('http');
const { parseXML } = require('../../backend/utils/xmlParser');

function sendSoapRequest(controlURL, action, serviceType, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(controlURL);
    const soapBody = `
      <?xml version="1.0"?>
      <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" 
                  s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
        <s:Body>
          <u:${action} xmlns:u="${serviceType}">
            ${body}
          </u:${action}>
        </s:Body>
      </s:Envelope>`;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset="utf-8"',
        'Content-Length': Buffer.byteLength(soapBody),
        'SOAPACTION': `"${serviceType}#${action}"`
      }
    };

    const req = http.request(options, res => {
      let responseData = '';
      res.on('data', chunk => { responseData += chunk; });
      res.on('end', () => resolve(responseData));
    });

    req.on('error', reject);
    req.write(soapBody);
    req.end();
  });
}

async function sendToDLNADevice(deviceDescriptionURL, mediaUrl) {
  const res = await fetch(deviceDescriptionURL);
  const xml = await res.text();
  const parsed = await parseXML(xml);

  const services = parsed.root.device.serviceList.service;
  const avTransport = services.find(s => s.serviceType.includes('AVTransport'));

  const controlURL = new URL(avTransport.controlURL, deviceDescriptionURL).href;
  const serviceType = avTransport.serviceType;

  await sendSoapRequest(controlURL, 'SetAVTransportURI', serviceType,
    `<InstanceID>0</InstanceID><CurrentURI>${mediaUrl}</CurrentURI><CurrentURIMetaData></CurrentURIMetaData>`
  );

  await sendSoapRequest(controlURL, 'Play', serviceType,
    `<InstanceID>0</InstanceID><Speed>1</Speed>`
  );
}

module.exports = { sendToDLNADevice };
