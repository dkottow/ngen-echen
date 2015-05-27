/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.RelationEditView = Backbone.View.extend({
		el:  '#modalEditRelation',

		events: {
			'click #modalRelationUpdate': 'updateClick',
			'click #modalRelationRemove': 'removeClick'
		},

		initialize: function() {
			console.log("RelationEditView.init");
		},

		render: function() {
			console.log("RelationEditView.render " + this.model);

			var el = $('#modalInputRelationTable')
			el.html('');
			app.schema.get('tables').each(function(table) {
				el.append($('<option></option>')
					.attr('value', table.get('name'))
					.text(table.get('name')));
			});
			el.val(this.model.get('related'));

			el = $('#modalInputRelationField')
			el.html('');
			var table = app.schema.get('tables').get(this.model.get('table'));
			table.get('fields').each(function(field) {
				if (field.get('type') == 'Integer' && field.get('name') != 'id') {
					el.append($('<option></option>')
						.attr('value', field.get('name'))
						.text(field.get('name')));
				}
			});
			el.val(this.model.get('field'));

			$('#modalInputRelationType').val(this.model.get('type'));

			$('#modalEditRelation').modal();
			return this;
		},

		updateClick: function() {
			this.model.set('related', $('#modalInputRelationTable').val());	
			this.model.set('type', $('#modalInputRelationType').val());	
			this.model.set('field', $('#modalInputRelationField').val());	
		},

		removeClick: function() {	
			console.log("RelationEditView.removeClick " + this.model.collection);
			this.model.collection.remove(this.model);
		}

	});

})(jQuery);


