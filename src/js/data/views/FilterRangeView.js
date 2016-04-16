/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.FilterRangeView = Backbone.View.extend({

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
		var slideTypes = [Donkeylift.Field.TYPES.INTEGER,
							Donkeylift.Field.TYPES.NUMERIC];
		return ( ! field.get('fk')) &&
				_.contains(slideTypes, field.get('type'));
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

		var current = Donkeylift.app.filters.getFilter(
						this.model.get('table'),
						this.model.get('field'));

		if (current && current.get('op') == Donkeylift.Filter.OPS.BETWEEN) {
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
		if (this.model.get('field').get('type') 
			== Donkeylift.Field.TYPES['DATE']) {

			var opts = { minDate: Donkeylift.Field.toDate(stats.min), 
						 maxDate: Donkeylift.Field.toDate(stats.max),
						dateFormat: 'yy-mm-dd' };
			var minVal = Donkeylift.Field.toDate($("#inputFilterMin").val());
			var maxVal = Donkeylift.Field.toDate($("#inputFilterMax").val());
			$("#inputFilterMin").datepicker(opts);
			$("#inputFilterMin").datepicker("setDate", minVal);
			$("#inputFilterMax").datepicker(opts);
			$("#inputFilterMax").datepicker("setDate", maxVal);

			$('#ui-datepicker-div').click(function(e) {
				e.stopPropagation();
			});
		}

	},

	sanitizeInputFilterValue: function(el, bounds) {

		if (/Min$/.test(el.id)) {
			bounds = [bounds[0], this.$("#inputFilterMax").val()];
		} else {
			bounds = [this.$("#inputFilterMin").val(), bounds[1]];
		}

		var val = this.model.get('field').parse(el.value);
		if (val < bounds[0]) val = bounds[0];
		if (val > bounds[1]) val = bounds[1];
		$(el).val(val);

		if (this.canSlide()) {
			var idx = /Min$/.test(el.id) ? 0 : 1;	
			this.$("#sliderRange").slider("values", idx, val);
		}
	},

	evInputFilterChange: function(ev) {
		var stats = this.model.get('field').get('stats');

		this.sanitizeInputFilterValue(ev.target, [stats.min, stats.max]);

		var filterValues = [this.$("#inputFilterMin").val(),
							this.$("#inputFilterMax").val()];

		if (filterValues[0] != stats.min || filterValues[1] != stats.max) {
			Donkeylift.app.filters.setFilter({
				table: this.model.get('table'),
				field: this.model.get('field'),
				op: Donkeylift.Filter.OPS.BETWEEN,
				value: filterValues
			});
		} else {
			Donkeylift.app.filters.clearFilter(this.model.get('table'), 
									this.model.get('field'));
		}

		Donkeylift.app.router.navigate("reload-table", {trigger: true});			
		//window.location.hash = "#reload-table";
	},

	evFilterRangeResetClick: function() {
		Donkeylift.app.filters.clearFilter(this.model.get('table'), 
								this.model.get('field'));

		Donkeylift.app.router.navigate("reload-table", {trigger: true});			
		//window.location.hash = "#reload-table";
		this.render();
	},
});


