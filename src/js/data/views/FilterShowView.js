/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.FilterShowView = Backbone.View.extend({
	el:  '#modalShowFilters',

	events: {
	},

	template: _.template($('#show-filter-item-template').html()),

	initialize: function() {
		console.log("FilterShowView.init");
	},

	render: function() {
		var el = this.$('#modalTableFilters > tbody');
		el.empty();
		//el.children('tr:not(:first)').remove();	
		this.collection.each(function(filter) {
			el.append(this.template(filter.toStrings()));
		}, this);			

		$('#modalInputDataUrl').val(Donkeylift.app.table.getAllRowsUrl());
		$('#modalShowFilters').on('shown.bs.modal', function() {
			$('#modalInputDataUrl').select();
		});

		$('#modalShowFilters').modal();

		return this;
	},


});


