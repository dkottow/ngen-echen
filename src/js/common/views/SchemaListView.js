/*global Donkeylift, Backbone, jQuery, _, $ */

Donkeylift.SchemaListView = Backbone.View.extend({
	el:  '#schema-list',

	events: {
		'click .schema-option': 'evSchemaClick',
	},

	initialize: function() {
	},

	schemaListTemplate: _.template($('#nav-schema-template').html()),

	render: function() {

		this.renderSchemaDropDown();
		this.renderCurrentSchemaName();

		return this;
	},

	renderSchemaDropDown: function() {
		var $ul = this.$('ul');
		$ul.empty();
		if (this.model.get('databases')) {
			this.model.get('databases').each(function(schema) {
				var html = this.schemaListTemplate({name: schema.get('name')});
				$ul.append(html);
			}, this);
		}
	},

	renderCurrentSchemaName: function() {
		var $span = this.$('a:first span');
		if (Donkeylift.app.schema) {
			$span.html(' DB ' + Donkeylift.app.schema.get('name'));
		} else {
			$span.html(' Choose DB ');
		}		
	},

	evSchemaClick: function(ev) {
		var name = $(ev.target).attr('data-target');
		console.log('SchemaListView.evSchemaClick ' + name);
		Donkeylift.app.setSchema(name);
	},

});


