/*global Donkeylift, Backbone, jQuery, _, $ */

Donkeylift.FieldEditView = Backbone.View.extend({
	el:  '#modalEditField',

	events: {
		'click #modalFieldUpdate': 'updateClick',
		'click #modalFieldRemove': 'removeClick',
		'click input[name="disabled"]': 'toggleDisableFieldClick',
	},

	initialize: function() {
		console.log("FieldEditView.init");
	},

	render: function() {
		//console.log("FieldEditView.render " + this.model.get('type'));

		$('#modalInputFieldName').val(this.model.get('name'));
		$('#modalInputFieldType').val(this.model.typeName());
		$('#modalInputFieldTypeSuffix').val(this.model.typeSuffix());						

		$('#modalTabProps form').empty();
	
		var disabled = this.model.get('disabled');
		var htmlDisabled = disabled 
				? '<input type="checkbox" checked name="disabled"> Disable Field'
				: '<input type="checkbox" name="disabled"> Disable Field'

		$('#modalTabDefs form').append(htmlDisabled);

		$('#modalTabDefs form').append('<div class="well inject-props"></div>');

		$('#modalEditField').modal();
		this.showDefinition(true);

		return this;
	},

	updateClick: function() {
		console.log("FieldEditView.updateClick ");

		this.model.set('name', $('#modalInputFieldName').val());
		this.model.setType($('#modalInputFieldType').val(), $('#modalInputFieldTypeSuffix').val());
		//this.model.set('type', $('#modalInputFieldType').val());

		this.model.set('disabled', $('#modalTabDefs input[name=disabled]:checked').val() == "on");

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

	showDefinition: function(show) {
		if (show) {
			$('#modalTabDefs').show();
		} else {
			$('#modalTabDefs').hide();
		}
	},

	togglePropsClick: function() {	
		var show = $('#modalTabDefs:visible').length == 0;
		this.showDefinition(show);
	},
	
	toggleDisableFieldClick: function(ev) {
		var disabled = $(ev.target).is(':checked');
	}

});


