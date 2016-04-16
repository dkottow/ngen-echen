/*global Donkeylift, Backbone, _ */

(function () {
	'use strict';

	Donkeylift.RouterSchema = Backbone.Router.extend({

        routes: {
			"table/:table": "routeGotoTable",
			"schema/:schema/:table": "routeUrlTableSchema"
        },

		routeUrlTableSchema: function(schemaName, tableName) {
			this.gotoTable(tableName, {
				schema: schemaName
			});
		},

		routeGotoTable: function(tableName) {
			//console.log("routeGotoTable " + tableName);
			this.gotoTable(tableName);
		},

		gotoTable: function(tableName, options) {
			options = options || {};

			var setOthers = function() {
				var table = Donkeylift.app.schema.get('tables').getByName(tableName); 
				Donkeylift.app.setTable(table);
			}

			if (options.schema) {
				Donkeylift.app.setSchema(options.schema, setOthers);

			} else {
				setOthers();
			}


		}

        
	});


})();
