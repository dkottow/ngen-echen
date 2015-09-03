/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	app.Schemas = Backbone.Collection.extend({

		initialize: function(models, options) {
			console.log("Schemas.initialize");
		},

		//Schemas is just a list of schema names
		//model: app.Schema,

		url	: function() { 
			return REST_ROOT + "/" + app.user; 
		},

		parse : function(response) {
			return _.values(response);
		},

	});

})();
