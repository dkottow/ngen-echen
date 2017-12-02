/*global Donkeylift, Backbone, jQuery, _, $ */

Donkeylift.SchemaListView = Backbone.View.extend({
/*
	id:  'schema-list',
	tagName: 'ul',
	className: 'dropdown-menu',
*/
	events: {
		'change #selectDatabase': 'evSchemaChange',
	},

	initialize: function() {
	},

	template: _.template($('#schema-list-template').html()),

	render: function() {

		this.$el.html(this.template());
		this.renderSchemaList();
		this.renderCurrentSchemaName();

		return this;
	},

	renderSchemaList: function() {
		var accounts = this.collection.groupBy(function(schema) {
			return schema.get('account');
		});
		_.each(accounts, function(schemas, account) {
			$('#selectDatabase').append(
				$('<optgroup></optgroup>')
					.attr('label', account)
			);
			_.each(schemas, function(schema) {
				$('#selectDatabase optgroup').last().append(
					$('<option></option>')
						.attr('value', schema.fullName())
						.text(schema.get('name'))
				);
				console.log(schema.fullName());
			});	
		});
		$('#selectDatabase').selectpicker('refresh');
	},

	renderCurrentSchemaName: function() {
/*
		var $span = this.$el.closest('li').find('a:first span');
		if (Donkeylift.app.schema) {
			$span.html(' DB ' + Donkeylift.app.schema.get('name'));
		} else {
			$span.html(' Choose DB ');
		}		
*/
	},

	evSchemaChange: function(ev) {
		console.log('SchemaListView.evSchemaChange ' + $(ev.target).val());
		var parts = $(ev.target).val().split('$');
		Donkeylift.app.account.set('name', parts[0]);
		Donkeylift.app.setSchema(parts[1], { reload: true });			
	},

});


