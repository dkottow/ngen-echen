/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.UserEditView = Backbone.View.extend({
	el:  '#modalEditUser',

	events: {
		'click #modalUserUpdate': 'evUpdateClick',
		'click #modalUserRemove': 'evRemoveClick',
	},

	initialize: function() {
		console.log("UserEditView.init");
	},

	render: function() {
		console.log("UserEditView.render ");
 		$('#modalInputUserName').val(this.model.get('name'));
 		$('#modalInputUserRole').val(this.model.get('role'));
		$('#modalEditUser').modal();
		return this;
	},

	evUpdateClick: function() {
		this.model.set('name', $('#modalInputUserName').val());
		this.model.set('role', $('#modalInputUserRole').val());

		if ( ! this.users.contains(this.model)) {
			this.users.add(this.model);
		}
		Donkeylift.app.schema.update();
	},

	evRemoveClick: function() {	
		if (this.users.contains(this.model)) {
			this.users.remove(this.model);
		}
		Donkeylift.app.schema.update();
	},


});


