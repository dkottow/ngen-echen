/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.CSVDownloadView = Backbone.View.extend({
	el:  '#modalCSVDownload',

	events: {
		'click #modalCSVGenerate': 'evGenerateCSVClick',
	},

	initialize: function() {
		console.log("CSVDownloadView.init " + this.model.get('name'));
	},

	render: function() {
		console.log("CSVDownloadView.render ");

		var el = this.$('#modalCSVSelectFields');
		el.empty();

		Donkeylift.app.addAncestorFieldsToSelect(el);
		var fieldNames = this.model.get('fields').map(function(f) {
			return this.model.getFieldQN(f);
		}, this);
		$('#modalCSVSelectFields').val(fieldNames);

		$('#modalCSVSelectFields').selectpicker('refresh');
		$('#modalCSVDownloadLink').attr('href', '#');
		$('#modalCSVDownloadLink').addClass('disabled');
		$('#modalCSVDownloadLink').removeClass('btn-success');

		$('#modalCSVDownload').modal();
		return this;
	},

	evGenerateCSVClick: function() {
		var fieldNames = $('#modalCSVSelectFields').val();
        this.model.generateCSV(fieldNames, function(err, link) {
			if (link) {
				console.log('CSV link ' + link);
				$('#modalCSVDownloadLink').attr('href', link);
				$('#modalCSVDownloadLink').toggleClass('disabled btn-success');
			}
		});
	},

});


