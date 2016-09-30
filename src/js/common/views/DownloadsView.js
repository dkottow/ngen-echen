/*global Donkeylift, Backbone, jQuery, _, $ */

Donkeylift.DownloadsView = Backbone.View.extend({

	el:  '#main',
	events: {
		'click .download-database': 'evDownloadDatabaseClick'
	},

	initialize: function() {
		console.log("DownloadsView.init");
	},

	template: _.template($('#downloads-template').html()),
	db_template: _.template('<li class="list-group-item"><a href="#" download="<%= filename%>" class="download-database"><%= name%></a></li>'),

	render: function() {
		console.log("DownloadsView.render ");
		this.$el.html(this.template());
		var dbLinks = this.model.get('databases').map(function(db) {
			return this.db_template({
				name: db.get('name'),
				filename: db.get('name') + '.sqlite'
			});
		}, this);
		this.$('#database-list').html(dbLinks);
	},

	evDownloadDatabaseClick: function(ev) {
		var db = $(ev.target).attr('download');
		console.log('evDownloadDatabaseClick ' + db);
		//TODO call api w/ id_token to get a use-once, expire-soon download link
		return false;
	},

});


