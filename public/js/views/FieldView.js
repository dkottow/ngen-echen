/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.FieldView = Backbone.View.extend({

		tagName: 'tr',

		initialize: function () {
			//console.log("TableView.init " + this.model.get('name'));
			this.listenTo(this.model, 'change', this.render);
		},

		template: _.template($('#field-template').html()),

		render: function() {
			//console.log("FieldView.render " + this.model.get("name"));
			this.$el.html(this.template(this.model.toJSON()));
			return this;
		},

	});

})(jQuery);


