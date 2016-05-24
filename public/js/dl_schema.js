/*global Backbone, $ */
var DONKEYLIFT_API = "http://api.donkeylift.com";  //set by gulp according to env var DONKEYLIFT_API. e.g. "http://api.donkeylift.com";
var Donkeylift = {};

function AppBase(opts) {
    
		opts = opts || {};

		this.user = opts.user || 'demo';
        this.schemas = new Donkeylift.Schemas(null, {url: DONKEYLIFT_API + '/' + this.user});
		this.schemaCurrentView = new Donkeylift.SchemaCurrentView();

}

AppBase.prototype.start = function() {
	var me = this;
	this.schemas.fetch({success: function() {
		me.schemaListView = new Donkeylift.SchemaListView({collection: me.schemas});
		$('#schema-list').append(me.schemaListView.render().el);
	}});

	this.menuView.render();

	Backbone.history.start();

	$('#toggle-sidebar').hide();

	$('#toggle-sidebar').click(function() {
		me.toggleSidebar();
	}); 

	$(document).ajaxStart(function() {
		$('#ajax-progress-spinner').show();
	});
	$(document).ajaxStop(function() {
		$('#ajax-progress-spinner').hide();
	});
	
}

AppBase.prototype.toggleSidebar = function() {
	if ($('#table-list').is(':visible')) {
        $('#menu').hide('slide');
        $('#table-list').hide('slide', function() {
		   	$('#module').toggleClass('col-sm-16 col-sm-13');             
		   	$('#sidebar').toggleClass('col-sm-3 col-sm-0');
		});
	} else {
		$('#module').toggleClass('col-sm-16 col-sm-13');             
		$('#sidebar').toggleClass('col-sm-3 col-sm-0');
    	$('#table-list').show('slide');
        $('#menu').show('slide');
	}
}

AppBase.prototype.createTableView = function(table, params) {
	//overwrite me
}

AppBase.prototype.setTable = function(table, params) {
	console.log('app.setTable ' + params);
	var $a = $("#table-list a[data-target='" + table.get('name') + "']");
	$('#table-list a').removeClass('active');
	$a.addClass('active');

	this.table = table;
	if (this.tableView) this.tableView.remove();

	this.tableView = this.createTableView(table, params);

	$('#content').html(this.tableView.render().el);			
	this.menuView.render();
}

AppBase.prototype.resetTable = function() {
	if (this.table) this.setTable(this.table);
}

AppBase.prototype.unsetTable = function() {
	this.table = null;
	if (this.tableView) this.tableView.remove();
}

/**** schema stuff ****/

AppBase.prototype.unsetSchema = function() {
	this.unsetTable();
	this.schema = null;
	if (this.tableListView) this.tableListView.remove();
	$('#content').empty();
	this.schemaCurrentView.render();
}

AppBase.prototype.createSchema = function(name) {
	//overwrite me
}

AppBase.prototype.setSchema = function(name, cbAfter) {
	var me = this;
	console.log('AppBase.setSchema ' + name);
	var loadRequired = ! this.schema || this.schema.get('name') != name;

	if (loadRequired) {
		console.log('app.setSchema loadRequired');
		this.unsetSchema();
		this.schema = this.createSchema(name);
		this.schema.fetch(function() {
			me.tableListView = new Donkeylift.TableListView({
				collection: me.schema.get('tables')
			});
			$('#sidebar').append(me.tableListView.render().el);
			$('#toggle-sidebar').show();

			me.menuView.render();
			//render current schema label
			me.schemaCurrentView.render();
			if (cbAfter) cbAfter();
		});
	} else {
		if (cbAfter) cbAfter();
	}
}

Donkeylift.AppBase = AppBase;


/*global Backbone, Donkeylift */

Donkeylift.Alias = Backbone.Model.extend({ 
	
	initialize: function(attrs) {
	},

	toString: function() {
		return this.get('table').get('name') + '.' 
			 + this.get('field').get('name');
	}

});

Donkeylift.Alias.parse = function(tableName, fieldName) {
	//console.log('Alias.parse ' + tableName + '.' + fieldName);
	var table = Donkeylift.app.schema.get('tables').getByName(tableName);
	var field = table.get('fields').getByName(fieldName);
	return new Donkeylift.Alias({table: table, field: field});
}


/*global Donkeylift, Backbone, _ */

