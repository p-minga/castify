const http = require('http');

function sendRokuCommand(deviceUrl, endpoint, method = 'POST', body = null, callback) {
  const url = new URL(deviceUrl);
  const options = {
    hostname: url.hostname,
    port: url.port || 8060,
    path: endpoint,
    method: method,
    headers: {}
  };

  if (body) {
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    options.headers['Content-Length'] = Buffer.byteLength(body);
  }

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => callback(null, res.statusCode, data));
  });

  req.on('error', (err) => callback(err));

  if (body) req.write(body);
  req.end();
}

function launchApp(deviceUrl, appId, callback) {
  sendRokuCommand(deviceUrl, `/launch/${appId}`, 'POST', null, callback);
}

function sendKeypress(deviceUrl, key, callback) {
  sendRokuCommand(deviceUrl, `/keypress/${key}`, 'POST', null, callback);
}

// New function to send PlayOnRoku play command with media URL
function sendPlayOnRokuCommand(deviceUrl, mediaUrl, callback) {
  const url = new URL(deviceUrl);
  const path = `/play?url=${encodeURIComponent(mediaUrl)}&ContentType=video/mp4`;

  const options = {
    hostname: url.hostname,
    port: url.port || 8060,
    path: path,
    method: 'GET',
  };

  const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      callback(null, 'Play command sent successfully');
    } else {
      callback(new Error(`Failed to send play command, status ${res.statusCode}`));
    }
  });

  req.on('error', (err) => callback(err));
  req.end();
}

function playMedia(deviceUrl, mediaUrl, callback) {
  launchApp(deviceUrl, '15985', (err, status) => {
    if (err) return callback(err);

    if (status !== 200) {
      return callback(new Error(`Failed to launch app, status ${status}`));
    }

    // Wait a bit to ensure app is launched, then send PlayOnRoku play command
    setTimeout(() => {
      sendPlayOnRokuCommand(deviceUrl, mediaUrl, callback);
    }, 1500);
  });
}

module.exports = {
  playMedia,
  launchApp,
  sendKeypress
};
