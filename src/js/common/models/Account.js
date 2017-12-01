/*global Backbone, Donkeylift, $ */

Donkeylift.Account = Backbone.Model.extend({

	initialize: function(attrs) {		
		console.log("Account.initialize");		
		console.log(attrs);

		this.set('name', attrs.account);
		this.set('user', attrs.user);
		this.set('id_token', attrs.id_token);
	},

	url	: function() { 
		return Donkeylift.env.server + '/' + this.get('name'); 
	},

	parse : function(response) {
		var dbs = _.values(response.databases);
		response.databases = new Backbone.Collection(dbs);
		return response;
	},

	principal: function() {
		return this.get('principal') || this.get('user');
	},

	isAdmin : function() {
		return true; ///TODO
	}

});

