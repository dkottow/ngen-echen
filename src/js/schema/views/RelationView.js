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
		var params = this.model.toJSON();
		if (this.model.get('related')) params.related = this.model.get('related').get('name');
		if (this.model.get('field')) params.field = this.model.get('field').get('name');
		this.$el.html(this.template(params));
		return this;
	},

	editRelationClick: function(ev) {				
		var editor = Donkeylift.app.getRelationEditor();
		editor.model = this.model;
		editor.render();
	},


});


