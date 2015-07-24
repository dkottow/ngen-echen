/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.DataTableView = Backbone.View.extend({

		className: 'panel',
		id: 'grid-panel',

		initialize: function() {
			console.log("DataTableView.init " + this.model);			
		},

		tableTemplate: _.template($('#grid-table-template').html()),
		columnTemplate: _.template($('#grid-column-template').html()),

		render: function() {
			console.log('DataTableView.render ');			
			var me = this;
			this.$el.html(this.tableTemplate());

			var columns = this.model.getColumns();

			_.each(columns, function(c, idx) {
				var align = idx < columns.length / 2 ? 
					'dropdown-menu-left' : 'dropdown-menu-right';
				
				this.$('thead > tr').append(this.columnTemplate({
					name: c.data,
					dropalign: align	
				}));					

			}, this);

			this.$('#grid').dataTable({
				'serverSide': true,
				//'processing': true,
				'columns': columns,				
				'ajax': this.model.ajaxGetRowsFn()
			});

			this.$('.field-filter').click(function(ev) {
				ev.stopPropagation();

				if ( ! $(this).data('bs.dropdown')) {
					//workaround for first click to show dropdown
					$(this).dropdown('toggle');
				} else {
					$(this).dropdown();
				}

				var colName = $(this).data('column');
				var field = me.model.get('fields').getByName(colName);

				var filterEl = me.$('#col-' + colName + ' div.dropdown-menu');

				app.filterView = new app.FilterView({
					model: field,
					el: filterEl
				});
				app.filterView.render();

			});

/*
			this.$('#grid').on( 'init.dt', function () {
			    console.log('grid ev init');
			});
*/
			return this;
		},

	});

})(jQuery);


