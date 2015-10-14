/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	//console.log("Table class def");
	app.Table = Backbone.Model.extend({ 
		
		initialize: function(attrs) {
			console.log("Table.initialize " + attrs.name);
			var fields = _.map( _.sortBy(attrs.fields, 'order'), 
						function(field) {
				return new app.Field(field);
			});			
			this.set('fields', new app.Fields(fields));
			//relations and row_alias are set in initRefs
		},

		initRefs: function(tables) {
			this.initRelations(tables);
			this.initAlias(tables);
			this.initJSON = this.toJSON();
		},

		isDirty: function() {
			return ! _.isEqual(this.initJSON, this.toJSON());
		},

		initRelations : function(tables) {
			var relations = [];
			_.each(this.get('parents'), function(parent_name) {
				//construct Relations
				var pt = _.find(tables, function(t) { 
					return t.get('name') == parent_name;
				});
				var fk = _.find(this.get('fields').models, 
					function(field) {
						return field.get('fk_table') == parent_name;
				});
				var relation = new app.Relation({
					table: this,
					related: pt,
					field: fk
				});
				relations.push(relation);
			}, this);
			this.set('relations', new app.Relations(relations), {silent: true});
		},

		initAlias : function(tables) {

			//console.log('table: ' + this.get('name'));
			//console.log('row_alias: ' + this.get('row_alias'));
			var row_alias = [];
			_.each(this.get('row_alias'), function(a) {
				//console.log('alias_part: ' + a);
				var alias = a.split('.');
				var alias_table;
				var field_name;
				if (alias.length == 2) {
					var alias_table = _.find(tables, function(t) {
							return t.get('name') == alias[0];
					});
					field_name = alias[1];
				} else {
					alias_table = this;
					field_name = alias;
				}
				var alias_field = _.find(alias_table.get('fields').models, 
					function(f) {
						return f.get('name') == field_name;
				});
				row_alias.push(new app.Alias({
							table : alias_table,
							field : alias_field
				}));

			}, this);
			this.set('row_alias', row_alias, {silent: true});
		},
		
		getFieldQN: function(field) {
			return _.isString(field) 
				? this.get('name') + '.' + field
				: this.get('name') + '.' + field.get('name');
		},

		createView: function(options) {
			return new app.TableView(options);
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

			var row_alias = _.map(this.get('row_alias'), function(a) {
				if (a.get('table') == this) return a.get('field').get('name');
				else return a.toString();	
/*
				var parts = fieldQName.split('.');
				if (parts[0] == this.get('name')) return parts[1];
				else return fieldQName;
*/
			}, this);

			return {
				name: this.get('name'),
				row_alias: row_alias,
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
