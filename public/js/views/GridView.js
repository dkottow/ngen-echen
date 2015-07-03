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
				}).done(function(data) {
					data.recordsTotal = 1000;
					data.recordsFiltered = 234;
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
				return { 'data': field.get('name') }
			});
			this.$('#grid').dataTable({
				'serverSide': true,
				'processing': true,
				'columns': columns,
				'ajax': this.ajaxCreateFn()
			});
			return this;
		},

	});

})(jQuery);


