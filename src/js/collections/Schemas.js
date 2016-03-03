/*global Backbone, Donkeylift */

(function () {
	'use strict';
	Donkeylift.Schemas = Backbone.Collection.extend({

		initialize: function(models, options) {
			console.log("Schemas.initialize " + options);
			this._url = options.url;
		},

		//Schemas is just a list of schema names
		//model: Donkeylift.Schema,

		url	: function() { 
			return this._url;
		},

		parse : function(response) {
			console.log("Schemas.parse ");
			return _.values(response.databases);
			//return _.values(response);
		},

	});

})();
