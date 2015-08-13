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

		toParam: function() {
			var param;
			if (this.get('op') == app.Filter.OPS.SEARCH) {
				param = this.id + ' search ' + this.get('value') + '*';
			} else if (this.get('op') == app.Filter.OPS.BETWEEN) {
				param = this.id + ' ge ' + this.get('value')[0]
					+ ' and ' + this.id + ' le ' + this.get('value')[1];
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

		loadSelect: function(cbAfter) {
			var field = this.get('field');
			this.get('table').options(field.vname(), function(opts) {
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
		'BETWEEN': ['le', 'ge']
	}

})();
