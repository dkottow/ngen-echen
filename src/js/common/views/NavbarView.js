/*global Donkeylift, Backbone, jQuery, _, $ */

Donkeylift.NavbarView = Backbone.View.extend({
	el:  'nav',

	events: {
		'click .schema-option': 'evSchemaClick',
		'click #nav-login': 'evLoginClick',
		'click #nav-profile': 'evProfileClick'
	},

	initialize: function() {
		//this.lock = new Auth0Lock(Donkeylift.env.AUTH0_CLIENT_ID, Donkeylift.env.AUTH0_DOMAIN);
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
		if (this.model.get('databases')) {
			this.model.get('databases').each(function(schema) {
				var html = this.navSchemaTemplate({name: schema.get('name')});
				$ul.append(html);
			}, this);
		}
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


