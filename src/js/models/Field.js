/*global Donkeylift, Backbone, _ */

(function () {
	'use strict';
	//console.log("Field class def");
	Donkeylift.Field = Backbone.Model.extend({ 
		initialize: function(field) {
			var rxp = /(\w+)(\([0-9,]+\))?/
			var match = field.type.match(rxp)
			this.set('type', Donkeylift.Field.TypeAlias(match[1]));
			var spec;
			if (match[2]) spec = match[2].substr(1, match[2].length - 2);
			this.set('length', spec);
		},
		
		vname: function() {
			return (this.get('fk') == 1) ?
				this.get('fk_table') + '_ref'
			  : this.get('name');
		},

		attrJSON: function() {
			return _.clone(this.attributes);
		},		

		toJSON: function() {
			var type = Donkeylift.Field.ALIAS[this.get('type')];
			if (this.get('length')) {
				type += '(' + this.get('length') + ')';
			}

			return {
				name: this.get('name'),
				type: type,
				order: this.get('order')
			};
		},

		parse: function(val) {
			if (this.get('fk') == 1 && _.isString(val)) {
				//its a string ref
				return val;
			}
			var t = this.get('type');
			if (t == Donkeylift.Field.TYPES.INTEGER) {
				return parseInt(val);
			} else if(t == Donkeylift.Field.TYPES.NUMERIC) {
				return parseFloat(val);
			} else if(t == Donkeylift.Field.TYPES.DATE) {
				//return new Date(val); 
				return new Date(val).toISOString().substr(0,10);
			} else if (t == Donkeylift.Field.TYPES.DATETIME) {
				//return new Date(val);
				return new Date(val).toISOString();
			} else {
				return val;
			}
		},

		toQS: function(val) {
			if (this.get('fk') == 1 && _.isString(val)) {
				//its a string ref
				return "'" + val + "'";
			}
			var t = this.get('type');
			if (t == Donkeylift.Field.TYPES.INTEGER
				|| t == Donkeylift.Field.TYPES.NUMERIC) {
				return val;
			} else {
				return "'" + val + "'";
			}
		}

	});

	Donkeylift.Field.create = function(name) {
		return new Donkeylift.Field({
			name: name,
			type: 'VARCHAR'
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
		//extract fk from ref such as 'Book (12)'
		var m = val.match(/^(.*)\[([0-9]+)\]$/);
		//console.log(val + " matches " + m);
		return m[2];
	}


})();
