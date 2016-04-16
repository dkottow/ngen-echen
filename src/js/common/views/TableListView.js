/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.TableListView = Backbone.View.extend({

	
	id: "table-list",
	className: "list-group",

	events: {
		//'click .table-item': 'evTableClick'
	},

	initialize: function() {
		console.log("TableListView.init " + this.collection);
		this.listenTo(this.collection, 'update', this.render);
		this.listenTo(this.collection, 'change', this.render);
	},

	template: _.template($('#table-list-template').html()),
	itemTemplate: _.template($('#table-item-template').html()),

	render: function() {
		console.log('TableListView.render ');			
		this.$el.html(this.template());
		this.collection.each(function(table) {
			var href = "#table" 
					+ "/" + table.get('name');
			this.$el.append(this.itemTemplate({
				name: table.get('name'),
				href: href
			}));
		}, this);			
		return this;
	},
});



