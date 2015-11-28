/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	app.Router = Backbone.Router.extend({
        routes: {
            "data": "data",
            "schema": "schema",
			"table/:table": "clickTable",
			"data/:schema/:table(/*params)": "urlTableData",
			"schema/:schema/:table": "urlTableSchema"
        },
        
        data: function() {
            app.gotoModule("data");
        },

        schema: function() {
            app.gotoModule("schema");
        },

		urlTableData: function(schemaName, tableName, params) {
/*
			console.log("urlTableData " 
						+ schemaName + " " + tableName + " " + params);
*/
			this.navTable('data', schemaName, tableName);
		},

		urlTableSchema: function(schemaName, tableName) {
			this.navTable('schema', schemaName, tableName);
		},

		clickTable: function(tableName) {
			//console.log("clickTable " + tableName);
			this.navTable(app.module(), app.schema.get('name'), tableName);
		},

		navTable: function(moduleName, schemaName, tableName) {

			if (app.module() != moduleName) {
				app.gotoModule(moduleName);
			}

			var setTable = function() {
				var table = app.schema.get('tables').find(function(t) { 
					return t.get('name') == tableName; 
				});			
				app.setTable(table);
			}

			if (!app.schema || app.schema.get('name') != schemaName) {
				app.loadSchema(schemaName, setTable);
			} else {
				setTable();
			}


		}

        
	});


})();
