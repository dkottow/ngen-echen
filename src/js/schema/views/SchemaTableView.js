/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.SchemaTableView = Backbone.View.extend({

	//el:  '#content',

	events: {
		'click .edit-table': 'evEditTableClick',
		'click #add-field': 'evNewFieldClick',
		'click #add-relation': 'evNewRelationClick',
		'click #add-alias': 'evNewAliasClick'
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
		this.$el.html(this.template(this.model.attrJSON()));

		var me = this;
		this.elFields().sortable({
			stop: function() {
				$('tr', me.elFields()).each(function(index) {
					var name = $('td:eq(2)', this).text();
					//console.log(name + ' = ' + (index + 1));
					var field = me.model.get('fields').getByName(name);
					field.setProp('order', index + 1);
				});
				me.render();
			}
		});

		this.setFields();
		this.setRelations();

		this.aliasView = new Donkeylift.AliasView({
			el: this.$('#alias'),
			model: this.model,
		});
		this.aliasView.render();

		return this;
	},

	elFields: function() {
		return this.$('#fields tbody');
	},

	elRelations: function() {
		return this.$('#relations tbody');
	},

	evEditTableClick: function(ev) {				
		Donkeylift.app.tableEditView.model = this.model;
		Donkeylift.app.tableEditView.render();
	},

	evNewFieldClick: function() {
		console.log('TableView.evNewFieldClick');
		var field = Donkeylift.Field.create();
		//var field = this.model.get('fields').addNew();
		Donkeylift.app.fieldEditView.model = field;
		Donkeylift.app.fieldEditView.render();
	},

	removeField: function(field) {
		console.log('SchemaView.removeField ' + field.get('name'));
		this.fieldViews[field.cid].remove();
	},

	addField: function(field) {
		console.log('TableView.addField ' + field.get("name"));
		var view = new Donkeylift.FieldView({model: field});
		this.elFields().append(view.render().el);
		this.fieldViews[field.cid] = view;
	},

	setFields: function() {
		console.log('TableView.setFields ' + this.model.get('name'));
		_.each(this.fieldViews, function(view) {
			view.remove();
		});
		this.elFields().html('');

		_.each(this.model.get('fields').sortByOrder(), this.addField, this);
	},

	evNewRelationClick: function() {
		console.log('TableView.evNewRelationClick');
		var relation = Donkeylift.Relation.create(this.model);
		//console.log(relation.attributes);
		Donkeylift.app.relationEditView.model = relation;
		Donkeylift.app.relationEditView.render();
	},

	removeRelation: function(relation) {
		console.log('SchemaView.removeRelation ' + relation.cid);
		this.relationViews[relation.cid].remove();
	},

	addRelation: function(relation) {
		console.log('SchemaView.addRelation ' + relation.cid);
		var view = new Donkeylift.RelationView({model: relation});
		this.elRelations().append(view.render().el);
		this.relationViews[relation.cid] = view;
	},

	setRelations: function() {
		this.elRelations().html('');
		this.model.get('relations').each(this.addRelation, this);
	},


	evNewAliasClick: function() {
		console.log('TableView.evNewAliasClick');
		Donkeylift.app.aliasEditView.setModel(this.model, null);
		Donkeylift.app.aliasEditView.render();
	}


});


