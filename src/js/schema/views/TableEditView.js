/*global Donkeylift, Backbone, $, _ */

Donkeylift.TableEditView = Backbone.View.extend({
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
		if ( ! Donkeylift.app.schema.get('tables').contains(this.model)) {
			Donkeylift.app.schema.get('tables').add(this.model);
		}
		var tableExample = $('#modalInputTableByExample').val();
		this.model.addFieldsByExample(tableExample);

		Donkeylift.app.schema.update(function() {
			var table = Donkeylift.app.schema.get('tables').getByName(newName);
			Donkeylift.app.setTable(table);
		});
	},

	removeClick: function() {	
		if (this.model.collection) {
			this.model.collection.remove(this.model);
			Donkeylift.app.tableView.remove();
			Donkeylift.app.schema.update();
		}
	}

});


