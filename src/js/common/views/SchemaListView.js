/*global Donkeylift, Backbone, jQuery, _, $ */

Donkeylift.SchemaListView = Backbone.View.extend({
	id:  'schema-list',
	tagName: 'ul',
	className: 'dropdown-menu',

	events: {
		'click .schema-option': 'evSchemaClick',
	},

	initialize: function() {
	},

	schemaListTemplate: _.template($('#nav-schema-template').html()),

	render: function() {

		this.renderSchemaList();
		this.renderCurrentSchemaName();

		return this;
	},

	renderSchemaList: function() {
		var $ul = this.$el;
		$ul.empty();
		if (this.model.get('databases')) {
			this.model.get('databases').each(function(schema) {
				var html = this.schemaListTemplate({name: schema.get('name')});
				$ul.append(html);
			}, this);
		}
	},

	renderCurrentSchemaName: function() {
		var $span = this.$el.closest('li').find('a:first span');
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


