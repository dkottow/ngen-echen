/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.MenuSchemaView = Backbone.View.extend({
		el:  '#menu',

		events: {
			'click #add-table': 'evAddTableClick',
			'click #new-schema': 'evNewSchemaClick',
			'click #save-schema': 'evSaveSchemaClick',
		},

		initialize: function() {
			console.log("MenuView.init");
			//this.listenTo(app.schema, 'change', this.render);
		},

		template: _.template($('#schema-menu-template').html()),

		render: function() {
			console.log('MenuSchemaView.render ');			
			this.$el.html(this.template({
				table: app.table, 
				schema: app.schema
			}));
			this.$('#add-table').prop('disabled', app.schema == null);
			this.$('#save-schema').prop('disabled', app.schema == null);

			//render current schema label
			var current = $('#schema-list > a:first span').html();
			if (app.schema && app.schema.get('name') == '')	{
				current = ' New Database ';
			} else if (app.schema) {
				current = ' Database ' + app.schema.get('name');
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
		},

	});

})(jQuery);


