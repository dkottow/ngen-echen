/*global Backbone, Donkeylift, $ */

Donkeylift.Account = Backbone.Model.extend({

	DEMO_ACCOUNT: 'demo',
	DEMO_EMAIL: 'demo@donkeylift.com',

	initialize: function(attrs) {		
		
		
		if (attrs.auth === false) {
			this.init_demo();
			return;
		}

		console.log("Account.initialize " + attrs.id_token);

		var token_attrs = jwt_decode(attrs.id_token);
		
		var account = token_attrs.app_metadata.account;
		if (account == '*') account = this.DEMO_ACCOUNT;		

		this.set('name', account);
		this.set('user', token_attrs.email);
		this.set('app_metadata', token_attrs.app_metadata);

		$.ajaxSetup({
			'beforeSend': function(xhr) {					
      			xhr.setRequestHeader('Authorization', 
					'Bearer ' + attrs.id_token);
			}
		});

		sessionStorage.setItem('id_token', attrs.id_token);

	},

	init_demo : function() {
		console.log("Account.init_demo");
		this.set('name', this.DEMO_ACCOUNT);
		this.set('user', this.DEMO_EMAIL);
	},

	url	: function() { 
		return DONKEYLIFT_API + '/' + this.get('name'); 
	},

	parse : function(response) {
		var dbs = _.values(response.databases);
		response.databases = new Backbone.Collection(dbs);
		return response;
	},

	downloadDatabase : function(db) {
		
	}

});

