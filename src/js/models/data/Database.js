/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	//console.log("Table class def");
	app.Database = app.Schema.extend({ 

		initialize : function(attrs, options) {
			console.log("Database.initialize " + (attrs.name || ''));
			app.Schema.prototype.initialize.call(this, attrs);
		},

		parse : function(response) {
			console.log("Database.parse " + response);

			var tables = _.map(response.tables, function(table) {
				return new app.DataTable(table);
			});
			response.tables = new app.Tables(tables);
			return response;
		},

	});		

/*
	app.Database.load = function(name, baseUrl, cbAfter) {
		var db = new app.Database({name: name});
		db.url = function() {
			return baseUrl + '/' + this.get('name');
		}
		db.fetch({success: function() {
				db.orgJSON = db.toJSON();
				cbAfter();
		}});
		return db;
	}

	app.Database.create = function(baseUrl, cbAfter) {
		var db = new app.Database({tmp: true});
		db.url = function() {
			return this.get('name') 
				? baseUrl + '/' + this.get('name')
				: baseUrl;
		}
		db.save(function() {
			cbAfter();
		});
		return db;
	}
*/

})();
