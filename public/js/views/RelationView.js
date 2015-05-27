/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.RelationView = Backbone.View.extend({

		tagName: 'tr',

		events: {
			'click .edit-relation': 'editRelationClick',
		},

		initialize: function () {
			//console.log("RelationView.init " + this.model.get('table'));
			this.listenTo(this.model, 'change', this.render);
		},

		template: _.template($('#relation-template').html()),

		render: function() {
			console.log("RelationView.render " + this.model);
			console.log("RelationView.render " + this.model.attributes);
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		},

		editRelationClick: function(ev) {				
			app.relationEditView.model = this.model;
			app.relationEditView.render();
		},


	});

})(jQuery);


