/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.TableEditView = Backbone.View.extend({
		el:  '#modalEditTable',

		events: {
			'click #modalTableUpdate': 'updateTableClick',
			'click #modalTableRemove': 'removeTableClick'
		},

		initialize: function() {
			console.log("TableEditView.init");
		},

		render: function() {
			console.log("TableEditView.render");
			$('#modalInputTableName').val(this.model.get('name'));
			$('#modalEditTable').modal();
			return this;
		},

		updateTableClick: function() {
			var newName = $('#modalInputTableName').val();
			this.model.set('name', newName);
		},

		removeTableClick: function() {	
			this.model.collection.remove(this.model);
		}

	});

})(jQuery);


