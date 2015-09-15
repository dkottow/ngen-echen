/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	//console.log("Table class def");
	app.Alias = Backbone.Model.extend({ 
		
		initialize: function(attrs) {
		},

		toString: function() {
			return this.get('table').get('name') + '.' 
				 + this.get('field').get('name');
		}

	});

	app.Alias.parse = function(tableName, fieldName) {
console.log('Alias.parse ' + tableName + '.' + fieldName);
		var table = app.schema.get('tables').getByName(tableName);
		var field = table.get('fields').getByName(fieldName);
		return new app.Alias({table: table, field: field});
	}

})();
