/*global Backbone */
var app = app || {};

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
			return function(data, callback, setttings) {
				console.log('request to REST');
				//console.dir(data);
				var orderField = me.get('fields')
								.at(data.order[0].column);

				var orderParam = '$orderby=' + orderField.vname() 
								+ ' ' + data.order[0].dir;
				
				var skipParam = '$skip=' + data.start;
				var topParam = '$top=' + data.length;

				if (data.search.value.length > 0) {
					var filter = new app.Filter({
						table: me.get('name'),
						field: me.get('name'),
						op: 'search',
						value: data.search.value + '*'
					});
					app.filters.setSearch(filter);
				}

				var searchParam = app.filters.toParam();
/*
				if (app.filters.size() > 0) {
					searchParam = '$filter=' + app.filter.toParam();
				}
*/
				var url = REST_ROOT + me.get('url') + '?'
						+ orderParam
						+ "&" + skipParam 
						+ "&" + topParam
						+ "&" + searchParam;

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




	});		

})();
