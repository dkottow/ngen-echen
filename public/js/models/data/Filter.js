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

			if (attrs.op == app.Filter.OPS.SEARCH) {
				this.set('id', this.get('table').get('name') + '.' 
							+ this.get('table').get('name'));
			} else {
				this.set('id', this.get('table').get('name') + '.' 
							+ this.get('field').get('name'));
			}
			//console.dir(this);
		},

		toParam: function() {
			var val = this.get('value');
			if (this.get('op') == app.Filter.OPS.SEARCH) val = val + '*';
			return 	this.id + ' ' + this.get('op') + ' ' + val;
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

	app.Filter.OPS = {
		'SEARCH': 'search'
	}

})();
