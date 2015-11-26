/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	app.Router = Backbone.Router.extend({
        routes: {
            "data": "data",
            "schema": "schema",
			"nav/:schema/:table": "navTable",
			"data/:schema/:table": "navTableData",
			"schema/:schema/:table": "navTableSchema"
        },
        
        data: function() {
            app.gotoModule("data");
        },

        schema: function() {
            app.gotoModule("schema");
        },

		navTableData: function(schemaName, tableName) {
			this._navTable('data', schemaName, tableName);
		},

		navTableSchema: function(schemaName, tableName) {
			this._navTable('schema', schemaName, tableName);
		},

		navTable: function(schemaName, tableName) {
			this._navTable(app.module(), schemaName, tableName);
		},

		_navTable: function(moduleName, schemaName, tableName) {

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
