/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.DataTableView = Backbone.View.extend({

		id: 'grid-panel',
		className: 'panel',

		initialize: function() {
			console.log("DataTableView.init " + this.model);			
			this.listenTo(app.filters, 'update', this.renderFilterButtons);
		},

		tableTemplate: _.template($('#grid-table-template').html()),
		columnTemplate: _.template($('#grid-column-template').html()),

		renderFilterButtons: function() {
			var columns = this.model.getColumns();
			_.each(columns, function(c, idx) {
				
				var filter = app.filters.getFilter(
						this.model, 
						c.field.get('name')
					);
				
				var active = filter ? true : false;
				var $el = this.$('#col-' + c.data + ' button').first();
				$el.toggleClass('filter-btn-active', active); 

			}, this);
		},

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

			this.renderFilterButtons();

			var filter = app.filters.getFilter(this.model);			
			var initSearch = {};
			if (filter) initSearch.search = filter.get('value');

			this.$('#grid').dataTable({
				'serverSide': true,
				'columns': this.model.getColumns(),				
				'ajax': this.model.ajaxGetRowsFn(),
				'search': initSearch
			});

			if (filter) {
				this.$('#grid_filter input').val(filter.get('value'));
			}

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
				var el = me.$('#col-' + colName + ' div.dropdown-menu');

				var filter = new app.Filter({
					table: me.model,
					field: field
				});

				app.setFilterView(filter, el);
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


