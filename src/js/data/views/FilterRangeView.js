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

	render: function() {
		this.$('a[href=#filterRange]').tab('show');

		this.renderMinMaxInputs();
		this.renderSlider();
		this.renderDateTimePicker();

	},

	evInputFilterChange: function(ev) {
		var stats = this.model.get('field').get('stats');

		this.sanitizeInputFilterValue(ev.target, [stats.min, stats.max]);

		var filterValues = [$("#inputFilterMin").val(),
							$("#inputFilterMax").val() ];

		if (this.canSlide()) {
			filterValues[0] = parseFloat(filterValues[0]);
			filterValues[1] = parseFloat(filterValues[1]);
			$('#inputSliderRange').slider('setValue', filterValues, false, false);
		}

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
	
	renderMinMaxInputs: function() {
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
	},

	renderSlider: function() {

		if (this.canSlide()) {

			$('#sliderRange').show();
			$('#inputSliderRange').css('width', '100%');

			var stats = this.model.get('field').get('stats');
			var sliderValues = [ 
				parseFloat(this.$("#inputFilterMin").val()),
				parseFloat(this.$("#inputFilterMax").val())
			];

			if ($('#inputSliderRange').attr('data-slider-value').length == 0) {
				//instantiate slider

				if (this.model.get('field').get('type') == Donkeylift.Field.TYPES.integer) {
					$('#inputSliderRange').attr('data-slider-step', 1);
				} else {
					$('#inputSliderRange').attr('data-slider-step', Math.max((stats.max - stats.min) / 100, 1e-6));
				}
	
				$('#inputSliderRange').attr('data-slider-value', '[' + sliderValues.toString() + ']');
				$('#inputSliderRange').attr('data-slider-min', stats.min);
				$('#inputSliderRange').attr('data-slider-max', stats.max);
				
				$('#inputSliderRange').slider({});
				
				$('#inputSliderRange').on("slide", function(slideEvt) {
					$("#inputFilterMin").val(slideEvt.value[0]);
					$("#inputFilterMax").val(slideEvt.value[1]);
				});			

				$('#inputSliderRange').on('slideStop', function() {
					$("#inputFilterMin").change();
					$("#inputFilterMax").change();
				});
			} else {
				//just set the value
				$('#inputSliderRange').slider('setValue', sliderValues);
				//$('#inputSliderRange').attr('data-slider-value', sliderValues);
			}			
		} else {
			$('#sliderRange').hide();
		}
		
	},

	renderDateTimePicker: function() {
		var me = this;
		var dateTypes = [
			Donkeylift.Field.TYPES.date,
			Donkeylift.Field.TYPES.timestamp
		];
		if (_.contains(dateTypes, this.model.get('field').get('type'))) {

			var opts = {
				debug: false,
				format: 'YYYY-MM-DD',
				widgetPositioning: {
					horizontal: 'auto',
					vertical: 'bottom'
				}
			}

			if (this.model.get('field').get('type') == Donkeylift.Field.TYPES.timestamp) {
				opts.format = 'YYYY-MM-DDTHH:mm:ss.SSS';
			}

			var evChangeDate = function(ev) {

				/* we need some massaging on date event handling:
				 *    1) only trigger filter event if date changes.
				 *    2) if input value is of type timestamp, 
				 * 		 we force it to be UTC by making sure the datetime string ends with Z.
				 */

				if (ev.oldDate) {
					$("#inputFilterMin").val(
						Donkeylift.Field.forceUTCDateString($("#inputFilterMin").val())
					);
					$("#inputFilterMax").val(
						Donkeylift.Field.forceUTCDateString($("#inputFilterMax").val())
					);
					me.evInputFilterChange(ev);
				}
			}

			$('#inputFilterMin').on('dp.change', evChangeDate);
			$('#inputFilterMax').on('dp.change', evChangeDate);

			$("#inputFilterMin").datetimepicker(opts);
			$("#inputFilterMax").datetimepicker(opts);
		}

/* bootstrap-datepicker
		var dateTypes = [
			Donkeylift.Field.TYPES.date
		];
		if (_.contains(dateTypes, this.model.get('field').get('type'))) {

			//$("#inputFilterMin").attr('type', 'date');
			//$("#inputFilterMax").attr('type', 'date');

			var opts = {
				format: 'yyyy-mm-dd',
				orientation: 'bottom'
			}

			$("#inputFilterMin").datepicker(opts);
			$("#inputFilterMax").datepicker(opts);
		}
*/		
	},
	
	sanitizeInputFilterValue: function(el, bounds) {

		if (/Min$/.test(el.id)) {
			bounds = [bounds[0], parseFloat($("#inputFilterMax").val()) ];
		} else {
			bounds = [ parseFloat($("#inputFilterMin").val()), bounds[1]];
		}

		var val = this.model.get('field').parse(el.value);
		if (val < bounds[0]) val = bounds[0];
		if (val > bounds[1]) val = bounds[1];
		$(el).val(val);

	},

	canSlide: function() {
		if (this.model.get('field').get('fk')) return false;

		return _.contains([
			Donkeylift.Field.TYPES.integer,
			Donkeylift.Field.TYPES.decimal,
			Donkeylift.Field.TYPES.float
		], Donkeylift.Field.typeName(
			this.model.get('field').get('type')			
		));
	},

	loadRender: function() {
		var me = this;
		this.model.loadRange(function() {
			me.render();
		});
	},
	
});


