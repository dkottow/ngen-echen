/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	console.log("Schema class def");
	app.Schema = Backbone.Model.extend({

		initialize: function(schema) {
			console.log("Schema.initialize " + schema.name);
			var tables = _.map(schema.tables, function(table) {
				return new app.Table(table);
			});
			this.set('tables', new app.Tables(tables));
			this.orgJSON = this.toJSON();
			this.set('id', schema.name); //unset me when new
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
		}	

	});

	app.Schema.create = function(name) {
		if ( ! name) name = '';
		return new app.Schema({
			name: name,
			tables: {}	
		});
	}

})();
