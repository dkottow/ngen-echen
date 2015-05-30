/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	console.log("Schema class def");
	app.Schema = Backbone.Model.extend({

		initialize: function() {
			this.set('tables', new app.Tables());
		},

		url	: function() { 
			return REST_ROOT + "/" + this.get("user") + "/" + this.get("name"); 
		},

		parse : function(response) {
			console.log(response);
			var tables = _.map(response.tables, function(table) {
				return new app.Table(table);
			});

			this.set({
				'joins': response.joins,
				'tables': new app.Tables(tables)
			});
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
