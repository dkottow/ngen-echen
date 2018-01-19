/*global Donkeylift, Backbone, _ */
//var pegParser = module.exports;

(function () {
	'use strict';

	Donkeylift.RouterData = Backbone.Router.extend({

        routes: {
			"table/:table": "routeGotoTable"
			, "table/:table/:filter": "routeGotoRows"
			, "reset-filter": "routeResetFilter"
			, "reload-table": "routeReloadTable"
			, "data/:schema/:table(/*params)": "routeUrlTableData"
			, "schema/:schema/:table": "routeUrlTableSchema"
        },

		routeUrlTableData: function(schemaName, tableName, paramStr) {
			console.log("routeUrlTableData " 
						+ schemaName + " " + tableName + " " + paramStr);
			/* 
			 * hack to block executing router handlers twice in a row in FF
			 * isBlocked.. will be timeout reset after a short time (100ms). 
			*/
			if (this.isBlockedGotoUrl) return;

			this.gotoTable(tableName, { 
				schema: schemaName,
				params: this.parseParams(paramStr)
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
			Donkeylift.app.filters.setFilter({
				table: filterTable,
				field: 'id',
				op: Donkeylift.Filter.OPS.EQUAL,
				value: kv[1]
			});
			
			this.gotoTable(tableName);
		},

		routeResetFilter: function() {
			Donkeylift.app.unsetFilters();
			Donkeylift.app.resetTable();
		},

		routeReloadTable: function() {
			Donkeylift.app.table.reload();
		},


		gotoHash: function(hash, cbAfter) {
			var parts = hash.split('/');
			if (parts.length == 4 && parts[0] == '#data') {
				
				var opts = 	{ 
						schema: parts[1],
						params: this.parseParams(parts[3])
				}; 
				this.gotoTable(parts[2], opts, cbAfter);
			} else {
				cbAfter();
			}
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

		blockGotoUrl: function(ms) {
			ms = ms || 1000;
			var me = this;
			this.isBlockedGotoUrl = true;
			window.setTimeout(function() {
				me.isBlockedGotoUrl = false;
			}, ms);
		},

		updateNavigation: function(fragment, options) {
			console.log('update nav ' + fragment + ' ' + options); 
			options = options || {};
			if (options.block > 0) {
				this.blockGotoUrl(options.block); //avoid inmediate reolad FF
			}
			this.navigate(fragment, {replace: options.replace});
		},	

		gotoTable: function(tableName, options, cbAfter) {
			options = options || {};

			var setOthers = function() {

				var table = Donkeylift.app.schema.get('tables').find(function(t) { 
					return t.get('name') == tableName; 
				});			

				if (options.params) {
					//set filters
					var filters = _.map(options.params.$filter, function(f) {
						return Donkeylift.Filter.Create(f);
					});
					if (_.contains(filters, null)) {
						console.log('error parsing $filter param. no filters added');
					} else {
						Donkeylift.app.setFilters(filters);
					}
				}
				
				//load data			
				Donkeylift.app.setTable(table, options.params);
				if (cbAfter) cbAfter();
			}

			if (options.schema) {
				Donkeylift.app.setSchema(options.schema, setOthers);

			} else {
				setOthers();
			}

		}

        
	});


})();
