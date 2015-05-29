/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	// Tables Collection
	// ---------------

	app.Fields = Backbone.Collection.extend({
		// Reference to this collection's model.
		model: app.Field,
		
		addNew: function() {
			var field = app.Field.create('field' + this.length);
			this.add(field);
			return field;
		},

		getByName: function(name) {
			return this.find(function(f) { return f.get('name') == name; });
		}
	});

})();
