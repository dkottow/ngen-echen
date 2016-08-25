/*global AppBase, Backbone, Donkeylift, $ */

function AppData(opts) {
    console.log('AppData ctor');
	Donkeylift.AppBase.call(this, opts);
	this.filters = new Donkeylift.Filters();
	this.menuView = new Donkeylift.MenuDataView();
	this.router = new Donkeylift.RouterData();
}

AppData.prototype = Object.create(Donkeylift.AppBase.prototype);
AppData.prototype.constructor = AppData; 

AppData.prototype.start = function() {
	Donkeylift.AppBase.prototype.start.call(this);
	$('#nav-data').closest("li").addClass("active");
}


	/**** schema stuff ****/

AppData.prototype.unsetSchema = function() {
	Donkeylift.AppBase.prototype.unsetSchema.call(this);
	this.unsetFilters();
}

/**** data stuff ****/

AppData.prototype.setFilters = function(filters) {
	this.filters = new Donkeylift.Filters(filters);
}

AppData.prototype.unsetFilters = function() {
	this.filters = new Donkeylift.Filters();
}

AppData.prototype.setFilterView = function(filter, $parentElem) {
	if (this.filterView) this.filterView.remove();
	this.filterView = new Donkeylift.FilterView({ model: filter });
	$parentElem.append(this.filterView.el);
	this.filterView.render();
}

AppData.prototype.onAccountLoaded = function() {
	//only data app
	if (location.hash.length > 0) {
		console.log("navigate " + location.hash);
		var parts = location.hash.split('/');
		if (parts.length == 4 && parts[0] == '#data') {
			Donkeylift.app.router
				.routeUrlTableData(parts[1], parts[2], parts[3]);
		}
	}
}

Donkeylift.AppData = AppData;
