/*global Backbone, Donkeylift, $ */

function AppSchema(opts) {
	
	Donkeylift.AppBase.call(this, opts);

	this.menuView = new Donkeylift.MenuSchemaView();
	this.router = new Donkeylift.RouterSchema();
	this.editorDialogs = {};
}

AppSchema.prototype = Object.create(Donkeylift.AppBase.prototype);
AppSchema.prototype.constructor=AppSchema; 

AppSchema.prototype.createTableView = function(table, params) {
	return new Donkeylift.SchemaTableView({model: table});
}

AppSchema.prototype.createSchema = function(name) {
	return new Donkeylift.Schema({name : name, id : name});
}

AppSchema.prototype.updateSchema = function(cbAfter) {
	var currentTable = Donkeylift.app.table ? Donkeylift.app.table.get('name') : undefined;
	Donkeylift.app.schema.update(function() {
/*
		Donkeylift.app.resetSchema(function() {
			if (currentTable) {
				var table = Donkeylift.app.schema.get('tables').getByName(currentTable);
				Donkeylift.app.setTable(table);
			}
			if (cbAfter) cbAfter();
		});
*/
	});
}

AppSchema.prototype.getEditorModal = function(name) {
	var editor = this.editorDialogs[name];
	if ( ! editor) {
		switch(name) {
			case 'table':
				editor = new Donkeylift.TableEditView();
				break;
			case 'field':
				editor = new Donkeylift.FieldEditView();
				break;
			case 'relation':
				editor = new Donkeylift.RelationEditView();
				break;
			case 'alias':
				editor = new Donkeylift.AliasEditView();
				break;
		}
		this.editorDialogs[name] = editor;
	}
	return editor;
}

AppSchema.prototype.getTableEditor = function() {
	return this.getEditorModal('table');
}

AppSchema.prototype.getFieldEditor = function() {
	return this.getEditorModal('field');
}

AppSchema.prototype.getRelationEditor = function() {
	var editor = this.getEditorModal('relation');
	editor.schema = this.schema;
	editor.table = this.table;
	return editor;
}

AppSchema.prototype.getAliasEditor = function() {
	return this.getEditorModal('alias');
}

Donkeylift.AppSchema = AppSchema;


