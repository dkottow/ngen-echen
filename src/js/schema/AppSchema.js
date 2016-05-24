/*global Backbone, Donkeylift, $ */

AppSchema.prototype = new Donkeylift.AppBase();
AppSchema.prototype.constructor=AppSchema; 

function AppSchema(opts) {
	
	this.schemaEditView = new Donkeylift.SchemaEditView();
	this.tableEditView = new Donkeylift.TableEditView();
	this.fieldEditView = new Donkeylift.FieldEditView();
	this.relationEditView = new Donkeylift.RelationEditView();
	this.aliasEditView = new Donkeylift.AliasEditView();

	this.menuView = new Donkeylift.MenuSchemaView();
	this.router = new Donkeylift.RouterSchema();
	
}

AppSchema.prototype.start = function() {
	Donkeylift.AppBase.prototype.start.call(this);
	$('#nav-schema').closest("li").addClass("active");
}

AppSchema.prototype.createTableView = function(table, params) {
	return new Donkeylift.SchemaTableView({model: table});
}

AppSchema.prototype.createSchema = function(name) {
	return new Donkeylift.Schema({name : name, id : name});
}

Donkeylift.AppSchema = AppSchema;

