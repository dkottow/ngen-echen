/*global Donkeylift, Backbone, jQuery, _ */

(function ($) {
	'use strict';

	Donkeylift.RelationView = Backbone.View.extend({

		tagName: 'tr',

		events: {
			'click .edit-relation': 'editRelationClick',
		},

		initialize: function () {
			//console.log("RelationView.init " + this.model.get('table'));
			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model, 'change:field', this.setAttributeListeners);
			this.listenTo(this.model, 'change:related', this.setAttributeListeners);
			this.setAttributeListeners();
		},

		setAttributeListeners: function () {
			if (this.model.get('field')) {
				this.listenTo(this.model.get('field'), 'change:name', this.render);
				this.listenTo(this.model.get('related'), 'change:name', this.render);
			}
		},

		template: _.template($('#relation-template').html()),

		render: function() {
			console.log("RelationView.render ");
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		},

		editRelationClick: function(ev) {				
			Donkeylift.app.relationEditView.model = this.model;
			Donkeylift.app.relationEditView.render();
		},


	});

})(jQuery);


