var express = require('express');
var url = require('url');

var path = require('path');
var util = require('util');

var app = express();
var ApiController = require('./app/ApiController').ApiController;

//require('dotenv').config();
var config = require('config');

//all api routes
controller = new ApiController();
app.use('/api', controller.router);

//just for debugging, Azure will use IIS static handler
app.use('/', express.static(path.resolve(__dirname, 'public'))); 


app.listen(config.port, config.ip, function() {
	console.log("Started server on " + config.ip + ":" + config.port);
});

