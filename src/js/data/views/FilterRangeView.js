/*global Donkeylift, Backbone, jQuery, _, $, noUiSlider */

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
		var slideTypes = [Donkeylift.Field.TYPES.integer,
							Donkeylift.Field.TYPES.decimal];
		return ( ! field.get('fk')) &&
				_.contains(slideTypes, Donkeylift.Field.typeName(field.get('type')));
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

			var step = undefined;
			if (this.model.get('field').get('type') == Donkeylift.Field.TYPES.integer) {
				step = 1;
			}

			var slider = this.$("#sliderRange")[0]; 
			if ( ! slider.noUiSlider) {
				noUiSlider.create(slider, {
						start: [ this.$("#inputFilterMin").val(),
								 this.$("#inputFilterMax").val() 
						]
						, range: {
							min: stats.min,
							max: stats.max
						}
						, connect: true
						, step: step
					}
				);
				
				slider.noUiSlider.on('slide', function() {
					var v = slider.noUiSlider.get();
					$("#inputFilterMin").val(v[0]);
					$("#inputFilterMax").val(v[1]);
				});
	
				slider.noUiSlider.on('change', function() {
					$("#inputFilterMin").change();
					$("#inputFilterMax").change();
				});
			} else {
				slider.noUiSlider.set([ 
					this.$("#inputFilterMin").val(),
					this.$("#inputFilterMax").val() 
				]);
				
			}			
		}

		if (this.model.get('field').get('type') 
			== Donkeylift.Field.TYPES.date) {

			$("#inputFilterMin").attr('type', 'date');
			$("#inputFilterMax").attr('type', 'date');
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
			if (/Min$/.test(el.id)) {
				this.$("#sliderRange")[0].noUiSlider.set([val, null]);
			} else {
				this.$("#sliderRange")[0].noUiSlider.set([null, val]);
			}
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


