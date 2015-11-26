/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	app.Router = Backbone.Router.extend({
        routes: {
            "data": "data",
            "schema": "schema",
        },
        
        data: function() {
            app.gotoModule("data");
        },

        schema: function() {
            app.gotoModule("schema");
        }
        
	});


})();