Donkeylift.Field = Backbone.Model.extend({
	initialize: function(field) {

		//strip type from e.g. VARCHAR(256) and NUMERIC(8,2) 
		var rxp = /(\w+)(\([0-9,]+\))?/
		var match = field.type.match(rxp)
		this.set('type', Donkeylift.Field.TypeAlias(match[1]));
		this.set('props', field.props || {});
	},

	vname: function() {
		if (this.get('fk') == 0) {
			return this.get('name');

		} else if (this.get('name').match(/id$/)) { 
			return this.get('name').replace(/id$/, "ref");

		} else {
			return this.get('name') + "_ref";
		}
	},

	getProp: function(name) {
		return this.get('props')[name];
	},

	setProp: function(name, value) {
		this.get('props')[name] = value;
	},

	attrJSON: function() {
		return _.clone(this.attributes);
	},

	toJSON: function() {
		var type = Donkeylift.Field.ALIAS[this.get('type')];

		return {
			name: this.get('name'),
			type: type,
			props: this.get('props')
		};
	},

	parse: function(val) {
		if (this.get('fk') == 1 && _.isString(val)) {
			//its a string ref
			return val;
		}
		var t = this.get('type');
		if (t == Donkeylift.Field.TYPES.INTEGER) {
			return parseInt(val);
		} else if(t == Donkeylift.Field.TYPES.NUMERIC) {
			return parseFloat(val);
		} else if(t == Donkeylift.Field.TYPES.DATE) {
			//return new Date(val);
			return new Date(val).toISOString().substr(0,10);
		} else if (t == Donkeylift.Field.TYPES.DATETIME) {
			//return new Date(val);
			return new Date(val).toISOString();
		} else {
			return val;
		}
	},

	//to formatted string
	toFS: function(val) {
		if (this.get('type') == Donkeylift.Field.TYPES.NUMERIC) {
			return this.getProp('scale') 
				? val.toFixed(this.getProp('scale')) 
				: String(val);

		} else {
			return String(val);
		}
	},

	//to query string
	toQS: function(val) {
		if (this.get('fk') == 1 && _.isString(val)) {
			//its a string ref
			return "'" + val + "'";
		}
		var t = this.get('type');
		if (t == Donkeylift.Field.TYPES.INTEGER
			|| t == Donkeylift.Field.TYPES.NUMERIC) {
			return val;
		} else {
			return "'" + val + "'";
		}
	}

});

Donkeylift.Field.create = function(name) {
	return new Donkeylift.Field({
		name: name,
		type: 'VARCHAR',
	});
}


Donkeylift.Field.TYPES = {
	'INTEGER': 'Integer',
	'NUMERIC': 'Decimal',
	'VARCHAR': 'Text',
	'DATE': 'Date',
	'DATETIME': 'Timestamp'
}

Donkeylift.Field.ALIAS = _.invert(Donkeylift.Field.TYPES);

Donkeylift.Field.TypeAlias = function(type) {
	return Donkeylift.Field.TYPES[type];
}

Donkeylift.Field.toDate = function(dateISOString) {
	return new Date(dateISOString.split('-')[0],
					dateISOString.split('-')[1] - 1,
					dateISOString.split('-')[2]);
}

Donkeylift.Field.getIdFromRef = function(val) {
	if (_.isNumber(val)) return val;
	//extract fk from ref such as 'Book [12]'
	var m = val.match(/^(.*)\[([0-9]+)\]$/);
	//console.log(val + " matches " + m);
	return m[2];
}



/*global Donkeylift, Backbone */

Donkeylift.Relation = Backbone.Model.extend({ 
	initialize: function(relation) {
		this.set('type', Donkeylift.Relation.Type(relation));
	}

});

Donkeylift.Relation.create = function(table) {
	return new Donkeylift.Relation({
		table: table,
		related: null, 
		field: null, 
	});	
}

Donkeylift.Relation.Type = function(relation) {
  	if (relation.field && relation.field.name == 'id') return 'one-to-one';
	else return 'many-to-one';
}

/*global _, Donkeylift, Backbone */

Donkeylift.Schema = Backbone.Model.extend({

	initialize: function(attrs) {
		console.log("Schema.initialize " + attrs.name);

		if ( ! attrs.table) this.set('tables', new Donkeylift.Tables());

		//this.set('id', attrs.name); //unset me when new
		//this.orgJSON = this.toJSON();
	},

	attrJSON: function() {
		return _.clone(this.attributes);
	},		

	toJSON : function() {
		var tables = this.get('tables').map(function(table) {
			return table.toJSON();	
		});
		return {
			name: this.get('name'),
			tables: tables
		};
	},	

	isEmpty : function() {
		var totalRowCount = this.get('tables').reduce(function(sum, table) {
			return sum + table.get('row_count');
		}, 0);	
		console.log(this.get('name') + ' has ' + totalRowCount + ' rows.');
		return totalRowCount == 0;
	},

	parse : function(response) {
		console.log("Schema.parse " + response);
		var tables = _.map(response.tables, function(table) {
			return new Donkeylift.Table(table);
		});
		response.tables = new Donkeylift.Tables(tables);
		return response;
	},

	url : function() {
		return Donkeylift.app.schemas.url() + '/' + this.get('name');
	},

	fetch : function(cbAfter) {
		var me = this;
		console.log("Schema.fetch...");
		Backbone.Model.prototype.fetch.call(this, {
			success: function() {
				console.log("Schema.fetch OK");
				cbAfter();
			}
		});
	},

	update : function() {
		console.log("Schema.update...");
return;
		//TODO
		var me = this;			
		this.save(function(err) {
			if (err) {
				//TODO
				console.log(err);
				alert('ERROR on update ' + me.get('name') + '. ' 
					+ err.status + " " + err.responseText);
			}
		});
	},


	save : function(cbResult) {
		console.log("Schema.save...");
		var saveOptions = {
			url: this.url()
			, parse: false
			, success: function(model) {
				Donkeylift.app.schema = model;

				//reload schema list
				Donkeylift.app.schemas.fetch({
					reset: true,
					success: function() {
						cbResult();
					},
					error: function(model, response) {
						cbResult(response);
					}
				});
			}
			, error: function(model, response) {
				console.log("Schema.save ERROR");
				console.dir(response);
				cbResult(response);
			}
		};

		//set id to (new) name
		this.set('id', this.get('name'));
		console.log("Schema.save " + saveOptions.url);

		Backbone.Model.prototype.save.call(this, null, saveOptions);
	},


	destroy: function(cbResult) {
		var destroyOptions = {
			success: function() {			
				Donkeylift.app.unsetSchema();
				Donkeylift.app.schemas.fetch({
					reset: true,
					success: function() {
						cbResult();
					},
					error: function(model, response) {
						cbResult(response);
					}
				});
			},
			error: function(model, response) {
				console.dir(response);
				cbResult(response);
			}
		};

		Backbone.Model.prototype.destroy.call(this, destroyOptions);
	},

	getFieldFromQN: function(fieldQName) {
		var parts = fieldQName.split('.');
		var table = this.get('tables').getByName(parts[0]);
		var field = table.get('fields').getByName(parts[1]);
		return { table: table, field: field };
	}

});

