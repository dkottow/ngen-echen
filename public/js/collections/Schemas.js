/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	app.Schemas = Backbone.Collection.extend({

		initialize: function(models, options) {
			this.user = options.user;
		},

		model: app.Schema,

		url	: function() { 
			return REST_ROOT + "/" + this.user; 
		},

		parse : function(response) {
			return _.values(response);
		},

	});

})();
