/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	//console.log("Table class def");
	app.Database = app.Schema.extend({ 

		parse : function(response) {
			console.log("Database.parse " + response);
			var tables = _.map(response.tables, function(table) {
				return new app.DataTable(table);
			});
			response.tables = new app.Tables(tables);
			return response;
		}
	});		

	app.Database.create = function(name) {
		return new app.Database({
			name: name,
			tables: new app.Tables()	
		});
	}

})();
