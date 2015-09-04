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
			//this.listenTo(app.schema, 'change', this.render);
		},

		template: null,

		render: function() {
			console.log('MenuDataView.render ');			
			this.$el.html('');
			return this;
		},

	});

})(jQuery);


