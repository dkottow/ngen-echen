/*global Donkeylift, Backbone, $, _ */

Donkeylift.AccessEditView = Backbone.View.extend({
	el:  '#modalEditAccess',

	events: {
		'click #modalAccessUpdate': 'evUpdateClick',
	},

	initialize: function() {
		console.log("AccessEditView.init");
	},

	setModel: function(model, role) {
		this.model = model;
		this.access = _.find(this.model.get('access_control'), function(access) {
			return access.role == role;
		}, this); 
	},

	render: function() {
		console.log("AliasAccessView.render ");
		$('#modalInputReadAccess').val(this.access.read);
		$('#modalInputWriteAccess').val(this.access.write);
		$('#modalEditAccess').modal();
		return this;
	},

	evUpdateClick: function() {
		this.access.read =  $('#modalInputReadAccess').val();
		this.access.write =  $('#modalInputWriteAccess').val();
		this.model.trigger('change:access_control'); //trigger change

		Donkeylift.app.schema.update();
	},

});


