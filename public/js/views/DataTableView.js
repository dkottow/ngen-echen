/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.DataTableView = Backbone.View.extend({

		className: 'panel',
		id: 'grid-panel',

		events: {
		},

		initialize: function() {
			console.log("DataTableView.init " + this.model);			
		},

		tableTemplate: _.template($('#grid-table-template').html()),
		columnTemplate: _.template($('#grid-column-template').html()),

		render: function() {
			console.log('DataTableView.render ');			
			this.$el.html(this.tableTemplate());

			var columns = this.model.getColumns();
			
			_.each(columns, function(c) {
				this.$('thead > tr').append(this.columnTemplate({
					name: c.data
				}));	
			}, this);

			this.$('#grid').dataTable({
				'serverSide': true,
				//'processing': true,
				'columns': columns,
				'ajax': this.model.ajaxGetRowsFn()
			});

			this.$('#grid').on( 'init.dt', function () {
			    console.log('grid ev init');
			});

			return this;
		},

	});

})(jQuery);


