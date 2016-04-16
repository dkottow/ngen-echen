/*global Backbone, Donkeylift */

Donkeylift.Alias = Backbone.Model.extend({ 
	
	initialize: function(attrs) {
	},

	toString: function() {
		return this.get('table').get('name') + '.' 
			 + this.get('field').get('name');
	}

});

Donkeylift.Alias.parse = function(tableName, fieldName) {
	//console.log('Alias.parse ' + tableName + '.' + fieldName);
	var table = Donkeylift.app.schema.get('tables').getByName(tableName);
	var field = table.get('fields').getByName(fieldName);
	return new Donkeylift.Alias({table: table, field: field});
}

