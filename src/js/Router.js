/*global Backbone */
var app = app || {};
var pegParser = module.exports;

(function () {
	'use strict';

	app.Router = Backbone.Router.extend({
        routes: {
            "data": "routeData",
            "schema": "routeSchema",
			"table/:table": "routeGotoTable",
			"reset-filter": "routeResetFilter",
			"reload-table": "routeReloadTable",
			"data/:schema/:table(/*params)": "routeUrlTableData",
			"schema/:schema/:table": "routeUrlTableSchema"
        },
        
        routeData: function() {
            app.gotoModule("data");
			app.resetTable();
        },

        routeSchema: function() {
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

		routeUrlTableData: function(schemaName, tableName, paramStr) {
			console.log("routeTableData " 
						+ schemaName + " " + tableName + " " + paramStr);

			/* 
			 * hack to block executing router handlers twice in FF
			 * if user interactively hits a route, 
			 * block execution of "url" routes 
			 * will be reset after 1s
			*/
			if (this.isBlockedGotoUrl) return;

			this.gotoTable(tableName, { 
				module: 'data', 
				schema: schemaName,
				params: this.parseParams(paramStr)
			});
		},

		blockGotoUrl: function(ms) {
			ms = ms || 1000;
			var me = this;
			this.isBlockedGotoUrl = true;
			window.setTimeout(function() {
				me.isBlockedGotoUrl = false;
			}, ms);
		},

		routeUrlTableSchema: function(schemaName, tableName) {
			this.gotoTable(tableName, {
				module: 'schema', 
				schema: schemaName
			});
		},

		routeGotoTable: function(tableName) {
			this.blockGotoUrl(1000);
			//console.log("clickTable " + tableName);
			this.gotoTable(tableName);
		},

		routeResetFilter: function() {
			this.blockGotoUrl(1000);
			app.unsetFilters();
			app.resetTable();
		},

		routeReloadTable: function() {
			this.blockGotoUrl(1000);
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
