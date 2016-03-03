/*global Backbone, Donkeylift */

(function () {
	'use strict';

	// Tables Collection
	// ---------------

	Donkeylift.Fields = Backbone.Collection.extend({
		// Reference to this collection's model.
		model: Donkeylift.Field,
		
		initialize: function(attrs) {
			//this.on('change', function(ev) { console.log('Fields.ev ' + ev); });
		},

		addNew: function() {
			var field = Donkeylift.Field.create('field' + this.length);
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
