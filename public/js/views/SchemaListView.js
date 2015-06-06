/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.SchemaListView = Backbone.View.extend({
		//el:  '#schema-select',

		tagName: 'ul',
		className: 'dropdown-menu alert-dropdown',

		events: {
			'click .schema-option': 'evSchemaClick'
		},

		initialize: function() {
			console.log("SchemaListView.init");
			this.listenTo(this.collection, 'update', this.render);
		},

		template: _.template($('#schema-select-template').html()),

		render: function() {
			console.log('SchemaListView.render ');			
			//var el = this.$('ul');
			this.collection.each(function(schema) {
				this.$el.append(this.template({name: schema.get('name')}));
			}, this);			
			return this;
		},
	
		evSchemaClick: function(ev) {
			var name = $(ev.target).attr('data-target');
			console.log('SchemaListView.evSchemaClick ' + name);
			var schema = this.collection.find(function(c) { 
				return c.get('name') == name; 
			});
//TODO			
			app.schema = schema;
			this.$('a:first span').html(' Schema ' + app.schema.get('name') + ' ');

			if (app.tableListView) app.tableListView.remove();
			app.tableListView = new app.TableListView({
				collection: app.schema.get('tables')
			});
			$('#table-list').append(app.tableListView.render().el);

		}

	});

})(jQuery);


