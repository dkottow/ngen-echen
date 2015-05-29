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

/*
			var relations = [];
			_.each(table.parents, function(p) {
				var fk = _.find(table.fields, function(f) {
					return f.fk_table == p;
				});
				var r = {
					table: table.name,
					related: p,
					field: fk.name
				}; 
				relations.push(r);
			});
			if (table.supertype) {
				var r = {
					table: table.name,
					related: table.supertype,
					field: table.fields['id'].name
				}; 
				relations.push(r);
			}
			this.set('relations', new app.Relations(relations));
*/
		},

	});

	app.Table.create = function(name) {
		var fields = {
			id: { name: 'id', type: 'INTEGER' },
			modified_by: { name : 'modified_by', type: 'VARCHAR' },
			modified_at: { name : 'modified_at', type: 'DATETIME' }
		};
		return new app.Table({
			name: name,
			fields: fields
		});
	}

})();
