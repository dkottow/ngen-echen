/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.TableView = Backbone.View.extend({

		tagName: 'div',
		className: 'panel panel-default',	

		events: {
			'click .edit-table': 'editTableClick',
		},

		initialize: function () {
			//console.log("TableView.init " + this.model.get('name'));
			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model.get('fields'), 'reset', this.setFields);
			this.listenTo(this.model.get('fields'), 'add', this.addField);
		},

		template: _.template($('#table-template').html()),

		render: function() {
			console.log("TableView.render " + this.model.get("name"));
			this.$el.html(this.template(this.model.toJSON()));
			this.setFields();
			return this;
		},

		editTableClick: function(ev) {				
			app.tableEditView.model = this.model;
			app.tableEditView.render();
		},

		addField: function(field) {
			//console.log('TableView.addField ' + field.get("name"));
			var view = new app.FieldView({model: field});
			var container = this.$('#fields' + this.model.get('name'));
			container.append(view.render().el);
		},

		setFields: function() {
			console.log('TableView.setFields ' + this.model.get('name'));
			var html = '<tr><th>Name</th><th>Type</th><th>Length</th><th></th></tr>';
			var container = this.$('#fields' + this.model.get('name'));
			container.html(html);
			this.model.get("fields").each(this.addField, this);
		}

	});

})(jQuery);


