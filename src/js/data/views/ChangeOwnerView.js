/*global Donkeylift, Backbone, $, _ */

Donkeylift.ChangeOwnerView = Backbone.View.extend({
	el:  '#modalChangeOwner',

	events: {
		'click #modalOwnerUpdate': 'evUpdateClick',
	},

	template: _.template($('#change-owner-item-template').html()),

	initialize: function() {
		console.log("ChangeOwnerView.init");
	},

	render: function() {
		var el = this.$('select');
		el.empty();
		el.append(this.template({ 
			user: '' //add empty 
		}));
		this.model.get('users').each(function(user) {
			el.append(this.template({ 
				user: user.get('name') 
			}));
		}, this);	
		

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


