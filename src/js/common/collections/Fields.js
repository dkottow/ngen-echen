/*global Backbone, Donkeylift */

Donkeylift.Fields = Backbone.Collection.extend({
	// Reference to this collection's model.
	model: Donkeylift.Field,
	
	initialize: function(attrs) {
		//this.on('change', function(ev) { console.log('Fields.ev ' + ev); });
	},

	addNew: function(field) {
		field = field || Donkeylift.Field.create('field' + this.length);
		//field.setProp('order', this.length + 1);
		this.add(field);
		return field;
	},

	getByName: function(name) {
		return this.find(function(field) { 
			return field.vname() == name || field.get('name') == name; 
		});
	},
	
	sortByOrder: function() {
		return this.sortBy(function(field) {
				return field.getProp('order');
		}, this);
	}
});

