/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	// Tables Collection
	// ---------------

	app.Tables = Backbone.Collection.extend({
		// Reference to this collection's model.
		model: app.Table,

		initialize : function(tables) {
			_.each(tables, function(table) {				
				table.initRelations(tables);
				table.initAlias(tables);
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
				if (it.get('supertype')) parents.push(it.get('supertype'));
				_.each(parents, function(tn) {
					var pt = this.getByName(tn);
					result.push(pt);
					tables.push(pt);
				}, this);
			}
			return result;
		}

	});

})();
