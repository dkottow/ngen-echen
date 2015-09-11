/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.SchemaCurrentView = Backbone.View.extend({
		el:  '#schema-list',

		initialize: function() {
		},

		render: function() {
			console.log('SchemaCurrentView.render ');			
			if (app.schema) {
				this.$('a:first span').html(' DB ' + app.schema.get('name'));
			} else {
				this.$('a:first span').html(' Choose DB ');
			}		
			return this;
		},


	});

})(jQuery);


