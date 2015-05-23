/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	// Tables Collection
	// ---------------

	app.Tables = Backbone.Collection.extend({
		// Reference to this collection's model.
		model: app.Table,

		addNew: function() {
			var table = app.Table.create('table' + this.length);
			this.add(table);
			return table;
		}

	});

})();
