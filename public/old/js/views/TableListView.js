/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.TableListView = Backbone.View.extend({

		tagName: 'ul',
		className: 'nav navbar-nav side-nav',

		events: {
			'click .table-item': 'evTableClick'
		},

		initialize: function() {
			console.log("TableListView.init " + this.collection);
			this.listenTo(this.collection, 'update', this.render);
			this.listenTo(this.collection, 'change', this.render);
		},

		template: _.template($('#table-list-template').html()),

		render: function() {
			console.log('TableListView.render ');			
			this.$el.empty();
			this.collection.each(function(table) {
				this.$el.append(this.template({name: table.get('name')}));
			}, this);			
			return this;
		},

		setTable: function(table) {
			app.table = table;
			if (app.tableView) app.tableView.remove();
			app.tableView = new app.TableView({model: app.table});
			$('#content').append(app.tableView.render().el);			
		},
	
		evTableClick: function(ev) {
			var name = $(ev.target).attr('data-target');
			var table = this.collection.find(function(c) { 
				return c.get('name') == name; 
			});

			app.setTable(table);
		}

	});

})(jQuery);

