/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	// Tables Collection
	// ---------------

	app.Filters = Backbone.Collection.extend({
		// Reference to this collection's model.
		model: app.Filter,
		
		toParam: function() {
			var params = this.reduce(function(memo, f) {
				return memo.length == 0 ? f.toParam() 
					: memo + ' and ' + f.toParam();
			}, '');
			return '$filter=' + params;
		},

		setFilter: function(attrs) {
			var filter = new app.Filter(attrs);		
			var current = this.get(filter.id);
			if (current) this.remove(current);
			if (attrs.value.length > 0) {
				this.add(filter);
			}
		},

		getSearch: function(table) {
			if (_.isObject(table)) table = table.get('name');
			return this.get(table + '.' + table);
		}

	});

})();
