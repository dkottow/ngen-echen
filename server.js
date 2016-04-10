var express = require('express');
var url = require('url');

var fs = require('fs');
var util = require('util');

var app = express();

var auth = require('./auth.js').auth;

var config = {
	'ip'	:  '127.0.0.1',
	'port'	: 3001 
}

if (process.env.DONKEYLIFT_WWW) {
	var u = url.parse(process.env.DONKEYLIFT_WWW);
	config.ip = u.hostname;
	config.port = u.port;
} else if (process.env.OPENSHIFT_DATA_DIR) {
	config.ip = process.env.OPENSHIFT_NODEJS_IP;
	config.port = process.env.OPENSHIFT_NODEJS_PORT;
} else if (process.env.C9_USER) {
	config.ip = process.env.IP;
	config.port = process.env.PORT;
}

app.use('/public', express.static('./public')); 
app.use('/', auth, express.static('./private'));

app.use(function(err, req, res, next) {
	console.log(err);
	res.send(500, err.stack);
});

app.listen(config.port, config.ip, function() {
	console.log("Started server on " + config.ip + ":" + config.port);
});

