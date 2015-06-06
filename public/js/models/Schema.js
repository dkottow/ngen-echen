/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	console.log("Schema class def");
	app.Schema = Backbone.Model.extend({

		initialize: function(schema) {
			var tables = _.map(schema.tables, function(table) {
				return new app.Table(table);
			});
			this.set('tables', new app.Tables(tables));
		},

		toServerJSON : function() {
			var tables = this.get('tables').map(function(table) {
				return table.toServerJSON();	
			});
			return {
				name: this.get('name'),
				tables: tables
			};
		}	

	});

})();
