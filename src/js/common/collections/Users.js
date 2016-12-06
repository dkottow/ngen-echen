/*global Backbone, Donkeylift */

// Tables Collection
// ---------------

Donkeylift.Users = Backbone.Collection.extend({
	// Reference to this collection's model.
	model: Donkeylift.User,

	getByName: function(name) {
		return this.find(function(u) { return u.get('name') == name; });
	},
	
});

