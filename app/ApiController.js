/*
   Copyright 2016 Daniel Kottow

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

var util = require('util');
var url = require('url');
var express = require('express');
var bodyParser = require('body-parser');
var config = require('config');

//var jwt = require('azure-ad-jwt');	//AAD
var log = {
	log: function(args) {
		console.log(args);
	},

	trace: function(args) {
		this.log(args);
	},
	debug: function(args) {
		this.log(args);
	},
	info: function(args) {
		this.log(args);
	},
	warn: function(args) {
		this.log(args);
	},
	error: function(args) {
		this.log(args);
	}
}


function Controller(options) {
	options = options || {};
	this.router = new express.Router();
	this.initRoutes(options);
}

Controller.prototype.initRoutes = function(options) {
	log.trace("Controller.initRoutes()...");		
	var me = this;

	var reqSizeLimit = options.bodyParser ? options.bodyParser.limit : '1mb';
	
	//urlencoded parsing (used by POST requests to add/mod/del rows)
	this.router.use(bodyParser.urlencoded({ limit: reqSizeLimit, extended: true }));

	this.router.get(/^\/(.*)$/, function(req, res) {
		log.trace("Controller.get...");		
		log.debug(req.url);
		log.debug(req.params);
		log.debug(req.query);
		log.debug(req.headers);
		res.send('api get ok.');
	});
	
}

exports.ApiController = Controller;

