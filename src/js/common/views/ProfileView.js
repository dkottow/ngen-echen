/*global Donkeylift, Backbone, jQuery, _, $ */


Donkeylift.ProfileView = Backbone.View.extend({

	el:  '#content',
	events: {
	},

	initialize: function() {
		console.log("ProfileView.init");
	},

	template: _.template($('#profile-template').html()),

	render: function() {
		console.log("ProfileView.render ");
		this.$el.html(this.template({
			user: this.model.get("user"),
			account: this.model.get("name"),
		}));
		$('#menu').empty(); //clear module menu
	},


});


