/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.FilterRangeView = Backbone.View.extend({

		events: {
			//range filter evs
			'click #rangeReset': 'evFilterRangeResetClick',
			'change #inputFilterMin': 'evInputFilterChange',
			'change #inputFilterMax': 'evInputFilterChange',
		},

		initialize: function () {
			console.log("FilterRangeView.init " + this.model.get('table'));
		},

		canSlide: function() {
			var field = this.model.get('field');
			return ( ! field.get('fk')) && 
					_.contains(['Integer', 'Decimal'], field.get('type'));
		},

		loadRender: function() {
			var me = this;
			this.model.loadRange(function() {
				me.render();
			});
		},

		render: function() {
			this.$('a[href=#filterRange]').tab('show');

			var stats = this.model.get('field').get('stats');

			var current = app.filters.getFilter(
							this.model.get('table'),
							this.model.get('field'));

			if (current && current.get('op') == app.Filter.OPS.BETWEEN) {
				this.$("#inputFilterMin").val(current.get('value')[0]);
				this.$("#inputFilterMax").val(current.get('value')[1]);
			} else {
				this.$("#inputFilterMin").val(stats.min);
				this.$("#inputFilterMax").val(stats.max);
			}

			//console.log('el ' + this.$el.html());

			if (this.canSlide()) {
				this.$("#sliderRange").slider({
					range: true,
					min: stats.min,
					max: stats.max,
					values: [
						this.$("#inputFilterMin").val(),
						this.$("#inputFilterMax").val()
					],	
					slide: function(ev, ui) {
						if ($(ui.handle).index() == 1) {
							$("#inputFilterMin").val(ui.values[0]);
						} else {
							$("#inputFilterMax").val(ui.values[1]);
						}
				  	},
					stop: function(ev, ui) {
						if ($(ui.handle).index() == 1) {
							$("#inputFilterMin").change();
						} else {
							$("#inputFilterMax").change();
						}
					}
				});
			}

		},

		sanitizeInputFilterValue: function(el, bounds) {

			if (el.id.endsWith('Min')) {
				bounds = [bounds[0], this.$("#inputFilterMax").val()];
			} else {
				bounds = [this.$("#inputFilterMin").val(), bounds[1]];
			}

			var val = this.model.get('field').parse(el.value);
			if (val < bounds[0]) val = bounds[0];
			if (val > bounds[1]) val = bounds[1];
			$(el).val(val);

			if (this.canSlide()) {
				var idx = el.id.endsWith('Min') ? 0 : 1;	
				this.$("#sliderRange").slider("values", idx, val);
			}
		},

		evInputFilterChange: function(ev) {
			var stats = this.model.get('field').get('stats');

			this.sanitizeInputFilterValue(ev.target, [stats.min, stats.max]);

			var filterValues = [this.$("#inputFilterMin").val(),
								this.$("#inputFilterMax").val()];

			if (filterValues[0] != stats.min || filterValues[1] != stats.max) {
				app.filters.setFilter({
					table: this.model.get('table'),
					field: this.model.get('field'),
					op: app.Filter.OPS.BETWEEN,
					value: filterValues
				});
			} else {
				app.filters.clearFilter(this.model.get('table'), 
										this.model.get('field'));
			}
			app.table.reload();
		},

		evFilterRangeResetClick: function() {
			app.filters.clearFilter(this.model.get('table'), 
									this.model.get('field'));
			app.table.reload();
			this.render();
		},
	});

})(jQuery);


