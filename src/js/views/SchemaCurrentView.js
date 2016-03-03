/*global Donkeylift, Backbone, jQuery, _ */

(function ($) {
	'use strict';

	Donkeylift.SchemaCurrentView = Backbone.View.extend({
		el:  '#schema-list',

		initialize: function() {
		},

		render: function() {
			console.log('SchemaCurrentView.render ');			
			if (Donkeylift.app.schema) {
				this.$('a:first span').html(' DB ' 
					+ Donkeylift.app.schema.get('name'));
			} else {
				this.$('a:first span').html(' Choose DB ');
			}		
			return this;
		},


	});

})(jQuery);


