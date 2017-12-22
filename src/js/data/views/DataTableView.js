/*global Donkeylift, Backbone, jQuery, _, $ */

Donkeylift.DataTableView = Backbone.View.extend({

	id: 'grid-panel',
	className: 'panel',

	initialize: function() {
		console.log("DataTableView.init " + this.model);			
		this.listenTo(Donkeylift.app.filters, 'update', this.renderStateFilterButtons);
	},

	tableTemplate: _.template($('#grid-table-template').html()),
	columnTemplate: _.template($('#grid-column-template').html()),
	buttonWrapTextTemplate: _.template($('#grid-button-wrap-text-template').html()),

	renderStateFilterButtons: function() {
		var fields = this.model.getEnabledFields().sortByOrder();
		_.each(fields, function(field, idx) {
			
			var filter = Donkeylift.app.filters.getFilter(
					this.model, 
					field.get('name')
				);
			
			var active = filter ? true : false;
			var $el = this.$('#col-' + field.vname() + ' button').first();
			$el.toggleClass('filter-btn-active', active); 

		}, this);
	},

	renderTextWrapCheck: function() {
		
		this.$('#grid_length').prepend(this.buttonWrapTextTemplate());
		this.$('#grid_wrap_text').click(function(ev) {
			var currentWrap = $("table.dataTable").css("white-space");
			var toggleWrap = currentWrap == 'normal' ? 'nowrap' : 'normal';
				
			$("table.dataTable").css("white-space", toggleWrap);
			$('#grid_wrap_text span')
				.toggleClass("glyphicon-text-height glyphicon-text-width");
		});

	},

	getOptions: function(params, fields) {
		params = params || {};
		var dtOptions = {};
		
		dtOptions.lengthMenu = params.lengthMenu || [5, 10, 25, 50, 100, 500];

		dtOptions.displayStart = params.$skip || 0;
		dtOptions.pageLength = params.$top || 10;

		dtOptions.order = [[0, 'asc']];
		if (params.$orderby) {
			var order = _.pairs(params.$orderby[0]) [0];
			for(var i = 0; i < fields.length; ++i) {
				if (fields[i].vname() == order[0]) {
					dtOptions.order[0][0] = i;
					dtOptions.order[0][1] = order[1];
					break;
				}
			}
		}

		var totalWidth = _.reduce(fields, function(s, f) {
			return s + f.getProp('width');
		}, 0);

		var columns = _.map(fields, function(field) {
			var col = {
				data: field.vname()
			}

			var width = (100 * field.getProp('width')) / totalWidth;
			col.width = String(Math.floor(width)) + '%';
			col.visible = field.visible();
			col.render = this.columnDataFn(field);

			return col;
		}, this);

		dtOptions.columns = columns;

		return dtOptions;
	},

	getEditorOptions: function() {
		var me = this;
		var dtEditorOptions = {};

		var editFields = this.model.getEditorFields();


		dtEditorOptions.fields = _.map(editFields, function(field) {
			var edField = {};

			edField.name = field.vname(); 
			edField.label = field.vname(); 

			if (field.get('type') == Donkeylift.Field.TYPES.date) {
				edField.type = 'datetime';

			} else if (field.getProp('width') > 60) {
				edField.type = 'textarea';

			} else if (field.get('fk') == 1) {
				var sourceFn = function(q, syncCb, asyncCb) {
					var fkTable = Donkeylift.app.schema
						.get('tables').getByName(field.get('fk_table'));
					
					fkTable.fieldValues('ref', q, function(rows, info) {
						var options = _.map(rows, function(row) {
							return row.ref;
						});
						//console.log(options);
						if (info && info.cached) syncCb(options);
						else asyncCb(options);
					});
				}
				edField.type = 'typeahead';
				edField.opts = {
						options: {
							hint: false
						}
						, source: sourceFn 
				};

			} else {
				edField.type = 'text';
			}
			return edField;
		});

		return dtEditorOptions;
	},

	render: function() {
		var me = this;
		
		console.log('DataTableView.render ');			
		this.$el.html(this.tableTemplate());

		var fields = this.model.getEnabledFields().sortByOrder();
		_.each(fields, function(field, idx) {
			var align = idx < fields.length / 2 ? 
				'dropdown-menu-left' : 'dropdown-menu-right';
			
			//this.$('thead > tr').append('<th>' + field.vname() + '</th>');
			var colHtml = this.columnTemplate({
				name: field.vname(),
				dropalign: align	
			});
			this.$('thead > tr').append(colHtml);
			this.$('#col-' + field.vname() + ' .field-filter').click( function(ev) {
				me.evFilterButtonClick(ev);
			});

		}, this);

		
		this.renderStateFilterButtons();

		var filter = Donkeylift.app.filters.getFilter(this.model);			
		var initSearch = {};
		if (filter) initSearch.search = filter.get('value');

		var dtOptions = this.getOptions(this.attributes.params, fields);
		var dtEditorOptions = this.getEditorOptions();
		//console.log(dtEditorOptions);

		this.dataEditor = new $.fn.dataTable.Editor({
			table: '#grid',
			idSrc: 'id',
			fields: dtEditorOptions.fields,
			display: 'bootstrap',
			formOptions: {
				main: { 
					focus: -1 
				}
			},
			ajax: this.model.ajaxGetEditorFn(),
		});

		var dtSettings = {
			serverSide: true,
			columns: dtOptions.columns,				
			ajax: this.model.ajaxGetRowsFn(),
			search: initSearch,
			lengthMenu: dtOptions.lengthMenu, 
			displayStart: dtOptions.displayStart, 
			pageLength: dtOptions.pageLength, 
			order: dtOptions.order,
			select: true,
			colReorder: true,
			//dom: "lfrtip",
			buttons: [
				{ extend: 'colvis', text: 'Show Columns' },
				{ extend: 'create', editor: this.dataEditor },
				{ extend: 'edit', editor: this.dataEditor },
				{ extend: 'remove', editor: this.dataEditor }
			]
		};


		this.dataTable = this.$('#grid').DataTable(dtSettings);

		if (filter) {
			this.$('#grid_filter input').val(filter.get('value'));
		}

		this.renderTextWrapCheck();
	
		this.addEvents();

		/* trigger preInit.dt event since the table was added dynamically
		   and this event seems to be triggered by DT on dom load.
		   see comment in datatables source about 'Initialisation' in select plugin */
		$(document).trigger('preInit.dt', this.dataTable.settings() );
		//this.dataTable.select(); 

		return this;
	},

	evFilterButtonClick: function(ev) {
		ev.stopPropagation();

		var colName = $(ev.target).closest('button').data('column');

		var filter = new Donkeylift.Filter({
			table: this.model,
			field: this.model.get('fields').getByName(colName)
		}); //TODO - avoid using ctor directly

		var th = this.$('#col-' + colName);
		Donkeylift.app.setFilterView(filter, th);

	},

	addButtonEllipsisEvent: function() {
		
		//expand ellipsis on click
		this.$('button.ellipsis-init').click(function(ev) {				
			//wrap text before expaning
			$(ev.target).parents('span').css('white-space', 'normal');	

			var fullText = $(ev.target).parents('span').attr('title');
			$(ev.target).parents('span').html(fullText);
			console.log('ellipsis click ' + $(ev.target).text());
		});
		//dont add click handler again
		this.$('button.ellipsis-init').removeClass('ellipsis-init');
	},

	addEvents: function() {
		var me = this;

		this.dataTable.on('draw.dt', function() {
			me.addButtonEllipsisEvent();
		});

		this.dataTable.on('page.dt', function() {
			console.log("page.dt");
			Donkeylift.app.router.navigate("reload-table", {trigger: false});			
		});

		this.dataTable.on('init.dt', function() {
			console.log("init.dt");

			me.dataTable.buttons().container()
				.removeClass('dt-buttons')
				.addClass('btn-group');

			me.dataTable.buttons().container().children()
				.removeClass('dt-button')
				.addClass('btn btn-default navbar-btn')

			$('#menu').append(me.dataTable.buttons().container());

			//customize to our bootstrap grid model which has 16, not 12 columns
			me.$('#grid_filter').parent()
				.removeClass('col-sm-6')
				.addClass('col-sm-10'); 
			me.$('#grid').parent()
				.removeClass('col-sm-12')
				.addClass('col-sm-16'); 
			me.$('#grid_paginate').parent()
				.removeClass('col-sm-7')
				.addClass('col-sm-11'); 
	
		});

		this.dataTable.on('buttons-action.dt', function (e, buttonApi, dataTable, node, config) {
			me.addButtonEllipsisEvent();
			if ($(buttonApi.node()).hasClass('buttons-columnVisibility')) {
				//set visibility prop of field according to Datatable colvis button	
				var field = me.model.get('fields').getByName(buttonApi.text());
				var visible = $(buttonApi.node()).hasClass('active');
				//TODO props vs prefs 
				field.setProp('visible', visible);
			}
		});

		//using order.dt event won't work because its fired otherwise, too

		this.$('th.sorting').click(function() {
			console.log("order.dt");
			Donkeylift.app.router.navigate("reload-table", {trigger: false});			
		});

		//using search.dt event won't work because its fired otherwise, too
/*
		this.$('input[type="search"]').blur(function() {
			console.log("search.dt");
			Donkeylift.app.router.navigate("reload-table", {trigger: false});			
		});
		this.$('input[type="search"]').focus(function() {
			console.log("search.dt");
			Donkeylift.app.router.navigate("reload-table", {trigger: false});			
		});
*/
		this.dataEditor.on('preSubmit', function(ev, req, action) {
			me.model.sanitizeEditorData(req);
			if (req.error) {
				me.dataEditor.error(req.error.field, req.error.message);
			}
		});

		this.dataEditor.on('submitError', function(ev, xhr, err, thrown, data) {
			me.dataEditor.error(xhr.responseText);
		});

		this.dataTable.on('column-reorder', function (e, settings, details) {
			$(document).mouseup(function() {
				var columnOrders = me.dataTable.colReorder.order();
				//console.log('column-reorder done.', columnOrders);
				_.each(columnOrders, function(pos, idx) {
					var field = settings.aoColumns[pos].data;
					//TODO props vs prefs 
					me.model.get('fields').getByName(field).setProp('order', pos);
					//console.log('col idx ' + idx + ' ' + field + ' order ' + pos) 
				});

			});
		});
	},

	columnDataFn: function(field) {

		var me = this;

		var btnExpand = '<button class="ellipsis ellipsis-init btn btn-default btn-xs"><span class="glyphicon glyphicon-option-horizontal" aria-hidden="true"></span></button>'
		var w = field.getProp('width');
		var abbrFn = function (data) {
			var s = field.toFS(data);
	   		return s.length > w
				//?  '<span title="' + s.replace(/"/g, '&quot;') + '">'
				?  '<span title="' + s + '">'
					+ s.substr( 0, w)
					+ ' ' + btnExpand
				: s;
		}

		var anchorFn = undefined;
		if (field.get('name') == 'id' 
			&& me.model.get('referenced').length > 0) {
			//link to table rows referencing this id.
			anchorFn = function(id) {
				var href = '#table'
					+ '/' + me.model.get('referenced')[0].table
					+ '/' + me.model.get('name') + '.id=' + id;

				return '<a href="' + href + '">' + id + '</a>';
			}

		} else if (field.get('fk') == 1) {
			//link to referenced table row.
			anchorFn = function(ref) {
				var href = '#table'
					+ '/' + field.get('fk_table')
					+ '/id=' + Donkeylift.Field.getIdFromRef(ref)

				return '<a href="' + href + '">' + ref + '</a>';
			}
		}

		var dataFn = function (data, type, full, meta ) {

			if (type == 'display' && data) {
				return anchorFn ? anchorFn(data) : abbrFn(data);
			} else {
				return data;
			}
		}								

		return dataFn;	
	},
	
	getSelection: function() {
		return this.dataTable.rows({selected: true}).data().toArray();
	}

});


