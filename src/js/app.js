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
        $('#table-list').toggle('slide', function() {
		   	$('#module').toggleClass('col-sm-16 col-sm-13');             
		   	$('#sidebar').toggleClass('col-sm-3 col-sm-0');
		});
	}
	
	$('#toggle-sidebar').click(function() {
		app.toggleSidebar();
	}); 

	app.gotoModule = function(name, el) {
		console.log('switching to module ' + name);

		$('#goto-options li').removeClass('active');
		$(el).parent().addClass('active');

		if (name == 'schema') {
			app.menuView = new app.MenuSchemaView();
		} else if (name == 'data') {
			app.menuView = new app.MenuDataView();
		}
		app.menuView.render();
	}

	$('#goto-options a').click(function(ev) {
		app.gotoModule($(ev.target).attr('data-target'), ev.target);
	}); 

	app.menuView = new app.MenuDataView();
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
				$('#sidebar').append(app.tableListView.render().el);
				app.menuView.render();			
			}
		});
	}

	app.setTable = function(table) {
		console.log('app.setTable');
		app.table = table;
		if (app.tableView) app.tableView.remove();
//TODO ask if data or schema then instantiate
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

