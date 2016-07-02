/*global Backbone, Donkeylift */

Donkeylift.Account = Backbone.Model.extend({

	initialize: function(attrs) {
		console.log("Account.initialize " + attrs.name);
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

