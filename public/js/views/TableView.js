/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.TableView = Backbone.View.extend({

		tagName: 'div',
		className: 'panel panel-default',	

		events: {
			'click .edit-table': 'editTableClick',
			'click #add-field': 'newFieldClick',
			'click #add-relation': 'newRelationClick'
		},

		initialize: function () {
			//console.log("TableView.init " + this.model.get('name'));
			this.listenTo(this.model, 'change', this.render);
			//this.listenTo(this.model.get('fields'), 'reset', this.setFields);
			this.listenTo(this.model.get('fields'), 'add', this.addField);
			this.listenTo(this.model.get('fields'), 'remove', this.removeField);
			this.listenTo(this.model.get('relations'), 'add', this.addRelation);
			this.listenTo(this.model.get('relations'), 'remove', this.removeRelation);
			this.fieldViews = {};
			this.relationViews = {};
		},

		template: _.template($('#table-template').html()),

		render: function() {
			console.log("TableView.render " + this.model.get("name"));
			this.$el.html(this.template(this.model.toJSON()));
			this.setFields();
			this.setRelations();
			return this;
		},

		editTableClick: function(ev) {				
			app.tableEditView.model = this.model;
			app.tableEditView.render();
		},

		newFieldClick: function() {
			console.log('TableView.newFieldClick');
			var field = this.model.get('fields').addNew();
			app.fieldEditView.model = field;
			app.fieldEditView.render();
		},

		removeField: function(field) {
			console.log('SchemaView.removeField ' + field.get('name'));
			this.fieldViews[field.cid].remove();
		},

		addField: function(field) {
			//console.log('TableView.addField ' + field.get("name"));
			var view = new app.FieldView({model: field});
			this.$('#fields-' + this.model.get('name') + ' tbody')
				.append(view.render().el);
			this.fieldViews[field.cid] = view;
		},

		setFields: function() {
			console.log('TableView.setFields ' + this.model.get('name'));
			this.$('#fields-' + this.model.get('name') + ' tbody').html('');
			this.model.get('fields').each(this.addField, this);
		},

		newRelationClick: function() {
			console.log('TableView.newRelationClick');
			var relation = this.model.get('relations').addNew(this.model.get('name'));
			app.relationEditView.model = relation;
			app.relationEditView.render();
		},

		removeRelation: function(relation) {
			console.log('SchemaView.removeRelation ' + relation.id);
			this.relationViews[relation.cid].remove();
		},

		addRelation: function(relation) {
			var view = new app.RelationView({model: relation});
			this.$('#relations-' + this.model.get('name') + ' tbody')
				.append(view.render().el);
			this.relationViews[relation.cid] = view;
		},

		setRelations: function() {
			this.$('#relations-' + this.model.get('name') + ' tbody').html('');
			this.model.get('relations').each(this.addRelation, this);
		}
	});

})(jQuery);


