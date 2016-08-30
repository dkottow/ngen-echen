/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.AccessView = Backbone.View.extend({

	//el: '#alias',

	events: {
		'click .edit-access': 'evEditAliasClick',
	},

	initialize: function () {
		console.log("AccessView.init ");
		console.log(this.model.get('access_control'));
	},

	template: _.template($('#access-role-template').html()),

	render: function() {
		console.log("AccessView.render");

		this.$el.find('tbody').empty();

		_.each(this.model.get('access_control'), function(a) {
			this.$el.find('tbody').append(this.template({
				role: a.role,
				read: a.read,
				write: a.write
			}));
		}, this);

	},

	evEditAliasClick: function(ev) {				
		console.log("AccessView.evEditAliasClick");
		var table = $(ev.target).parents('tr').find('td:eq(1)').text();
		var field = $(ev.target).parents('tr').find('td:eq(2)').text();

		var alias = _.find(this.model.get('row_alias'), function(a) {
			return a.get('table').get('name') == table 
				&& a.get('field').get('name') == field;
		});
		console.log("Edit alias " + table + "." + field + " = " + alias);

		var editor = Donkeylift.app.getAliasEditor();
		editor.setModel(this.model, alias);
		editor.render();
	},

});


