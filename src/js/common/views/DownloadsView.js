/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.DownloadsView = Backbone.View.extend({
	el:  '#content',

	events: {
		//'click #reset-all-filters': 'evResetAllFilters'
	},

	initialize: function() {
		console.log("MenuView.init");
		//this.listenTo(Donkeylift.table, 'change', this.render);
	},

	template: _.template($('#downloads-template').html()),

	render: function() {
		console.log('DownloadsView.render ');			
		this.$el.html(this.template());
		return this;
	},

});