/*global Donkeylift, Backbone, _ */

//console.log("Table class def");
Donkeylift.Table = Backbone.Model.extend({ 
	
	initialize: function(table) {
		console.log("Table.initialize " + table.name);
		var fields = _.map( _.sortBy(table.fields, 'order'), 
					function(field) {
			return new Donkeylift.Field(field);
		});			
		this.set('fields', new Donkeylift.Fields(fields));
		this.set('props', table.props);
		//relations and row_alias are set in initRefs
	},

	initRefs: function(tables) {
		this.initRelations(tables);
		this.initAlias(tables);
		this.initJSON = this.toJSON();
	},

	isDirty: function() {
		return ! _.isEqual(this.initJSON, this.toJSON());
	},

	initRelations : function(tables) {
		var relations = _.map(this.get('referencing'), function(ref) {
			//console.log('adding relation to ' + ref.fk_table + ' fk ' + ref.fk);

			var fk_table = _.find(tables, function(t) { 
				return t.get('name') == ref.fk_table;
			});
			var fk = this.get('fields').getByName(ref.fk);

			return new Donkeylift.Relation({
				table: this,
				related: fk_table,
				field: fk
			});
		}, this);
		this.set('relations', new Donkeylift.Relations(relations), {silent: true});
	},

	initAlias : function(tables) {

		//console.log('table: ' + this.get('name'));
		//console.log('row_alias: ' + this.get('row_alias'));
		var row_alias = [];
		_.each(this.get('row_alias'), function(a) {
			//console.log('alias_part: ' + a);
			var alias = a.split('.');
			var alias_table;
			var field_name;
			if (alias.length == 2) {
				var alias_table = _.find(tables, function(t) {
						return t.get('name') == alias[0];
				});
				field_name = alias[1];
			} else {
				alias_table = this;
				field_name = alias;
			}
			var alias_field = _.find(alias_table.get('fields').models, 
				function(f) {
					return f.get('name') == field_name;
			});
			row_alias.push(new Donkeylift.Alias({
						table : alias_table,
						field : alias_field
			}));

		}, this);
		this.set('row_alias', row_alias, {silent: true});
	},
	
	getFieldQN: function(field) {
		return _.isString(field) 
			? this.get('name') + '.' + field
			: this.get('name') + '.' + field.get('name');
	},

	createView: function(options) {
		return new Donkeylift.TableView(options);
	},

	attrJSON: function() {
		return _.clone(this.attributes);
	},		

	toJSON: function() {
		var fields = this.get('fields').map(function(field) {
			return field.toJSON();
		}); 
		fields = _.object(_.pluck(fields, 'name'), fields);

		this.get('relations').each(function(relation) {
			var field = fields[relation.get('field').get('name')];
			field.fk_table = relation.get('related').get('name');
		});

		var row_alias = _.map(this.get('row_alias'), function(a) {
			if (a.get('table') == this) return a.get('field').get('name');
			else return a.toString();	
/*
			var parts = fieldQName.split('.');
			if (parts[0] == this.get('name')) return parts[1];
			else return fieldQName;
*/
		}, this);

		return {
			name: this.get('name'),
			row_alias: row_alias,
			fields: fields
		};
	}

});

Donkeylift.Table.create = function(name) {
	var fields = [ 
		{ name: 'id', type: 'INTEGER', props: { order: 1} },
		{ name : 'mod_by', type: 'VARCHAR', props: {order: 2} },
		{ name : 'mod_on', type: 'DATETIME', props: {order: 3} }
	];
	var table = new Donkeylift.Table({
		name: name,
		fields: fields
	});
	table.initRefs();
	return table;
}

/*global Backbone, Donkeylift */

