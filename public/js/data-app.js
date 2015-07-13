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

	app.menuView = new app.MenuView();
	app.menuView.render();

	app.schemaListUrl = function() { return REST_ROOT + "/" + app.user; }

	app.schemas = new app.Schemas();
	app.schemas.fetch({success: function() {
		app.schemaListView = new app.SchemaListView({collection: app.schemas});
		$('#schema-list').append(app.schemaListView.render().el);
	}});

	app.loadSchema = function(name) {
		console.log('app.loadSchema ' + name);
		app.database = null;
		if (app.gridView) app.gridView.remove();
		if (app.tableListView) app.tableListView.remove();

		app.database = new app.Database.create(name);
		app.database.fetch({success: function() {
			app.tableListView = new app.TableListView({
				collection: app.database.get('tables')
			});
			$('#table-list').append(app.tableListView.render().el);
			app.menuView.render();			
		}});
	}

	app.setTable = function(table) {
		console.log('app.setTable');
		app.table = table;
		if (app.tableView) app.tableView.remove();
		app.tableView = new app.DataTableView({model: app.table});
		$('#content').append(app.tableView.render().el);			
	}


	app.toggleSidebar = function() {
		var destValue = 225 - $('#wrapper').css('width');
		$('#wrapper').animate({'padding-left': destValue}, 1000);
		$('.side-nav').animate({'width': destValue}, 1000);
	}

});

