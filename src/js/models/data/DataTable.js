/*global Donkeylift, Backbone */

var ROWS_EXT = '.rows';
var STATS_EXT = '.stats';

(function () {
	'use strict';
	//console.log("Table class def");
	Donkeylift.DataTable = Donkeylift.Table.extend({

		createView: function(options) {
			return new Donkeylift.DataTableView(options);
		},

		getAllRowsUrl: function() {
			return decodeURI(this.lastFilterUrl);
		},

		ajaxGetRowsFn: function() {
			var me = this;
			return function(data, callback, settings) {
				console.log('request to api');
				var orderField = me.get('fields')
								.at(data.order[0].column);

				var orderParam = '$orderby='
								+ encodeURIComponent(orderField.vname()
								+ ' ' + data.order[0].dir);

				var skipParam = '$skip=' + data.start;
				var topParam = '$top=' + data.length;

				if (data.search.value.length == 0) {
					//sometimes necessary after back/fwd
					Donkeylift.app.filters.clearFilter(me);
				}

				var filters = Donkeylift.app.filters.clone();

				if (data.search.value.length > 0) {
					filters.setFilter({
						table: me,
						op: Donkeylift.Filter.OPS.SEARCH,
						value: data.search.value
					});
				}

				var q = orderParam
					+ '&' + skipParam
					+ '&' + topParam
					+ '&' + filters.toParam();
				var url = DONKEYLIFT_API + me.get('url') + ROWS_EXT + '?' + q;

				console.log(url);

				me.lastFilterUrl = DONKEYLIFT_API
								 + me.get('url') + ROWS_EXT + '?'
								 + filters.toParam();

				$.ajax(url, {
					cache: false
				}).done(function(response) {
					//console.log('response from api');
					//console.dir(response);

					var fragment =
								Donkeylift.app.module()
								+ '/' + Donkeylift.app.schema.get('name')
								+ '/' + Donkeylift.app.table.get('name')
								+ '/' + q;

					//console.log(fragment);
					Donkeylift.app.router.updateNavigation(fragment, {
						block: 100,
						replace: true
					});

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

			var filters = Donkeylift.app.filters.apply(filter);
			q = q + '&' + Donkeylift.Filters.toParam(filters);

			var url = DONKEYLIFT_API + this.get('url') + STATS_EXT
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

			var filters = Donkeylift.app.filters.apply(filter, searchTerm);
			q = q + '&' + Donkeylift.Filters.toParam(filters);

			var url = DONKEYLIFT_API + this.get('url') + ROWS_EXT
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
