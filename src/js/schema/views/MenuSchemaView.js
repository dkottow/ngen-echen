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

	evAddTableClick: function() {
		var table = Donkeylift.Table.create();
		var editor = Donkeylift.app.getTableEditor();
		editor.model = table;
		editor.render();
	},

	evUsersClick: function() {
		if ( ! this.usersView) {
			this.usersView = new Donkeylift.UsersView({
				collection: Donkeylift.app.schema.get('users')
			});
		}
		this.usersView.render();
	},

	evUpdateSchemaClick: function() {
		var editor = Donkeylift.app.getSchemaEditor();
		editor.model = Donkeylift.app.schema;
		editor.render();
	},


	evNewSchemaClick: function() {
		var editor = Donkeylift.app.getSchemaEditor();
		editor.model = new Donkeylift.Schema({});
		editor.render();
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

