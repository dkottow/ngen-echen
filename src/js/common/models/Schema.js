/*global _, Donkeylift, Backbone */

Donkeylift.Schema = Backbone.Model.extend({

	initialize: function(attrs) {
		console.log("Schema.initialize " + attrs.name);

		if ( ! attrs.tables) {
			this.set('tables', new Donkeylift.Tables());
		}
		if ( ! attrs.users) {
			this.set('users', new Donkeylift.Users());
		}

		//this.set('id', attrs.name); //unset me when new
		//this.orgJSON = this.toJSON();
	},

	attrJSON: function() {
		return _.clone(this.attributes);
	},		

	toJSON : function() {

		return {
			name: this.get('name'),
			tables: this.get('tables').toJSON(),
			users: this.get('users').toJSON()
		};
	},	

	isEmpty : function() {
		var totalRowCount = this.get('tables').reduce(function(sum, table) {
			return sum + table.get('row_count');
		}, 0);	
		console.log(this.get('name') + ' has ' + totalRowCount + ' rows.');
		return totalRowCount == 0;
	},

	parse : function(response) {
		console.log("Schema.parse " + response);
		var tables = _.map(response.tables, function(table) {
			return new Donkeylift.Table(table);
		});
		response.tables = new Donkeylift.Tables(tables);
		response.users = new Donkeylift.Users(_.values(response.users));
		return response;
	},

	url : function() {
		return Donkeylift.app.account.url() + '/' + this.get('name');
	},

	fetch : function(cbAfter) {
		var me = this;
		console.log("Schema.fetch...");
		Backbone.Model.prototype.fetch.call(this, {
			success: function() {
				console.log("Schema.fetch OK");
				cbAfter();
			}
		});
	},

	update : function() {
		console.log("Schema.update...");
return;
		//TODO
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
			url: this.url()
			, success: function(model) {

				//reload schema list
				Donkeylift.app.account.fetch({
					reset: true,
					success: function() {
						cbResult();
					},
					error: function(model, response) {
						cbResult(response);
					}
				});
			}
			, error: function(model, response) {
				console.log("Schema.save ERROR");
				console.dir(response);
				cbResult(response);
			}
		};

		//set id to (new) name
		this.set('id', this.get('name'));
		console.log("Schema.save " + saveOptions.url);

		Backbone.Model.prototype.save.call(this, null, saveOptions);
	},


	destroy: function(cbResult) {
		var destroyOptions = {
			success: function() {			
				Donkeylift.app.unsetSchema();

				//reload schema list
				Donkeylift.app.account.fetch({
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
