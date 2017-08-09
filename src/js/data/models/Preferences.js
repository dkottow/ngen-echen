/*global Donkeylift, Backbone, _ */

Donkeylift.Preferences = Backbone.Model.extend({ 

	initialize : function(attrs) {
		console.log("Preferences.initialize " + attrs.table.get('name'));
    },

    getPreferences : function(scope) {
        if (scope == 'table') {
            return this.get('table').getPreferences();
        }
    }
});		
