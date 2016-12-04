/*global Donkeylift, Backbone, jQuery, _, $ */

Donkeylift.FieldView = Backbone.View.extend({

	tagName: 'tr',

	events: {
		'click .btn-field-edit': 'editFieldClick',
		'click .btn-field-up': 'moveUpFieldClick',
		'click .btn-field-down': 'moveDownFieldClick',
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
		var editor = Donkeylift.app.getFieldEditor();
		editor.model = this.model;
		editor.render();
	},

	getFieldFromRow: function(tr) {
		var name = tr.find('td:eq(2)').text();
		return Donkeylift.app.table.get('fields').getByName(name);
	},

	swapFieldsOrder: function(f1, f2) {
		var o1 = f1.getProp('order');
		f1.setProp('order', f2.getProp('order'));
		f2.setProp('order', o1);
	},

    moveUpFieldClick: function(ev) {
        var row = $(ev.target).closest("tr");
		var prevField = this.getFieldFromRow(row.prev());
		this.swapFieldsOrder(this.model, prevField);
		Donkeylift.app.tableView.render();
		Donkeylift.app.schema.update();
    },
    
    moveDownFieldClick: function(ev) {
        var row = $(ev.target).closest("tr");
		var nextField = this.getFieldFromRow(row.next());
		this.swapFieldsOrder(this.model, nextField);
		Donkeylift.app.tableView.render();
		Donkeylift.app.schema.update();
    },

});


