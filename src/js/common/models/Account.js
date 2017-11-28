/*global Backbone, Donkeylift, $ */

Donkeylift.Account = Backbone.Model.extend({

	initialize: function(attrs) {		
		console.log("Account.initialize");		
		console.log(attrs);

		this.set('name', attrs.account);
		this.set('user', attrs.user);
		this.set('auth', attrs.auth);
		if (attrs.auth) {
			this.set('id_token', attrs.id_token);
		}

	},

	url	: function() { 
		return Donkeylift.env.API_BASE + '/' + this.get('name'); 
	},

	parse : function(response) {
		var dbs = _.values(response.databases);
		response.databases = new Backbone.Collection(dbs);
		return response;
	},

	getDownloadLink : function(dbName, cbResult) {
		var me = this;
		var db = this.get('databases').find(function(db) { 
			return db.get('name') == dbName; 
		});
		
		var path = '/' + this.get('name') + '/' + db.get('name') + '.sqlite';
		var url = this.url() + '/' + db.get('name') + '.nonce';

		$.ajax(url, {
			type: 'POST',
			data: JSON.stringify({ path: path }),
			contentType:'application/json; charset=utf-8',
			dataType: 'json'
		}).done(function(response) {
			var link = Donkeylift.env.API_BASE + path + '?nonce=' + response.nonce;
			cbResult(null, link);
			//console.dir(response);
		});
	},
	
	principal: function() {
		return this.get('principal') || this.get('user');
	},

	isAdmin : function() {
		return true; ///TODO
	}

});

