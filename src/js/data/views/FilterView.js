/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.FilterView = Backbone.View.extend({

	events: {
		'click .filter-column': 'evFilterColumnClick',
		'click .nav-tabs a': 'evFilterTabClick'
	},

	initialize: function (options) {
		console.log("FilterView.init " + this.model.get('table'));

		this.rangeView = new Donkeylift.FilterRangeView({
							model: this.model, el: this.el });
		this.itemsView = new Donkeylift.FilterItemsView({
							model: this.model, el: this.el });

		var th = options.th;
		this.$th = th;
		th.find('.dropdown-menu').append(this.el);
		
		/*
		 * turn off DT ColReorder mouse events while filter dropdown is shown
		 */
		th.find('.dropdown').on('show.bs.dropdown', function() {
			th.off('mousedown.ColReorder');
		});
		th.find('.dropdown').on('hide.bs.dropdown', function() {
			//TODO? slightly hacky way of re-insantiating the event handler for ColReorder 
			$.fn.dataTable.ColReorder('#grid')._fnMouseListener(0, th);
		});

		//on filter btn click toggle dropdown 
		var btn = th.find('.field-filter');
		if ( ! btn.data('bs.dropdown')) {
			//workaround for first click to show dropdown
			btn.dropdown('toggle');
		} else {
			btn.dropdown();
		}
		
	},

	template: _.template($('#filter-template').html()),

	render: function() {
		var field = this.model.get('field');
		console.log("FilterView.render " + field.get('name'));

		this.$el.html(this.template({
			name: field.get('name'),
			specialAction: field.get('name') == 'id' ? 'All' : 'Nulls'  
		}));

		var cx = (this.$th[0].getBoundingClientRect().left 
			+ this.$th[0].getBoundingClientRect().right) / 2;	
		var setAlign = cx < window.innerWidth / 2
			? 'left' : 'right';
		var clearAlign = setAlign == 'left' ? 'right' : 'left';

		this.$el.parent().toggleClass('dropdown-menu-' + clearAlign, false);
		this.$el.parent().toggleClass('dropdown-menu-' + setAlign, true);

		if (field.get('type').startsWith(Donkeylift.Field.TYPES.text)
		 || field.get('fk') == 1) {
			this.itemsView.loadRender();
		} else {
			this.rangeView.loadRender();
		}

		return this;
	},

	evFilterColumnClick: function(ev) {
		ev.preventDefault();
		ev.stopPropagation();
	},

	evFilterTabClick: function(ev) {
		ev.preventDefault();
		ev.stopPropagation();

//console.log('evFilterTab ' + ev.target);
		if (/filterSelect$/.test(ev.target.href)) {
			this.itemsView.loadRender();
		} else if (/filterRange$/.test(ev.target.href)) {
			this.rangeView.loadRender();
		}
	}
});


