/*global Donkeylift, Backbone, _ */

Donkeylift.Filter = Backbone.Model.extend({

	initialize: function(attrs) {
		console.log("Filter.initialize ");			

		
		if (_.isString(attrs.table)) {
			this.set('table', 
				Donkeylift.app.schema.get('tables').getByName(attrs.table));
		}

		if (attrs.field && _.isString(attrs.field)) {
			this.set('field', 
				this.get('table').get('fields').getByName(attrs.field));
		}

		this.set('id', Donkeylift.Filter.Key(attrs.table, attrs.field));

	},

	values: function(opts) {
		var me = this;

		var val = _.isArray(this.get('value')) ? 
					this.get('value') : [ this.get('value') ];

		return val.map(function(v) {
			return me.get('field').toQS(v, opts);
		});
	},

	toParam: function() {
		var param;

		if (this.get('op') == Donkeylift.Filter.OPS.SEARCH) {
			var f = this.get('field') ? this.get('field').vname() : null;
			var key = Donkeylift.Filter.Key(this.get('table'), f);
			param = key + " search '" + this.get('value') + "'";

		} else if (this.get('op') == Donkeylift.Filter.OPS.BETWEEN) {
			var values = this.values();
			var key = Donkeylift.Filter.Key(this.get('table'), 
						this.get('field').vname());
			param = key + " btwn " + values[0] + ',' + values[1];

		} else if (this.get('op') == Donkeylift.Filter.OPS.IN) {				
			//do not use ref string, use foreign key ids instead.
			var values = this.values({resolveRefs: true});
			var key = Donkeylift.Filter.Key(this.get('table'), 
						this.get('field'));
			param = key + " in " + values.join(",");

		} else {
			//EQUAL, GREATER, LESSER
			var key = Donkeylift.Filter.Key(this.get('table'),
						this.get('field').vname());
			param = key + " " + this.get('op') + " " 
			    + this.get('field').toQS(this.get('value'));
		}

		//console.log(param);
		return param;
	},

	loadRange: function(cbAfter) {
		var field = this.get('field');
		this.get('table').stats(this, function(stats) {
			field.set('stats', stats);
			cbAfter();
		});
	},

	loadOptions: function(searchTerm, cbAfter) {
		var field = this.get('field');
		this.get('table').options(this, searchTerm, function(opts) {
			var notNulls = _.reject(opts, function(opt) { return opt[field.get('name')] === null; });
			field.set('options', notNulls);
			field.set('option_null', notNulls.length < opts.length);
			cbAfter();
		});
	},

	toStrings: function() {
		var result = { table: this.get('table').get('name'), field: '' };
		if (this.get('op') == Donkeylift.Filter.OPS.SEARCH) {
			result.op = 'search';
			result.value = this.get('value');

		} else if (this.get('op') == Donkeylift.Filter.OPS.BETWEEN) {
			result.op = 'between';
			result.field = this.get('field').get('name');
			result.value = this.get('value')[0] 
						+ ' and ' + this.get('value')[1];

		} else if (this.get('op') == Donkeylift.Filter.OPS.IN) {
			result.op = 'in';
			result.field = this.get('field').get('name');
			result.value = this.get('value').join(', '); 

		} else if (this.get('op') == Donkeylift.Filter.OPS.GREATER) {
			result.op = 'greater';
			result.field = this.get('field').get('name');
			result.value = this.get('value'); 
		
		} else if (this.get('op') == Donkeylift.Filter.OPS.EQUAL) {
			result.op = 'equal';
			result.field = this.get('field').get('name');
			result.value = this.get('value') === null ? 'null' : this.get('value'); 
		}
		return result;
	}

});

Donkeylift.Filter.Key = function(table, field) {		
	if (_.isObject(table)) table = table.get('name');
	if ( ! field) field = '*';
	else if (_.isObject(field)) field = field.get('name'); //not vname
	return table + '.' + field;
}

Donkeylift.Filter.OPS = {
	'SEARCH': 'search',
	'BETWEEN': 'btwn',
	'IN': 'in',
	'EQUAL': 'eq',
	'LESSER': 'le',
	'GREATER': 'ge'
}

Donkeylift.Filter.CONJUNCTION = ' and ';
