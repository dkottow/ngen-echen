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

				//if (data.search.value.length > 0) {
				app.filters.setFilter({
					table: me,
					op: app.Filter.OPS.SEARCH,
					value: data.search.value
				});
				//}

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

		dataCache: {},
		stats : function(field, callback) {
			var fieldParam = '$fields='+field;
			
			var me = this;
			var url = REST_ROOT + this.get('url') + STATS_EXT + '?'
					+ fieldParam
					+ '&' + app.filters.toParam();

			console.log('stats ' + me.get('name') + '.' + field + ' ' + url);

			if (this.dataCache[url]) {
				callback(this.dataCache[url][field]);

			} else {
				$.ajax(url, {
				}).done(function(response) {
					//console.dir(response);
					me.dataCache[url] = response;
					callback(response[field]);
				});
			}
		},
		
		options: function(field, callback) {
			var topParam = '$top=200';
			var distinctParam = '$distinct=1';
			var fieldParam = '$fields='+field;
			var orderParam = '$orderby='+field;

			var me = this;
			var url = REST_ROOT + this.get('url') + ROWS_EXT + '?'
					+ '&' + fieldParam
					+ '&' + orderParam
					+ '&' + distinctParam
					+ '&' + topParam
					+ '&' + app.filters.toParam();

			console.log('options ' + me.get('name') + '.' + field + ' ' + url);

			if (this.dataCache[url]) {
	console.log(this.dataCache[url]);
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
