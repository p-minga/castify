const { playMediaOnDlna } = require('../dlna/dlnaController');
const rokuController = require('../dlna/rokuController');

module.exports = function setupCastRoutes(req, res) {
  if (req.method === 'POST' && req.url === '/cast/play') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { deviceId, mediaUrl } = JSON.parse(body);

        if (deviceId.includes('8060')) {
          // Roku device
          rokuController.playMedia(deviceId, mediaUrl, (err, msg) => {
            if (err) return sendError(res, err);
            sendOk(res, msg);
          });
        } else {
          // DLNA device
          playMediaOnDlna(deviceId, mediaUrl, (err, msg) => {
            if (err) return sendError(res, err);
            sendOk(res, msg);
          });
        }

      } catch (err) {
        sendError(res, err);
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
};

function sendOk(res, message) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', message }));
}

function sendError(res, err) {
  res.writeHead(500, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'error', message: err.message || err }));
}