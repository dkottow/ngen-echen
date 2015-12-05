/*global Backbone, _ */
var app = app || {};
var pegParser = module.exports;

(function () {
	'use strict';

	app.Router = Backbone.Router.extend({
        routes: {
            "data": "routeData",
            "schema": "routeSchema",
			"table/:table": "routeGotoTable",
			"table/:table/:filter": "routeGotoRows",
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
			 * block execution of this route. 
			 * isBlocked.. will be timeout reset after a short time (100ms). 
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
			//console.log("routeGotoTable " + tableName);
			this.gotoTable(tableName);
		},

		routeGotoRows: function(tableName, filter) {
			var kv = filter.split('=');
			var filterTable;
			if (kv[0].indexOf('.') > 0) {
				filterTable = kv[0].substr(0, kv[0].indexOf('.'));
			} else {
				filterTable = tableName;
			}

			console.log("routeGotoRow " + tableName + " " + filter);
			app.filters.setFilter({
				table: filterTable,
				field: 'id',
				op: app.Filter.OPS.EQUAL,
				value: kv[1]
			});
			
			this.gotoTable(tableName);
		},

		routeResetFilter: function() {
			app.unsetFilters();
			app.resetTable();
		},

		routeReloadTable: function() {
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
