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

/*** override AppBase methods ***/ 

AppData.prototype.start = function(params, cbAfter) {
	console.log("AppData.start...");
	AppBase.prototype.start.call(this, params, function() {
		//only data app
		if (window.location.hash.length > 0) {
			console.log("navigate " + window.location.hash);
			Donkeylift.app.router.gotoHash(window.location.hash, cbAfter);
		} else {
			if (cbAfter) cbAfter();
		}
	})
}

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


AppData.prototype.addSelection = function(rows) {
	this.selectedRows.add(rows);
}

AppData.prototype.getSelection = function(opts) {
	return this.selectedRows;
}

AppData.prototype.unsetSelection = function() {
	this.selectedRows.reset();
}

AppData.prototype.setFilterView = function(filter, thElement) {
	if (this.filterView) this.filterView.remove();
	this.filterView = new Donkeylift.FilterView({ model: filter, th: thElement });
	this.filterView.render();
}

Donkeylift.AppData = AppData;
