/*global Donkeylift, _, Backbone, $ */

var ROWS_EXT = '.rows';
var STATS_EXT = '.stats';
var CHOWN_EXT = '.chown';
var CSV_EXT = '.csv';

Donkeylift.DataTable = Donkeylift.Table.extend({

	initialize: function(table) {
		Donkeylift.Table.prototype.initialize.apply(this, arguments);
		this.set('skipRowCounts', false); //if true nocounts=1 on api calls.
	},

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
		return Donkeylift.env.server + this.get('url') + ext;
	},

	getAllRowsUrl: function() {
		return this.lastFilterUrl;
		//return decodeURI(this.lastFilterUrl).replace(/\t/g, '%09');
	},

	sanitizeEditorData: function(req) {
		var me = this;

		try {
			var resolveRefs = this.get('fields').at(0).get('resolveRefs');
			var parseOpts = { validate: true, resolveRefs: resolveRefs };
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
						row.id = parseInt(id);
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
			var url = me.fullUrl() + '?' + q.join('&');

			Donkeylift.ajax(url, {
				method: req.method,
				data: req.data,
				contentType: "application/json",
				processData: false

			}).then(function(result) {
				var response = result.response;
				console.log(response);
				success({data: response.rows});

			}).catch(function(result) {
				error(result.jqXHR, result.textStatus, result.errThrown);
				console.log("Error requesting " + url);
				console.log(result.textStatus + " " + result.errThrown);
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
			
			var fieldNames = me.get('fields').map(function(field) {
				return field.vname();
			});
			
			var params = {
				'$select': fieldNames.join(','),
				'$orderby': orderClauses.join(','),
				'$skip': query.start,
				'$top': query.length,
				'counts': me.get('skipRowCounts') ? 0 : 1
			}

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

			var q = _.map(params, function(v, k) {
				return k + '=' + v;
			}).join('&');
			q = q + '&' + filters.toParam();

			var url = me.fullUrl() + '?' + q;
			console.log(url);

			me.lastFilterUrl = me.fullUrl() + '?' + filters.toParam();
			me.lastFilterQuery = { 
				order: orderClauses, 
				filters: filters,
				fields:  fieldNames
			};

			Donkeylift.ajax(url, {
				cache: false

			}).then(function(result) {
				var response = result.response;
					//console.log('response from api');
				//console.dir(response);

				var fragment = 'data'
							+ '/' + Donkeylift.app.schema.get('name')
							+ '/' + me.get('name')
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

				if (me.get('skipRowCounts')) {
					//unknown number of rows.. 
					//if returned data less than queried data length, stop. 
					//otherwise make sure we get a next page.
					data.recordsFiltered = (data.data.length < query.length) 
						? query.start + data.data.length : query.start + query.length + 1;
					data.recordsTotal = data.recordsFiltered;					
				}

				callback(data);
			}).catch(function(result) {
				console.log("Error requesting " + url);
				var err = new Error(result.jqXHR.responseText);
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
			Donkeylift.ajax(url, {
				
			}).then(function(result) {
				var response = result.response;
					//console.dir(response);
				me.dataCache[url] = response;
				callback(response[fieldName]);

			}).catch(function(result) {
				console.log("Error requesting " + url);
				var err = new Error(result.jqXHR.responseText);
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
			Donkeylift.ajax(url, {

			}).then(function(result) {
				var response = result.response;
					//console.dir(response.rows);
				me.dataCache[url] = response;
				callback(response.rows);

			}).catch(function(result) {
				console.log("Error requesting " + url);
				var err = new Error(result.jqXHR.responseText);
				console.log(err);
				alert(err.message);
			});
		}
	},

	changeOwner: function(rowIds, owner) {
		var me = this;
		var q = 'owner=' + encodeURIComponent(owner);
		var url = this.fullUrl(CHOWN_EXT) + '?' + q;

		Donkeylift.ajax(url, {
			method: 'PUT',
			data: JSON.stringify(rowIds),
			contentType: "application/json",
			processData: false

		}).then(function(result) {
			var response = result.response;
			console.log(response);
			me.reload();

		}).catch(function(result) {
			console.log("Error requesting " + url);
			var err = new Error(result.jqXHR.responseText);
			console.log(err);
			alert(err.message);
		});
	},

	getRowsAsCSV: function(cbResult) {
		var me = this;
		if ( ! this.lastFilterQuery) return;

		var q = '$select=' + this.lastFilterQuery.fields.join(',')
			+ '&' + this.lastFilterQuery.filters.toParam()
			+ '&' + '$orderby=' + this.lastFilterQuery.order.join(',')
			+ '&' + 'format=csv'
			+ '&' + 'nocounts=1';

		var url = this.fullUrl() + '?' + q;
		console.log(url);

		Donkeylift.ajax(url, {

		}).then(function(result) {
			var response = result.response;
			me.dataCache[url] = response;
			cbResult(response);

		}).catch(function(result) {
			console.log("Error requesting " + url);
			var err = new Error(result.jqXHR.responseText);
			console.log(err);
			alert(err.message);
			cbResult();
		});
	},

	generateCSV : function(fields, cbResult) {
		var me = this;
		if ( ! this.lastFilterQuery || ! fields || ! fields.length) return;

		var q = '$select=' + fields.join(',')
			+ '&' + '$orderby=' + this.lastFilterQuery.order.join(',')
			+ '&' + this.lastFilterQuery.filters.toParam();

		var path = this.get('url') + CSV_EXT + '?' + q;
		var url = Donkeylift.env.server + this.get('url') + '.nonce';

		Donkeylift.ajax(url, {
			type: 'POST',
			data: JSON.stringify({ path: path }),
			contentType:'application/json; charset=utf-8',
			dataType: 'json'

		}).then(function(result) {
			var response = result.response;
			var link = Donkeylift.env.server + me.get('url') + CSV_EXT + '?nonce=' + response.nonce;
			cbResult(null, link);
			console.log(response);

		}).catch(function(result) {
			console.log("Error requesting " + url);
			var err = new Error(result.jqXHR.responseText);
			console.log(err);
			alert(err.message);
			cbResult(err);
		});
	},
	
	getPreferences: function() {
		return {
			skipRowCounts : this.get('skipRowCounts'),
			resolveRefs : this.get('fields').at(0).get('resolveRefs')
		}
	},

	setPreferences: function(prefs) {
		_.each(prefs, function(value, name) {
			switch(name) {
				case 'skipRowCounts':
					this.set('skipRowCounts', value);
					break;
				case 'resolveRefs':
					this.get('fields').each(function(field) {
						field.set('resolveRefs', value);	
					});
					break;
				default:
					console.log("unknown preference '" + name + "´");
			}
		}, this);
	},

});
