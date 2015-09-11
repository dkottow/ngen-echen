/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.AliasView = Backbone.View.extend({

		//el: '#alias',

		events: {
			'click .edit-alias': 'evEditAliasClick',
		},

		initialize: function () {
			console.log("AliasView.init " + this.model.get('row_alias'));
			this.listenTo(this.model, 'change:alias', this.render);
		},

		template: _.template($('#alias-field-template').html()),

		render: function() {
			console.log("AliasView.render");

			this.$el.find('tbody').empty();
			_.each(this.model.get('row_alias'), function(fieldQName) {
				console.log('Alias adding ' + fieldQName);
				var result = app.schema.getFieldFromQN(fieldQName);
console.log(result);
				this.$el.find('tbody').append(this.template({
					table: result.table.get('name'),
					field: result.field.get('name')
				}));
			}, this);
		},

		evEditAliasClick: function(ev) {				
			console.log("evEditAliasView.click");
			var fieldQName = $(ev.target).parents('tr').find('td:eq(0)').text()
				+ '.' + $(ev.target).parents('tr').find('td:eq(1)').text();
			//console.log(fieldQName);
			app.aliasEditView.setModel(this.model, fieldQName);
			app.aliasEditView.render();
		},

	});

})(jQuery);


