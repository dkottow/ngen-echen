var express = require('express');
var url = require('url');

var fs = require('fs');
var util = require('util');

var app = express();

//require('dotenv').config();
var config = require('config');

app.get('/public/docs/videotour', function(req, res) { res.redirect('https://youtu.be/EVt12a0wuwA') });

app.use('/app', express.static('./app'));
app.use('/public', express.static('./public')); 

app.get('/', function(req, res) { res.redirect('/public/index.html') });

app.listen(config.port, config.ip, function() {
	console.log("Started server on " + config.ip + ":" + config.port);
});

