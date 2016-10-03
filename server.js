var express = require('express');
var url = require('url');

var fs = require('fs');
var util = require('util');

var app = express();

//require('dotenv').config();

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

app.get('/public/docs/videotour', function(req, res) { res.redirect('https://www.wevideo.com/view/747605616') });

app.use('/app', express.static('./app'));
app.use('/public', express.static('./public')); 

app.get('/', function(req, res) { res.redirect('/public/index.html') });

app.listen(config.port, config.ip, function() {
	console.log("Started server on " + config.ip + ":" + config.port);
});

