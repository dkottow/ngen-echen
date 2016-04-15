/*global Backbone, Donkeylift, $ */
var DONKEYLIFT_API = "$DONKEYLIFT_API";  //set by gulp according to env var DONKEYLIFT_API. e.g. "http://api.donkeylift.com";

$(function () {
	'use strict';
	var app = {};
	/**** init app - call me from your javascript ***/
	app.init = function(opts) {
		opts = opts || {};
		
		app.user = opts.user || 'demo';

		app.schemas = new Donkeylift.Schemas(null, {url: DONKEYLIFT_API + '/' + app.user});

		app.schemaCurrentView = new Donkeylift.SchemaCurrentView();

		app.schemaEditView = new Donkeylift.SchemaEditView();
		app.tableEditView = new Donkeylift.TableEditView();
		app.fieldEditView = new Donkeylift.FieldEditView();
		app.relationEditView = new Donkeylift.RelationEditView();
		app.aliasEditView = new Donkeylift.AliasEditView();

		app.schemas.fetch({success: function() {
			app.schemaListView = new Donkeylift.SchemaListView({collection: app.schemas});
			$('#schema-list').append(app.schemaListView.render().el);
		}});

		app.menuView = new Donkeylift.MenuSchemaView();
		app.menuView.render();

		app.router = new Donkeylift.Router();
		Backbone.history.start();

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

	app.setTable = function(table, params) {
		console.log('app.setTable ' + params);
		var $a = $("#table-list a[data-target='" + table.get('name') + "']");
		$('#table-list a').removeClass('active');
		$a.addClass('active');

		app.table = table;
		if (app.tableView) app.tableView.remove();

		app.tableView = new Donkeylift.SchemaTableView({model: table});

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
			app.schema = new Donkeylift.Schema({name : name, id : name});
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

	//make app global
	Donkeylift.app = app;

	//start
	//app.init();
});

