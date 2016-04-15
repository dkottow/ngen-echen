/*global Donkeylift, Backbone, jQuery, _ */

(function ($) {
	'use strict';

	Donkeylift.FilterItemsView = Backbone.View.extend({

		events: {
			'click #selectReset': 'evFilterItemsReset',
			'click .filter-option': 'evFilterOptionClick',
			'click .filter-selected': 'evFilterSelectedClick',
			'input #inputFilterItemsSearch': 'evInputFilterSearchChange',
		},

		initialize: function () {
			console.log("FilterItemsView.init " + this.model.get('table'));
		},

		template: _.template($('#filter-option-template').html()),

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
			var current = Donkeylift.app.filters.getFilter(
							this.model.get('table'),
							this.model.get('field'));

			if (current && current.get('op') == Donkeylift.Filter.OPS.IN) {
				//get values from filter
				var selected = current.get('value');		
//console.log(selected);
				_.each(selected, function(val) {
					this.$('#filterSelection').append(this.template({
						name: 'filter-selected',
						value: val
					}));
				}, this);
			}

			this.$('#filterOptions').empty();
			var fn = this.model.get('field').vname();
			var opts = this.model.get('field').get('options');		
//console.log(opts);
			_.each(opts, function(opt) {
				this.$('#filterOptions').append(this.template({
					name: 'filter-option',
					value: opt[fn]
				}));
			}, this);
		},

		setFilter: function() {
			var filterValues = this.$('#filterSelection').children()
				.map(function() {
					return $(this).attr('data-target');
			}).get();

			Donkeylift.app.filters.setFilter({
				table: this.model.get('table'),
				field: this.model.get('field'),
				op: Donkeylift.Filter.OPS.IN,
				value: filterValues
			});
			
			Donkeylift.app.router.navigate("reload-table", {trigger: true});			
			//window.location.hash = "#reload-table";
		},

		evFilterOptionClick: function(ev) {
			ev.stopPropagation();
			//console.log(ev.target);
			var opt = $(ev.target).attr('data-target');
			var attr = '[data-target="' + opt + '"]';

			//avoid duplicate items in filterSelection
			if (this.$('#filterSelection').has(attr).length == 0) {
				var item = this.template({
					name: 'filter-selected',
					value: opt
				});
				this.$('#filterSelection').append(item);
				this.setFilter();
			}
		},

		evFilterSelectedClick: function(ev) {
			ev.stopPropagation();
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
			this.$('#inputFilterItemsSearch').val('');
			this.loadRender();
		},

	});

})(jQuery);


