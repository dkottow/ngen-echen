/*global Donkeylift, Backbone, _ */

Donkeylift.Database = Donkeylift.Schema.extend({ 

	initialize : function(attrs, options) {
		console.log("Database.initialize " + (attrs.name || ''));
		Donkeylift.Schema.prototype.initialize.call(this, attrs);
	},

	parseTables : function(response) {
		console.log("Database.parseTables " + response);

		var tables = _.map(response.tables, function(table) {
			return new Donkeylift.DataTable(table);
		});
		response.tables = new Donkeylift.Tables(tables);
		return response;
	},
});		
