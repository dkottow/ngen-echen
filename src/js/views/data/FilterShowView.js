/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.FilterShowView = Backbone.View.extend({
		el:  '#modalShowFilters',

		events: {
		},

		initialize: function() {
			console.log("FilterShowView.init");
		},

		render: function() {
			$('#modalShowFilters').modal();
			return this;
		},


	});

})(jQuery);


