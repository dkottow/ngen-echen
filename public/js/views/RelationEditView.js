/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.RelationEditView = Backbone.View.extend({
		el:  '#modalEditRelation',

		events: {
			'click #modalRelationUpdate': 'updateClick',
			'click #modalRelationRemove': 'removeClick',
			'change #modalInputRelationType': 'typeChange'
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
			
			if (this.model.get('related'))
				el.val(this.model.get('related').get('name'));

			el = $('#modalInputRelationField')
			el.html('');
			this.model.get('table').get('fields').each(function(field) {
				if (field.get('type') == 'Integer' && field.get('name') != 'id') {
					el.append($('<option></option>')
						.attr('value', field.get('name'))
						.text(field.get('name')));
				}
			});

			if (this.model.get('field'))
				el.val(this.model.get('field').get('name'));

			$('#modalInputRelationType').val(this.model.get('type'));

			$('#modalEditRelation').modal();
			return this;
		},

		updateClick: function() {
			var newTable = $('#modalInputRelationTable').val();	
			var newType = $('#modalInputRelationType').val();
			var newField = $('#modalInputRelationField').val();
			if (newType == 'one-to-one') newField = 'id';
			this.model.set('type', newType);	

			var fields = this.model.get('table').get('fields');
			var tables = app.schema.get('tables');
			//console.log('new field ' + fields.getByName(newField).get('name'));
			//console.log('new related table ' + tables.getByName(newTable).get('name'));
			
			this.model.set({
				'field': fields.getByName(newField),
				'related': tables.getByName(newTable)
			});	
		},

		removeClick: function() {	
			console.log("RelationEditView.removeClick " + this.model.collection);
			this.model.collection.remove(this.model);
		},

		typeChange: function() {
			var el = $('#modalInputRelationField');	
			if ($('#modalInputRelationType').val() == 'one-to-one') {
				el.val('');
				el.prop('disabled', true);
			} else {
				el.prop('disabled', false);
			}
		}

	});

})(jQuery);


