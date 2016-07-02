/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.NavbarView = Backbone.View.extend({
	el:  'nav',

	events: {
		'click .schema-option': 'evSchemaClick'
	},

	initialize: function() {
	},

	schemaSelectTemplate: _.template($('#schema-select-template').html()),

	render: function() {

		this.renderDBDropDown();
		this.renderCurrentDBName();

		return this;
	},

	renderDBDropDown: function() {
		console.log('NavbarView.render() schema list items');			
		var $ul = this.$('#schema-list ul');
		$ul.empty();	
		this.model.get('databases').each(function(schema) {
			var html = this.schemaSelectTemplate({name: schema.get('name')});
			$ul.append(html);
		}, this);
	},

	renderCurrentDBName: function() {
		console.log('NavbarView.render() current schema label');			
		var $span = this.$('#schema-list a:first span');
		if (Donkeylift.app.schema) {
			$span.html(' DB ' + Donkeylift.app.schema.get('name'));
		} else {
			$span.html(' Choose DB ');
		}		
	},

	evSchemaClick: function(ev) {
		var name = $(ev.target).attr('data-target');
		console.log('NavbarView.evSchemaClick ' + name);
		Donkeylift.app.setSchema(name);
	}


});


