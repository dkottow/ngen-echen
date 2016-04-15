/*global Donkeylift, Backbone, _ */

(function () {
	'use strict';

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

		getAncestors: function(table) {
			var result = [];
			var tables = [table];
			while(tables.length > 0) {
				var it = tables.shift();
				var parents = it.get('parents');
				_.each(parents, function(tn) {
					var pt = this.getByName(tn);
					if (pt != it) {
						result.push(pt);
						tables.push(pt);
					}
				}, this);
			}
			return result;
		}

	});

})();
