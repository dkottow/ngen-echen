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
					var m = val.match(/^(.*)\(([0-9]+)\)$/);
					//console.log(val + " matches " + m);
					return m[2];
				} else {
					return me.get('field').toQS(val);
				}
			});
		},

		toParam: function() {
			var param;
			var values = this.values();
			if (this.get('op') == app.Filter.OPS.SEARCH) {
				param = this.id + " search '" + this.get('value') + "*'";
			} else if (this.get('op') == app.Filter.OPS.BETWEEN) {
				param = this.id + " ge " + values[0] + ' and ' 
						+ this.id + " le " + values[1];
			} else if (this.get('op') == app.Filter.OPS.IN) {
				param = this.id + " in " + values.join(",");
			}
			return param;
		},

		loadRange: function(cbAfter) {
			var field = this.get('field');
			this.get('table').stats(field.vname(), function(stats) {
				field.set('stats', stats);
				cbAfter();
			});
		},

		loadSelect: function(searchTerm, cbAfter) {
			var field = this.get('field');
			this.get('table').options(field.vname(), searchTerm, function(opts) {
				field.set('options', opts);
				cbAfter();
			});
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
