/*global Backbone, $ */

//set by gulp according to env vars
// e.g. DONKEYLIFT_API. "http://api.donkeylift.com";

var DONKEYLIFT_API = "$DONKEYLIFT_API";  

var AUTH0_CLIENT_ID = "$AUTH0_CLIENT_ID";
var AUTH0_DOMAIN = "$AUTH0_DOMAIN";


var Donkeylift = {};

function AppBase(opts) {
	var me = this;

    console.log('AppBase ctor');

	$.ajaxPrefilter(function( options, _, jqXHR ) {
		$('#ajax-progress-spinner').show();
	    jqXHR.always(function() {
			$('#ajax-progress-spinner').hide();
		});
	});

	$('#toggle-sidebar').click(function() {
		me.toggleSidebar();
	}); 

	Backbone.history.start();
}

AppBase.prototype.start = function() {
	var me = this;
	this.navbarView = new Donkeylift.NavbarView();
	this.loadAccount(sessionStorage.getItem('id_token'));
}

AppBase.prototype.loadAccount = function(id_token) {
	var me = this;
	console.log('loadAccount: ' + id_token);
	if ( ! id_token) return;

	this.account = new Donkeylift.Account({ id_token: id_token });
	this.navbarView.model = this.account;

	this.account.fetch({ success: function() {
		me.navbarView.render();
		me.menuView.render();
		me.onAccountLoaded();
	}});

	$('#toggle-sidebar').hide();
}

AppBase.prototype.onAccountLoaded = function() {
	//overwrite me
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
	this.navbarView.render();
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

		me.navbarView.render();
		me.menuView.render();
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

