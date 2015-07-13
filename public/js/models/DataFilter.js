/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	app.DataFilter = Backbone.Model.extend({

		initialize: function(attrs) {
			console.log("DataFilter.initialize ");
		},

		toParam: function() {			
			return this.get('table') + '.' + this.get('field') 
				+ ' ' + this.get('op')
				+ ' ' + this.get('value');
		}

	});

})();
