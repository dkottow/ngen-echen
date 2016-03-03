/*global Donkeylift, Backbone, jQuery, _ */

(function ($) {
	'use strict';

	Donkeylift.FieldEditView = Backbone.View.extend({
		el:  '#modalEditField',

		events: {
			'click #modalFieldUpdate': 'updateClick',
			'click #modalFieldRemove': 'removeClick'
		},

		initialize: function() {
			console.log("FieldEditView.init");
		},

		render: function() {
			console.log("FieldEditView.render " + this.model.get('type'));
			$('#modalInputFieldName').val(this.model.get('name'));
			$('#modalInputFieldType').val(this.model.get('type'));
			$('#modalInputFieldLength').val(this.model.get('length'));
			$('#modalEditField').modal();
			return this;
		},

		updateClick: function() {
			this.model.set('name', $('#modalInputFieldName').val());
			this.model.set('type', $('#modalInputFieldType').val());
			this.model.set('length', $('#modalInputFieldLength').val());
			if ( ! Donkeylift.app.table.get('fields').contains(this.model)) {
				this.model.set('order', Donkeylift.app.table.get('fields').length + 1);
				Donkeylift.app.table.get('fields').add(this.model);
			}
			Donkeylift.app.schema.update();
		},

		removeClick: function() {	
			console.log("FieldEditView.removeClick " + this.model.collection);
			if (this.model.collection) {
				this.model.collection.remove(this.model);
				Donkeylift.app.schema.update();
			}
		}

	});

})(jQuery);


