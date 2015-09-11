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
		},

		save : function(cbResult) {
			console.log("Schema.save...");
			var saveOptions = {
				parse: false,
				error: function(model, response) {
					console.log("Schema.save ERROR");
					console.dir(response);
					cbResult(response);
				},
			};

			if (this.get('id')) {
				saveOptions.url = this.url();
				saveOptions.success = function(model) {	
					console.log("Schema.save OK");
					cbResult();
				}
			} else {
				saveOptions.url = REST_ROOT + '/' + app.user;
				saveOptions.success = function(model) {
					console.log("Schema.save new OK");
					//set id to (new) name
					model.set('id', model.get('name'));
					//reload schema list
					app.schemas.fetch({
						reset: true,
						success: function() {
							cbResult();
						},
						error: function(model, response) {
							cbResult(response);
						}
					});
				}
			}

			Backbone.Model.prototype.save.call(this, null, saveOptions);
		},


		destroy: function(cbResult) {
			var destroyOptions = {
				success: function() {			
					app.unsetSchema();
					app.schemas.fetch({
						reset: true,
						success: function() {
							cbResult();
						},
						error: function(model, response) {
							cbResult(response);
						}
					});
				},
				error: function(model, response) {
					console.dir(response);
					cbResult(response);
				}
			};

			Backbone.Model.prototype.destroy.call(this, destroyOptions);
		},

		getFieldFromQN: function(fieldQName) {
			var parts = fieldQName.split('.');
			var table = this.get('tables').getByName(parts[0]);
			var field = table.get('fields').getByName(parts[1]);
			return { table: table, field: field };
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
