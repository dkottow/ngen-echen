/*global Backbone, Donkeylift */

Donkeylift.Fields = Backbone.Collection.extend({
	// Reference to this collection's model.
	model: Donkeylift.Field,
	
	initialize: function(attrs) {
		//this.on('change', function(ev) { console.log('Fields.ev ' + ev); });
	},

	addNew: function(field) {
		field = field || Donkeylift.Field.create('field' + this.length);
		this.add(field);
		return field;
	},

	getByName: function(name) {
		return this.find(function(field) { 
			return field.vname() == name || field.get('name') == name; 
		});
	},

	setByName: function(field) {
		this.remove(this.getByName(field.get('name')));
		this.add(field);
		return field;
	},

	sortByOrder: function() {
		return this.sortBy(function(field) {
				return field.getProp('order');
		});
	},

	sortByName: function() {
		return this.sortBy(function(field) {
				return field.get('name');
		});
	}
	
});

