/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	// Tables Collection
	// ---------------

	app.Relations = Backbone.Collection.extend({
		// Reference to this collection's model.
		model: app.Relation,
		
		addNew: function(table) {
			var relation = new app.Relation.create(table);
			this.add(relation);
			return relation;
		}

	});

})();
