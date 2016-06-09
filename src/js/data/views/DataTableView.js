/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.DataTableView = Backbone.View.extend({

	id: 'grid-panel',
	className: 'panel',

	initialize: function() {
		console.log("DataTableView.init " + this.model);			
		this.listenTo(Donkeylift.app.filters, 'update', this.renderFilterButtons);
	},

	tableTemplate: _.template($('#grid-table-template').html()),
	columnTemplate: _.template($('#grid-column-template').html()),
	buttonWrapTextTemplate: _.template($('#grid-button-wrap-text-template').html()),

	renderFilterButtons: function() {
		var fields = this.model.get('fields').sortByOrder();
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
		
		dtOptions.lengthMenu = params.lengthMenu || [5, 10, 25, 50, 100];

		dtOptions.displayStart = params.$skip || 0;
		dtOptions.pageLength = params.$top || 10;

		dtOptions.order = [0, 'asc'];
		if (params.$orderby) {
			var order = _.pairs(params.$orderby[0]) [0];
			for(var i = 0; i < fields.length; ++i) {
				if (fields[i].vname() == order[0]) {
					dtOptions.order[0] = i;
					dtOptions.order[1] = order[1];
					break;
				}
			}
		}

		var totalWidth = _.reduce(fields, function(s, f) {
			return s + f.getProp('width');
		}, 0);

		var columns = _.map(fields, function(field) {
			var col = {
				data: field.vname(),
			}

			var width = (100 * field.getProp('width')) / totalWidth;
			col.width = String(Math.floor(width)) + '%';

			col.render = this.columnDataFn(field);

			return col;
		}, this);

		dtOptions.columns = columns;

		return dtOptions;
	},

	getEditorOptions: function(fields) {
		var me = this;
		var dtEditorOptions = {};

		var excludeFields = ['id', 'mod_by', 'mod_on'];

		var editFields = _.filter(fields, function(field) {
			return ! _.contains(excludeFields, field.get('name'));
		});

		dtEditorOptions.fields = _.map(editFields, function(field) {
			var edField = {};

			edField.name = field.vname(); 
			edField.label = field.vname(); 

			if (field.get('type') == Donkeylift.Field.TYPES.DATE) {
				edField.type = 'datetime';

			} else if (field.getProp('width') > 60) {
				edField.type = 'textarea';

			} else if (field.get('fk') == 1) {
				var sourceFn = function(req, response) {
					me.model.fieldValues(field, req.term, function(rows) {
						var options = _.map(rows, function(row) {
							return row[field.vname()];
						});
						response(options);
					});
				}
				edField.type = 'autoComplete';
				edField.opts = {
					source: sourceFn
				};

			} else {
				edField.type = 'text';
			}
			return edField;
		});

		return dtEditorOptions;
	},

	render: function() {
		console.log('DataTableView.render ');			
		this.$el.html(this.tableTemplate());

		var fields = this.model.get('fields').sortByOrder();

		_.each(fields, function(field, idx) {
			var align = idx < fields.length / 2 ? 
				'dropdown-menu-left' : 'dropdown-menu-right';
			
			this.$('thead > tr').append(this.columnTemplate({
				name: field.vname(),
				dropalign: align	
			}));					

		}, this);

		this.renderFilterButtons();


		var filter = Donkeylift.app.filters.getFilter(this.model);			
		var initSearch = {};
		if (filter) initSearch.search = filter.get('value');

		var dtOptions = this.getOptions(this.attributes.params, fields);
		var dtEditorOptions = this.getEditorOptions(fields);
		//console.log(dtEditorOptions);

		this.dataEditor = new $.fn.dataTable.Editor({
			table: "#grid",
			idSrc: "id",
			fields: dtEditorOptions.fields,
			formOptions: {
				main: { 
					focus: -1 
				}
			},
			ajax: this.model.ajaxGetEditorFn(),
		});


		this.dataTable = this.$('#grid').DataTable({
			serverSide: true,
			columns: dtOptions.columns,				
			ajax: this.model.ajaxGetRowsFn(),
			search: initSearch,
			lengthMenu: dtOptions.lengthMenu, 
			displayStart: dtOptions.displayStart, 
			pageLength: dtOptions.pageLength, 
			order: dtOptions.order,
			select: true,
			//dom: "lfrtip",
			buttons: [
				{ extend: "create", editor: this.dataEditor },
				{ extend: "edit", editor: this.dataEditor },
				{ extend: "remove", editor: this.dataEditor }
			]
		});

/* make select row on click work calling select()
   see comment in datatables source about 'Initialisation'
*/
		this.dataTable.select(); 

		if (filter) {
			this.$('#grid_filter input').val(filter.get('value'));
		}

		this.renderTextWrapCheck();

		this.addEvents();
		return this;
	},

	addEvents: function() {
		var me = this;

		this.$('.field-filter').click(function(ev) {
			ev.stopPropagation();

			if ( ! $(this).data('bs.dropdown')) {
				//workaround for first click to show dropdown
				$(this).dropdown('toggle');
			} else {
				$(this).dropdown();
			}

			var colName = $(this).data('column');
			var field = me.model.get('fields').getByName(colName);
			var el = me.$('#col-' + colName + ' div.dropdown-menu');

			var filter = new Donkeylift.Filter({
				table: me.model,
				field: field
			});

			Donkeylift.app.setFilterView(filter, el);
		});

		this.$('#grid').on('draw.dt', function() {

			//expand ellipsis on click
			me.$('button.ellipsis').click(function(ev) {				
				//wrap text before expaning
				$(ev.target).parents('span').css('white-space', 'normal');	

				var fullText = $(ev.target).parents('span').attr('title');
				$(ev.target).parents('span').html(fullText);
			});
		});

		this.$('#grid').on('page.dt', function() {
			console.log("page.dt");
			Donkeylift.app.router.navigate("reload-table", {trigger: false});			
		});

		this.$('#grid').on('init.dt', function() {
			console.log("init.dt");

			me.dataTable.buttons().container()
				.removeClass('dt-buttons')
				.addClass('btn-group');

			me.dataTable.buttons().container().children()
				.removeClass('dt-button')
				.addClass('btn btn-default navbar-btn')

			$('#menu').append(me.dataTable.buttons().container());
		});

		//using order.dt event won't work because its fired otherwise, too
		this.$('th.sorting').click(function() {
			console.log("order.dt");
			Donkeylift.app.router.navigate("reload-table", {trigger: false});			
		});

		//using search.dt event won't work because its fired otherwise, too
		this.$('input[type="search"]').blur(function() {
			console.log("search.dt");
			Donkeylift.app.router.navigate("reload-table", {trigger: false});			
		});
		this.$('input[type="search"]').focus(function() {
			console.log("search.dt");
			Donkeylift.app.router.navigate("reload-table", {trigger: false});			
		});

		this.dataEditor.on('preSubmit', function(ev, req, action) {
			me.model.sanitizeEditorData(req);
			if (req.error) {
				me.dataEditor.error(req.error.field, req.error.message);
			}
		});

		this.dataEditor.on('submitError', function(ev, xhr, err, thrown, data) {
			me.dataEditor.error(xhr.responseText);
		});
	},

	columnDataFn: function(field) {

		var me = this;

		var btnExpand = '<button class="ellipsis btn btn-default btn-xs"><span class="glyphicon glyphicon-option-horizontal" aria-hidden="true"></span></button>'
		var w = field.getProp('width');
		var abbrFn = function (data) {
			var s = field.toFS(data);
	   		return s.length > w
				?  '<span title="' + s.replace(/"/g, '&quot;') + '">'
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
	}

});


