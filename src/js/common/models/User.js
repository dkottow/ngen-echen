/*global Donkeylift, Backbone */

Donkeylift.User = Backbone.Model.extend({ 
	initialize: function(user) {

	}

});

Donkeylift.User.ROLES = {
	'OWNER': 'owner',
	'WRITER': 'writer',
	'READER': 'reader'
}

