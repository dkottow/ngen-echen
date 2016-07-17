/*global Backbone, Donkeylift */

Donkeylift.Account = Backbone.Model.extend({

	DEFAULT_ACCOUNT: 'demo',

	initialize: function(attrs) {
		console.log("Account.initialize " + attrs.id_token);

		var token_attrs = jwt_decode(attrs.id_token);
		
		var account = token_attrs.app_metadata.account;
		if (account == '*') account = this.DEFAULT_ACCOUNT;		

		this.set('name', account);
		this.set('user', token_attrs.email);

		$.ajaxSetup({
			'beforeSend': function(xhr) {					
      			xhr.setRequestHeader('Authorization', 
					'Bearer ' + attrs.id_token);
			}
		});

		sessionStorage.setItem('id_token', attrs.id_token);

	},

	url	: function() { 
		return DONKEYLIFT_API + '/' + this.get('name'); 
	},

	parse : function(response) {
		var dbs = _.values(response.databases);
		response.databases = new Backbone.Collection(dbs);
		return response;
	},

});

