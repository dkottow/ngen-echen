/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	//console.log("Table class def");
	app.Table = Backbone.Model.extend({ 
		
		initialize: function(table) {
			console.log("Table.initialize " + table.name);
			var fields = _.map( _.sortBy(table.fields, 'order'), 
						function(field) {
				return new app.Field(field);
			});			
			this.set('fields', new app.Fields(fields));
			this.set('relations', new app.Relations());
		},

		attrJSON: function() {
			return _.clone(this.attributes);
		},		

		toJSON: function() {
			var fields = this.get('fields').map(function(field) {
				return field.toJSON();
			}); 
			fields = _.object(_.pluck(fields, 'name'), fields);

			this.get('relations').each(function(relation) {
				var field = fields[relation.get('field').get('name')];
				field.fk_table = relation.get('related').get('name');
			});

			return {
				name: this.get('name'),
				fields: fields
			};
		}

	});

	app.Table.create = function(name) {
		var fields = [ 
			{ name: 'id', type: 'INTEGER', order: 1 },
			{ name : 'modified_by', type: 'VARCHAR', order: 2 },
			{ name : 'modified_on', type: 'DATETIME', order: 3 }
		];
		return new app.Table({
			name: name,
			fields: fields
		});
	}

})();
