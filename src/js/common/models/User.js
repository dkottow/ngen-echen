/*global Donkeylift, Backbone */

Donkeylift.User = Backbone.Model.extend({ 
	initialize: function(user) {

	}

});

Donkeylift.User.create = function(name) {
	return new Donkeylift.User({ 
		name: name, 
		role: Donkeylift.User.ROLES.WRITER 
	});
}

Donkeylift.User.ROLES = {
	'OWNER': 'owner',
	'WRITER': 'writer',
	'READER': 'reader'
}

