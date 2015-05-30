/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	//console.log("Table class def");
	app.Table = Backbone.Model.extend({ 
		
		initialize: function(table) {
			var fields = _.map(table.fields, function(field) {
				return new app.Field(field);
			});
			this.set('fields', new app.Fields(fields));
			this.set('relations', new app.Relations());
		},

	});

	app.Table.create = function(name) {
		var fields = [ 
			{ name: 'id', type: 'INTEGER', order: 1 },
			{ name : 'modified_by', type: 'VARCHAR', order: 2 },
			{ name : 'modified_at', type: 'DATETIME', order: 3 }
		];
		return new app.Table({
			name: name,
			fields: fields
		});
	}

})();
