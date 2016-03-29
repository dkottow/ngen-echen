/*global Backbone */
var DONKEYLIFT_API = "$DONKEYLIFT_API";  //set by gulp according to env var DONKEYLIFT_API. e.g. "http://api.donkeylift.com";

$(function () {
	'use strict';
	var app = {};
	/**** init app - called at the end ***/
	app.init = function() {

		//fixed user named demo
		app.user = 'demo';

		app.schemas = new Donkeylift.Schemas(null, {url: DONKEYLIFT_API + '/' + app.user});

		app.filters = new Donkeylift.Filters();

		app.schemaCurrentView = new Donkeylift.SchemaCurrentView();

		app.schemaEditView = new Donkeylift.SchemaEditView();
		app.tableEditView = new Donkeylift.TableEditView();
		app.fieldEditView = new Donkeylift.FieldEditView();
		app.relationEditView = new Donkeylift.RelationEditView();
		app.aliasEditView = new Donkeylift.AliasEditView();

		app.filterShowView = new Donkeylift.FilterShowView();

		app.schemas.fetch({success: function() {
			app.schemaListView = new Donkeylift.SchemaListView({collection: app.schemas});
			$('#schema-list').append(app.schemaListView.render().el);
		}});

		app.router = new Donkeylift.Router();
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

		$("#menu").empty();
		$("#content").empty();

		if (name == 'schema') {
			app.menuView = new Donkeylift.MenuSchemaView();
		} else if (name == 'data') {
			app.menuView = new Donkeylift.MenuDataView();
		} else if (name == 'downloads') {
			app.menuView = new Donkeylift.DownloadsView();
		}
		app.menuView.render();

	}

	app.module = function() {
		var m;
		if (app.menuView instanceof Donkeylift.MenuSchemaView) m = 'schema';
		else if (app.menuView instanceof Donkeylift.MenuDataView) m = 'data';
		else if (app.menuView instanceof Donkeylift.DownloadsView) m = 'downloads';
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
			app.tableView = new Donkeylift.DataTableView({
				model: table, 
				attributes: { params: params }
						
			});
		} else if (app.module() == 'schema') {
			app.tableView = new Donkeylift.SchemaTableView({model: table});
		}

		$('#content').html(app.tableView.render().el);			
		app.menuView.render();			
	}

	app.resetTable = function() {
		if (app.table) app.setTable(app.table);
	}

	app.unsetTable = function() {
		app.table = null;
		if (app.tableView) app.tableView.remove();
	}

	/**** schema stuff ****/

	app.unsetSchema = function() {
		app.unsetTable();
		app.unsetFilters();
		app.schema = null;
		if (app.tableListView) app.tableListView.remove();
		
		app.schemaCurrentView.render();
	}

	app.setSchema = function(name, cbAfter) {
		console.log('app.setSchema ' + name);
		var loadRequired = ! app.schema || app.schema.get('name') != name;

		if (loadRequired) {
			console.log('app.setSchema loadRequired');
			app.unsetSchema();
			app.schema = new Donkeylift.Database({name : name, id : name});
			app.schema.fetch(function() {
				app.tableListView = new Donkeylift.TableListView({
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

	/**** data stuff ****/

	app.setFilters = function(filters) {
		app.filters = new Donkeylift.Filters(filters);
	}

	app.unsetFilters = function() {
		app.filters = new Donkeylift.Filters();
	}

	app.setFilterView = function(filter, $parentElem) {
		if (app.filterView) app.filterView.remove();
		app.filterView = new Donkeylift.FilterView({ model: filter });
		$parentElem.append(app.filterView.el);
		app.filterView.render();
	}

	//make app global
	Donkeylift.app = app;

	//start
	app.init();
});

