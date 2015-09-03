/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	app.Relation = Backbone.Model.extend({ 
		initialize: function(relation) {
			this.set('type', app.Relation.Type(relation));
		}

	});

	app.Relation.create = function(table) {
		return new app.Relation({
			table: table,
			related: null, 
			field: null, 
		});	
	}

	app.Relation.Type = function(relation) {
  		if (relation.field && relation.field.name == 'id') return 'one-to-one';
		else return 'many-to-one';
	}
})();
