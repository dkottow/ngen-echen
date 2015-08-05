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
			//console.log('el ' + this.$el.html());
			this.$("#inputFilterMin").val(stats.min);
			this.$("#inputFilterMax").val(stats.max);

			if (this.canSlide()) {
				this.$("#sliderRange").slider({
				  range: true,
				  min: stats.min,
				  max: stats.max,
				  values: [stats.min, stats.max],	
				  slide: function( event, ui ) {
					$("#inputFilterMin").val(ui.values[0]);
					$("#inputFilterMax").val(ui.values[1]);
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
		}

	});

})(jQuery);


