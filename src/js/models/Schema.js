/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	console.log("Schema class def");
	app.Schema = Backbone.Model.extend({

		initialize: function(attrs) {
			console.log("Schema.initialize " + attrs.name);

			this.orgJSON = this.toJSON();
			this.set('id', attrs.name); //unset me when new
		},

		isDirty: function() {
			return ! _.isEqual(this.orgJSON, this.toJSON());
		},

		attrJSON: function() {
			return _.clone(this.attributes);
		},		

		toJSON : function() {
			var tables = this.get('tables').map(function(table) {
				return table.toJSON();	
			});
			return {
				name: this.get('name'),
				tables: tables
			};
		},	


		url	: function() { 
			return REST_ROOT + "/" + app.user + "/" + this.get('name'); 
		},

		parse : function(response) {
			console.log("Schema.parse " + response);
			var tables = _.map(response.tables, function(table) {
				return new app.Table(table);
			});
			response.tables = new app.Tables(tables);
			return response;
		}

	});

	app.Schema.create = function(name) {
		if ( ! name) name = '';
		return new app.Schema({
			name: name,
			tables: new app.Tables()	
		});
	}

})();
