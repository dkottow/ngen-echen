/*global Donkeylift, Backbone, _ */


Donkeylift.Property = Backbone.Model.extend({ 
	
	initialize : function(attrs) {
		//console.log("Row.initialize " + attrs);
	},
});		

Donkeylift.Properties = Backbone.Collection.extend({

	model: Donkeylift.Property,
	
	initialize: function(props, options) {
		this.schema = options.schema;
	},
	
	url : function() {
		return this.schema.url() + '/' + Donkeylift.Properties.TABLE;
	},

	parse : function(response) {
		console.log("Properties.parse...");
		var rows = _.map(response.rows, function(row) {			
			try {
				row[Donkeylift.Properties.FIELDS.value] = JSON.parse(row[Donkeylift.Properties.FIELDS.value]);
			} catch(err) {
				console.log("Error parsing property " + row[Donkeylift.Properties.FIELDS.value]);
				console.log(JSON.stringify(row));
			}
			return row;
		});
		return rows;
	},

	fetch : function(cbAfter) {
		var me = this;
		console.log("Properties.fetch...");
		Backbone.Collection.prototype.fetch.call(this, {
			success: function() {
				console.log("Properties.fetch OK");
				if (cbAfter) cbAfter();
			},
			error: function(collection, response, options) {
				console.log("Error requesting " + me.url());		
				console.log(response);
			}
		});
	},
			
			 
	getUpdateRows : function() {
		var updateRows = [];
		var insertRows = [];
		this.each(function(row) {
			if (row.get('own_by') == Donkeylift.Properties.SYSTEM_OWNER) {
				; //ignore
			} else if (row.has('id')) {
				updateRows.push(row);
			} else {
				insertRows.push(row);		
			}
		});
		return {
			update: updateRows,
			insert: insertRows
		}
	},

	update : function(cbAfter) {
		var me = this;
		var rows = this.getUpdateRows();
		var insertData = JSON.stringify(_.map(rows.insert, function(row) { return row.attributes; }));
		var updateData = JSON.stringify(_.map(rows.update, function(row) { return row.attributes; }));
		var url = this.url();
		$.ajax(url, {
			method: 'POST'
			, data: insertData
			, contentType: "application/json"
			, processData: false

		}).done(function(response) {
			console.log("Properties.update POST ok.");			
			//console.log(response);			
			_.each(rows.insert, function(row, idx) {
				row.set('id', response.rows[idx].id);
			});
			if (cbAfter) cbAfter();

		}).fail(function(jqXHR, textStatus, errThrown) {
			console.log("Error requesting " + url);
			console.log(errThrown + " " + textStatus);
			if (cbAfter) cbAfter(new Error(errThrown + " " + jqXHR.responseJSON.error), jqXHR.responseJSON.schema);
		});

		$.ajax(url, {
			method: 'PUT'
			, data: updateData
			, contentType: "application/json"
			, processData: false

		}).done(function(response) {
			console.log("Properties.update PUT ok.");			
			console.log(response);			
			if (cbAfter) cbAfter();

		}).fail(function(jqXHR, textStatus, errThrown) {
			console.log("Error requesting " + url);
			console.log(errThrown + " " + textStatus);
			if (cbAfter) cbAfter(new Error(errThrown + " " + jqXHR.responseJSON.error), jqXHR.responseJSON.schema);
		});		
	},

	setKeyFuncs : function() {
		this.schema.get('tables').each(function(table) {
			table.propKey = function(name) {
				var key = [ table.get('name'), name ].join('.');
				return key;		
			}
			table.get('fields').each(function(field) {
				field.propKey = function(name) {
					var key = [ 
						table.get('name'), 
						field.get('name'), 
						name ].join('.');
					return key;		
				}
			});
		});		
	},

	getProp : function(key) {
		var row = this.getRow(key);
		return row ? row.get(Donkeylift.Properties.FIELDS.value) : undefined;
	},

	setProp : function(key, value) {
		var row = this.getRow(key);

		if (row && row.get('own_by') == Donkeylift.Properties.SYSTEM_OWNER) {
			throw new Error('cannot update system property ' + key);

		} else if (row) {
			row.set(Donkeylift.Properties.FIELDS.value, value);

		} else {
			var newRow = new Donkeylift.Property();
			var key = this.parseKey(key);	
			newRow.set(Donkeylift.Properties.FIELDS.name, key.name);
			newRow.set(Donkeylift.Properties.FIELDS.table, key.table);
			newRow.set(Donkeylift.Properties.FIELDS.field, key.field);

			newRow.set(Donkeylift.Properties.FIELDS.value, value);
			this.add(newRow);			
		}
	},

	getRow: function(key) {
		key = this.parseKey(key);
		var row = this.find(function(row) {
			return key.name == row.get(Donkeylift.Properties.FIELDS.name)
				&& key.table == row.get(Donkeylift.Properties.FIELDS.table)
				&& key.field == row.get(Donkeylift.Properties.FIELDS.field);
		});
		return row;
	},

	parseKey : function(key) {
		var parts = key.split('.');
		switch(parts.length) {
			case 1:
				return { table: null, field: null, name: parts[0] };
			case 2:
				return { table: parts[0], field: null, name: parts[1] };	
			case 3:
				return { table: parts[0], field: parts[1], name: parts[2] };	
			default:
				throw new Error('undefined key structure');
		}
	}
	
});
	


Donkeylift.Properties.SYSTEM_OWNER = 'system';
Donkeylift.Properties.TABLE = '_d365Properties';
Donkeylift.Properties.FIELDS = {
	name : 'Name',
	table : 'TableName',
	field : 'FieldName',
	value : 'Value'
};