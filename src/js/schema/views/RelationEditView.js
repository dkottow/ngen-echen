/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.RelationEditView = Backbone.View.extend({
	el:  '#modalEditRelation',

	events: {
		'click #modalRelationUpdate': 'updateClick',
		'click #modalRelationRemove': 'removeClick',
		'change #modalInputRelationType': 'typeChange'
	},

	initialize: function() {
		console.log("RelationEditView.init");
	},

	render: function() {
		console.log("RelationEditView.render " + this.model);

		var el = $('#modalInputRelationTable')
		el.html('');
		this.schema.get('tables').each(function(table) {
			el.append($('<option></option>')
				.attr('value', table.get('name'))
				.text(table.get('name')));
		});
		
		el.val('');
		if (this.model.get('related'))
			el.val(this.model.get('related').get('name'));

		el = $('#modalInputRelationField')
		el.html('');
		this.model.get('table').get('fields').each(function(field) {
			if (field.get('type') == Donkeylift.Field.TYPES.integer && field.get('name') != 'id') {
				el.append($('<option></option>')
					.attr('value', field.get('name'))
					.text(field.get('name')));
			}
		});

		el.val('');
		if (this.model.get('field'))
			el.val(this.model.get('field').get('name'));

		$('#modalInputRelationType').val(this.model.get('type'));

		$('#modalEditRelation').modal();
		return this;
	},

	updateClick: function() {
		console.log('RelationEditView.updateClick');
		var newTable = $('#modalInputRelationTable').val();	
		var newField = $('#modalInputRelationField').val();

		if (_.isEmpty(newField)) {
			//create field as <newTable>_id
			newField = Donkeylift.Field.create();
			newField.set('name', newTable + "_id");
			newField.set('type', Donkeylift.Field.TYPES.integer);
			this.model.get('table').get('fields').setByName(newField);
		} else {
			newField = this.model.get('table').get('fields').getByName(newField);
		}

		newTable = this.schema.get('tables').getByName(newTable);
		var newType = $('#modalInputRelationType').val();

		this.model.set({
			'type': newType,
			'field': newField,
			'related': newTable
		});	
		if ( ! this.table.get('relations').contains(this.model)) {
			this.table.get('relations').add(this.model);
		}
		Donkeylift.app.updateSchema();
	},

	removeClick: function() {	
		console.log("RelationEditView.removeClick " + this.model.collection);
		if (this.model.collection) {
			this.model.collection.remove(this.model);
		}
		Donkeylift.app.updateSchema();
	},

	typeChange: function() {
		var el = $('#modalInputRelationField');	
		if ($('#modalInputRelationType').val() == 'one-to-one') {
			el.val('id'); //doesnt work
			el.prop('disabled', true);
		} else {
			el.prop('disabled', false);
		}
	}

});


