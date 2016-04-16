/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.SchemaEditView = Backbone.View.extend({
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
		var name = this.model.get('name') || '';
		$('#modalSchemaAction > button').prop('disabled', false);
		$('#modalInputSchemaName').val(name);
		$('#modalSchemaActionResult').hide();
		$('#modalSchemaAction').show();
		$('#modalEditSchema').modal();
		return this;
	},

	renderResult: function(err) {
		$('#modalSchemaAction').hide();
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
		Donkeylift.app.schemaCurrentView.render();
	},

	evSaveClick: function() {
		var me = this;
		console.log("SchemaEditView.evSaveClick");

		$('#modalSchemaAction > button').prop('disabled', true);
		var newName = $('#modalInputSchemaName').val();
		if (newName != this.model.get('name')) {
			console.log('SchemaEditView Save as new');
			this.model.set('name', newName);
		}
		this.model.save(function(err) { 
			Donkeylift.app.setSchema(me.model.get('name'));
			return me.renderResult(err); 
		});
	},

	evRemoveClick: function() {	
		var me = this;
		$('#modalSchemaAction > button').prop('disabled', true);
		this.model.destroy(function(err) { return me.renderResult(err); });
	}

});


