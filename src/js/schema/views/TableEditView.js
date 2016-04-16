/*global Donkeylift, Backbone, jQuery, _ */

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
			Donkeylift.app.setTable(this.model);
		}
		Donkeylift.app.schema.update();
	},

	removeClick: function() {	
		if (this.model.collection) {
			this.model.collection.remove(this.model);
			Donkeylift.app.tableView.remove();
			Donkeylift.app.schema.update();
		}
	}

});


