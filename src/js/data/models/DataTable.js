/*global Donkeylift, Backbone */

var ROWS_EXT = '.rows';
var STATS_EXT = '.stats';

Donkeylift.DataTable = Donkeylift.Table.extend({

	createView: function(options) {
		return new Donkeylift.DataTableView(options);
	},

	fullUrl: function(ext) {
		ext = ext || ROWS_EXT;
		return DONKEYLIFT_API + this.get('url') + ext;
	},

	getAllRowsUrl: function() {
		return this.lastFilterUrl;
		//return decodeURI(this.lastFilterUrl).replace(/\t/g, '%09');
	},

	sanitizeEditorData: function(req) {
		var me = this;

		try {
			var parseOpts = { validate: true, resolveRefs: true };
			var rows = [];
			switch(req.action) {
				case 'create':
					method = 'POST';
					rows = _.map(req.data, function(strRow) {
						return me.parse(strRow, parseOpts);
					});
				break;
				case 'edit':
					method = 'PUT';
					rows = _.map(req.data, function(strRow, id) {
						var row = me.parse(strRow, parseOpts);
						row.id = id;
						return row;
					});
				break;
				case 'remove':
					method = 'DELETE';
					rows = _.map(_.keys(req.data), function(id) {
						return parseInt(id);
					});
				break;
			}

			var data = JSON.stringify(rows);

		} catch(err) {
			req.error = err;
		}

		req.data = data;
	},

	ajaxGetEditorFn: function() {
		var me = this;
		return function(U1, U2, req, success, error) {
			console.log('api call edit row ');
			console.log(req);

			if (req.error) {
				error(null, '', '');
				return;
			}

			var q = 'retmod=true';
			var url = me.fullUrl() + '?' + q;

			$.ajax(url, {
				method: method,
				data: req.data,
				contentType: "application/json",
				processData: false

			}).done(function(response) {
				console.log(response);
				success({data: response.rows});

			}).fail(function(jqXHR, textStatus, errThrown) {
				error(jqXHR, textStatus, errThrown);
				console.log("Error requesting " + url);
				console.log(textStatus + " " + errThrown);
			});
		}
	},

	ajaxGetRowsFn: function() {
		var me = this;
		return function(query, callback, settings) {
			console.log('api call get rows');
			var orderField = me.get('fields')
							.at(query.order[0].column);

			var orderParam = '$orderby='
							+ encodeURIComponent(orderField.vname()
							+ ' ' + query.order[0].dir);

			var skipParam = '$skip=' + query.start;
			var topParam = '$top=' + query.length;

			if (query.search.value.length == 0) {
				//sometimes necessary after back/fwd
				Donkeylift.app.filters.clearFilter(me);
			}

			var filters = Donkeylift.app.filters.clone();

			if (query.search.value.length > 0) {
				filters.setFilter({
					table: me,
					op: Donkeylift.Filter.OPS.SEARCH,
					value: query.search.value
				});
			}

			var q = orderParam
				+ '&' + skipParam
				+ '&' + topParam
				+ '&' + filters.toParam();
			var url = me.fullUrl() + '?' + q;

			console.log(url);

			me.lastFilterUrl = me.fullUrl() + '?' + filters.toParam();

			$.ajax(url, {
				cache: false
			}).done(function(response) {
				//console.log('response from api');
				//console.dir(response);

				var fragment = 'data'
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
			}).fail(function(jqXHR, textStatus, errThrown) {
				console.log("Error requesting " + url);
				console.log(textStatus + " " + errThrown);
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

		var url = me.fullUrl(STATS_EXT) + '?' + q;

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
			'$select': fieldName,
			'$orderby': fieldName
		};

		var q = _.map(params, function(v,k) { return k + "=" + v; })
				.join('&');

		var filters = Donkeylift.app.filters.apply(filter, searchTerm);
		q = q + '&' + Donkeylift.Filters.toParam(filters);

		var url = me.fullUrl() + '?' + q;

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
