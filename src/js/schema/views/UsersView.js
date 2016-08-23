/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.UsersView = Backbone.View.extend({

	//el:  '#content',

	events: {
		'click .edit-user': 'evEditUserClick',
		'click #add-user': 'evNewUserClick'
	},

	initialize: function () {
		console.log("UsersView.init " + this.collection);
		this.listenTo(this.collection, 'add', this.render);
		this.listenTo(this.collection, 'remove', this.render);
		this.listenTo(this.collection, 'change', this.render);
	},

	template: _.template($('#users-template').html()),
	user_template: _.template($('#user-template').html()),

	render: function() {
		console.log("UsersView.render");

		this.$el.html(this.template());

		this.collection.each(function(user) {
			//console.log('user ' + user.get('name') + ' ' + user.get('role'));
			this.$el.find('tbody').append(this.user_template({
				name: user.get('name'),
				role: user.get('role'),
			}));
		}, this);
		return this;
	},

	evEditUserClick: function(ev) {				
		console.log("UsersView.evEditUserClick");
		var uname = $(ev.target).parents('tr').find('td:eq(1)').text();

		var user = this.collection.find(function(u) {
			return u.get('name') == uname;
		});
		console.log("Edit user " + uname + " = " + user);

		var editor = Donkeylift.app.getUserEditor();
		editor.model = user;
		editor.render();
	},

	evNewUserClick: function() {
		console.log('UsersView.evNewUserClick');
		var user = Donkeylift.User.create();
		var editor = Donkeylift.app.getUserEditor();
		editor.model = user;
		editor.render();
	}

});


