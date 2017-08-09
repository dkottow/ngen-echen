/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.PreferencesView = Backbone.View.extend({
	el:  '#modalEditPrefs',

	events: {
		'click #modalEditPrefsApply': 'evPreferencesApplyClick',
	},

	initialize: function() {
		console.log("PreferencesView.init " + this.model);
	},

	render: function() {
		console.log("PreferencesView.render ");
        var tablePrefs = this.model.getPreferences('table');
        $('#modalInputSkipRowCounts').prop('checked', tablePrefs.skipRowCounts);
        $('#modalInputShowRowAlias').prop('checked', tablePrefs.resolveRefs);
		$('#modalEditPrefs').modal();
		return this;
	},

	evPreferencesApplyClick: function() {
        var tablePrefs = this.model.getPreferences('table');
        tablePrefs.skipRowCounts = $('#modalInputSkipRowCounts').is(':checked');
        tablePrefs.resolveRefs = $('#modalInputShowRowAlias').is(':checked');
        Donkeylift.app.table.setPreferences(tablePrefs);
        Donkeylift.app.resetTable();
	},

});


