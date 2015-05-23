/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	//console.log("Table class def");
	app.Field = Backbone.Model.extend({ 
		initialize: function(field) {
			this.id = field.name;
		}
		
	});

})();
