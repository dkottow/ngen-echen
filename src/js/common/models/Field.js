/*global Donkeylift, Backbone, _ */

function escapeStr(str) {
	return str.replace("'", "\\'");
}

Donkeylift.Field = Backbone.Model.extend({
	initialize: function(field) {

/*
		//strip type from e.g. VARCHAR(256) and NUMERIC(8,2) 
		var rxp = /(\w+)(\([0-9,]+\))?/
		var match = field.type.match(rxp)
		this.set('type', Donkeylift.Field.TypeAlias(match[1]));
*/
		var props = new Donkeylift.Properties(field.props || {}, {
								parent: this,
								propDefs: Donkeylift.Field.PROPERTIES
		});
		this.set('props', props);
		this.set('disabled', field.disabled == true);
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
/* TODO			
		} else if (this.get('name') == 'id' && resolveRefs) {
			return 'ref'; 
*/
		} else {
			return this.get('name');
		}
	},

	typeName: function() {
		return Donkeylift.Field.typeName(this.get('type'));
	},

	setType: function(typeName, typeSuffix) {
		if ( ! Donkeylift.Field.TYPES[typeName]) {
			throw new Error("setType failed. Unknown type '" + typeName + "'");
		}	
		if (typeName == 'text' && typeSuffix.length > 0) {
			var length = typeSuffix.toUpperCase() == 'MAX' ? 'MAX' : parseInt(typeSuffix);
			this.set('type', typeName + '(' + length + ')');

		} else if (typeName == 'decimal' && typeSuffix.length > 0) {
			var parts = typeSuffix.split(',');
			this.set('type', typeName + '(' + parseInt(parts[0]) + ',' + parseInt(parts[1]) + ')');

		} else {
			this.set('type', typeName);
		}
	},

	typeSuffix: function() {
		return Donkeylift.Field.typeSuffix(this.get('type'));
	},

	getProp: function(name) {
		return this.get('props').get(name);
	},

	setProp: function(name, value) {
		if (this.get('props').getDefinition(name)) {
			this.get('props').set(name, value);
		} else {
			throw new Error("setProp failed. Unknown property '" + name + "'");			
		}
	},

	setPropArray: function(inputArray) {
		this.get('props').setFromArray(inputArray);
		this.trigger('change', this);
	},

	attrJSON: function() {
		var attrs = _.clone(_.omit(this.attributes, 'props'));
		attrs.props = this.get('props').attributes;
		return attrs;
	},

	toJSON: function() {
		//var type = Donkeylift.Field.ALIAS[this.get('type')];

		return {
			name: this.get('name'),
			type: this.get('type'),
			disabled: this.get('disabled'),
			props: this.get('props').attributes
		};
	},

	parse: function(val, opts) {
		opts = opts || {};
		var validate = opts.validate || false;
		var resolveRefs = opts.resolveRefs || false;
		var result = null;
		var resultError = true;

		if ( ! val || val.length == 0) return result;

		var t = this.typeName();

		if (this.get('fk') == 1 && resolveRefs) {
			result = Donkeylift.Field.getIdFromRef(val);
			resultError = isNaN(result); 

		} else if (this.get('fk') == 1 && ! resolveRefs) {
			result = val.toString();
			resultError = false;

		} else if (t == Donkeylift.Field.TYPES.text) {
			result = val.toString();
			resultError = false;

		} else if (t == Donkeylift.Field.TYPES.integer) {
			result = parseInt(val);
			resultError = isNaN(result); 

		} else if(t == Donkeylift.Field.TYPES.decimal) {
			result = parseFloat(val);
			resultError = isNaN(result); 

		} else if(t == Donkeylift.Field.TYPES.date) {
			//return new Date(val);
			result = new Date(val);
			resultError = isNaN(Date.parse(val)); 
			if ( ! resultError) result = result.toISOString().substr(0,10);

		} else if (t == Donkeylift.Field.TYPES.timestamp) {
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

		if (val === null) return "null";

		if (this.get('fk') == 1 && resolveRefs) {
			return Donkeylift.Field.getIdFromRef(val);
		} else if (this.get('fk') == 1 && ! resolveRefs) {
			return "'" + escapeStr(val) + "'";
		}

		var t = this.typeName();

		if (t == Donkeylift.Field.TYPES.integer || t == Donkeylift.Field.TYPES.decimal) {
			return val;

		} else {
			return "'" + escapeStr(val) + "'";
		}
	},

	setTypeByExample: function(val) {
		if (String(parseInt(val)) == val) {
			this.set('type', Donkeylift.Field.TYPES.integer);
			return;
		} 
		var num = val.replace(/[^0-9-.]/g, '');
		console.log(num);
		if (num.length > 0 && ! isNaN(num)) {
			this.set('type', Donkeylift.Field.TYPES.decimal);
			//TODO set precision
			return;
		} 
		if ( ! isNaN(Date.parse(val))) {
			this.set('type', Donkeylift.Field.TYPES.date);
			return;
		} 
		this.set('type', Donkeylift.Field.TYPES.text);
	}

});

Donkeylift.Field.create = function(name) {
	return new Donkeylift.Field({
		name: name,
		type: Donkeylift.Field.TYPES.text,
	});
}


Donkeylift.Field.TYPES = {
	text: 'text', 
	integer: 'integer', 
	decimal: 'decimal', 
	date: 'date', 
	timestamp: 'timestamp', 
	float: 'float'
};

Donkeylift.Field.PROPERTIES = [
	{ 
		'name': 'order'
		, 'type': 'Integer' 
		, 'default': 100
	}
	, { 
		'name': 'width'
		, 'type': 'Integer'
		, 'default': 16
	}
	, { 
		'name': 'scale'
		, 'type': 'Integer'
		, 'scope': [ 'Decimal' ]
		, 'default': 2
	}
/*	
	, { 
		'name': 'label',
		'type': 'Text'
	}
*/	
	, { 
		'name': 'visible'
		, 'type': 'Boolean'
		, 'default': true
	}
];	

Donkeylift.Field.typeName = function(fieldType) 
{
    var m = fieldType.match(/^[a-z]+/);
    if (m && m.length > 0) return m[0];
    return null;
}

Donkeylift.Field.typeSuffix = function(fieldType) 
{
    var m = fieldType.match(/\(([0-9]+,?[0-9]*)\)$/);
    if (m && m.length > 1) return m[1];
    return '';
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



