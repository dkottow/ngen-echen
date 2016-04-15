/*global Donkeylift, Backbone, _ */

(function () {
	'use strict';
	//console.log("Table class def");
	Donkeylift.Database = Donkeylift.Schema.extend({ 

		initialize : function(attrs, options) {
			console.log("Database.initialize " + (attrs.name || ''));
			Donkeylift.Schema.prototype.initialize.call(this, attrs);
		},

		parse : function(response) {
			console.log("Database.parse " + response);

			var tables = _.map(response.tables, function(table) {
				return new Donkeylift.DataTable(table);
			});
			response.tables = new Donkeylift.Tables(tables);
			return response;
		},
	});		

})();
