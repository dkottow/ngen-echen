/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.AliasView = Backbone.View.extend({

	//el: '#alias',

	events: {
		'click .edit-alias': 'evEditAliasClick',
		'click #add-alias': 'evNewAliasClick'
	},

	initialize: function () {
		console.log("AliasView.init " + this.model.get('row_alias'));
		this.listenTo(this.model, 'change:row_alias', this.render);
	},

	template: _.template($('#alias-field-template').html()),

	render: function() {
		console.log("AliasView.render");

		this.$el.find('tbody').empty();
//console.log(this.model.get('row_alias'));
		_.each(this.model.get('row_alias'), function(a) {
			this.$el.find('tbody').append(this.template({
				table: a.get('table').get('name'),
				field: a.get('field').get('name')
			}));
		}, this);
	},

	getEditor: function() {
		if ( ! this.aliasEditView) {
			this.aliasEditView = new Donkeylift.AliasEditView();
		}
		return this.aliasEditView;
	},

	evEditAliasClick: function(ev) {				
		console.log("AliasView.evEditAliasClick");
		var table = $(ev.target).parents('tr').find('td:eq(1)').text();
		var field = $(ev.target).parents('tr').find('td:eq(2)').text();

		var alias = _.find(this.model.get('row_alias'), function(a) {
			return a.get('table').get('name') == table 
				&& a.get('field').get('name') == field;
		});
		console.log("Edit alias " + table + "." + field + " = " + alias);


		this.getEditor().setModel(this.model, alias);
		this.getEditor().render();
	},

	evNewAliasClick: function() {
		console.log('AliasView.evNewAliasClick');

		this.getEditor().setModel(this.model, null);
		this.getEditor().render();

//		Donkeylift.app.aliasEditView.setModel(this.model, null);
//		Donkeylift.app.aliasEditView.render();
	}

});


