/*global Donkeylift, Backbone, jQuery, _, $ */

Donkeylift.NavbarView = Backbone.View.extend({
	el:  'nav',

	events: {
		'click #nav-login': 'evLoginClick',
		'click #nav-profile': 'evProfileClick'
	},

	initialize: function() {
	},

	navSchemaTemplate: _.template($('#nav-schema-template').html()),
	navProfileTemplate: _.template($('#nav-profile-template').html()),

	render: function() {
		this.renderProfileDropDown();
		return this;
	},

	renderProfileDropDown: function() {
		var me = this;
		var $el = this.$('#menu-profile');
		$el.empty();	
		var html = this.navProfileTemplate({
			account: this.model.get('name')
		});
		$el.append(html);
		
		this.$('#nav-downloads').click(function(ev) { 
			me.evDownloadsClick(ev); 
		});

		this.$('#nav-logout').click(function(ev) { 
			me.evLogoutClick(ev); 
		});
	},

	evDownloadsClick: function() {
		if ( ! this.downloadsView) {
			this.downloadsView = new Donkeylift.DownloadsView();
		}
		this.downloadsView.model = Donkeylift.app.account;
		this.downloadsView.render();
	},

	evProfileClick: function() {
		if ( ! this.profileView) {
			this.profileView = new Donkeylift.ProfileView();
		} 
		this.profileView.model = Donkeylift.app.account;
		this.profileView.render();
	},

	evLogoutClick: function(ev) {
		sessionStorage.clear();
		window.location = "https://" + Donkeylift.env.AUTH0_DOMAIN + "/v2/logout";
	},

	evLoginClick: function(ev) {

		var opts = {
			signupLink: '/public/signup.html'
			, authParams: { scope: 'openid email app_metadata' } 
		};

		Donkeylift.app.lock.show(opts, function(err, profile, id_token) {
			if (err) {
				console.log("There was an error :/", err);
				return;
		  	}

			Donkeylift.app.loadAccount({id_token: id_token});
		});
	}

});


