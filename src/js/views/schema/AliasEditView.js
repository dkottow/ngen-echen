/*global Donkeylift, Backbone, jQuery, _ */

(function ($) {
	'use strict';

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

			el.html('');

			var aliasTables = [ this.model ]
					.concat(Donkeylift.app.schema.get('tables').getAncestors(this.model));
						
			_.each(aliasTables, function(table) {
				el.append('<optgroup label="' + table.get('name') + '">');
				table.get('fields').each(function(field) {
					var qn = table.getFieldQN(field);
					el.append($('<option></option>')
						.attr('value', qn)
						.text(field.get('name')));
				}, this);
				el.append('</optgroup>');
			});
			
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
console.log(i);
			if (i >= 0) {
				this.model.get('row_alias').splice(i, 1, alias);
			} else {
				this.model.get('row_alias').push(alias);
			}

			this.model.trigger('change:row_alias'); //trigger change
//console.log(this.model.get('row_alias'));
		},

		evRemoveClick: function() {	
			var i = this.model.get('row_alias').indexOf(this.alias);
			if (i >= 0) {
				this.model.get('row_alias').splice(i, 1);
				this.model.trigger('change:row_alias'); //trigger change
			}
//console.log(this.model.get('row_alias'));
		},


	});

})(jQuery);