Donkeylift.Fields = Backbone.Collection.extend({
	// Reference to this collection's model.
	model: Donkeylift.Field,
	
	initialize: function(attrs) {
		//this.on('change', function(ev) { console.log('Fields.ev ' + ev); });
	},

	addNew: function(field) {
		field = field || Donkeylift.Field.create('field' + this.length);
		field.setProp('order', this.length + 1);
		this.add(field);
		return field;
	},

	getByName: function(name) {
		return this.find(function(f) { 
			return f.vname() == name || f.get('name') == name; 
		});
	},
	
	sortByOrder: function() {
		return this.sortBy(function(field) {
				return field.getProp('order');
		}, this);
	}
});


/*global Backbone, Donkeylift */

// Tables Collection
// ---------------

Donkeylift.Relations = Backbone.Collection.extend({
	// Reference to this collection's model.
	model: Donkeylift.Relation,
	
	addNew: function(table) {
		console.log('Relations addNew ' + table.get('name'));
		var relation = new Donkeylift.Relation.create(table);
		this.add(relation);
		return relation;
	}

});


/*global Backbone, Donkeylift */

Donkeylift.Schemas = Backbone.Collection.extend({

	initialize: function(models, options) {
		console.log("Schemas.initialize " + options);
		this._url = options.url;
	},

	//Schemas is just a list of schema names
	//model: Donkeylift.Schema,

	url	: function() { 
		return this._url;
	},

	parse : function(response) {
		console.log("Schemas.parse ");
		return _.values(response.databases);
		//return _.values(response);
	},

});


/*global Donkeylift, Backbone, _ */

// Tables Collection
// ---------------

Donkeylift.Tables = Backbone.Collection.extend({
	// Reference to this collection's model.
	model: Donkeylift.Table,

	initialize : function(tables) {
		_.each(tables, function(table) {				
			table.initRefs(tables);
		});
	},

	getByName: function(name) {
		return this.find(function(t) { return t.get('name') == name; });
	},

	getAncestors: function(table) {
		var result = [];
		var tables = [table];
		while(tables.length > 0) {
			var it = tables.shift();
			var parents = it.get('parents');
			_.each(parents, function(tn) {
				var pt = this.getByName(tn);
				if (pt != it) {
					result.push(pt);
					tables.push(pt);
				}
			}, this);
		}
		return result;
	}

});

/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.DownloadsView = Backbone.View.extend({
	el:  '#content',

	events: {
		//'click #reset-all-filters': 'evResetAllFilters'
	},

	initialize: function() {
		console.log("MenuView.init");
		//this.listenTo(Donkeylift.table, 'change', this.render);
	},

	template: _.template($('#downloads-template').html()),

	render: function() {
		console.log('DownloadsView.render ');			
		this.$el.html(this.template());
		return this;
	},

});



/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.SchemaCurrentView = Backbone.View.extend({
	el:  '#schema-list',

	initialize: function() {
	},

	render: function() {
		console.log('SchemaCurrentView.render ');			
		if (Donkeylift.app.schema) {
			this.$('a:first span').html(' DB ' 
				+ Donkeylift.app.schema.get('name'));
		} else {
			this.$('a:first span').html(' Choose DB ');
		}		
		return this;
	},


});



/*global Donkeylift, Backbone, $, _ */

Donkeylift.SchemaListView = Backbone.View.extend({
	//el:  '#schema-select',

	tagName: 'ul',
	className: 'dropdown-menu alert-dropdown',

	events: {
		'click .schema-option': 'evSchemaClick'
	},

	initialize: function() {
		console.log("SchemaListView.init");
		this.listenTo(this.collection, 'reset', this.render);
	},

	template: _.template($('#schema-select-template').html()),

	render: function() {
		console.log('SchemaListView.render ');			
		//var el = this.$('ul');
		this.$el.empty();	
		this.collection.each(function(schema) {
			this.$el.append(this.template({name: schema.get('name')}));
		}, this);
		
		return this;
	},

	evSchemaClick: function(ev) {
		var name = $(ev.target).attr('data-target');
		console.log('SchemaListView.evSchemaClick ' + name);
		Donkeylift.app.setSchema(name);
	}

});



/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.TableListView = Backbone.View.extend({

	
	id: "table-list",
	className: "list-group",

	events: {
		//'click .table-item': 'evTableClick'
	},

	initialize: function() {
		console.log("TableListView.init " + this.collection);
		this.listenTo(this.collection, 'update', this.render);
		this.listenTo(this.collection, 'change', this.render);
	},

	template: _.template($('#table-list-template').html()),
	itemTemplate: _.template($('#table-item-template').html()),

	render: function() {
		console.log('TableListView.render ');			
		this.$el.html(this.template());
		this.collection.each(function(table) {
			var href = "#table" 
					+ "/" + table.get('name');
			this.$el.append(this.itemTemplate({
				name: table.get('name'),
				href: href
			}));
		}, this);			
		return this;
	},
});




