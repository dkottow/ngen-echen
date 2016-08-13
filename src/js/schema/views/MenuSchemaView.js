/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.MenuSchemaView = Backbone.View.extend({
	el:  '#menu',

	events: {
		'click #add-table': 'evAddTableClick'
		, 'click #edit-users': 'evUsersClick'
		, 'click #new-schema': 'evNewSchemaClick'
		, 'click #save-schema': 'evUpdateSchemaClick'
		, 'click #vis-tablegraph': 'evVisTableGraphClick'
		, 'click #downloads': 'evDownloadsClick'
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
		//this.$('#add-table').prop('disabled', Donkeylift.app.schema == null);
		//this.$('#save-schema').prop('disabled', Donkeylift.app.schema == null);

		return this;
	},

	getSchemaEditor: function() {
		if ( ! this.schemaEditView) {
			this.schemaEditView = new Donkeylift.SchemaEditView();
		}
		return this.schemaEditView;
	},

	getTableEditor: function() {
		if ( ! this.tableEditView) {
			this.tableEditView = new Donkeylift.TableEditView();
		}
		return this.tableEditView;
	},

	evAddTableClick: function() {
		var table = Donkeylift.Table.create();

		this.getTableEditor().model = table;
		this.getTableEditor().render();
	},

	evUsersClick: function() {
		var usersView = new Donkeylift.UsersView({
			collection: Donkeylift.app.schema.get('users')
		});
		usersView.render();
	},

	evUpdateSchemaClick: function() {
		this.getSchemaEditor().model = Donkeylift.app.schema;
		this.getSchemaEditor().render();
	},


	evNewSchemaClick: function() {
		this.getSchemaEditor().model = new Donkeylift.Schema({});
		this.getSchemaEditor().render();
	},

	evVisTableGraphClick: function() {
		if ( ! this.graphView) {
			this.graphView = new Donkeylift.SchemaGraphView();
		}
		this.graphView.model = Donkeylift.app.schema;
		this.graphView.render();
	},

	evDownloadsClick: function() {
		if ( ! this.downloadsView) {
			this.downloadsView = new Donkeylift.DownloadsView({
				model: Donkeylift.app.account
			});
		}
		this.downloadsView.render();
	},
});

