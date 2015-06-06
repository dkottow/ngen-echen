var REST_ROOT = "http://localhost:3000/";
var app = app || {};

$(function () {
	'use strict';

	// kick things off..

	app.tableEditView = new app.TableEditView();
	app.fieldEditView = new app.FieldEditView();
	app.relationEditView = new app.RelationEditView();

/*
	app.schema = new app.Schema();
	app.schemaView = new app.SchemaView({model: app.schema});
	app.schema.fetch();
*/
	
	app.schemas = new app.Schemas(null, {user: "stores"});


	app.schemas.fetch({success: function() {
		app.schemaListView = new app.SchemaListView({collection: app.schemas});
		$('#schema-list').append(app.schemaListView.render().el);
	}});

	//TODO instead bring schemas from server 
	/*
		app.schemas.reset( %schemasJSON% );
		app.schemaListView({collection: app.schemas});
	*/

});

