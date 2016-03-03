/*global Donkeylift, Backbone, jQuery, _ */

(function ($) {
	'use strict';

	Donkeylift.MenuSchemaView = Backbone.View.extend({
		el:  '#menu',

		events: {
			'click #add-table': 'evAddTableClick',
			'click #new-schema': 'evNewSchemaClick',
			'click #save-schema': 'evSaveSchemaClick',
		},

		initialize: function() {
			console.log("MenuView.init");
			//this.listenTo(Donkeylift.app.schema, 'change', this.render);
		},

		template: _.template($('#schema-menu-template').html()),

		render: function() {
			console.log('MenuSchemaView.render ');			
			this.$el.show();
			this.$el.html(this.template());
			this.$('#add-table').prop('disabled', Donkeylift.app.schema == null);
			this.$('#save-schema').prop('disabled', Donkeylift.app.schema == null);

			return this;
		},

		evAddTableClick: function() {
			var table = Donkeylift.Table.create();
			Donkeylift.app.tableEditView.model = table;
			Donkeylift.app.tableEditView.render();
			
		},


		evSaveSchemaClick: function() {
			Donkeylift.app.schemaEditView.model = Donkeylift.app.schema;
			Donkeylift.app.schemaEditView.render();
		},


		evNewSchemaClick: function() {
			Donkeylift.app.schemaEditView.model = new Donkeylift.Database({});
			Donkeylift.app.schemaEditView.render();
		},

	});

})(jQuery);

