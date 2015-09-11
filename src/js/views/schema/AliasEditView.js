/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.AliasEditView = Backbone.View.extend({
		el:  '#modalEditAlias',

		events: {
			'click #modalAliasUpdate': 'evUpdateClick',
			'click #modalAliasRemove': 'evRemoveClick',
		},

		initialize: function() {
			console.log("AliasEditView.init");
		},

		setModel: function(model, fieldQName) {
			this.model = model;
			this.fieldQName = fieldQName;
		},

		

		render: function() {
			console.log("AliasEditView.render ");

			var el = $('#modalInputAliasField')

			el.html('');

			var aliasTables = [ this.model ]
					.concat(app.schema.get('tables').getAncestors(this.model));
						
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
			
			el.val(this.fieldQName);

			$('#modalEditAlias').modal();
			return this;
		},

		evUpdateClick: function() {
			var newFieldQName = $('#modalInputAliasField').val();
//console.log(this.model.get('row_alias'));
			var i = this.model.get('row_alias').indexOf(this.fieldQName);
			if (i >= 0) {
				this.model.get('row_alias').splice(i, 1, newFieldQName);
			} else {
				this.model.get('row_alias').push(newFieldQName);
			}
			this.model.trigger('change:row_alias'); //trigger change
//console.log(this.model.get('row_alias'));
		},

		evRemoveClick: function() {	
			var i = this.model.get('row_alias').indexOf(this.fieldQName);
			if (i >= 0) {
				this.model.get('row_alias').splice(i, 1);
				this.model.trigger('change:row_alias'); //trigger change
			}
//console.log(this.model.get('row_alias'));
		},


	});

})(jQuery);


