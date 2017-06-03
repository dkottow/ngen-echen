/*global Donkeylift, _, Backbone, $ */

var ROWS_EXT = '.rows';
var STATS_EXT = '.stats';
var CHOWN_EXT = '.chown';

Donkeylift.DataTable = Donkeylift.Table.extend({

	createView: function(options) {
		return new Donkeylift.DataTableView(options);
	},

	getEnabledFields: function() {
		return new Donkeylift.Fields(this.get('fields').filter(function(field) {
			return ! field.get('disabled');
		}));
	},

	fullUrl: function(ext) {
		ext = ext || ROWS_EXT;
		return Donkeylift.env.API_BASE + this.get('url') + ext;
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
			var method;
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
		req.method = method;
	},

	getEditorFields: function() {
		
		var editFields = _.filter(this.getEnabledFields().sortByOrder(), function(field) {
			return ! _.contains(Donkeylift.Table.NONEDITABLE_FIELDS, field.get('name'));
		});
		
		if (Donkeylift.app.account.isAdmin()) {
			return editFields;
		}
		
		var loggedUser = Donkeylift.app.schema.get('users').getByName(Donkeylift.app.account.get('user'));

		if (_.contains(['reader', 'writer'], loggedUser.get('role'))) {
			//only db-owner is allowed to change own_by fields.
			editFields = _.reject(editFields, function(field) {
				return field.get('name') == 'own_by'; 
			});
		}
		
		return editFields;
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

			var q = ['retmod=true'];
			if (Donkeylift.env.DEMO_FLAG) {
				var user = Donkeylift.app.account.get('user');
				q.push('user=' + user); 
			}
			var url = me.fullUrl() + '?' + q.join('&');

			$.ajax(url, {
				method: req.method,
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

			var orderClauses = [];
			for(var i = 0; i < query.order.length; ++i) {
				var orderCol = query.columns[query.order[i].column].data;
				var orderField = me.get('fields').getByName(orderCol);
				orderClauses.push(encodeURIComponent(
						orderField.vname() + ' ' + query.order[i].dir));
			}
			
			var orderParam = '$orderby=' + orderClauses.join(',');

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
				var err = new Error(errThrown + " " + textStatus);
				console.log(err);
				alert(err.message);
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

			}).fail(function(jqXHR, textStatus, errThrown) {
				console.log("Error requesting " + url);
				var err = new Error(errThrown + " " + textStatus);
				console.log(err);
				alert(err.message);
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

		var q = _.map(params, function(v,k) { return k + "=" + encodeURIComponent(v); })
				.join('&');

		var filters = Donkeylift.app.filters.apply(filter, searchTerm);
		q = q + '&' + Donkeylift.Filters.toParam(filters);

		var url = this.fullUrl() + '?' + q;

		console.log('options ' + this.get('name') + '.' + fieldName
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

			}).fail(function(jqXHR, textStatus, errThrown) {
				console.log("Error requesting " + url);
				var err = new Error(errThrown + " " + textStatus);
				console.log(err);
				alert(err.message);
			});
		}
	},

	changeOwner: function(rowIds, owner) {
		var me = this;
		var q = 'owner=' + encodeURIComponent(owner);
		var url = this.fullUrl(CHOWN_EXT) + '?' + q;

		$.ajax(url, {
			method: 'PUT',
			data: JSON.stringify(rowIds),
			contentType: "application/json",
			processData: false

		}).done(function(response) {
			console.log(response);
			me.reload();

		}).fail(function(jqXHR, textStatus, errThrown) {
			console.log("Error requesting " + url);
			var err = new Error(errThrown + " " + textStatus);
			console.log(err);
			alert(err.message);
		});
	},

});
