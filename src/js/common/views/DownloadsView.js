/*global Donkeylift, Backbone, jQuery, _, $ */

Donkeylift.DownloadsView = Backbone.View.extend({

	el:  '#content',
	events: {
		'click .download-database': 'evDownloadDatabaseClick'
	},

	initialize: function() {
		console.log("DownloadsView.init");
	},

	template: _.template($('#downloads-template').html()),
	db_template: _.template('<li class="list-group-item"><a href="#" data-db="{{ name }}" class="download-database">Get {{ name }}</a></li>'),
	//db_template: _.template('<li class="list-group-item"><a href="<%= link%>">Get link for <%= name%></a></li>'),

	render: function() {
		console.log("DownloadsView.render ");
		this.$el.html(this.template());
		$('#menu').empty(); //clear module menu
		var dbLinks = this.model.get('databases').map(function(db) {
			return this.db_template({
				name: db.get('name'),
			});
		}, this);
		this.$('#database-list').html(dbLinks);
	},

	evDownloadDatabaseClick: function(ev) {

		if ($(ev.target).attr('href') != '#') return true;
		
		var db = $(ev.target).attr('data-db');
		console.log('evDownloadDatabaseClick ' + db);
		this.model.getDownloadLink(db, function(err, link) {
			if (err) {
				console.log(err);
			} else {
				$(ev.target).attr('href', link);
				$(ev.target).text('Download ' + db);
			}
		});
		return false;
	},

});


