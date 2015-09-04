var express = require('express');

var fs = require('fs');
var util = require('util');

var app = express();

var config = {
	'ip'	:  '127.0.0.1',
	'port'	: 3001 
}

app.use('/public', express.static('./public')); 

app.use(function(err, req, res, next) {
	log.error(err);
	res.send(500, err.stack);
});

app.listen(config.port, config.ip, function() {
	console.log("Started server on " + config.ip + ":" + config.port);
});

