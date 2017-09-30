/*global Donkeylift, Backbone, _ */

Donkeylift.Properties = Backbone.Model.extend({

	initialize: function(attrs) {

	},
	
	url : function() {
		return this.get('schema').url() + '/' + Donkeylift.Properties.TABLE;
	},

	parse : function(response) {
		console.log("Properties.parse " + response);
		_.each(response.rows, function(row) {
			var key = this.key(row[Donkeylift.Properties.FIELDS.name], {
				table : row[Donkeylift.Properties.FIELDS.table],
				field : row[Donkeylift.Properties.FIELDS.field]
			});
			try {
				this.set(key, JSON.parse(row[Donkeylift.Properties.FIELDS.value]));
			} catch(err) { 
				console.log(err);
				alert('Error parsing ' + key + ' = ' + row[Donkeylift.Properties.FIELDS.value]); 
			}
		}, this);
		return response;
	},

	fetch : function(cbAfter) {
		var me = this;
		console.log("Properties.fetch...");
		Backbone.Model.prototype.fetch.call(this, {
			success: function() {
				console.log("Properties.fetch OK");
				cbAfter();
			}
		});
	},
	
	setKeyFuncs : function(schema) {
		schema.get('tables').each(function(table) {
			table.propKey = function(name) {
				var key = [Donkeylift.Properties.PREFIX, 
						table.get('name'),	
						name
					].join('.');
				return key;		
			}
			table.get('fields').each(function(field) {
				field.propKey = function(name) {
					var key = [Donkeylift.Properties.PREFIX, 
							table.get('name'),	
							field.get('name'),	
							name
						].join('.');
					return key;		
				}
			});
		});		
	},

	key : function(name, opts) {
		opts = opts || {};
		var key = [ Donkeylift.Properties.PREFIX ];
		if (opts.table) {
			key.push(opts.table); 
		} 
		if (opts.field) {
			key.push(opts.field); 
		} 
		key.push(name); 
		return key.join('.');		
	}

});

Donkeylift.Properties.PREFIX = 'prop';
Donkeylift.Properties.TABLE = '_d365Properties';
Donkeylift.Properties.FIELDS = {
	name : 'Name',
	table : 'TableName',
	field : 'FieldName',
	value : 'Value'
};