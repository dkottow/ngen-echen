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
			if ( ! app.schema.get('tables').contains(this.model)) {
				app.schema.get('tables').add(this.model);
				app.tableListView.setTable(this.model);
			}
		},

		removeClick: function() {	
			if (this.model.collection) {
				this.model.collection.remove(this.model);
				app.tableView.remove();
			}
		}

	});

})(jQuery);


