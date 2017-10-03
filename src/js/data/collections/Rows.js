/*global Backbone, Donkeylift */

// Tables Collection
// ---------------
Donkeylift.Row = Backbone.Model.extend({ 
	
	initialize : function(attrs) {
		console.log("Row.initialize " + attrs.id);
	},
});		
	

Donkeylift.Rows = Backbone.Collection.extend({
	// Reference to this collection's model.
	model: Donkeylift.Row,

});

