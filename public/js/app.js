var REST_ROOT = "http://localhost:3000/";
var app = app || {};

$(function () {
	'use strict';

	// kick things off..

	$(document).ajaxStart(function() {
		$('#ajax-progress-spinner').show();
	});
	$(document).ajaxStop(function() {
		$('#ajax-progress-spinner').hide();
	});

	app.schemaEditView = new app.SchemaEditView();
	app.tableEditView = new app.TableEditView();
	app.fieldEditView = new app.FieldEditView();
	app.relationEditView = new app.RelationEditView();

	app.menuView = new app.MenuView();
	app.menuView.render();

	app.schemas = new app.Schemas(null, {user: "stores"});

	app.schemas.fetch({success: function() {
		app.schemaListView = new app.SchemaListView({collection: app.schemas});
		$('#schema-list').append(app.schemaListView.render().el);
	}});


	app.setSchema = function(schema) {
		app.schema = schema;
		var schemaSelectText = ' Select Schema ';
		if (app.tableView) app.tableView.remove();
		if (app.tableListView) app.tableListView.remove();
		if (app.schema) {
			app.tableListView = new app.TableListView({
				collection: app.schema.get('tables')
			});
			$('#table-list').append(app.tableListView.render().el);
			if (app.schema.get('name')) {
				schemaSelectText = ' Schema ' + app.schema.get('name');
			} else {
				schemaSelectText = ' New Schema ';
			}
		}
		$('#schema-list > a:first span').html(schemaSelectText);
		app.menuView.render();
	}

	//TODO instead bring schemas from server 
	/*
		app.schemas.reset( %schemasJSON% );
		app.schemaListView({collection: app.schemas});
	*/

});

