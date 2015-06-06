/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	// Tables Collection
	// ---------------

	app.Tables = Backbone.Collection.extend({
		// Reference to this collection's model.
		model: app.Table,

		initialize: function(tables) {
			if (tables) {
				_.each(tables, function(table) {				
					var relations = [];
					_.each(table.get('parents'), function(name) {
						var pt = _.find(tables, function(t) { 
							return t.get('name') == name;
						});
						var fk = _.find(table.get('fields').models, function(field) {
							return field.get('fk_table') == name;
						});
						var relation = new app.Relation({
							table: table,
							related: pt,
							field: fk
						});
						relations.push(relation);
					});
					table.set('relations', new app.Relations(relations));
				});
			}
		},

		addNew: function() {
			console.log("Tables.addNew");
			var table = app.Table.create('table' + this.length);
			this.add(table);
			return table;
		},

		getByName: function(name) {
			return this.find(function(t) { return t.get('name') == name; });
		}

	});

})();
