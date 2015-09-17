/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	console.log("Schema class def");
	app.Schema = Backbone.Model.extend({

		initialize: function(attrs) {
			console.log("Schema.initialize " + attrs.name);

			if ( ! attrs.table) this.set('tables', new app.Tables());

			//this.set('id', attrs.name); //unset me when new
			//this.orgJSON = this.toJSON();
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

		parse : function(response) {
			console.log("Schema.parse " + response);
			var tables = _.map(response.tables, function(table) {
				return new app.Table(table);
			});
			response.tables = new app.Tables(tables);
			return response;
		},

		url : function() {
			return app.schemas.url() + '/' + this.get('name');
		},

		fetch : function(cbAfter) {
			var me = this;
			console.log("Schema.fetch...");
			Backbone.Model.prototype.fetch.call(this, {
				success: function() {
					me.orgJSON = me.toJSON();
					console.log("Schema.fetch OK");
					cbAfter();
				}
			});
		},

		update : function() {
			var me = this;
			this.save(function(err) {
				if (err) {
					//TODO
					console.log(err);
					alert('ERROR on update ' + me.get('name') + '. ' 
						+ err.status + " " + err.responseText);
				}
			});
		},


		save : function(cbResult) {
			console.log("Schema.save...");
			var saveOptions = {
				error: function(model, response) {
					console.log("Schema.save ERROR");
					console.dir(response);
					cbResult(response);
				},
			};

			//save existing database
			if (this.get('id') == this.get('name')) {
				saveOptions.parse = false;
				saveOptions.url = this.url();
				console.log("Schema.save " + saveOptions.url);
				saveOptions.success = function(model) {	
					console.log("Schema.save OK");
					cbResult();
				}

			//save new database
			} else {
				this.unset('id'); 
				saveOptions.parse = false;
				saveOptions.url = app.schemas.url();
				console.log("Schema.save " + saveOptions.url);
				saveOptions.success = function(model) {
					console.log("Schema.save new OK");
					//set id to (new) name
					model.set('id', model.get('name'));
					app.schema = model;

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

})();
