/*global Donkeylift, Backbone, _ */

// Tables Collection
// ---------------

Donkeylift.Tables = Backbone.Collection.extend({
	// Reference to this collection's model.
	model: Donkeylift.Table,

	initialize : function(tables) {
		_.each(tables, function(table) {				
			table.initRefs(tables);
		});
	},

	getByName: function(name) {
		return this.find(function(t) { return t.get('name') == name; });
	},

	getAll: function(opts) {
		//TODO sort by user-defined order 
		return this.sortBy(function(t) { return t.get('name'); });
	},
		
	getAncestors: function(table) {
		var result = [];
		var tables = [table];
		while(tables.length > 0) {
			var it = tables.shift();
			var fks = it.get('referencing');
			_.each(fks, function(fk) {
				var pt = this.getByName(fk.fk_table);
				if ( ! _.contains(tables, pt)) {
					result.push(pt);
					tables.push(pt);
				}
			}, this);
		}
		return result;
	}

});
