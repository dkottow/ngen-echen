/*global Donkeylift, Backbone, jQuery, _, $ */

Donkeylift.NavbarView = Backbone.View.extend({
	el:  'nav',

	events: {
	},

	initialize: function() {
	},

	navUserInfoTemplate: _.template($('#nav-user-info-template').html()),

	render: function() {
		this.renderUserInfo();
		return this;
	},

	renderUserInfo: function() {
		var $el = $('#user-info');
		$el.empty();	
		var html = this.navUserInfoTemplate({
			user: this.model.principal()
		});
		$el.append(html);
	}

});


