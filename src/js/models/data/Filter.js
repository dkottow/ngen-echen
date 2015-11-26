/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	app.Filter = Backbone.Model.extend({

		initialize: function(attrs) {
			console.log("Filter.initialize ");			

			
			if (_.isString(attrs.table)) {
				this.set('table', 
					app.database.get('tables').getByName(attrs.table));
			}

			if (attrs.field && _.isString(attrs.field)) {
				this.set('field', 
					this.get('table').get('fields').getByName(attrs.field));
			}

			this.set('id', app.Filter.Key(attrs.table, attrs.field));

		},

		values: function() {
			var me = this;

			var val = _.isArray(this.get('value')) ? 
						this.get('value') : [ this.get('value') ];

			return val.map(function(val) {
				if (me.get('field').get('fk') == 1 
					&& me.get('op') == app.Filter.OPS.IN) {
					//extract fk from ref such as 'Book (12)'
					var m = val.match(/^(.*)\(([0-9]+)\)$/);
					//console.log(val + " matches " + m);
					return m[2];
				} else {
					return me.get('field').toQS(val);
				}
			});
		},

		toParam: function() {
			var f = this.get('field') ? this.get('field').vname() : null;
			var key = app.Filter.Key(this.get('table'), f);
			var param;

			if (this.get('op') == app.Filter.OPS.SEARCH) {
				//add asterisk and enclose in double quotes (prefix last + phrase query)
				param = key + " search '" 
						+ '"' + this.get('value') + '*"' + "'";

			} else {
				var values = this.values();
				if (this.get('op') == app.Filter.OPS.BETWEEN) {
					param = key + " ge " + values[0] + ' and ' 
						  + key + " le " + values[1];

				} else if (this.get('op') == app.Filter.OPS.IN) {
					key = app.Filter.Key(this.get('table'), this.get('field'));
					param = key + " in " + values.join(",");
				}
			}

			return param;
		},

		loadRange: function(cbAfter) {
			var field = this.get('field');
			this.get('table').stats(this, function(stats) {
				field.set('stats', stats);
				cbAfter();
			});
		},

		loadSelect: function(searchTerm, cbAfter) {
			var field = this.get('field');
			this.get('table').options(this, searchTerm, function(opts) {
				field.set('options', opts);
				cbAfter();
			});
		},

		toStrings: function() {
			var result = { table: this.get('table').get('name'), field: '' };
			if (this.get('op') == app.Filter.OPS.SEARCH) {
				result.op = 'search';
				result.value = this.get('value');
			} else if (this.get('op') == app.Filter.OPS.BETWEEN) {
				result.op = 'between';
				result.field = this.get('field').get('name');
				result.value = this.get('value')[0] 
							+ ' and ' + this.get('value')[1];
			} else if (this.get('op') == app.Filter.OPS.IN) {
				result.op = 'in';
				result.field = this.get('field').get('name');
				result.value = this.get('value').join(', '); 
			}
			return result;
		}

	});

	app.Filter.Key = function(table, field) {		
		if (_.isObject(table)) table = table.get('name');
		if ( ! field) field = table;
		else if (_.isObject(field)) field = field.get('name'); //not vname
		return table + '.' + field;
	}

	app.Filter.OPS = {
		'SEARCH': 'search',
		'BETWEEN': ['le', 'ge'],
		'IN': 'in'
	}

	app.Filter.CONJUNCTION = ' and ';

})();
