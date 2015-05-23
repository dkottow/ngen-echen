var express = require('express');

var fs = require('fs');
var util = require('util');

var app = express();

app.use('/public', express.static('./public')); 

app.use(function(err, req, res, next) {
	log.error(err);
	res.send(500, err.stack);
});

app.listen(3001);

