/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	// Tables Collection
	// ---------------

	app.Fields = Backbone.Collection.extend({
		// Reference to this collection's model.
		model: app.Field,
		
	});

})();
