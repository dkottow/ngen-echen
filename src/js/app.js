var REST_ROOT = "http://localhost:3000";
var app = app || {};

$(function () {
	'use strict';

	// kick things off..
	app.name = 'data';
	app.user = 'demo';

	$(document).ajaxStart(function() {
		$('#ajax-progress-spinner').show();
	});
	$(document).ajaxStop(function() {
		$('#ajax-progress-spinner').hide();
	});

	app.toggleSidebar = function() {
		var destValue = 225 - parseInt($('.side-nav').css('width'));
		$('.side-nav').animate({ 'width': destValue }, 200);
		$('#wrapper').animate({ 'padding-left': destValue }, 200);
	}

	$('#toggle-sidebar > a').click(function() {
		app.toggleSidebar();
	}); 

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
		if (app.gridView) app.gridView.remove();
		if (app.tableView) app.tableView.remove();
		if (app.tableListView) app.tableListView.remove();

		app.menuView.render();
	}

	app.loadSchema = function(name) {
		app.unsetSchema();
		app.schema = new app.Database.create(name);
		app.schema.fetch({
			success: function() {
				app.schema.orgJSON = app.schema.toJSON();
				app.tableListView = new app.TableListView({
					collection: app.schema.get('tables')
				});
				$('#table-list').append(app.tableListView.render().el);
				app.menuView.render();			
			}
		});
	}

	app.setTable = function(table) {
		console.log('app.setTable');
		app.table = table;
		if (app.tableView) app.tableView.remove();
		app.tableView = table.createView({model: table});
		$('#content').append(app.tableView.render().el);			
	}

	/**** schema only stuff ****/

	app.schemaEditView = new app.SchemaEditView();
	app.tableEditView = new app.TableEditView();
	app.fieldEditView = new app.FieldEditView();
	app.relationEditView = new app.RelationEditView();

	app.newSchema = function() {
		app.unsetSchema();
		app.schema = new app.Schema.create();

		app.tableListView = new app.TableListView({
			collection: app.schema.get('tables')
		});
		$('#table-list').append(app.tableListView.render().el);

		app.menuView.render();
	}

	/**** data only stuff ****/

	app.filters = new app.Filters();

	app.setFilterView = function(filter, $parentElem) {
		if (app.filterView) app.filterView.remove();
		app.filterView = new app.FilterView({ model: filter });
		$parentElem.append(app.filterView.el);
		app.filterView.render();
	}



});

