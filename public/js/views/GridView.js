/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.GridView = Backbone.View.extend({

		className: 'panel',
		id: 'grid-panel',

		events: {
		},

		initialize: function() {
			console.log("GridView.init " + this.model);			
		},

		tableTemplate: _.template($('#grid-table-template').html()),
		columnTemplate: _.template($('#grid-column-template').html()),

		ajaxCreateFn: function() {
			var me = this;
			return function(data, callback, setttings) {
				console.log('request to REST');
				console.dir(data);
				var orderField = me.model.get('fields')
								.at(data.order[0].column).get('name');

				var orderParam = '$orderby=' + orderField 
								+ ' ' + data.order[0].dir;
				
				var skipParam = '$skip=' + data.start;
				var topParam = '$top=' + data.length;

				var url = REST_ROOT + me.model.get('url') + '?'
						+ orderParam
						+ "&" + skipParam 
						+ "&" + topParam;
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

		render: function() {
			console.log('GridView.render ');			
			this.$el.html(this.tableTemplate());
			this.model.get('fields').each(function(field) {
				//console.log(field.get('name'));			
				this.$('thead > tr').append(this.columnTemplate({
					name: field.get('name')
				}));	
			}, this);			
			var columns = this.model.get('fields').map(function(field) {
				return (field.get('fk') == 1) ?
					  { 'data': field.get('fk_table') + '_'}
					: { 'data': field.get('name') };
			});
			this.$('#grid').dataTable({
				'serverSide': true,
				//'processing': true,
				'columns': columns,
				'ajax': this.ajaxCreateFn()
			});
			return this;
		},

	});

})(jQuery);


