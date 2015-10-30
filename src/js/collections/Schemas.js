/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	app.Schemas = Backbone.Collection.extend({

		initialize: function(models, options) {
			console.log("Schemas.initialize " + options);
			this._url = options.url;
		},

		//Schemas is just a list of schema names
		//model: app.Schema,

		url	: function() { 
			return this._url;
			//return REST_ROOT + "/" + app.user; 
		},

		parse : function(response) {
			console.log("Schemas.parse ");
			return _.values(response.databases);
			//return _.values(response);
		},

	});

})();
