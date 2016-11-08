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

	vname: function(opts) {
		opts = opts || {};
		var resolveRefs = opts.resolveRefs || true;

		if (this.get('fk') == 1 && resolveRefs) {
			if (this.get('name').match(/id$/)) { 
				return this.get('name').replace(/id$/, "ref");
			} else {
				return this.get('name') + "_ref";
			}
		} else {
			return this.get('name');
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
		opts = opts || {};
		var validate = opts.validate || false;
		var resolveRefs = opts.resolveRefs || false;
		var result = null;
		var resultError = true;
		var t = this.get('type');

		if (this.get('fk') == 1 && resolveRefs) {
			result = Donkeylift.Field.getIdFromRef(val);
			resultError = isNaN(result); 

		} else if (this.get('fk') == 1 && ! resolveRefs) {
			result = val.toString();
			resultError = false;

		} else if (t == Donkeylift.Field.TYPES.VARCHAR) {
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
			var err;
			if (this.get('fk') == 1) {
				err = new Error("Parse '" + val + "' ref failed.");
			} else {
				err = new Error("Parse '" + val + "'" + " to " + t + " failed.");
			}
			err.field = this.vname(opts);
			throw err;
		}
		return result;
	},

	//to formatted string (pretty-print)
	toFS: function(val) {
		if (_.isNumber(val) && this.getProp('scale')) {
			return val.toFixed(this.getProp('scale'));
		}
		if ( ! _.isString(val)) return String(val);

		return _.escape(String(val));
	},

	//to query string
	toQS: function(val, opts) {
		opts = opts || {};
		var resolveRefs = opts.resolveRefs || false;

		if (this.get('fk') == 1 && resolveRefs) {
			return Donkeylift.Field.getIdFromRef(val);
		} else if (this.get('fk') == 1 && ! resolveRefs) {
			return "'" + escapeStr(val) + "'";
		}

		var t = this.get('type');
		if (t == Donkeylift.Field.TYPES.INTEGER
			|| t == Donkeylift.Field.TYPES.NUMERIC) {
			return val;

		} else {
			return "'" + escapeStr(val) + "'";
		}
	},

	setTypeByExample: function(val) {
		if (String(parseInt(val)) == val) {
			this.set('type', Donkeylift.Field.TYPES.INTEGER);
			return;
		} 
		var num = val.replace(/[^0-9-.]/g, '');
		console.log(num);
		if (num.length > 0 && ! isNaN(num)) {
			this.set('type', Donkeylift.Field.TYPES.NUMERIC);
			//TODO set precision
			return;
		} 
		if ( ! isNaN(Date.parse(val))) {
			this.set('type', Donkeylift.Field.TYPES.DATE);
			return;
		} 
		this.set('type', Donkeylift.Field.TYPES.VARCHAR);
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
	if (m && m.length == 3) return parseInt(m[2]);
	else return NaN;
}



