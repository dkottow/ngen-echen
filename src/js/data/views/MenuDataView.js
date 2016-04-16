/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.MenuDataView = Backbone.View.extend({
	el:  '#menu',

	events: {
		'click #show-filters': 'evShowFilters',
		//'click #reset-all-filters': 'evResetAllFilters'
	},

	initialize: function() {
		console.log("MenuView.init");
		//this.listenTo(Donkeylift.app.table, 'change', this.render);
	},

	template: _.template($('#data-menu-template').html()),

	render: function() {
		console.log('MenuDataView.render ');			
		if (! Donkeylift.app.table) this.$el.empty();
		else this.$el.html(this.template());
		return this;
	},

	evResetAllFilters: function() {
		Donkeylift.app.unsetFilters();
		Donkeylift.app.resetTable();
	},

	evShowFilters: function() {
		Donkeylift.app.filterShowView.collection = Donkeylift.app.filters;
		Donkeylift.app.filterShowView.render();
	},

});


