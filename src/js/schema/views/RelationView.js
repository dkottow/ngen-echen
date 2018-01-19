/*global Donkeylift, Backbone, $, _ */

Donkeylift.RelationView = Backbone.View.extend({

	tagName: 'tr',

	events: {
		'click .edit-relation': 'editRelationClick',
	},

	initialize: function () {
		//console.log("RelationView.init " + this.model.get('table'));
		this.listenTo(this.model, 'change', this.render);
		this.listenTo(this.model, 'change:field', this.setAttributeListeners);
		this.listenTo(this.model, 'change:related', this.setAttributeListeners);
		this.setAttributeListeners();
	},

	setAttributeListeners: function () {
		if (this.model.get('field')) {
			this.listenTo(this.model.get('field'), 'change:name', this.render);
			this.listenTo(this.model.get('related'), 'change:name', this.render);
		}
	},

	template: _.template($('#relation-template').html()),

	render: function() {
		console.log("RelationView.render ");
		this.$el.html(this.template({
			fk_table: this.model.get('related').get('name'),
			fk_field: this.model.get('field').get('name')
		}));
		return this;
	},

	editRelationClick: function(ev) {				
		var editor = Donkeylift.app.getRelationEditor();
		editor.model = this.model;
		editor.render();
	},


});


