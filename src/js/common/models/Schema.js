/*global _, $, Donkeylift, Backbone, jsonpatch */

Donkeylift.Schema = Backbone.Model.extend({

	initialize: function(attrs) {
		console.log("Schema.initialize " + attrs.name);

		if ( ! attrs.tables) {
			this.set('tables', new Donkeylift.Tables());
		}
		//this.set('id', attrs.name); //unset me when new
		this.set('props', new Donkeylift.Properties(null, { schema: this }));
		
	},

	attrJSON: function() {
		return _.clone(this.attributes);
	},		

	toJSON : function() {

		var tables = this.get('tables').toJSON();
		tables =  _.object(_.pluck(tables, 'name'), tables);

		return {
			name: this.get('name'),
			tables: tables
		};
	},	

/*	
	isEmpty : function() {
		var totalRowCount = this.get('tables').reduce(function(sum, table) {
			return sum + table.get('row_count');
		}, 0);	
		console.log(this.get('name') + ' has ' + totalRowCount + ' rows.');
		return totalRowCount == 0;
	},
*/

	parse : function(response) {
		console.log("Schema.parse " + response);
		response = this.parseTables(response);
		return response;
	},

	parseTables: function(response) {
		var tables = _.map(response.tables, function(table) {
			return new Donkeylift.Table(table);
		});
		response.tables = new Donkeylift.Tables(tables);
		return response;		
	},

	url : function(params) {
		var url = Donkeylift.app.account.url() + '/' + this.get('name');
		if (params) {
			url = url + '?' 
				+ _.map(params, function(v, k) { return k + '=' + encodeURI(v) }).join('&');
		}
		return url;
	},

	fetch : function(cbAfter) {
		var me = this;
		console.log("Schema.fetch...");
		var url = me.url({ reload : 1 });		
		Backbone.Model.prototype.fetch.call(this, {
			success: function(model, response, options) {
				me.orgJSON = JSON.parse(JSON.stringify(me.toJSON())); //copy
				me.get('props').setKeyFuncs();
				console.log("Schema.fetch OK");
				me.get('props').fetch(function() {
					cbAfter();
				});					
			},
			error: function(model, response, options) {
				console.log(JSON.stringify(response));
				alert(response.responseText);
			},
			url: url
		});
	},

	update : function(cbAfter) {
		var me = this;
		if ( ! this.updateDebounced) {
			this.updateDebounced = _.debounce(function(cbAfter) {
				var diff = jsonpatch.compare(me.orgJSON, me.toJSON());
				console.log('Schema.update');		
				console.log(diff);		
				if (diff.length > 0) {
					me.patch(diff, function(err, result) {
						
						if (err) {
							alert(err.message); //TODO make me nicer.
						} 

						console.log(result);
						var attrs = me.parse(result);
						me.set(attrs);
						me.orgJSON = JSON.parse(JSON.stringify(me.toJSON())); //copy
						if (cbAfter) cbAfter();
						//reset schema in browser

					});
				}
			}, 1000);
		}
//TODO re-enable and fix
/*
if (cbAfter) cbAfter();
return;
*/
		this.updateDebounced(cbAfter);
	},

	patch : function(diff, cbResult) {
		console.log("Schema.patch...");
		var url = this.url();
		$.ajax(url, {
			method: 'PATCH'
			, data: JSON.stringify(diff)
			, contentType: "application/json"
			, processData: false

		}).done(function(response) {
			console.log(response);
			cbResult(null, response);

		}).fail(function(jqXHR, textStatus, errThrown) {
			console.log("Error requesting " + url);
			console.log(errThrown + " " + textStatus);
			cbResult(new Error(errThrown + " " + jqXHR.responseJSON.error), jqXHR.responseJSON.schema);
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
	},

	fullName: function() {
		return this.get('account') + '$' + this.get('name');
	}

});
