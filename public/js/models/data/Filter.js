/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	app.Filter = Backbone.Model.extend({

		initialize: function(attrs) {
			console.log("Filter.initialize ");
		},

		toParam: function() {			
			return this.get('table') + '.' + this.get('field') 
				+ ' ' + this.get('op')
				+ ' ' + this.get('value');
		}

	});

})();
