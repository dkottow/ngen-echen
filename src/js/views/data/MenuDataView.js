/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.MenuDataView = Backbone.View.extend({
		el:  '#menu',

		events: {
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

	});

})(jQuery);


