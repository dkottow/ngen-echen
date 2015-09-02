/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.FilterItemsView = Backbone.View.extend({

		events: {
			'click #selectReset': 'evFilterItemsReset',
			'click .filter-option': 'evFilterOptionClick',
			'click .filter-selected': 'evFilterSelectedClick',
			'input #inputFilterItemsSearch': 'evInputFilterSearchChange',

		},

		initialize: function () {
			console.log("FilterItemsView.init " + this.model.get('table'));
		},

		optionTemplate: _.template($('#filter-option-template').html()),
		selectedTemplate: _.template($('#filter-selected-template').html()),

		loadRender: function() {
			var me = this;
			var s = this.$('#inputFilterItemsSearch').val();
			this.model.loadSelect(s, function() {
				me.render();
			});
		},

		render: function() {
			this.$('a[href=#filterSelect]').tab('show');

			this.$('#filterSelection').empty();
			var current = app.filters.getFilter(
							this.model.get('table'),
							this.model.get('field'));

			if (current && current.get('op') == app.Filter.OPS.IN) {
				//get values from filter
				var selected = current.get('value');		
console.log(selected);
				_.each(selected, function(val) {
					this.$('#filterSelection').append(this.selectedTemplate({
						value: val
					}));
				}, this);
			}

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

		setFilter: function() {
			var filterValues = this.$('#filterSelection').children()
				.map(function() {
				return $(this).attr('data-target');

			}).get();

			app.filters.setFilter({
				table: this.model.get('table'),
				field: this.model.get('field'),
				op: app.Filter.OPS.IN,
				value: filterValues
			});
			app.table.reload();
		},

		evFilterOptionClick: function(ev) {
			//console.log(ev.target);
			var opt = $(ev.target).attr('data-target');
			var attr = 'a[data-target="' + opt + '"]';

			if (this.$('#filterSelection').has(attr).length == 0) {

				var item = this.selectedTemplate({value: opt});
				this.$('#filterSelection').append(item);
				this.setFilter();
			}
		},

		evFilterSelectedClick: function(ev) {
			//console.log(ev.target);
			$(ev.target).remove();
			this.setFilter();
		},

		evInputFilterSearchChange: function(ev) {
			this.loadRender();
		},


		evFilterItemsReset: function() {
			this.$('#filterSelection').empty();
			this.setFilter(); //actually clears filter

/*
			app.filters.clearFilter(this.model.get('table'), 
									this.model.get('field'));
			app.table.reload();
*/
			this.$('#inputFilterItemsSearch').val('');
			this.loadRender();
		},

	});

})(jQuery);


