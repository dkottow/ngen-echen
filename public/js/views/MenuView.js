/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.MenuView = Backbone.View.extend({
		el:  '#schema-menu',

		events: {
			'click #add-table': 'evAddTableClick',
			'click #new-schema': 'evNewSchemaClick',
			'click #save-schema': 'evSaveSchemaClick'
		},

		initialize: function() {
			console.log("MenuView.init");
			//this.listenTo(app.schema, 'change', this.render);
		},

		template: _.template($('#schema-menu-template').html()),

		render: function() {
			console.log('MenuView.render ');			
			this.$el.html(this.template({
				table: app.table, 
				schema: app.schema
			}));
			this.$('#add-table').prop('disabled', app.schema == null);
			this.$('#save-schema').prop('disabled', app.schema == null);

			//render current schema label
			var current = $('#schema-list > a:first span').html();
			if (app.schema && app.schema.get('name') == '')	{
				current = ' New Schema ';
			} else if (app.schema) {
				current = ' Schema ' + app.schema.get('name');
			} else if (app.database) {
				current = ' Database ' + app.database.get('name');
			}
			$('#schema-list > a:first span').html(current);

			return this;
		},

		evAddTableClick: function() {
			var table = app.Table.create();
			app.tableEditView.model = table;
			app.tableEditView.render();
			
		},

		evSaveSchemaClick: function() {
			app.schemaEditView.model = app.schema;
			app.schemaEditView.render();
		},

		evNewSchemaClick: function() {
			
			app.newSchema();
/*
			var newSchema = app.Schema.create();
			app.schemas.remove('');
			app.schemas.add(newSchema);
			app.setSchema(newSchema);
*/
		}

	});

})(jQuery);


