/*global Donkeylift, Backbone, jQuery, _ */

(function ($) {
	'use strict';

	Donkeylift.SchemaListView = Backbone.View.extend({
		//el:  '#schema-select',

		tagName: 'ul',
		className: 'dropdown-menu alert-dropdown',

		events: {
			'click .schema-option': 'evSchemaClick'
		},

		initialize: function() {
			console.log("SchemaListView.init");
			this.listenTo(this.collection, 'reset', this.render);
		},

		template: _.template($('#schema-select-template').html()),

		render: function() {
			console.log('SchemaListView.render ');			
			//var el = this.$('ul');
			this.$el.empty();	
			this.collection.each(function(schema) {
				this.$el.append(this.template({name: schema.get('name')}));
			}, this);
			
			return this;
		},

		evSchemaClick: function(ev) {
			var name = $(ev.target).attr('data-target');
			console.log('SchemaListView.evSchemaClick ' + name);
			Donkeylift.app.setSchema(name);
		}

	});

})(jQuery);


