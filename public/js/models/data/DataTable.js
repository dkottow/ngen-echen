/*global Backbone */
var app = app || {};

var ROWS_EXT = '.rows';
var STATS_EXT = '.stats';

(function () {
	'use strict';
	//console.log("Table class def");
	app.DataTable = app.Table.extend({ 

		getColumns: function() {

			return this.get('fields').map(function(field) {
				return { data : field.vname() };
			});
		},

		ajaxGetRowsFn: function() {
			var me = this;
			return function(data, callback, settings) {
				console.log('request to REST');
				var orderField = me.get('fields')
								.at(data.order[0].column);

				var orderParam = '$orderby=' + orderField.vname() 
								+ ' ' + data.order[0].dir;
				
				var skipParam = '$skip=' + data.start;
				var topParam = '$top=' + data.length;

				if (data.search.value.length > 0) {
					app.filters.setFilter({
						table: me,
						op: app.Filter.OPS.SEARCH,
						value: data.search.value
					});
				} else {
					app.filters.clearFilter(me);
				}

				var url = REST_ROOT + me.get('url') + ROWS_EXT + '?'
						+ orderParam
						+ '&' + skipParam 
						+ '&' + topParam
						+ '&' + app.filters.toParam();

				console.log(url);

				$.ajax(url, {
					cache: false
				}).done(function(response) {
					//console.log('response from REST');
					//console.dir(response);

					var data = {
						data: response.rows,
						recordsTotal: response.totalCount,
						recordsFiltered: response.count,
					};
					callback(data);
				});
			}
		},

		reload: function() {
			$('#grid').DataTable().ajax.reload();
		},

		dataCache: {},

		filterParams: function(excludeFieldName, searchTerm) {
			var me = this;
			var excludeKey = app.Filter.Key(this, excludeFieldName);
			var filters = app.filters.filter(function(f) {
				return  f.id != excludeKey;
			});
			filters = filters.filter(function(f) {
				//exclude evtl search on same table
				return ! (f.get('op') == app.Filter.OPS.SEARCH 
						&& f.get('table') == me);
			});
			
			if (searchTerm && searchTerm.length > 0) {
				var searchFilter = new app.Filter({
						table: this,
						field: excludeFieldName,
						op: app.Filter.OPS.SEARCH,
						value: searchTerm
				});
				filters.push(searchFilter);
			}
			
			return app.Filters.toParam(filters);
		},

		stats : function(fieldName, callback) {
			var me = this;

			var fieldParam = '$select='+fieldName;
			var url = REST_ROOT + this.get('url') + STATS_EXT 
					+ '?' + fieldParam
					+ '&' + this.filterParams(fieldName);

			console.log('stats ' + me.get('name') + '.' + fieldName + ' ' + url);

			if (this.dataCache[url]) {
				callback(this.dataCache[url][fieldName]);

			} else {
				$.ajax(url, {
				}).done(function(response) {
					//console.dir(response);
					me.dataCache[url] = response;
					callback(response[fieldName]);
				});
			}
		},
		
		options: function(fieldName, searchTerm, callback) {
			var me = this;

			var topParam = '$top=20';
			var distinctParam = '$distinct=true';
			var fieldParam = '$select='+fieldName;
			var orderParam = '$orderby='+fieldName;

			var url = REST_ROOT + this.get('url') + ROWS_EXT 
					+ '?' + fieldParam
					+ '&' + orderParam
					+ '&' + distinctParam
					+ '&' + topParam
					+ '&' + this.filterParams(fieldName, searchTerm);					
			console.log('options ' + me.get('name') + '.' + fieldName + ' ' + url);

			if (this.dataCache[url]) {
	//console.log(this.dataCache[url]);
				callback(this.dataCache[url]['rows']);

			} else {
				$.ajax(url, {
				}).done(function(response) {
					//console.dir(response.rows);
					me.dataCache[url] = response;
					callback(response.rows);
				});
			}
		}

	});		

})();
