/*global Backbone */
var app = app || {};
var pegParser = module.exports;

(function () {
	'use strict';

	app.Router = Backbone.Router.extend({
        routes: {
            "data": "data",
            "schema": "schema",
			"table/:table": "navTable",
			"reset-filter": "unsetFilters",
			"reload-table": "reloadTable",
			"data/:schema/:table(/*params)": "urlTableData",
			"schema/:schema/:table": "urlTableSchema"
        },
        
        data: function() {
            app.gotoModule("data");
			app.resetTable();
        },

        schema: function() {
            app.gotoModule("schema");
			app.resetTable();
        },

		parseParams: function(paramStr) {
			var params = {};
			_.each(paramStr.split('&'), function(p) {
				var ps = p.split('=');
				var k = decodeURIComponent(ps[0]);
				var v = ps.length > 1 
						? decodeURIComponent(ps[1])
						:  decodeURIComponent(ps[0]);
				if (k[0] == '$') {
					var param = pegParser.parse(k + "=" + v);
					params[param.name] = param.value;
				}
			});
			//console.dir(params);
			return params;
		},

		urlTableData: function(schemaName, tableName, paramStr) {
			console.log("urlTableData " 
						+ schemaName + " " + tableName + " " + paramStr);


			this.gotoTable(tableName, { 
				module: 'data', 
				schema: schemaName,
				params: this.parseParams(paramStr)
			});
		},

		urlTableSchema: function(schemaName, tableName) {
			this.gotoTable(tableName, {
				module: 'schema', 
				schema: schemaName
			});
		},

		navTable: function(tableName) {
			//console.log("clickTable " + tableName);
			this.gotoTable(tableName);
		},

		unsetFilters: function() {
			app.unsetFilters();
			app.resetTable();
		},

		reloadTable: function() {
			app.table.reload();
		},

		gotoTable: function(tableName, options) {
			options = options || {};

			var setOthers = function() {

				var table = app.schema.get('tables').find(function(t) { 
					return t.get('name') == tableName; 
				});			

				//set filters
				if (options.params) {
					var filters = _.map(options.params.$filter, function(f) {
						return new app.Filter(f);
					});
					app.setFilters(filters);
				}
				
				//load data			
				app.setTable(table);
			}

			if (options.module) {
				app.gotoModule(options.module);
			}

			if (options.schema) {
				app.setSchema(options.schema, setOthers);

			} else {
				setOthers();
			}


		}

        
	});


})();
