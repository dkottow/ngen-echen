/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	//console.log("Table class def");
	app.Table = Backbone.Model.extend({ 
		
		initialize: function(table) {
			this.id = table.name;
			var fields = _.map(table.fields, function(field) {
				return new app.Field(field);
			});
			this.set('fields', new app.Fields(fields));
		},

	});

	app.Table.create = function(name) {
		var fields = {
			id: { name: 'id', type: 'INTEGER' },
			modified_by: { name : 'modified_by', type: 'VARCHAR' }
		};
		return new app.Table({
			name: name,
			fields: fields
		});
	}

})();
