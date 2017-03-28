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

AppSchema.prototype.updateSchema = function(cbAfter) {
	Donkeylift.app.schema.update(function() {
		if (Donkeylift.app.table) {
			var name = Donkeylift.app.table.get('name');
			var table = Donkeylift.app.schema.get('tables').getByName(name);
			Donkeylift.app.setTable(table);
			if (cbAfter) cbAfter();
		}
	});
}

AppSchema.prototype.getEditorModal = function(name) {
	var editor = this.editorDialogs[name];
	if ( ! editor) {
		switch(name) {
			case 'schema':
				editor = new Donkeylift.SchemaEditView();
				break;
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
			case 'access':
				editor = new Donkeylift.AccessEditView();
				break;
			case 'user':
				editor = new Donkeylift.UserEditView();
				break;
		}
		this.editorDialogs[name] = editor;
	}
	return editor;
}

AppSchema.prototype.getSchemaEditor = function() {
	return this.getEditorModal('schema');
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

AppSchema.prototype.getUserEditor = function() {
	var editor = this.getEditorModal('user');
	editor.users = this.schema.get('users');
	return editor;
}

AppSchema.prototype.getAccessEditor = function() {
	return this.getEditorModal('access');
}

Donkeylift.AppSchema = AppSchema;


