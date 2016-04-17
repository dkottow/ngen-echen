/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.MenuSchemaView = Backbone.View.extend({
	el:  '#menu',

	events: {
		'click #add-table': 'evAddTableClick'
		, 'click #new-schema': 'evNewSchemaClick'
		, 'click #save-schema': 'evSaveSchemaClick'
		, 'click #vis-tablegraph': 'evVisTableGraphClick'
	},

	initialize: function() {
		console.log("MenuView.init");
		//this.listenTo(Donkeylift.app.schema, 'change', this.render);
	},

	template: _.template($('#schema-menu-template').html()),

	render: function() {
		console.log('MenuSchemaView.render ' + Donkeylift.app.schema);			
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
		Donkeylift.app.schemaEditView.model = new Donkeylift.Schema({});
		Donkeylift.app.schemaEditView.render();
	},

	evVisTableGraphClick: function() {
		var model = Donkeylift.app.schema;
		var graphView = new Donkeylift.TableGraphView({model: model});
		graphView.render();
	},
});

