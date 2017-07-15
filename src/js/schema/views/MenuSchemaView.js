/*global Donkeylift, Backbone, jQuery, $, _ */

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
		if (! Donkeylift.app.schema) {
			this.$el.empty();
		} else {
			this.$el.html(this.template());
		}
		return this;
	},

	evAddTableClick: function() {
		if ( ! Donkeylift.app.schema) return;
		var table = Donkeylift.Table.create();
		var editor = Donkeylift.app.getTableEditor();
		editor.model = table;
		editor.render();
	},

	evUsersClick: function() {
		if ( ! Donkeylift.app.schema) return;
		if (this.usersView) this.usersView.remove();
		this.usersView = new Donkeylift.UsersView({
			collection: Donkeylift.app.schema.get('users')
		});
		$('#content').html(this.usersView.render().el);		
	},

	evVisTableGraphClick: function() {
		if ( ! Donkeylift.app.schema) return;
		if ( ! this.graphView) {
			this.graphView = new Donkeylift.SchemaGraphView();
		}
		this.graphView.model = Donkeylift.app.schema;
		this.graphView.render();
	},

});

