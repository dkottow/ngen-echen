/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.FilterItemsView = Backbone.View.extend({

		events: {
			'click #selectReset': 'evFilterItemsReset',
			'click .filter-option': 'evFilterOptionClick',
			'click .filter-selected': 'evFilterSelectedClick'
		},

		initialize: function () {
			console.log("FilterItemsView.init " + this.model.get('table'));
		},

		optionTemplate: _.template($('#filter-option-template').html()),
		selectedTemplate: _.template($('#filter-selected-template').html()),

		render: function() {
			this.$('a[href=#filterSelect]').tab('show');

			this.$('#filterOptions').empty();
			var fn = this.model.get('field').vname();
			var opts = this.model.get('field').get('options');		
//console.log(opts);
			_.each(opts, function(opt) {
				this.$('#filterOptions').append(this.optionTemplate({
					value: opt[fn]
				}));
			}, this);
		},

		evFilterOptionClick: function(ev) {
			console.log(ev.target);
			var opt = $(ev.target).attr('data-target');
			var attr = 'a[data-target="' + opt + '"]';
			if (this.$('#filterSelection').has(attr).length == 0) {
				var item = this.selectedTemplate({value: opt});
				this.$('#filterSelection').append(item);
			}
		},

		evFilterSelectedClick: function(ev) {
			console.log(ev.target);
			$(ev.target).remove();
		},

		evFilterItemsReset: function() {
			this.$('#filterSelection').empty();
		},

	});

})(jQuery);


