/*global Donkeylift, Backbone, $, _ */

Donkeylift.ChangeOwnerView = Backbone.View.extend({
	el:  '#modalChangeOwner',

	events: {
		'click #modalOwnerUpdate': 'evUpdateClick',
	},

	initialize: function() {
		console.log("ChangeOwnerView.init");
	},

	render: function() {
		$('#modalChangeOwner').modal();
		return this;
	},

	evUpdateClick: function() {
		var owner = $('#modalInputOwner').val();
		if (owner.length > 0) {
			Donkeylift.app.table.changeOwner(this.model.get('rowIds'), owner);
			Donkeylift.app.unsetFilters();
			console.log('update owner to ' + owner);
		}
	},

});


