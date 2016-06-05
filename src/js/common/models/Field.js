/*global Donkeylift, Backbone, _ */

function escapeStr(str) {
	return str.replace("'", "\\'");
}

Donkeylift.Field = Backbone.Model.extend({
	initialize: function(field) {

		//strip type from e.g. VARCHAR(256) and NUMERIC(8,2) 
		var rxp = /(\w+)(\([0-9,]+\))?/
		var match = field.type.match(rxp)
		this.set('type', Donkeylift.Field.TypeAlias(match[1]));
		this.set('props', field.props || {});
	},

	vname: function() {
		if (this.get('fk') == 0) {
			return this.get('name');

		} else if (this.get('name').match(/id$/)) { 
			return this.get('name').replace(/id$/, "ref");

		} else {
			return this.get('name') + "_ref";
		}
	},

	getProp: function(name) {
		return this.get('props')[name];
	},

	setProp: function(name, value) {
		this.get('props')[name] = value;
	},

	attrJSON: function() {
		return _.clone(this.attributes);
	},

	toJSON: function() {
		var type = Donkeylift.Field.ALIAS[this.get('type')];

		return {
			name: this.get('name'),
			type: type,
			props: this.get('props')
		};
	},

	parse: function(val, opts) {
		var validate = (opts && opts.validate) || false;
		var result = null;
		var resultError = true;
		var t = this.get('type');

		if (t == Donkeylift.Field.TYPES.VARCHAR || this.get('fk') == 1) {
			result = val.toString();
			resultError = false;

		} else if (t == Donkeylift.Field.TYPES.INTEGER) {
			result = parseInt(val);
			resultError = isNaN(result); 

		} else if(t == Donkeylift.Field.TYPES.NUMERIC) {
			result = parseFloat(val);
			resultError = isNaN(result); 

		} else if(t == Donkeylift.Field.TYPES.DATE) {
			//return new Date(val);
			result = new Date(val);
			resultError = isNaN(Date.parse(val)); 
			if ( ! resultError) result = result.toISOString().substr(0,10);

		} else if (t == Donkeylift.Field.TYPES.DATETIME) {
			//return new Date(val);
			result = new Date(val);
			resultError = isNaN(Date.parse(val)); 
			if ( ! resultError) result = result.toISOString();

		}

		if (validate && resultError) {
			var err = new Error("Parse '" + val + "'" + " to " + t + " failed.");
			err.field = this.get('name');
			throw err;
		}
		return result;
	},

	//to formatted string
	toFS: function(val) {
		if (this.get('type') == Donkeylift.Field.TYPES.NUMERIC) {
			return this.getProp('scale') 
				? val.toFixed(this.getProp('scale')) 
				: String(val);

		} else {
			return String(val);
		}
	},

	//to query string
	toQS: function(val) {
		if (this.get('fk') == 1 && _.isString(val)) {
			//its a string ref
			return "'" + escapeStr(val) + "'";
		}

		var t = this.get('type');
		if (t == Donkeylift.Field.TYPES.INTEGER
			|| t == Donkeylift.Field.TYPES.NUMERIC) {
			return val;

		} else {
			return "'" + escapeStr(val) + "'";
		}
	}

});

Donkeylift.Field.create = function(name) {
	return new Donkeylift.Field({
		name: name,
		type: 'VARCHAR',
	});
}


Donkeylift.Field.TYPES = {
	'INTEGER': 'Integer',
	'NUMERIC': 'Decimal',
	'VARCHAR': 'Text',
	'DATE': 'Date',
	'DATETIME': 'Timestamp'
}

Donkeylift.Field.ALIAS = _.invert(Donkeylift.Field.TYPES);

Donkeylift.Field.TypeAlias = function(type) {
	return Donkeylift.Field.TYPES[type];
}

Donkeylift.Field.toDate = function(dateISOString) {
	return new Date(dateISOString.split('-')[0],
					dateISOString.split('-')[1] - 1,
					dateISOString.split('-')[2]);
}

Donkeylift.Field.getIdFromRef = function(val) {
	if (_.isNumber(val)) return val;
	//extract fk from ref such as 'Book [12]'
	var m = val.match(/^(.*)\[([0-9]+)\]$/);
	//console.log(val + " matches " + m);
	return m[2];
}



