/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	// Tables Collection
	// ---------------

	app.Fields = Backbone.Collection.extend({
		// Reference to this collection's model.
		model: app.Field,
		
		initialize: function(attrs) {
			//this.on('change', function(ev) { console.log('Fields.ev ' + ev); });
		},

		addNew: function() {
			var field = app.Field.create('field' + this.length);
			field.set('order', this.length);
			this.add(field);
			return field;
		},

		getByName: function(name) {
			return this.find(function(f) { 
				return f.vname() == name || f.get('name') == name; 
			});
		}
	});

})();
