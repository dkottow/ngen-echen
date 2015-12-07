/*global Backbone */
var REST_ROOT = "$DONKEYLIFT_API";  //set by gulp according to env var. e.g. "http://api.donkeylift.com";
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

		app.filterShowView = new app.FilterShowView();

		app.schemas.fetch({success: function() {
			app.schemaListView = new app.SchemaListView({collection: app.schemas});
			$('#schema-list').append(app.schemaListView.render().el);
		}});

		app.router = new app.Router();
		Backbone.history.start();

		app.gotoModule('data');

		$('#toggle-sidebar').hide();
	}
	
	$('#toggle-sidebar').click(function() {
		app.toggleSidebar();
	}); 

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

	}

	app.module = function() {
		var m;
		if (app.menuView instanceof app.MenuSchemaView) m = 'schema';
		else if (app.menuView instanceof app.MenuDataView) m = 'data';
		//console.log('module ' + m);
		return m;		
	}

	app.setTable = function(table, params) {
		console.log('app.setTable ' + params);
		var $a = $("#table-list a[data-target='" + table.get('name') + "']");
		$('#table-list a').removeClass('active');
		$a.addClass('active');

		app.table = table;
		if (app.tableView) app.tableView.remove();

		if (app.module() == 'data') {
			app.tableView = new app.DataTableView({
				model: table, 
				attributes: { params: params }
						
			});
		} else if (app.module() == 'schema') {
			app.tableView = new app.SchemaTableView({model: table});
		}

		$('#content').append(app.tableView.render().el);			
		app.menuView.render();			
	}

	app.resetTable = function() {
		if (app.table) app.setTable(app.table);
	}

	/**** schema stuff ****/

	app.unsetSchema = function() {
		app.table = null;
		app.schema = null;
		if (app.gridView) app.gridView.remove();
		if (app.tableView) app.tableView.remove();
		if (app.tableListView) app.tableListView.remove();
		
		app.schemaCurrentView.render();
	}

	app.setSchema = function(name, cbAfter) {
		var loadRequired = ! app.schema || app.schema.get('name') != name;

		if (loadRequired) {
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
				if (cbAfter) cbAfter();
			});
		} else {
			if (cbAfter) cbAfter();
		}
	}

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

	/**** data stuff ****/

	app.setFilters = function(filters) {
		app.filters = new app.Filters(filters);
	}

	app.unsetFilters = function() {
		app.filters = new app.Filters();
	}

	app.setFilterView = function(filter, $parentElem) {
		if (app.filterView) app.filterView.remove();
		app.filterView = new app.FilterView({ model: filter });
		$parentElem.append(app.filterView.el);
		app.filterView.render();
	}

	//start
	app.init();

});

