/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.NavbarView = Backbone.View.extend({
	el:  'nav',

	events: {
		'click .schema-option': 'evSchemaClick'
	},

	initialize: function() {
	},

	navSchemaTemplate: _.template($('#nav-schema-template').html()),
	navProfileTemplate: _.template($('#nav-profile-template').html()),

	render: function() {

		this.renderSchemaDropDown();
		this.renderCurrentSchemaName();
		this.renderProfileDropDown();

		return this;
	},

	renderSchemaDropDown: function() {
		var $ul = this.$('#schema-list ul');
		$ul.empty();	
		this.model.get('databases').each(function(schema) {
			var html = this.navSchemaTemplate({name: schema.get('name')});
			$ul.append(html);
		}, this);
	},

	renderProfileDropDown: function() {
		var $el = this.$('#menu-profile');
		$el.empty();	
		var html = this.navProfileTemplate({
			logout: "https://" + AUTH0_DOMAIN + "/v2/logout",
			account: this.model.get('name')
		});
		$el.append(html);
	},

	renderCurrentSchemaName: function() {
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


