/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.SchemaView = Backbone.View.extend({
		el:  '#content',

		events: {
			//'keypress #new-todo': 'createOnEnter',
			'click #add-table': 'evNewTable',
			'click #save-schema': 'evSaveSchema'
		},

		initialize: function() {
			console.log("SchemaView.init");

			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model, 'change:tables', this.setAttributeListeners);

			this.tableViews = {};
		},

		setAttributeListeners: function() {
			console.log('SchemaView.setTableListeners');			
			this.listenTo(this.model.get('tables'), 'reset', this.setTables);
			this.listenTo(this.model.get('tables'), 'add', this.addTable);
			this.listenTo(this.model.get('tables'), 'remove', this.removeTable);
		},

		render: function() {
			console.log('SchemaView.render ' + this.model.attributes);			
			this.setTables();
			return this;
		},

		evSaveSchema: function() {
			console.log(JSON.stringify(this.model.toServerJSON()));
		},

		evNewTable: function() {
			console.log('SchemaView.evNewTable');
			var table = this.model.get('tables').addNew();
			app.tableEditView.model = table;
			app.tableEditView.render();
		},

		removeTable: function(table) {
			console.log('SchemaView.removeTable ' + table.get('name'));
			this.tableViews[table.cid].remove();
		},

		addTable: function(table) {
			console.log('SchemaView.addTable ' + table.get("name"));
			var view = new app.TableView({model: table});
			$('#tables-accord').append(view.render().el);
			this.tableViews[table.cid] = view;
		},

		setTables: function() {
			//console.log('SchemaView.setTables');
			$('#tables-accord').html('');
			this.model.get('tables').each(this.addTable, this);
		}

	});

})(jQuery);


