/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.TableListView = Backbone.View.extend({

/*	
	id: "table-list",
	className: "list-group",
*/

	events: {
		//'click .table-item': 'evTableClick'
		'change #selectShowTables': 'evSelectShowTableChange'
	},

	initialize: function() {
		console.log("TableListView.init " + this.collection);
		this.listenTo(this.collection, 'update', this.render);
		this.listenTo(this.collection, 'change', this.render);
	},

	template: _.template($('#table-list-template').html()),
	itemTemplate: _.template($('#table-item-template').html()),

	render: function() {
		var me = this;
		console.log('TableListView.render ');			
		this.$el.html(this.template());
		this.collection.each(function(table) {
			var visible = table.getProp('visible') == true;
			if (visible) {
				var href = "#table" 
						+ "/" + table.get('name');
				this.$('#table-list-items').append(this.itemTemplate({
					name: table.get('name'),
					href: href
				}));
			}	
			$('#selectShowTables').append(
				$('<option></option>')
					.attr('value', table.get('name'))
					.text(table.get('name'))
					.prop('selected', visible)						
			);
		}, this);	
		$('#selectShowTables').selectpicker('refresh');

		$('#selectShowTables').on('hidden.bs.select', function (e) {
console.log('dada');
			me.render();
		});
		return this;
	},

	evSelectShowTableChange: function(ev) {
		$('#selectShowTables option').each(function() {
			var table = Donkeylift.app.schema.get('tables').getByName( $(this).val() );
			table.get('props').visible = $(this).prop('selected');	
		});
	}
});



