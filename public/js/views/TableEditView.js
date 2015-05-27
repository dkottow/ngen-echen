/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.TableEditView = Backbone.View.extend({
		el:  '#modalEditTable',

		events: {
			'click #modalTableUpdate': 'updateClick',
			'click #modalTableRemove': 'removeClick'
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

		updateClick: function() {
			var newName = $('#modalInputTableName').val();
			this.model.set('name', newName);
			$('#collapse-' + newName).collapse('show');
		},

		removeClick: function() {	
			this.model.collection.remove(this.model);
		}

	});

})(jQuery);


