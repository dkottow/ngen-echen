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
			return app.Filters.toParam(this.models);	
		},

		//used by Datable.stats & Datatable.options to get context:
		//min/max, opts
		apply: function(exFilter, searchTerm) {

			var filters = this.filter(function(f) {

				//exclude callee
				if (f.id == exFilter.id) return false;

				//exclude existing search on same table
				if (f.get('op') == app.Filter.OPS.SEARCH 
				 && f.get('table') == exFilter.get('table')) {
					return false;
				}

				return true;
			});
			
			//add search term
			if (searchTerm && searchTerm.length > 0) {
				var searchFilter = new app.Filter({
						table: exFilter.get('table'),
						field: exFilter.get('field'),
						op: app.Filter.OPS.SEARCH,
						value: searchTerm
				});
				filters.push(searchFilter);
			}
			
			return filters;
		},

		setFilter: function(attrs) {
			var filter = new app.Filter(attrs);		
			var current = this.get(filter.id);
			if (current) this.remove(current);
			if (attrs.value.length > 0) {
				this.add(filter);
			}
		},

		getFilter: function(table, field) {
			return this.get(app.Filter.Key(table, field));
		},

		clearFilter: function(table, field) {
			var current = this.getFilter(table, field);
			if (current) this.remove(current);
		},

	});

	app.Filters.toParam = function(filters) {
		var result = '';
		if (filters.length > 0) {
			var params = _.reduce(filters, function(memo, f) {
				return memo.length == 0 ? f.toParam() 
					: memo + app.Filter.CONJUNCTION + f.toParam();
			}, '');				
			result = '$filter=' + encodeURIComponent(params);
		}
		return result;
	}

})();
