/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.FieldEditView = Backbone.View.extend({
	el:  '#modalEditField',

	events: {
		'click #modalFieldUpdate': 'updateClick',
		'click #modalFieldRemove': 'removeClick',
		'click #modalToggleProps': 'togglePropsClick'
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
		this.showDefinition(true);

		return this;
	},

	updateClick: function() {
		console.log("FieldEditView.updateClick ");
		this.model.set('name', $('#modalInputFieldName').val());
		this.model.set('type', $('#modalInputFieldType').val());
		this.model.set('length', $('#modalInputFieldLength').val());

		Donkeylift.app.table.get('fields').addNew(this.model);
		Donkeylift.app.schema.update();
	},

	removeClick: function() {	
		console.log("FieldEditView.removeClick " + this.model.collection);
		if (this.model.collection) {
			this.model.collection.remove(this.model);
			Donkeylift.app.schema.update();
		}
	},

	showDefinition: function(show) {
		if (show) {
			$('#modalTabDefs').show();
			$('#modalTabProps').hide();
			$('#modalToggleProps').text('Properties');
		} else {
			$('#modalTabProps').show();
			$('#modalTabDefs').hide();
			$('#modalToggleProps').text('Definition');
		}
	},

	togglePropsClick: function() {	
		console.log("FieldEditView.togglePropsClick " + this.model.collection);
		var show = $('#modalTabDefs:visible').length == 0;
		this.showDefinition(show);
	}

});


