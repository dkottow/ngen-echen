/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.FieldView = Backbone.View.extend({

	tagName: 'tr',

	events: {
		'click .edit-field': 'editFieldClick',
	},

	initialize: function () {
		//console.log("TableView.init " + this.model.get('name'));
		this.listenTo(this.model, 'change', this.render);
	},

	template: _.template($('#field-template').html()),

	render: function() {
		//console.log("FieldView.render " + this.model.get("name"));
		this.$el.html(this.template(this.model.attrJSON()));
		return this;
	},

	editFieldClick: function(ev) {				
		Donkeylift.app.fieldEditView.model = this.model;
		Donkeylift.app.fieldEditView.render();
	},


});


