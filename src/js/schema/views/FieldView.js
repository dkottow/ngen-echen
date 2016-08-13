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
		var attrs = this.model.attrJSON();
		attrs.props = _.map(attrs.props, function(v, k) {
			return k + ": " + v;
		}).join(' | ');
		this.$el.html(this.template(attrs));
		return this;
	},

	editFieldClick: function(ev) {				
		var editor = Donkeylift.app.tableView.getFieldEditor();
		editor.model = this.model;
		editor.render();
	},


});


