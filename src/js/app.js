var REST_ROOT = "http://localhost:3000";
var app = app || {};

$(function () {
	'use strict';

	/**** init app - called at the end ***/
	app.init = function() {

		//fixed user named demo
		app.user = 'demo';

		app.schemas = new app.Schemas(null, {url: REST_ROOT + '/' + app.user});

		app.filters = new app.Filters();

		app.schemaCurrentView = new app.SchemaCurrentView();

		app.schemaEditView = new app.SchemaEditView();
		app.tableEditView = new app.TableEditView();
		app.fieldEditView = new app.FieldEditView();
		app.relationEditView = new app.RelationEditView();
		app.aliasEditView = new app.AliasEditView();


		app.schemas.fetch({success: function() {
			app.schemaListView = new app.SchemaListView({collection: app.schemas});
			$('#schema-list').append(app.schemaListView.render().el);
		}});

		app.gotoModule('data');

		$('#toggle-sidebar').hide();
	}


	$(document).ajaxStart(function() {
		$('#ajax-progress-spinner').show();
	});
	$(document).ajaxStop(function() {
		$('#ajax-progress-spinner').hide();
	});

	app.toggleSidebar = function() {
		if ($('#table-list').is(':visible')) {
	        $('#menu').hide('slide');
	        $('#table-list').hide('slide', function() {
			   	$('#module').toggleClass('col-sm-16 col-sm-13');             
			   	$('#sidebar').toggleClass('col-sm-3 col-sm-0');
			});
		} else {
			$('#module').toggleClass('col-sm-16 col-sm-13');             
			$('#sidebar').toggleClass('col-sm-3 col-sm-0');
        	$('#table-list').show('slide');
	        $('#menu').show('slide');
		}
	}
	
	$('#toggle-sidebar').click(function() {
		app.toggleSidebar();
	}); 

	app.gotoModule = function(name) {
		console.log('switching to module ' + name);

		$('#goto-options li').removeClass('active');
		$('#goto-options a[data-target="' + name + '"]')
			.parent().addClass('active');

		if (name == 'schema') {
			app.menuView = new app.MenuSchemaView();
		} else if (name == 'data') {
			app.menuView = new app.MenuDataView();
		}
		app.menuView.render();

		//refresh table view
		if (app.table) app.setTable(app.table);
	}

	app.module = function() {
		var m;
		if (app.menuView instanceof app.MenuSchemaView) m = 'schema';
		else if (app.menuView instanceof app.MenuDataView) m = 'data';
		//console.log('module ' + m);
		return m;		
	}

	$('#goto-options a').click(function(ev) {
		app.gotoModule($(ev.target).attr('data-target'));
	}); 

	app.setTable = function(table) {
		//console.log('app.setTable');
		app.table = table;
		if (app.tableView) app.tableView.remove();

		if (app.module() == 'data') {
			app.tableView = new app.DataTableView({model: table});
		} else if (app.module() == 'schema') {
			app.tableView = new app.SchemaTableView({model: table});
		}

		$('#content').append(app.tableView.render().el);			
		app.menuView.render();			
	}

	app.unsetSchema = function() {
		app.schema = null;
		if (app.gridView) app.gridView.remove();
		if (app.tableView) app.tableView.remove();
		if (app.tableListView) app.tableListView.remove();
		
		app.schemaCurrentView.render();
	}

	app.loadSchema = function(name) {
		app.unsetSchema();
		app.schema = new app.Database({name : name, id : name});
		app.schema.fetch(function() {
			app.tableListView = new app.TableListView({
				collection: app.schema.get('tables')
			});
			$('#sidebar').append(app.tableListView.render().el);
			$('#toggle-sidebar').show();

			//render current schema label
			app.schemaCurrentView.render();
		});
	}

	/**** schema only stuff ****/

	app.newSchema = function(name) {
		app.unsetSchema();
		app.schema = new app.Database({name : name});
		app.schema.save(function() {
			app.tableListView = new app.TableListView({
				collection: app.schema.get('tables')
			});
			$('#sidebar').append(app.tableListView.render().el);

			//render current schema label
			app.schemaCurrentView.render();
		});
	}

	/**** data only stuff ****/

	app.setFilterView = function(filter, $parentElem) {
		if (app.filterView) app.filterView.remove();
		app.filterView = new app.FilterView({ model: filter });
		$parentElem.append(app.filterView.el);
		app.filterView.render();
	}

	//start
	app.init();

});

