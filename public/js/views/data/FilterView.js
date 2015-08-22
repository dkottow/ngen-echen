/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.FilterView = Backbone.View.extend({

		events: {
			'click .filter-column': 'evFilterColumnClick',
			'click .nav-tabs a': 'evFilterTabClick'
		},

		initialize: function () {
			console.log("FilterView.init " + this.model.get('table'));
			this.rangeView = new app.FilterRangeView({
										model: this.model,
										el: this.el
			});
			this.itemsView = new app.FilterItemsView({
										model: this.model,
										el: this.el
			});
		},

		template: _.template($('#filter-template').html()),

		render: function() {
			var me = this;
			var field = this.model.get('field');

			console.log("FilterView.render " + field.get('name'));

			this.$el.html(this.template({
				name: field.get('name'),
			}));

			if (field.get('type') == app.Field.TYPES.VARCHAR
			 || field.get('fk') == 1) {
				this.model.loadSelect(function() {
					me.itemsView.render();
				});
			} else {
				this.model.loadRange(function() {
					me.rangeView.render();
				});
			}

			return this;
		},

		evFilterColumnClick: function(ev) {
			ev.stopPropagation();
		},

		evFilterTabClick: function(ev) {
			ev.preventDefault();

	//console.log('evFilterTab ' + ev.target);
			var me = this;
			if (ev.target.href.endsWith('filterSelect')) {
				this.model.loadSelect(function() {
					me.itemsView.render();
				});
			} else if (ev.target.href.endsWith('filterRange')) {
				this.model.loadRange(function() {
					me.rangeView.render();
				});
			}
		}
	});

})(jQuery);


