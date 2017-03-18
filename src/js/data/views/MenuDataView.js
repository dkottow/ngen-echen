/*global Donkeylift, Backbone, $, _ */

Donkeylift.MenuDataView = Backbone.View.extend({
	el:  '#menu',

	events: {
		'click #filter-show': 'evFilterShow',
		'click #selection-filter': 'evSelectionFilter',
		'click #selection-add': 'evSelectionAdd',
	},

	initialize: function(opts) {
		console.log("MenuView.init");
		this.listenTo(opts.app.selectedRows, 'update', this.updateSelectionLabel);
		this.listenTo(opts.app.selectedRows, 'reset', this.updateSelectionLabel);
	},

	template: _.template($('#data-menu-template').html()),

	render: function() {
		console.log('MenuDataView.render ');			
		if (! Donkeylift.app.table) {
			this.$el.empty();
		} else {
			this.$el.html(this.template());
		}
		return this;
	},

	updateSelectionLabel: function() {
		var selCount = Donkeylift.app.getSelection().length;
		var label = 'Selection';
		if (selCount > 0) label = label + ' (' + selCount + ')';
		$('#selection-dropdown span:first').text(label);
	},

	getShowFilter: function() {
		if ( ! this.filterShowView) {
			this.filterShowView = new Donkeylift.FilterShowView();
		}
		return this.filterShowView;
	},

	evFilterShow: function() {
		this.getShowFilter().collection = Donkeylift.app.filters;
		this.getShowFilter().render();
	},

	addSelection: function() {
		var table = Donkeylift.app.table;
		var rows = $('#grid').DataTable().rows({selected: true}).data().toArray();
		Donkeylift.app.addSelection(table.get('name'), rows);
	},

	evSelectionAdd: function(ev) {
		this.addSelection();
	
		$('#selection-dropdown').dropdown('toggle');	
		return false;
	},

	evSelectionFilter: function(ev) {
		this.addSelection();

		var table = Donkeylift.app.table;
		var rows = Donkeylift.app.getSelection({ table: table.get('name') });

		if (rows.length == 0) {
			$('#selection-dropdown').dropdown('toggle');	
			return false;
		}
		
		var filter = Donkeylift.Filter.Create({
			table: table,
			field: 'id',
			op: Donkeylift.Filter.OPS.IN,
			value: _.pluck(rows, 'id')
		});

		Donkeylift.app.setFilters([ filter ]);
		Donkeylift.app.resetTable();

	},
});


