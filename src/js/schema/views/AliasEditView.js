/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.AliasEditView = Backbone.View.extend({
	el:  '#modalEditAlias',

	events: {
		'click #modalAliasUpdate': 'evUpdateClick',
		'click #modalAliasRemove': 'evRemoveClick',
	},

	initialize: function() {
		console.log("AliasEditView.init");
	},

	setModel: function(model, alias) {
		this.model = model;
		this.alias = alias;
	},

	render: function() {
		console.log("AliasEditView.render ");

		var el = this.$('#modalInputAliasField');
		el.empty();

		Donkeylift.app.addAncestorFieldsToSelect(el);

		if (this.alias) {
			el.val(this.alias.toString());
		}

		$('#modalEditAlias').modal();
		return this;
	},

	evUpdateClick: function() {
		var newFieldQName = $('#modalInputAliasField').val();
		//console.log(this.model.get('row_alias'));
		var alias = Donkeylift.Alias.parse(
						newFieldQName.split('.')[0],
						newFieldQName.split('.')[1]
		);	

		var i = this.model.get('row_alias').indexOf(this.alias);
		if (i >= 0) {
			this.model.get('row_alias').splice(i, 1, alias);
		} else {
			this.model.get('row_alias').push(alias);
		}

		this.model.trigger('change:row_alias'); //trigger change
		Donkeylift.app.updateSchema();
		//console.log(this.model.get('row_alias'));
	},

	evRemoveClick: function() {	
		var i = this.model.get('row_alias').indexOf(this.alias);
		if (i >= 0) {
			this.model.get('row_alias').splice(i, 1);
			this.model.trigger('change:row_alias'); //trigger change
		}
		Donkeylift.app.updateSchema();
		//console.log(this.model.get('row_alias'));
	},


});


