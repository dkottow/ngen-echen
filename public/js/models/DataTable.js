/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	//console.log("Table class def");
	app.DataTable = app.Table.extend({ 

		getColumns: function() {

			return this.get('fields').map(function(field) {
				return (field.get('fk') == 1) ?
					  { 'data': field.get('fk_table') + '_ref'}
					: { 'data': field.get('name') };
			});
		},

		ajaxGetRowsFn: function() {
			var me = this;
			return function(data, callback, setttings) {
				console.log('request to REST');
				console.dir(data);
				var orderField = me.get('fields')
								.at(data.order[0].column);

				var orderFieldName = orderField.get('fk') == 1 ?
									orderField.get('fk_table') + '_ref' :
									orderField.get('name');

				var orderParam = '$orderby=' + orderFieldName 
								+ ' ' + data.order[0].dir;
				
				var skipParam = '$skip=' + data.start;
				var topParam = '$top=' + data.length;

				var searchParam = '';
				if (data.search.value.length > 0) {
					app.filter = new app.DataFilter({
						table: me.get('name'),
						field: me.get('name'),
						op: 'search',
						value: data.search.value + '*'
					});
/*
					searchParam = '$filter=' + me.get('name') 
								+ '.' + me.get('name')
								+ ' search ' + data.search.value + '*';
*/
				}
				if (app.filter) {
					searchParam = '$filter=' + app.filter.toParam();
				}

				var url = REST_ROOT + me.get('url') + '?'
						+ orderParam
						+ "&" + skipParam 
						+ "&" + topParam
						+ "&" + searchParam;
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
