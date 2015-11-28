/*global Backbone */
var app = app || {};

var ROWS_EXT = '.rows';
var STATS_EXT = '.stats';

(function () {
	'use strict';
	//console.log("Table class def");
	app.DataTable = app.Table.extend({ 

		createView: function(options) {
			return new app.DataTableView(options);
		},

		getColumns: function() {

			return this.get('fields')
				.sortBy(function(field) {
					return field.get('order');
				})
				.map(function(field) {
					return { 
			data : field.vname(),
		    render: function ( data, type, full, meta ) {
				      	return type == 'display' && data && data.length > 40 
							?  '<span title="'
								+ data + '">'
								+ data.substr( 0, 38) 
								+ '...</span>' 
							: data;
    					},
						field: field 
					};
				});
		},

		getFullUrl: function() {
			return this.lastAjaxUrl;
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

				var q = orderParam
					+ '&' + skipParam 
					+ '&' + topParam
					+ '&' + app.filters.toParam();
				var url = REST_ROOT + me.get('url') + ROWS_EXT + '?' + q;

				console.log(url);

				me.lastAjaxUrl = url;

				$.ajax(url, {
					cache: false
				}).done(function(response) {
					//console.log('response from REST');
					//console.dir(response);

					var fragment = encodeURI(
								app.module() 
								+ '/' + app.schema.get('name')
								+ '/' + app.table.get('name') 
								+ '/' + q.replace(' ', '+'));
					//console.log(fragment);
					app.router.navigate(fragment, {replace: true});

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

		load: function(url) {
			$('#grid').DataTable().ajax.url(url).load();
		},

		dataCache: {},

		stats : function(filter, callback) {
			var me = this;
			
			var fieldName = filter.get('field').vname();

			var params = { '$select' : fieldName };

			var q = _.map(params, function(v,k) { return k + "=" + v; })
					.join('&');

			var filters = app.filters.apply(filter);
			q = q + '&' + app.Filters.toParam(filters);

			var url = REST_ROOT + this.get('url') + STATS_EXT 
					+ '?' + q;

			console.log('stats ' + me.get('name') + '.' + fieldName 
						+ ' ' + url);

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
		
		options: function(filter, searchTerm, callback) {
			var me = this;

			var fieldName = filter.get('field').vname();

			var params = { 
				'$top': 10,
				'$distinct': true,
				'$select': fieldName,				
				'$orderby': fieldName
			};

			var q = _.map(params, function(v,k) { return k + "=" + v; })
					.join('&');

			var filters = app.filters.apply(filter, searchTerm);
			q = q + '&' + app.Filters.toParam(filters);

			var url = REST_ROOT + this.get('url') + ROWS_EXT 
					+ '?' + q;

			console.log('options ' + me.get('name') + '.' + fieldName 
						+ ' ' + url);

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
		},

	});		

})();
