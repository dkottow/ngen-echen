/*global Donkeylift, Backbone, $, _ */

Donkeylift.AccessView = Backbone.View.extend({

	//el: '#alias',

	events: {
		'click .edit-access': 'evEditClick',
	},

	initialize: function () {
		console.log("AccessView.init ");
		console.log(this.model.get('access_control'));
		this.listenTo(this.model, 'change:access_control', this.render);
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

	evEditClick: function(ev) {				
		console.log("AccessView.evEditClick");
		var role = $(ev.target).parents('tr').find('td:eq(1)').text();

		console.log("Edit access " + role);

		var editor = Donkeylift.app.getAccessEditor();
		editor.setModel(this.model, role);
		editor.render();
	},

});


