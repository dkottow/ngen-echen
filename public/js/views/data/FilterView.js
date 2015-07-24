/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.FilterView = Backbone.View.extend({


		initialize: function () {
			console.log("FilterView.init " + this.model.get('name'));
		},

		template: _.template($('#filter-template').html()),

		render: function() {
			console.log("FilterView.render " + this.model.get("name"));
			//console.log('el ' + this.$el.html());
			this.$el.html(this.template({name: this.model.get('name')}));


/* TODO
    $( "#slider-range" ).slider({
      range: true,
      min: 0,
      max: 500,
      values: [ 75, 300 ],
      slide: function( event, ui ) {
        $( "#amount" ).val( "$" + ui.values[ 0 ] + " - $" + ui.values[ 1 ] );
      }
    });
    $( "#amount" ).val( "$" + $( "#slider-range" ).slider( "values", 0 ) +
      " - $" + $( "#slider-range" ).slider( "values", 1 ) );
*/



			return this;
		},

	});

})(jQuery);


