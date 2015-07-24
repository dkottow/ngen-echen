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

		setSearch: function(filter) {

			var current = this.find(function(f) { 
				return f.get('op') == 'search'; 
			});
			if (current) this.remove(current);
			this.add(filter);	
		}
	});

})();
