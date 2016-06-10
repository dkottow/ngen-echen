/*global Backbone, $ */
var DONKEYLIFT_API = "$DONKEYLIFT_API";  //set by gulp according to env var DONKEYLIFT_API. e.g. "http://api.donkeylift.com";
var Donkeylift = {};

function AppBase(opts) {
    
		opts = opts || {};

		this.user = opts.user || 'demo';
        this.schemas = new Donkeylift.Schemas(null, {url: DONKEYLIFT_API + '/' + this.user});
		this.schemaCurrentView = new Donkeylift.SchemaCurrentView();

}

AppBase.prototype.start = function() {
	var me = this;
	this.schemas.fetch({success: function() {
		me.schemaListView = new Donkeylift.SchemaListView({collection: me.schemas});
		$('#schema-list').append(me.schemaListView.render().el);
	}});

	this.menuView.render();

	Backbone.history.start();

	$('#toggle-sidebar').hide();

	$('#toggle-sidebar').click(function() {
		me.toggleSidebar();
	}); 

	$(document).ajaxStart(function() {
		$('#ajax-progress-spinner').show();
	});
	$(document).ajaxStop(function() {
		$('#ajax-progress-spinner').hide();
	});
	
}

AppBase.prototype.toggleSidebar = function() {
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

AppBase.prototype.createTableView = function(table, params) {
	//overwrite me
}

AppBase.prototype.setTable = function(table, params) {
	console.log('app.setTable ' + params);
	var $a = $("#table-list a[data-target='" + table.get('name') + "']");
	$('#table-list a').removeClass('active');
	$a.addClass('active');

	this.table = table;
	if (this.tableView) this.tableView.remove();

	this.tableView = this.createTableView(table, params);

	$('#content').html(this.tableView.render().el);			
	this.menuView.render();
}

AppBase.prototype.resetTable = function() {
	if (this.table) this.setTable(this.table);
}

AppBase.prototype.unsetTable = function() {
	this.table = null;
	if (this.tableView) this.tableView.remove();
}

/**** schema stuff ****/

AppBase.prototype.unsetSchema = function() {
	this.schema = null;
	if (this.tableListView) this.tableListView.remove();
	this.unsetTable();
	$('#content').empty();
	this.schemaCurrentView.render();
}

AppBase.prototype.createSchema = function(name) {
	//overwrite me
}

AppBase.prototype.setSchema = function(name, cbAfter) {
	console.log('AppBase.setSchema ' + name);
	var me = this;

	var loadRequired = (! this.schema) || (this.schema.get('name') != name);

	var updateViewsFn = function() {
		//always false if (me.tableListView) me.tableListView.remove();
		me.tableListView = new Donkeylift.TableListView({
			collection: me.schema.get('tables')
		});
		$('#sidebar').append(me.tableListView.render().el);
		$('#toggle-sidebar').show();

		me.menuView.render();
		//render current schema label
		me.schemaCurrentView.render();
	}

	if (loadRequired) {
		this.unsetSchema();
		this.schema = this.createSchema(name);
		this.schema.fetch(function() {
			updateViewsFn();
			if (cbAfter) cbAfter();
		});
	} else {
		console.log(' ! loadRequired ' + this.schema.get('name'));
		var currentSchema = this.schema;
		this.unsetSchema();
		this.schema = currentSchema;
		updateViewsFn();
		if (cbAfter) cbAfter();
	}
}

Donkeylift.AppBase = AppBase;

