/*global Backbone, Donkeylift, $ */

function AppSchema(opts) {
	
	AppBase.call(this, opts);

	this.menuView = new Donkeylift.MenuSchemaView();
	this.router = new Donkeylift.RouterSchema();
}

AppSchema.prototype = Object.create(AppBase.prototype);
AppSchema.prototype.constructor=AppSchema; 


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

AppSchema.prototype.getSchemaEditor = function() {
	if ( ! this.schemaEditView) {
		this.schemaEditView = new Donkeylift.SchemaEditView();
	}
	return this.schemaEditView;
}

AppSchema.prototype.getTableEditor = function() {
	if ( ! this.tableEditView) {
		this.tableEditView = new Donkeylift.TableEditView();
	}
	return this.tableEditView;
}

AppSchema.prototype.getFieldEditor = function() {
	if ( ! this.fieldEditView) {
		this.fieldEditView = new Donkeylift.FieldEditView();
	}
	return this.fieldEditView;
}

AppSchema.prototype.getRelationEditor = function() {
	if ( ! this.relationEditView) {
		this.relationEditView = new Donkeylift.RelationEditView();
	}
	this.relationEditView.schema = this.schema;
	this.relationEditView.table = this.table;
	return this.relationEditView;
}

AppSchema.prototype.getAliasEditor = function() {
	if ( ! this.aliasEditView) {
		this.aliasEditView = new Donkeylift.AliasEditView();
	}
	return this.aliasEditView;
}

AppSchema.prototype.getUserEditor = function() {
	if ( ! this.userEditView) {
		this.userEditView = new Donkeylift.UserEditView();
	}
	this.userEditView.users = this.schema.get('users');
	return this.userEditView;
}


Donkeylift.AppSchema = AppSchema;


