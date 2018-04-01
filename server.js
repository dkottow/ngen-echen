var express = require('express');
var url = require('url');

var path = require('path');
var util = require('util');

var app = express();

//require('dotenv').config();
var config = require('config');

app.use('/', express.static(path.resolve(__dirname, 'public'))); 

app.listen(config.port, config.ip, function() {
	console.log("Started server on " + config.ip + ":" + config.port);
});

