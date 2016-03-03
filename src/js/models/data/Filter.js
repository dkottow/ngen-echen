/*global Donkeylift, Backbone, _ */

(function () {
	'use strict';
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

		values: function() {
			var me = this;

			var val = _.isArray(this.get('value')) ? 
						this.get('value') : [ this.get('value') ];

			return val.map(function(v) {
				if (me.get('field').get('fk') == 1 
					&& me.get('op') == Donkeylift.Filter.OPS.IN) {

					return Donkeylift.Field.getIdFromRef(v);

				} else {
					return me.get('field').toQS(v);
				}
			});
		},

		toParam: function() {
			var f = this.get('field') ? this.get('field').vname() : null;
			var key = Donkeylift.Filter.Key(this.get('table'), f);
			var param;

			if (this.get('op') == Donkeylift.Filter.OPS.SEARCH) {
				param = key + " search '" + this.get('value') + "'";

			} else if (this.get('op') == Donkeylift.Filter.OPS.EQUAL) {
				param = key + " eq " 
						+ this.get('field').toQS(this.get('value'));

			} else {
				var values = this.values();
				if (this.get('op') == Donkeylift.Filter.OPS.BETWEEN) {
					param = key + " btwn " + values[0] + ',' + values[1];

				} else if (this.get('op') == Donkeylift.Filter.OPS.IN) {
					key = Donkeylift.Filter.Key(this.get('table'), this.get('field'));
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

			} else if (this.get('op') == Donkeylift.Filter.OPS.EQUAL) {
				result.op = 'equal';
				result.field = this.get('field').get('name');
				result.value = this.get('value'); 
			}
			return result;
		}

	});

	Donkeylift.Filter.Key = function(table, field) {		
		if (_.isObject(table)) table = table.get('name');
		if ( ! field) field = table;
		else if (_.isObject(field)) field = field.get('name'); //not vname
		return table + '.' + field;
	}

	Donkeylift.Filter.OPS = {
		'SEARCH': 'search',
		'BETWEEN': 'btwn',
		'IN': 'in',
		'EQUAL': 'eq'
	}

	Donkeylift.Filter.CONJUNCTION = ' and ';

})();
