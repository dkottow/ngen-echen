/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.FilterView = Backbone.View.extend({

		events: {
			'click .filter-column': 'evFilterColumnClick',
			'click .nav-tabs a': 'evFilterTabClick',
			'click #rangeReset': 'evFilterRangeResetClick',
			'change #inputFilterMin': 'evFilterInputChange',
			'change #inputFilterMax': 'evFilterInputChange'
		},

		initialize: function () {
			console.log("FilterView.init " + this.model.get('table'));
		},

		show: function() {
			this.render();	
			var me = this;
			var field = this.model.get('field');
			if (field.get('fk') == 1) {
				this.model.loadSelect(function() {
					me.renderSelect();
				});
			} else {
				this.model.loadRange(function() {
					me.renderRange();
				});
			}
		},

		canSlide: function() {
			var field = this.model.get('field');
			return ( ! field.get('fk')) && 
					_.contains(['Integer', 'Decimal'], field.get('type'));
		},

		template: _.template($('#filter-template').html()),
		optionTemplate: _.template($('#filter-option-template').html()),

		render: function() {
			var field = this.model.get('field');

			console.log("FilterView.render " + field.get('name'));

			this.$el.html(this.template({
				name: field.get('name'),
			}));

			return this;
		},

		renderRange: function() {
			this.$('a[href=#filterRange]').tab('show');

			var stats = this.model.get('field').get('stats');

			var current = app.filters.getFilter(
							this.model.get('table'),
							this.model.get('field')
						);

			if (current) {
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

		renderSelect: function() {
			this.$('a[href=#filterSelect]').tab('show');

			this.$('#filterOptions').empty();
			var fn = this.model.get('field').vname();
			var opts = this.model.get('field').get('options');		
//console.log(opts);
			_.each(opts, function(opt) {
				this.$('#filterOptions').append(this.optionTemplate({
					name: opt[fn]
				}));
			}, this);
		},

		applyRangeFilter: function() {
			var minVal =  this.$("#inputFilterMin").val();
			var maxVal =  this.$("#inputFilterMax").val();
			var stats = this.model.get('field').get('stats');

			if (minVal > stats.min + 1E-6 || maxVal < stats.max + 1E-6) {
				//apply filter
				console.log("apply filter " + minVal + " - " + maxVal);
				app.filters.setFilter({
					table: this.model.get('table'),
					field: this.model.get('field'),
					op: app.Filter.OPS.BETWEEN,
					value: [minVal, maxVal]					 
				});
			} else {
				//clear filter
				console.log("clear filter");
				app.filters.clearFilter(this.model.get('table'), 
										this.model.get('field'));
			}
			app.table.reload();
		},

		evFilterInputChange: function(ev) {
			var val = ev.target.value;
			var stats = this.model.get('field').get('stats');
			var idx, minVal, maxVal;

			if (ev.target.id.endsWith('Min')) {
				minVal = stats.min;
				maxVal = this.$("#inputFilterMax").val();
				idx = 0;
			} else { 
				minVal = this.$("#inputFilterMin").val();
				maxVal = stats.max;
				idx = 1;
			}
			if (val < minVal) val = minVal;
			if (val > maxVal) val = maxVal;	
			//val = Math.min(Math.max(minVal, val), maxVal);
			$(ev.target).val(val);

			if (this.canSlide()) {
				this.$("#sliderRange").slider("values", idx, val);
			}
			
			this.applyRangeFilter();
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
					me.renderSelect();
				});
			} else if (ev.target.href.endsWith('filterRange')) {
				this.model.loadRange(function() {
					me.renderRange();
				});
			}
		},

		evFilterRangeResetClick: function() {
			app.filters.clearFilter(this.model.get('table'), 
									this.model.get('field'));
			this.renderRange();
			this.applyRangeFilter();
		}

	});

})(jQuery);


