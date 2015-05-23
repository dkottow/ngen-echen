var REST_ROOT = "http://localhost:3000/";
var app = app || {};

$(function () {
	'use strict';
	
	// kick things off..
	app.schema = new app.Schema({user: "stores", name: "custorder"});
	app.schema.fetch();
	app.schemaView = new app.SchemaView({
		model: app.schema
	});
	app.tableEditView = new app.TableEditView();
});

