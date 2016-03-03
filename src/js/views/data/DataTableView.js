/*global Donkeylift, Backbone, jQuery, _ */

(function ($) {
	'use strict';

	Donkeylift.DataTableView = Backbone.View.extend({

		id: 'grid-panel',
		className: 'panel',

		initialize: function() {
			console.log("DataTableView.init " + this.model);			
			this.listenTo(Donkeylift.app.filters, 'update', this.renderFilterButtons);
		},

		tableTemplate: _.template($('#grid-table-template').html()),
		columnTemplate: _.template($('#grid-column-template').html()),

		renderFilterButtons: function() {
			var columns = this.model.getColumns();
			_.each(columns, function(c, idx) {
				
				var filter = Donkeylift.app.filters.getFilter(
						this.model, 
						c.field.get('name')
					);
				
				var active = filter ? true : false;
				var $el = this.$('#col-' + c.data + ' button').first();
				$el.toggleClass('filter-btn-active', active); 

			}, this);
		},

		getOptions: function(params, columns) {
			params = params || {};
			var dtOptions = {};
			
			dtOptions.displayStart = params.$skip || 0;
			dtOptions.pageLength = params.$top || 10;

			dtOptions.order = [0, 'asc'];
			if (params.$orderby) {
				var order = _.pairs(params.$orderby[0]) [0];
				for(var i = 0; i < columns.length; ++i) {
					if (columns[i].data == order[0]) {
						dtOptions.order[0] = i;
						dtOptions.order[1] = order[1];
						break;
					}
					
				}
			}

			return dtOptions;
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

			var filter = Donkeylift.app.filters.getFilter(this.model);			
			var initSearch = {};
			if (filter) initSearch.search = filter.get('value');

			var dtOptions = this.getOptions(this.attributes.params, columns);
			console.log(dtOptions);

			this.$('#grid').dataTable({
				serverSide: true,
				columns: this.model.getColumns(),				
				ajax: this.model.ajaxGetRowsFn(),
				search: initSearch,
				displayStart: dtOptions.displayStart, 
				pageLength: dtOptions.pageLength, 
				order: dtOptions.order
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

				var filter = new Donkeylift.Filter({
					table: me.model,
					field: field
				});

				Donkeylift.app.setFilterView(filter, el);
			});


			this.$('#grid').on( 'page.dt', function () {
				console.log("page.dt");
				Donkeylift.app.router.navigate("reload-table", {trigger: false});			
			});

			//using order.dt event won't work because its fired otherwise, too
			this.$('th.sorting').click(function () {
				console.log("order.dt");
				Donkeylift.app.router.navigate("reload-table", {trigger: false});			
			});

			//using search.dt event won't work because its fired otherwise, too
			this.$('input[type="search"]').blur(function () {
				console.log("search.dt");
				Donkeylift.app.router.navigate("reload-table", {trigger: false});			
			});
			this.$('input[type="search"]').focus(function () {
				console.log("search.dt");
				Donkeylift.app.router.navigate("reload-table", {trigger: false});			
			});


			return this;
		},

	});

})(jQuery);


