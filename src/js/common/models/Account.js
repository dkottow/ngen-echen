/*global Backbone, Donkeylift, $ */

Donkeylift.Account = Backbone.Model.extend({

	initialize: function(attrs) {		
		
		
		if (attrs.auth === false) {
			this.set('name', attrs.account);
			this.set('user', attrs.user);
			return;
		}

		console.log("Account.initialize " + attrs.id_token);

		var token_attrs = jwt_decode(attrs.id_token);
		
		//root users have access to any account.
		var account = attrs.account || token_attrs.app_metadata.account;

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
	
	isAdmin : function() {
		return this.get('app_metadata') && this.get('app_metadata').admin;		
	}

});

