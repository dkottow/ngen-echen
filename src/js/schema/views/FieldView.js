/*global Donkeylift, Backbone, jQuery, _, $ */

Donkeylift.FieldView = Backbone.View.extend({

	tagName: 'tr',

	events: {
		'click .btn-field-edit': 'editFieldClick',
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
		
		if (this.model.get('name') == 'id') {
			attrs.pkfk = 'field-primary-key';
		} else if (this.model.get('fk')) {
			attrs.pkfk = 'field-foreign-key';
		}
		attrs.pkfk = attrs.pkfk || 'field-no-key';
		
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

});


