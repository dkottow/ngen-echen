/*global Donkeylift, Backbone */

Donkeylift.Filters = Backbone.Collection.extend({
	// Reference to this collection's model.
	model: Donkeylift.Filter,
	
	toParam: function() {
		return Donkeylift.Filters.toParam(this.models);	
	},

	//used by Datable.stats & Datatable.options to get context:
	//min/max, opts
	apply: function(exFilter, searchTerm) {

		var filters = this.filter(function(f) {

			//exclude callee
			if (f.id == exFilter.id) return false;

			//exclude existing search on same table
			if (f.get('op') == Donkeylift.Filter.OPS.SEARCH 
			 && f.get('table') == exFilter.get('table')) {
				return false;
			}

			return true;
		});
		
		//add search term
		if (searchTerm && searchTerm.length > 0) {
			var searchFilter = Donkeylift.Filter.Create({
					table: exFilter.get('table'),
					field: exFilter.get('field'),
					op: Donkeylift.Filter.OPS.SEARCH,
					value: searchTerm
			});
			if (searchFilter) filters.push(searchFilter);
			else console.log('error creating searchFilter');
		}
		
		return filters;
	},

	setFilter: function(attrs) {
		var current = this.getFilter(attrs.table, attrs.field);
		if (current) this.remove(current);
		var filter = Donkeylift.Filter.Create(attrs);	
		if (filter) this.add(filter);
	},

	getFilter: function(table, field) {
		return this.get(Donkeylift.Filter.Key(table, field));
	},

	clearFilter: function(table, field) {
		var current = this.getFilter(table, field);
		if (current) this.remove(current);
	},

});

Donkeylift.Filters.toParam = function(filters) {
	var result = '';
	if (filters.length > 0) {
		var params = _.reduce(filters, function(memo, f) {
			return memo.length == 0 ? f.toParam() 
				: memo + Donkeylift.Filter.CONJUNCTION + f.toParam();
		}, '');				
		result = '$filter=' + encodeURIComponent(params);
	}
	return result;
}
