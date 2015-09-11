/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	//console.log("Table class def");
	app.Database = app.Schema.extend({ 

		parse : function(response) {
			console.log("Database.parse " + response);


//TODO fixme. hack for backbone 
//backbone expects us to return the model on PUT/POST
//instead donkeylift REST returns a number (id or 1). ignore it.
			//if (_.isNumber(response)) return response;


			var tables = _.map(response.tables, function(table) {
				return new app.DataTable(table);
			});
			response.tables = new app.Tables(tables);
			return response;
		},

	});		

	app.Database.create = function(name) {
		return new app.Database({
			name: name,
			tables: new app.Tables()	
		});
	}

})();
