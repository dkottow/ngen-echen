var basicAuth = require('basic-auth');

var auth = function (req, res, next) {
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.send(401);
  };

  var user = basicAuth(req);

  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  }

  if (user.name === 'demo' && user.pass === '466esR9F') {
    return next();
  } else {
    return unauthorized(res);
  }
}

exports.auth = auth;