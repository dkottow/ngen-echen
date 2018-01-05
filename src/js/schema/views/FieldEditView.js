/*global Donkeylift, Backbone, jQuery, _, $ */

Donkeylift.FieldEditView = Backbone.View.extend({
	el:  '#modalEditField',

	events: {
		'click #modalFieldUpdate': 'updateClick',
		'click #modalFieldRemove': 'removeClick',
	},

	initialize: function() {
		console.log("FieldEditView.init");
	},

	render: function() {
		//console.log("FieldEditView.render " + this.model.get('type'));

		$('#modalInputFieldName').val(this.model.get('name'));
		$('#modalInputFieldType').val(this.model.typeName());
		$('#modalInputFieldTypeSuffix').val(this.model.typeSuffix());						
		$('#modalInputFieldDisabled').prop('checked', this.model.get('disabled'));

		$('#modalEditField').modal();

		return this;
	},

	updateClick: function() {
		console.log("FieldEditView.updateClick ");

		this.model.set('name', $('#modalInputFieldName').val());
		this.model.setType($('#modalInputFieldType').val(), $('#modalInputFieldTypeSuffix').val());
		this.model.set('disabled', $('#modalInputFieldDisabled').prop('checked'));

		if ( ! this.model.collection) {
			Donkeylift.app.table.get('fields').addNew(this.model);
		}
		Donkeylift.app.table.sanitizeFieldOrdering();
		Donkeylift.app.updateSchema();

		//Donkeylift.app.tableView.render();
	},

	removeClick: function() {	
		console.log("FieldEditView.removeClick " + this.model.collection);
		if (this.model.collection) {
			this.model.collection.remove(this.model);
		}
		Donkeylift.app.updateSchema();
		Donkeylift.app.tableView.render();
	},

});


