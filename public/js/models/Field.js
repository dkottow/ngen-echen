/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	//console.log("Field class def");
	app.Field = Backbone.Model.extend({ 
		initialize: function(field) {
			var rxp = /(\w+)(\([0-9,]+\))?/
			var match = field.type.match(rxp)
			this.set('type', app.Field.TypeAlias(match[1]));
			var spec;
			if (match[2]) spec = match[2].substr(1, match[2].length - 2);
			this.set('length', spec);
		},

		toServerJSON: function() {
			var type = app.Field.ALIAS[this.get('type')];
			if (this.get('length')) {
				type += '(' + this.get('length') + ')';
			}

			return {
				name: this.get('name'),
				type: type,
				order: this.get('order')
			};
		}

	});

	app.Field.create = function(name) {
		return new app.Field({
			name: name,
			type: 'VARCHAR'
		});
	}


	app.Field.TYPES = {
		'INTEGER': 'Integer',
		'NUMERIC': 'Decimal',
		'VARCHAR': 'Text',
		'DATE': 'Date',
		'DATETIME': 'Timestamp'
	}

	app.Field.ALIAS = _.invert(app.Field.TYPES);

	app.Field.TypeAlias = function(type) {
		return app.Field.TYPES[type]; 		
	}

})();
