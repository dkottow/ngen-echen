var REST_ROOT = "http://localhost:3000";
var app = app || {};

$(function () {
	'use strict';

	// kick things off..
	app.name = 'schema';
	app.user = 'demo';

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

	app.schemaListUrl = function() { return REST_ROOT + "/" + app.user; }

	app.schemas = new app.Schemas();
	app.schemas.fetch({success: function() {
		app.schemaListView = new app.SchemaListView({collection: app.schemas});
		$('#schema-list').append(app.schemaListView.render().el);
	}});

	app.unsetSchema = function() {
		app.schema = null;
		if (app.tableView) app.tableView.remove();
		if (app.tableListView) app.tableListView.remove();

		app.menuView.render();
	}

	app.newSchema = function() {
		app.unsetSchema();
		app.schema = new app.Schema.create();

		app.tableListView = new app.TableListView({
			collection: app.schema.get('tables')
		});
		$('#table-list').append(app.tableListView.render().el);

		app.menuView.render();
	}

	app.loadSchema = function(name) {
		app.unsetSchema();
		app.schema = new app.Schema.create(name);
		app.schema.fetch({success: function() {
			app.schema.orgJSON = app.schema.toJSON();
			app.tableListView = new app.TableListView({
				collection: app.schema.get('tables')
			});
			$('#table-list').append(app.tableListView.render().el);
			app.menuView.render();			
		}});
	}

	app.setTable = function(table) {
		app.table = table;
		if (app.tableView) app.tableView.remove();
		app.tableView = new app.TableView({model: app.table});
		$('#content').append(app.tableView.render().el);			
	}

	app.toggleSidebar = function() {
		var destValue = 225 - parseInt($('.side-nav').css('width'));
console.log(destValue);
		$('.side-nav').animate({'width': destValue}, 400);
		$('#wrapper').animate({'padding-left': destValue}, 400);
	}
});