/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.AliasEditView = Backbone.View.extend({
	el:  '#modalEditAlias',

	events: {
		'click #modalAliasUpdate': 'evUpdateClick',
		'click #modalAliasRemove': 'evRemoveClick',
	},

	initialize: function() {
		console.log("AliasEditView.init");
	},

	setModel: function(model, alias) {
		this.model = model;
		this.alias = alias;
	},

	

	render: function() {
		console.log("AliasEditView.render ");

		var el = this.$('#modalInputAliasField');

		el.html('');

		var aliasTables = [ this.model ]
				.concat(Donkeylift.app.schema.get('tables').getAncestors(this.model));
					
		_.each(aliasTables, function(table) {
			el.append('<optgroup label="' + table.get('name') + '">');
			table.get('fields').each(function(field) {
				var qn = table.getFieldQN(field);
				el.append($('<option></option>')
					.attr('value', qn)
					.text(field.get('name')));
			}, this);
			el.append('</optgroup>');
		});
		
		if (this.alias) {
			el.val(this.alias.toString());
		}

		$('#modalEditAlias').modal();
		return this;
	},

	evUpdateClick: function() {
		var newFieldQName = $('#modalInputAliasField').val();
//console.log(this.model.get('row_alias'));
		var alias = Donkeylift.Alias.parse(
						newFieldQName.split('.')[0],
						newFieldQName.split('.')[1]
		);	

		var i = this.model.get('row_alias').indexOf(this.alias);
console.log(i);
		if (i >= 0) {
			this.model.get('row_alias').splice(i, 1, alias);
		} else {
			this.model.get('row_alias').push(alias);
		}

		this.model.trigger('change:row_alias'); //trigger change
//console.log(this.model.get('row_alias'));
	},

	evRemoveClick: function() {	
		var i = this.model.get('row_alias').indexOf(this.alias);
		if (i >= 0) {
			this.model.get('row_alias').splice(i, 1);
			this.model.trigger('change:row_alias'); //trigger change
		}
//console.log(this.model.get('row_alias'));
	},


});



/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.AliasView = Backbone.View.extend({

	//el: '#alias',

	events: {
		'click .edit-alias': 'evEditAliasClick',
	},

	initialize: function () {
		console.log("AliasView.init " + this.model.get('row_alias'));
		this.listenTo(this.model, 'change:row_alias', this.render);
	},

	template: _.template($('#alias-field-template').html()),

	render: function() {
		console.log("AliasView.render");

		this.$el.find('tbody').empty();
//console.log(this.model.get('row_alias'));
		_.each(this.model.get('row_alias'), function(a) {
			this.$el.find('tbody').append(this.template({
				table: a.get('table').get('name'),
				field: a.get('field').get('name')
			}));
		}, this);
	},

	evEditAliasClick: function(ev) {				
		console.log("evEditAliasView.click");
		var table = $(ev.target).parents('tr').find('td:eq(0)').text();
		var field = $(ev.target).parents('tr').find('td:eq(1)').text();

		var alias = _.find(this.model.get('row_alias'), function(a) {
			return a.get('table').get('name') == table 
				&& a.get('field').get('name') == field;
		});

		//console.log(fieldQName);
		Donkeylift.app.aliasEditView.setModel(this.model, alias);
		Donkeylift.app.aliasEditView.render();
	},

});



/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.FieldEditView = Backbone.View.extend({
	el:  '#modalEditField',

	events: {
		'click #modalFieldUpdate': 'updateClick',
		'click #modalFieldRemove': 'removeClick'
	},

	initialize: function() {
		console.log("FieldEditView.init");
	},

	render: function() {
		console.log("FieldEditView.render " + this.model.get('type'));
		$('#modalInputFieldName').val(this.model.get('name'));
		$('#modalInputFieldType').val(this.model.get('type'));
		$('#modalInputFieldLength').val(this.model.get('length'));
		$('#modalEditField').modal();
		return this;
	},

	updateClick: function() {
		console.log("FieldEditView.updateClick ");
		this.model.set('name', $('#modalInputFieldName').val());
		this.model.set('type', $('#modalInputFieldType').val());
		this.model.set('length', $('#modalInputFieldLength').val());

		Donkeylift.app.table.get('fields').addNew(this.model);
		Donkeylift.app.schema.update();
	},

	removeClick: function() {	
		console.log("FieldEditView.removeClick " + this.model.collection);
		if (this.model.collection) {
			this.model.collection.remove(this.model);
			Donkeylift.app.schema.update();
		}
	}

});



/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.FieldView = Backbone.View.extend({

	tagName: 'tr',

	events: {
		'click .edit-field': 'editFieldClick',
	},

	initialize: function () {
		//console.log("TableView.init " + this.model.get('name'));
		this.listenTo(this.model, 'change', this.render);
	},

	template: _.template($('#field-template').html()),

	render: function() {
		//console.log("FieldView.render " + this.model.get("name"));
		var attrs = this.model.attrJSON();
		attrs.props = _.map(attrs.props, function(v, k) {
			return k + ": " + v;
		}).join(' | ');
		this.$el.html(this.template(attrs));
		return this;
	},

	editFieldClick: function(ev) {				
		Donkeylift.app.fieldEditView.model = this.model;
		Donkeylift.app.fieldEditView.render();
	},


});



