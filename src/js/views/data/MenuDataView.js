/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.MenuDataView = Backbone.View.extend({
		el:  '#menu',

		events: {
			'click #show-filters': 'evShowFilters',
			//'click #reset-all-filters': 'evResetAllFilters'
		},

		initialize: function() {
			console.log("MenuView.init");
			//this.listenTo(app.table, 'change', this.render);
		},

		template: _.template($('#data-menu-template').html()),

		render: function() {
			console.log('MenuDataView.render ');			
			if (! app.table) this.$el.empty();
			else this.$el.html(this.template());
			return this;
		},

		evResetAllFilters: function() {
			app.unsetFilters();
			app.resetTable();
		},

		evShowFilters: function() {
			app.filterShowView.collection = app.filters;
			app.filterShowView.render();
		},

	});

})(jQuery);


