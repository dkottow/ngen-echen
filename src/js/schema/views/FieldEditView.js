/*global Donkeylift, Backbone, jQuery, _, $ */

Donkeylift.FieldEditView = Backbone.View.extend({
	el:  '#modalEditField',

	events: {
		'click #modalFieldUpdate': 'updateClick',
		'click #modalFieldRemove': 'removeClick',
		'click #modalToggleProps': 'togglePropsClick',
		'click input[name="disabled"]': 'toggleDisableFieldClick',
	},

	initialize: function() {
		console.log("FieldEditView.init");
	},

	propTemplate: function(type) {
		return _.template($('#edit-prop-' + type.toLowerCase() + '-template').html());
	},
	
	render: function() {
		//console.log("FieldEditView.render " + this.model.get('type'));
		$('#modalInputFieldName').val(this.model.get('name'));
		$('#modalInputFieldType').val(this.model.get('type'));


		$('#modalTabProps form').empty();
	
		var disabled = this.model.getProp('disabled');
		var htmlDisabled = disabled 
				? '<input type="checkbox" checked name="disabled"> Disable Field'
				: '<input type="checkbox" name="disabled"> Disable Field'

		$('#modalTabProps form').append(htmlDisabled);

		$('#modalTabProps form').append('<div class="well inject-props"></div>');

		var props = _.reject(this.model.get('props').getAll(), function(p) {
			return p.name == 'disabled';
		});
		_.each(props, function(prop) {
			//console.log(prop);
			var template = this.propTemplate(prop.type);
			$('#modalTabProps .inject-props').append(template({ 
				name: prop.name, 
				value: prop.value 
			}));
		}, this);

		$('#modalEditField').modal();
		this.showDefinition(true);

		return this;
	},

	updateClick: function() {
		console.log("FieldEditView.updateClick ");

		this.model.set('name', $('#modalInputFieldName').val());
		this.model.set('type', $('#modalInputFieldType').val());

		var propValues = $("#modalTabProps form").serializeArray();
		this.model.setPropArray(propValues);
		
		Donkeylift.app.table.get('fields').addNew(this.model);

		Donkeylift.app.schema.update();
	},

	removeClick: function() {	
		console.log("FieldEditView.removeClick " + this.model.collection);
		if (this.model.collection) {
			this.model.collection.remove(this.model);
			Donkeylift.app.schema.update();
		}
	},

	showDefinition: function(show) {
		if (show) {
			$('#modalTabDefs').show();
			$('#modalTabProps').hide();
			$('#modalToggleProps').text('View Properties');
		} else {
			$('#modalTabProps').show();
			$('#modalTabDefs').hide();
			$('#modalToggleProps').text('View Definition');
		}
	},

	togglePropsClick: function() {	
		var show = $('#modalTabDefs:visible').length == 0;
		this.showDefinition(show);
	},
	
	toggleDisableFieldClick: function(ev) {
		var disabled = $(ev.target).is(':checked');
		$('#modalTabProps .inject-props input').prop('disabled', disabled);
	}

});


