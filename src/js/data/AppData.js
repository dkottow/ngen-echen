/*global AppBase, Backbone, Donkeylift, $ */

function AppData(opts) {
    console.log('AppData ctor');
	Donkeylift.AppBase.call(this, opts);
	
	this.filters = new Donkeylift.Filters();
	this.selectedRows = new Donkeylift.Rows();
	
	this.menuView = new Donkeylift.MenuDataView({ app: this });
	this.router = new Donkeylift.RouterData();
}

AppData.prototype = Object.create(Donkeylift.AppBase.prototype);
AppData.prototype.constructor = AppData; 

AppData.prototype.start = function(cbAfter) {
	Donkeylift.AppBase.prototype.start.call(this, cbAfter);
	$('#nav-data').closest("li").addClass("active");
}

/*** override AppBase methods ***/ 

AppData.prototype.createTableView = function(table, params) {
	return new Donkeylift.DataTableView({
		model: table,
		attributes: { params: params }
	});
}

AppData.prototype.createSchema = function(name) {
	return new Donkeylift.Database({name : name, id : name});
}

	
AppData.prototype.unsetSchema = function() {
	Donkeylift.AppBase.prototype.unsetSchema.call(this);
	this.unsetFilters();
}

AppData.prototype.unsetTable = function() {
	Donkeylift.AppBase.prototype.unsetTable.call(this);
	this.unsetSelection();
}

/**** AppData stuff ****/

AppData.prototype.setFilters = function(filters) {
	this.filters.reset(filters); // = new Donkeylift.Filters(filters);
}

AppData.prototype.unsetFilters = function() {
	this.filters.reset(); // = new Donkeylift.Filters();
}


AppData.prototype.addSelection = function(table, rows) {
	this.selectedRows.add(rows);
}

AppData.prototype.getSelection = function() {
	return this.selectedRows.toJSON();
}

AppData.prototype.unsetSelection = function() {
	this.selectedRows.reset();
}

AppData.prototype.setFilterView = function(filter, thElement) {
	if (this.filterView) this.filterView.remove();
	this.filterView = new Donkeylift.FilterView({ model: filter, th: thElement });
	this.filterView.render();
}

AppData.prototype.onAccountLoaded = function(cbAfter) {
	//only data app
	if (location.hash.length > 0) {
		console.log("navigate " + location.hash);
		var parts = location.hash.split('/');
		if (parts.length == 4 && parts[0] == '#data') {
			Donkeylift.app.router
				.routeUrlTableData(parts[1], parts[2], parts[3]);
		}
	}
	else if (cbAfter) cbAfter();
}

Donkeylift.AppData = AppData;