/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.MenuSchemaView = Backbone.View.extend({
	el:  '#menu',

	events: {
		'click #add-table': 'evAddTableClick'
		, 'click #new-schema': 'evNewSchemaClick'
		, 'click #save-schema': 'evSaveSchemaClick'
		, 'click #vis-tablegraph': 'evVisTableGraphClick'
	},

	initialize: function() {
		console.log("MenuView.init");
		//this.listenTo(Donkeylift.app.schema, 'change', this.render);
	},

	template: _.template($('#schema-menu-template').html()),

	render: function() {
		console.log('MenuSchemaView.render ' + Donkeylift.app.schema);			
		this.$el.show();
		this.$el.html(this.template());
		this.$('#add-table').prop('disabled', Donkeylift.app.schema == null);
		this.$('#save-schema').prop('disabled', Donkeylift.app.schema == null);

		return this;
	},

	evAddTableClick: function() {
		var table = Donkeylift.Table.create();
		Donkeylift.app.tableEditView.model = table;
		Donkeylift.app.tableEditView.render();
		
	},


	evSaveSchemaClick: function() {
		Donkeylift.app.schemaEditView.model = Donkeylift.app.schema;
		Donkeylift.app.schemaEditView.render();
	},


	evNewSchemaClick: function() {
		Donkeylift.app.schemaEditView.model = new Donkeylift.Schema({});
		Donkeylift.app.schemaEditView.render();
	},

	evVisTableGraphClick: function() {
		if ( ! this.graphView) {
			this.graphView = new Donkeylift.SchemaGraphView();
		}
		this.graphView.model = Donkeylift.app.schema;
		this.graphView.render();
	},
});


/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.RelationEditView = Backbone.View.extend({
	el:  '#modalEditRelation',

	events: {
		'click #modalRelationUpdate': 'updateClick',
		'click #modalRelationRemove': 'removeClick',
		'change #modalInputRelationType': 'typeChange'
	},

	initialize: function() {
		console.log("RelationEditView.init");
	},

	render: function() {
		console.log("RelationEditView.render " + this.model);

		var el = $('#modalInputRelationTable')
		el.html('');
		Donkeylift.app.schema.get('tables').each(function(table) {
			el.append($('<option></option>')
				.attr('value', table.get('name'))
				.text(table.get('name')));
		});
		
		el.val('');
		if (this.model.get('related'))
			el.val(this.model.get('related').get('name'));

		el = $('#modalInputRelationField')
		el.html('');
		this.model.get('table').get('fields').each(function(field) {
			if (field.get('type') == 'Integer' && field.get('name') != 'id') {
				el.append($('<option></option>')
					.attr('value', field.get('name'))
					.text(field.get('name')));
			}
		});

		el.val('');
		if (this.model.get('field'))
			el.val(this.model.get('field').get('name'));

		$('#modalInputRelationType').val(this.model.get('type'));

		$('#modalEditRelation').modal();
		return this;
	},

	updateClick: function() {
		var newTable = $('#modalInputRelationTable').val();	
		var newType = $('#modalInputRelationType').val();
		var newField = $('#modalInputRelationField').val();
		if (newType == 'one-to-one') newField = 'id';
		else if (_.isEmpty(newField)) {
			//create field as <newTable>_id
			newField = newTable + "_id";
			var f = this.model.get('table').get('fields').addNew();
			f.set('name', newField);
			f.set('type', Donkeylift.Field.TYPES.INTEGER);
		}

		newField = this.model.get('table').get('fields').getByName(newField);
		newTable = Donkeylift.app.schema.get('tables').getByName(newTable);
		//console.log('new field ' + fields.getByName(newField).get('name'));
		//console.log('new related table ' + tables.getByName(newTable).get('name'));
		
		this.model.set({
			'type': newType,
			'field': newField,
			'related': newTable
		});	
		if ( ! Donkeylift.app.table.get('relations').contains(this.model)) {
			Donkeylift.app.table.get('relations').add(this.model);
		}
		Donkeylift.app.schema.update();
	},

	removeClick: function() {	
		console.log("RelationEditView.removeClick " + this.model.collection);
		if (this.model.collection) {
			this.model.collection.remove(this.model);
			Donkeylift.app.schema.update();
		}
	},

	typeChange: function() {
		var el = $('#modalInputRelationField');	
		if ($('#modalInputRelationType').val() == 'one-to-one') {
			el.val('id'); //doesnt work
			el.prop('disabled', true);
		} else {
			el.prop('disabled', false);
		}
	}

});



/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.RelationView = Backbone.View.extend({

	tagName: 'tr',

	events: {
		'click .edit-relation': 'editRelationClick',
	},

	initialize: function () {
		//console.log("RelationView.init " + this.model.get('table'));
		this.listenTo(this.model, 'change', this.render);
		this.listenTo(this.model, 'change:field', this.setAttributeListeners);
		this.listenTo(this.model, 'change:related', this.setAttributeListeners);
		this.setAttributeListeners();
	},

	setAttributeListeners: function () {
		if (this.model.get('field')) {
			this.listenTo(this.model.get('field'), 'change:name', this.render);
			this.listenTo(this.model.get('related'), 'change:name', this.render);
		}
	},

	template: _.template($('#relation-template').html()),

	render: function() {
		console.log("RelationView.render ");
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	},

	editRelationClick: function(ev) {				
		Donkeylift.app.relationEditView.model = this.model;
		Donkeylift.app.relationEditView.render();
	},


});



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



