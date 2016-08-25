/*global Backbone, Donkeylift, $ */

function AppSchema(opts) {
	
	Donkeylift.AppBase.call(this, opts);

	this.menuView = new Donkeylift.MenuSchemaView();
	this.router = new Donkeylift.RouterSchema();
	this.editorDialogs = {};
}

AppSchema.prototype = Object.create(Donkeylift.AppBase.prototype);
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
	var editor = this.editorDialogs['schema'];
	if ( ! editor) {
		editor = new Donkeylift.SchemaEditView();
		this.editorDialogs['schema'] = editor;
	}
	return editor;
}

AppSchema.prototype.getTableEditor = function() {
	var editor = this.editorDialogs['table'];
	if ( ! editor) {
		editor = new Donkeylift.TableEditView();
		this.editorDialogs['table'] = editor;
	}
	return editor;
}

AppSchema.prototype.getFieldEditor = function() {
	var editor = this.editorDialogs['field'];
	if ( ! editor) {
		editor = new Donkeylift.FieldEditView();
		this.editorDialogs['field'] = editor;
	}
	return editor;
}

AppSchema.prototype.getRelationEditor = function() {
	var editor = this.editorDialogs['relation'];
	if ( ! editor) {
		editor = new Donkeylift.RelationEditView();
		this.editorDialogs['relation'] = editor;
	}
	editor.schema = this.schema;
	editor.table = this.table;
	return editor;
}

AppSchema.prototype.getAliasEditor = function() {
	var editor = this.editorDialogs['alias'];
	if ( ! editor) {
		editor = new Donkeylift.AliasEditView();
		this.editorDialogs['alias'] = editor;
	}
	return editor;
}

AppSchema.prototype.getUserEditor = function() {
	var editor = this.editorDialogs['user'];
	if ( ! editor) {
		editor = new Donkeylift.UserEditView();
		this.editorDialogs['user'] = editor;
	}
	editor.users = this.schema.get('users');
	return editor;
}


Donkeylift.AppSchema = AppSchema;


