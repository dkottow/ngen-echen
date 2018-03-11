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
		me.bbFetch({
			success: function(result) {
				console.log("Properties.fetch OK");
				if (cbAfter) cbAfter();
			},
			error: function(err) {
				console.log("Error requesting " + me.url());		
				alert(err.message);
			}
		});
	},

    bbFetch: function(options) {
		//minimally adapted from backbone.js
		options = _.extend({parse: true}, options);
		var collection = this;

		var url = options.url || this.url();
		//use Donkeylift.ajax instead of Backbone.sync
		Donkeylift.ajax(this.url(), {

		}).then(function(result) {
			var resp = result.response;

			var method = options.reset ? 'reset' : 'set';
			collection[method](resp, options);
			if (options.success) options.success.call(options.context, resp);
			collection.trigger('sync', collection, resp, options);

		}).catch(function(result) {
			console.log("Error requesting " + url);
			var err = new Error(result.jqXHR.responseText);
			console.log(err);
			if (options.error) options.error.call(options.context, err);
		});

	  },	
			 
	getUpdateRows : function(opts) {
		var updateRows = [];
		var insertRows = [];
		opts = opts || {};
		this.each(function(row) {
			if (row.get('own_by') == Donkeylift.Properties.SYSTEM_OWNER) {
				; //ignore system props

			} else if (opts.table && row.get('TableName') != opts.table && row.get('FieldName')) {
				; //ignore field props from other tables

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

	update : function(opts, cbAfter) {
		var me = this;  
		
		opts = typeof opts == 'object' ? opts : {};
		if (typeof arguments[arguments.length - 1] == 'function') {
		  cbAfter = arguments[arguments.length - 1];
		}
	  
		var rows = this.getUpdateRows(opts);
		var insertData = JSON.stringify(_.map(rows.insert, function(row) { return row.attributes; }));
		var updateData = JSON.stringify(_.map(rows.update, function(row) { return row.attributes; }));
		var url = this.url();
		Donkeylift.ajax(url, {
			method: 'POST'
			, data: insertData
			, contentType: "application/json"
			, processData: false

		}).then(function(result) {
			var response = result.response;
			console.log("Properties.update POST ok.");			
			//console.log(response);			
			_.each(rows.insert, function(row, idx) {
				row.set('id', response.rows[idx].id);
			});
			if (cbAfter) cbAfter();

		}).catch(function(result) {
			var jqXHR = result.jqXHR;
			console.log("Error requesting " + url);
			console.log(result.errThrown + " " + result.textStatus);
			if (cbAfter) cbAfter(new Error(result.errThrown + " " + jqXHR.responseJSON.error), jqXHR.responseJSON.schema);
		});

		Donkeylift.ajax(url, {
			method: 'PUT'
			, data: updateData
			, contentType: "application/json"
			, processData: false

		}).then(function(result) {
			var response = result.response;
			console.log("Properties.update PUT ok.");			
			console.log(response);			
			if (cbAfter) cbAfter();

		}).catch(function(result) {
			var jqXHR = result.jqXHR;
			console.log("Error requesting " + url);
			console.log(result.errThrown + " " + result.textStatus);
			if (cbAfter) cbAfter(new Error(result.errThrown + " " + jqXHR.responseJSON.error), jqXHR.responseJSON.schema);
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