/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.SchemaGraphView = Backbone.View.extend({

	el:  '#content',
	events: {
		'click .join-tree-item': 'evJoinTreeClick'
	},

	initialize: function() {
		console.log("SchemaGraphView.init");
	},

	template: _.template($('#schema-graph-template').html()),
	drop_template: _.template('<li><a href="#" class="join-tree-item">Tree #<%= id%></a></li>'),

	render: function() {
		console.log("SchemaGraphView.render " + this.model.get("name"));
		this.$el.html(this.template());
		var elTrees = _.map(this.model.get('join_trees'), function(tree, idx) {
			return this.drop_template({id: idx});
		}, this);
		this.$('ul.dropdown-menu').html(elTrees);
		this.renderGraph();
	},

	evJoinTreeClick: function(ev) {
		var idx = $(ev.target).closest('li').index();
		console.log('evJoinTreeClick ' + idx);

		var tree = this.model.get('join_trees')[idx];
		//console.log(tree);
		var edges = [];
		_.each(tree.joins, function(join) {
			var table = this.model.get('tables').getByName(join.v);
			var fks = table.get('fields').filter(function(f) {
				return f.get('fk_table') == join.w;
			});
			_.each(fks, function(fk) {
				edges.push(table.getFieldQN(fk));
			});
		}, this);
		//console.log(edges);

		Donkeylift.app.visNetwork.setSelection(
			{ 
				nodes: tree.tables, 
				edges: edges	
			}, 
			{ highlightEdges: false }
		);

	},

	renderGraph: function() {
		var nodes = this.model.get("tables").map(function(table) {
			return { 
				id: table.get('name'), 
				label: table.get('name')
			};
		}); 
		var edges = _.flatten(this.model.get('tables').map(function(table) {
			return _.map(table.get('referencing'), function(ref) {
				return { 
					from: table.get('name'), 
					to: ref.fk_table,
					id: table.get('name') + '.' + ref.fk,
					title: ref.fk
				};
			});
		})); 
		console.log(edges);
		
	   // provide the data in the vis format
	    var data = {
	        nodes: new vis.DataSet(nodes),
	        edges: new vis.DataSet(edges)
	    };
	    var options = {
	    	nodes: {
	    		shape: 'box'	
				, color: {
					highlight: {
						background: 'orange'
						, border: 'red'
					}
				}
	    	}
	    	, edges : {
	    		font: {
	    			align: 'horizontal'
	    		}
	    		, arrows: 'to'
	    	}
	    	, layout: {
	    		hierarchical: {
	    			enabled: false
	    			, direction: 'UD'
	    		}
	    	}
	    	, physics: {
	    		barnesHut: {
	    			springConstant: 0.03
	    		}
	    	}
	    };
	
	    // initialize your network!
	    var network = new vis.Network(this.$("#vis-graph").get(0), data, options);		
		Donkeylift.app.visNetwork = network;
		
		return this;
	}

/*

Donkeylift.app.visNetwork.setSelection({ nodes: ['Player', 'Team', 'Position'], edges: ['Player.Team_id', 'Player.PreferredPosition_id'] }, { highlightEdges: false});

*/


});



