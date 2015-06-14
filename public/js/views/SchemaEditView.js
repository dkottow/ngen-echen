/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.SchemaEditView = Backbone.View.extend({
		el:  '#modalEditSchema',

		events: {
			'click #modalSchemaSave': 'evSaveClick',
			'click #modalSchemaRemove': 'evRemoveClick'
		},

		initialize: function() {
			console.log("SchemaEditView.init");
		},

		render: function() {
			console.log("SchemaEditView.render");
			$('#modalInputSchemaName').val(this.model.get('name'));
			$('#modalSchemaActionResult').hide();
			$('#modalSchemaAction').show();
			$('#modalEditSchema').modal();
			return this;
		},
	
		renderResult: function(err) {
			$('#modalSchemaAction').hide();
			$('#modalSchemaAction > button').prop('disabled', false);
			if (err) {
				$('#modalSchemaResultMessage').html(
						err.status + " " + err.responseText
				);			
				$('#modalSchemaResultButton').addClass('btn-danger');
				$('#modalSchemaResultButton').removeClass('btn-success');
			} else {
				$('#modalSchemaResultMessage').empty();
				$('#modalSchemaResultButton').addClass('btn-success');
				$('#modalSchemaResultButton').removeClass('btn-danger');
			}
			$('#modalSchemaActionResult').show();
		},

		evSaveClick: function() {
			$('#modalSchemaAction > button').prop('disabled', true);
			var newName = $('#modalInputSchemaName').val();
			if (newName != this.model.get('name')) {
				//add schema, not replace
				console.log('SchemaEditView unset id');
				this.model.unset('id');
			}
			this.model.set('name', newName);
			var me = this;
			this.model.save(null, {
				success: function() {	
					app.schemas.fetch({
						reset: true,
						success: function() {
							me.renderResult();
							var model = app.schemas.get(me.model.get('name'));
							app.setSchema(model);
						},
						error: function(model, response) {
							me.renderResult(response);
						}
					});
				},
				error: function(model, response) {
					me.renderResult(response);
					console.dir(response);
				}
			});
		},

		evRemoveClick: function() {	
			var me = this;
			this.model.destroy({
				success: function() {			
					app.schemas.fetch({
						reset: true,
						success: function() {
							me.renderResult();
							app.setSchema(null);
						},
						error: function(model, response) {
							me.renderResult(response);
						}
					});
				},
				error: function(model, response) {
					me.renderResult(response);
					console.dir(response);
				}
			});
		}

	});

})(jQuery);


