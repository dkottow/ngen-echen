/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.FieldEditView = Backbone.View.extend({
		el:  '#modalEditField',

		events: {
			'click #modalFieldUpdate': 'updateClick',
			'click #modalFieldRemove': 'removeClick'
		},

		initialize: function() {
			console.log("FieldEditView.init");
		},

		render: function() {
			console.log("FieldEditView.render " + this.model.get('type'));
			$('#modalInputFieldName').val(this.model.get('name'));
			$('#modalInputFieldType').val(this.model.get('type'));
			$('#modalInputFieldLength').val(this.model.get('length'));
			$('#modalEditField').modal();
			return this;
		},

		updateClick: function() {
			this.model.set('name', $('#modalInputFieldName').val());
			this.model.set('type', $('#modalInputFieldType').val());
			this.model.set('length', $('#modalInputFieldLength').val());
		},

		removeClick: function() {	
			console.log("FieldEditView.removeClick " + this.model.collection);
			this.model.collection.remove(this.model);
		}

	});

})(jQuery);