/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.SchemaTableView = Backbone.View.extend({

	//el:  '#content',

	events: {
		'click .edit-table': 'evEditTableClick',
		'click #add-field': 'evNewFieldClick',
		'click #add-relation': 'evNewRelationClick',
		'click #add-alias': 'evNewAliasClick'
	},

	initialize: function () {
		//console.log("TableView.init " + this.model.get('name'));
		this.listenTo(this.model, 'change', this.render);
		//this.listenTo(this.model.get('fields'), 'reset', this.setFields);
		this.listenTo(this.model.get('fields'), 'add', this.addField);
		this.listenTo(this.model.get('fields'), 'remove', this.removeField);
		this.listenTo(this.model.get('relations'), 'add', this.addRelation);
		this.listenTo(this.model.get('relations'), 'remove', this.removeRelation);
		this.fieldViews = {};
		this.relationViews = {};
	},

	template: _.template($('#table-template').html()),

	render: function() {
		console.log("TableView.render " + this.model.get("name"));
		this.$el.html(this.template(this.model.attrJSON()));

		var me = this;
		this.elFields().sortable({
			stop: function() {
				$('tr', me.elFields()).each(function(index) {
					var name = $('td:eq(2)', this).text();
					//console.log(name + ' = ' + (index + 1));
					var field = me.model.get('fields').getByName(name);
					field.setProp('order', index + 1);
				});
				me.render();
			}
		});

		this.setFields();
		this.setRelations();

		this.aliasView = new Donkeylift.AliasView({
			el: this.$('#alias'),
			model: this.model,
		});
		this.aliasView.render();

		return this;
	},

	elFields: function() {
		return this.$('#fields tbody');
	},

	elRelations: function() {
		return this.$('#relations tbody');
	},

	evEditTableClick: function(ev) {				
		Donkeylift.app.tableEditView.model = this.model;
		Donkeylift.app.tableEditView.render();
	},

	evNewFieldClick: function() {
		console.log('TableView.evNewFieldClick');
		var field = Donkeylift.Field.create();
		//var field = this.model.get('fields').addNew();
		Donkeylift.app.fieldEditView.model = field;
		Donkeylift.app.fieldEditView.render();
	},

	removeField: function(field) {
		console.log('SchemaView.removeField ' + field.get('name'));
		this.fieldViews[field.cid].remove();
	},

	addField: function(field) {
		console.log('TableView.addField ' + field.get("name"));
		var view = new Donkeylift.FieldView({model: field});
		this.elFields().append(view.render().el);
		this.fieldViews[field.cid] = view;
	},

	setFields: function() {
		console.log('TableView.setFields ' + this.model.get('name'));
		_.each(this.fieldViews, function(view) {
			view.remove();
		});
		this.elFields().html('');

		_.each(this.model.get('fields').sortByOrder(), this.addField, this);
	},

	evNewRelationClick: function() {
		console.log('TableView.evNewRelationClick');
		var relation = Donkeylift.Relation.create(this.model);
		//console.log(relation.attributes);
		Donkeylift.app.relationEditView.model = relation;
		Donkeylift.app.relationEditView.render();
	},

	removeRelation: function(relation) {
		console.log('SchemaView.removeRelation ' + relation.cid);
		this.relationViews[relation.cid].remove();
	},

	addRelation: function(relation) {
		console.log('SchemaView.addRelation ' + relation.cid);
		var view = new Donkeylift.RelationView({model: relation});
		this.elRelations().append(view.render().el);
		this.relationViews[relation.cid] = view;
	},

	setRelations: function() {
		this.elRelations().html('');
		this.model.get('relations').each(this.addRelation, this);
	},


	evNewAliasClick: function() {
		console.log('TableView.evNewAliasClick');
		Donkeylift.app.aliasEditView.setModel(this.model, null);
		Donkeylift.app.aliasEditView.render();
	}


});



/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.TableEditView = Backbone.View.extend({
	el:  '#modalEditTable',

	events: {
		'click #modalTableUpdate': 'updateClick',
		'click #modalTableRemove': 'removeClick'
	},

	initialize: function() {
		console.log("TableEditView.init");
	},

	render: function() {
		console.log("TableEditView.render");
		$('#modalInputTableName').val(this.model.get('name'));
		$('#modalEditTable').modal();
		return this;
	},

	updateClick: function() {
		var newName = $('#modalInputTableName').val();
		this.model.set('name', newName);
		if ( ! Donkeylift.app.schema.get('tables').contains(this.model)) {
			Donkeylift.app.schema.get('tables').add(this.model);
			Donkeylift.app.setTable(this.model);
		}
		Donkeylift.app.schema.update();
	},

	removeClick: function() {	
		if (this.model.collection) {
			this.model.collection.remove(this.model);
			Donkeylift.app.tableView.remove();
			Donkeylift.app.schema.update();
		}
	}

});



/*global Donkeylift, Backbone, _ */

(function () {
	'use strict';

	Donkeylift.RouterSchema = Backbone.Router.extend({

        routes: {
			"table/:table": "routeGotoTable",
			"schema/:schema/:table": "routeUrlTableSchema"
        },

		routeUrlTableSchema: function(schemaName, tableName) {
			this.gotoTable(tableName, {
				schema: schemaName
			});
		},

		routeGotoTable: function(tableName) {
			//console.log("routeGotoTable " + tableName);
			this.gotoTable(tableName);
		},

		gotoTable: function(tableName, options) {
			options = options || {};

			var setOthers = function() {
				var table = Donkeylift.app.schema.get('tables').getByName(tableName); 
				Donkeylift.app.setTable(table);
			}

			if (options.schema) {
				Donkeylift.app.setSchema(options.schema, setOthers);

			} else {
				setOthers();
			}


		}

        
	});


})();

/*global Backbone, Donkeylift, $ */

AppSchema.prototype = new Donkeylift.AppBase();
AppSchema.prototype.constructor=AppSchema; 

function AppSchema(opts) {
	
	this.schemaEditView = new Donkeylift.SchemaEditView();
	this.tableEditView = new Donkeylift.TableEditView();
	this.fieldEditView = new Donkeylift.FieldEditView();
	this.relationEditView = new Donkeylift.RelationEditView();
	this.aliasEditView = new Donkeylift.AliasEditView();

	this.menuView = new Donkeylift.MenuSchemaView();
	this.router = new Donkeylift.RouterSchema();
	
}

AppSchema.prototype.start = function() {
	Donkeylift.AppBase.prototype.start.call(this);
	$('#nav-schema').closest("li").addClass("active");
}

AppSchema.prototype.createTableView = function(table, params) {
	return new Donkeylift.SchemaTableView({model: table});
}

AppSchema.prototype.createSchema = function(name) {
	return new Donkeylift.Schema({name : name, id : name});
}

Donkeylift.AppSchema = AppSchema;


