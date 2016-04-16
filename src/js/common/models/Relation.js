/*global Donkeylift, Backbone */

Donkeylift.Relation = Backbone.Model.extend({ 
	initialize: function(relation) {
		this.set('type', Donkeylift.Relation.Type(relation));
	}

});

Donkeylift.Relation.create = function(table) {
	return new Donkeylift.Relation({
		table: table,
		related: null, 
		field: null, 
	});	
}

Donkeylift.Relation.Type = function(relation) {
  	if (relation.field && relation.field.name == 'id') return 'one-to-one';
	else return 'many-to-one';
}
