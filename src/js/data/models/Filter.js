/*global Donkeylift, Backbone, _ */

Donkeylift.Filter = Backbone.Model.extend({

	initialize: function(attrs) {
		console.log("Filter.initialize ");			
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
			var values = this.values({
				resolveRefs: this.get('field').get('resolveRefs') 
			});
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
			field.setStats(stats);
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

		} else if (this.get('op') == Donkeylift.Filter.OPS.LESSER) {
			result.op = 'lesser';
			result.field = this.get('field').get('name');
			result.value = this.get('value'); 

		} else if (this.get('op') == Donkeylift.Filter.OPS.GREATER) {
			result.op = 'greater';
			result.field = this.get('field').get('name');
			result.value = this.get('value'); 
		
		} else if (this.get('op') == Donkeylift.Filter.OPS.EQUAL) {
			result.op = 'equal';
			result.field = this.get('field').get('name');
			result.value = this.get('value') === null ? 'null' : this.get('value'); 

		} else if (this.get('op') == Donkeylift.Filter.OPS.NOTEQUAL) {
			result.op = 'not equal';
			result.field = this.get('field').get('name');
			result.value = this.get('value') === null ? 'null' : this.get('value'); 
		}
		return result;
	}

});


Donkeylift.Filter.Create = function(attrs) {

	var opts = {};

	if (attrs.op != Donkeylift.Filter.OPS.IN) {
		opts.value = attrs.value; //any value permitted
	} else if (attrs.value.length > 0) {
		opts.value = attrs.value; //IN filter requires non-empty arrays 
	}

	if (_.isObject(attrs.table)) {
		opts.table = attrs.table; //trust it
	} else if (_.isString(attrs.table)) {
		opts.table = Donkeylift.app.schema.get('tables').getByName(attrs.table);
	}

	if (_.contains(_.values(Donkeylift.Filter.OPS), attrs.op)) {
		opts.op = attrs.op; 
	}

	if (_.isObject(attrs.field)) {
		opts.field = attrs.field; //trust it
	} else if (_.isString(attrs.field)) {
		opts.field = opts.table.get('fields').getByName(attrs.field);
	} else if (attrs.op == Donkeylift.Filter.OPS.SEARCH) {
		opts.field = null;
	}
	

	if (opts.table && (opts.field !== undefined) && opts.op && (opts.value !== undefined)) {
		return new Donkeylift.Filter(opts);
	} 
	return null;
}

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
	'NOTEQUAL': 'ne',
	'LESSER': 'le',
	'GREATER': 'ge'
}

Donkeylift.Filter.CONJUNCTION = ' and ';
