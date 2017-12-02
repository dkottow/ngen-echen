/*global Donkeylift, Backbone, _ */

// Tables Collection
// ---------------

Donkeylift.Schemas = Backbone.Collection.extend({
	// Reference to this collection's model.
	model: Donkeylift.Schema,

	initialize : function(schemas) {
	},

});

Donkeylift.Schemas.Create = function(rows) {
    var schemas = _.map(rows, function(row) {
        return {
            account: row.Account,
            name: row.Database
        };
    });
    return new Donkeylift.Schemas(schemas);
}
