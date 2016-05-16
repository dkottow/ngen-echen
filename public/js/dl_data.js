/*global Backbone, $ */
var DONKEYLIFT_API = "api.donkeylift.com";  //set by gulp according to env var DONKEYLIFT_API. e.g. "http://api.donkeylift.com";
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
			error: function(model, response) {
				console.log("Schema.save ERROR");
				console.dir(response);
				cbResult(response);
			},
			parse: false
		};

		//save existing database
		if (this.get('id') == this.get('name')) {
			saveOptions.url = this.url();
			console.log("Schema.save " + saveOptions.url);
			saveOptions.success = function(model) {	
				console.log("Schema.save OK");
				cbResult();
			}

		//save new database
		} else {
			this.unset('id'); 
			saveOptions.url = Donkeylift.app.schemas.url();
			console.log("Schema.save " + saveOptions.url);
			saveOptions.success = function(model) {
				console.log("Schema.save new OK");
				//set id to (new) name
				model.set('id', model.get('name'));
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
		}

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

/*global Donkeylift, Backbone */

var ROWS_EXT = '.rows';
var STATS_EXT = '.stats';

Donkeylift.DataTable = Donkeylift.Table.extend({

	createView: function(options) {
		return new Donkeylift.DataTableView(options);
	},

	getAllRowsUrl: function() {
		return decodeURI(this.lastFilterUrl).replace(/\t/g, '%09');
	},

	ajaxGetRowsFn: function() {
		var me = this;
		return function(data, callback, settings) {
			console.log('request to api');
			var orderField = me.get('fields')
							.at(data.order[0].column);

			var orderParam = '$orderby='
							+ encodeURIComponent(orderField.vname()
							+ ' ' + data.order[0].dir);

			var skipParam = '$skip=' + data.start;
			var topParam = '$top=' + data.length;

			if (data.search.value.length == 0) {
				//sometimes necessary after back/fwd
				Donkeylift.app.filters.clearFilter(me);
			}

			var filters = Donkeylift.app.filters.clone();

			if (data.search.value.length > 0) {
				filters.setFilter({
					table: me,
					op: Donkeylift.Filter.OPS.SEARCH,
					value: data.search.value
				});
			}

			var q = orderParam
				+ '&' + skipParam
				+ '&' + topParam
				+ '&' + filters.toParam();
			var url = DONKEYLIFT_API + me.get('url') + ROWS_EXT + '?' + q;

			console.log(url);

			me.lastFilterUrl = DONKEYLIFT_API
							 + me.get('url') + ROWS_EXT + '?'
							 + filters.toParam();

			$.ajax(url, {
				cache: false
			}).done(function(response) {
				//console.log('response from api');
				//console.dir(response);

				var fragment = 'data'
							+ '/' + Donkeylift.app.schema.get('name')
							+ '/' + Donkeylift.app.table.get('name')
							+ '/' + q;

				//console.log(fragment);
				Donkeylift.app.router.updateNavigation(fragment, {
					block: 100,
					replace: true
				});

				var data = {
					data: response.rows,
					recordsTotal: response.totalCount,
					recordsFiltered: response.count,
				};
				callback(data);
			});
		}
	},

	reload: function() {
		$('#grid').DataTable().ajax.reload();
	},

	load: function(url) {
		$('#grid').DataTable().ajax.url(url).load();
	},

	dataCache: {},

	stats : function(filter, callback) {
		var me = this;

		var fieldName = filter.get('field').vname();

		var params = { '$select' : fieldName };

		var q = _.map(params, function(v,k) { return k + "=" + v; })
				.join('&');

		var filters = Donkeylift.app.filters.apply(filter);
		q = q + '&' + Donkeylift.Filters.toParam(filters);

		var url = DONKEYLIFT_API + this.get('url') + STATS_EXT
				+ '?' + q;

		console.log('stats ' + me.get('name') + '.' + fieldName
					+ ' ' + url);

		if (this.dataCache[url]) {
			callback(this.dataCache[url][fieldName]);

		} else {
			$.ajax(url, {
			}).done(function(response) {
				//console.dir(response);
				me.dataCache[url] = response;
				callback(response[fieldName]);
			});
		}
	},

	options: function(filter, searchTerm, callback) {
		var me = this;

		var fieldName = filter.get('field').vname();

		var params = {
			'$top': 10,
			'$select': fieldName,
			'$orderby': fieldName
		};

		var q = _.map(params, function(v,k) { return k + "=" + v; })
				.join('&');

		var filters = Donkeylift.app.filters.apply(filter, searchTerm);
		q = q + '&' + Donkeylift.Filters.toParam(filters);

		var url = DONKEYLIFT_API + this.get('url') + ROWS_EXT
				+ '?' + q;

		console.log('options ' + me.get('name') + '.' + fieldName
					+ ' ' + url);

		if (this.dataCache[url]) {
//console.log(this.dataCache[url]);
			callback(this.dataCache[url]['rows']);

		} else {
			$.ajax(url, {
			}).done(function(response) {
				//console.dir(response.rows);
				me.dataCache[url] = response;
				callback(response.rows);
			});
		}
	},

});

/*global Donkeylift, Backbone, _ */

Donkeylift.Database = Donkeylift.Schema.extend({ 

	initialize : function(attrs, options) {
		console.log("Database.initialize " + (attrs.name || ''));
		Donkeylift.Schema.prototype.initialize.call(this, attrs);
	},

	parse : function(response) {
		console.log("Database.parse " + response);

		var tables = _.map(response.tables, function(table) {
			return new Donkeylift.DataTable(table);
		});
		response.tables = new Donkeylift.Tables(tables);
		return response;
	},
});		

/*global Donkeylift, Backbone, _ */

Donkeylift.Filter = Backbone.Model.extend({

	initialize: function(attrs) {
		console.log("Filter.initialize ");			

		
		if (_.isString(attrs.table)) {
			this.set('table', 
				Donkeylift.app.schema.get('tables').getByName(attrs.table));
		}

		if (attrs.field && _.isString(attrs.field)) {
			this.set('field', 
				this.get('table').get('fields').getByName(attrs.field));
		}

		this.set('id', Donkeylift.Filter.Key(attrs.table, attrs.field));

	},

	values: function() {
		var me = this;

		var val = _.isArray(this.get('value')) ? 
					this.get('value') : [ this.get('value') ];

		return val.map(function(v) {
			if (me.get('field').get('fk') == 1 
				&& me.get('op') == Donkeylift.Filter.OPS.IN) {

				return Donkeylift.Field.getIdFromRef(v);

			} else {
				return me.get('field').toQS(v);
			}
		});
	},

	toParam: function() {
		var f = this.get('field') ? this.get('field').vname() : null;
		var param;

		if (this.get('op') == Donkeylift.Filter.OPS.SEARCH) {
			var key = Donkeylift.Filter.Key(this.get('table'), f);
			param = key + " search '" + this.get('value') + "'";

		} else if (this.get('op') == Donkeylift.Filter.OPS.BETWEEN) {
			var values = this.values();
			var key = Donkeylift.Filter.Key(this.get('table'), f);
			param = key + " btwn " + values[0] + ',' + values[1];

		} else if (this.get('op') == Donkeylift.Filter.OPS.IN) {				
			var values = this.values();
			var key = Donkeylift.Filter.Key(this.get('table'), this.get('field'));
			param = key + " in " + values.join(",");

		} else {
			//EQUAL, GREATER, LESSER
			var key = Donkeylift.Filter.Key(this.get('table'), f);
			param = key + " " + this.get('op') + " " 
			    + this.get('field').toQS(this.get('value'));
		}


		return param;
	},

	loadRange: function(cbAfter) {
		var field = this.get('field');
		this.get('table').stats(this, function(stats) {
			field.set('stats', stats);
			cbAfter();
		});
	},

	loadSelect: function(searchTerm, cbAfter) {
		var field = this.get('field');
		this.get('table').options(this, searchTerm, function(opts) {
			field.set('options', opts);
			cbAfter();
		});
	},

	toStrings: function() {
		var result = { table: this.get('table').get('name'), field: '' };
		if (this.get('op') == Donkeylift.Filter.OPS.SEARCH) {
			result.op = 'search';
			result.value = this.get('value');

		} else if (this.get('op') == Donkeylift.Filter.OPS.BETWEEN) {
			result.op = 'between';
			result.field = this.get('field').get('name');
			result.value = this.get('value')[0] 
						+ ' and ' + this.get('value')[1];

		} else if (this.get('op') == Donkeylift.Filter.OPS.IN) {
			result.op = 'in';
			result.field = this.get('field').get('name');
			result.value = this.get('value').join(', '); 

		} else if (this.get('op') == Donkeylift.Filter.OPS.EQUAL) {
			result.op = 'equal';
			result.field = this.get('field').get('name');
			result.value = this.get('value'); 
		}
		return result;
	}

});

Donkeylift.Filter.Key = function(table, field) {		
	if (_.isObject(table)) table = table.get('name');
	if ( ! field) field = '*';
	else if (_.isObject(field)) field = field.get('name'); //not vname
	return table + '.' + field;
}

Donkeylift.Filter.OPS = {
	'SEARCH': 'search',
	'BETWEEN': 'btwn',
	'IN': 'in',
	'EQUAL': 'eq',
	'LESSER': 'le',
	'GREATER': 'ge'
}

Donkeylift.Filter.CONJUNCTION = '\t';

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

/*global Donkeylift, Backbone */

Donkeylift.Filters = Backbone.Collection.extend({
	// Reference to this collection's model.
	model: Donkeylift.Filter,
	
	toParam: function() {
		return Donkeylift.Filters.toParam(this.models);	
	},

	//used by Datable.stats & Datatable.options to get context:
	//min/max, opts
	apply: function(exFilter, searchTerm) {

		var filters = this.filter(function(f) {

			//exclude callee
			if (f.id == exFilter.id) return false;

			//exclude existing search on same table
			if (f.get('op') == Donkeylift.Filter.OPS.SEARCH 
			 && f.get('table') == exFilter.get('table')) {
				return false;
			}

			return true;
		});
		
		//add search term
		if (searchTerm && searchTerm.length > 0) {
			var searchFilter = new Donkeylift.Filter({
					table: exFilter.get('table'),
					field: exFilter.get('field'),
					op: Donkeylift.Filter.OPS.SEARCH,
					value: searchTerm
			});
			filters.push(searchFilter);
		}
		
		return filters;
	},

	setFilter: function(attrs) {
		var filter = new Donkeylift.Filter(attrs);		
		var current = this.get(filter.id);
		if (current) this.remove(current);
		if (attrs.value.length > 0) {
			this.add(filter);
		}
	},

	getFilter: function(table, field) {
		return this.get(Donkeylift.Filter.Key(table, field));
	},

	clearFilter: function(table, field) {
		var current = this.getFilter(table, field);
		if (current) this.remove(current);
	},

});

Donkeylift.Filters.toParam = function(filters) {
	var result = '';
	if (filters.length > 0) {
		var params = _.reduce(filters, function(memo, f) {
			return memo.length == 0 ? f.toParam() 
				: memo + Donkeylift.Filter.CONJUNCTION + f.toParam();
		}, '');				
		result = '$filter=' + encodeURIComponent(params);
	}
	return result;
}

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
		console.log(dtOptions);

		this.dataTable = this.$('#grid').DataTable({
			serverSide: true,
			columns: dtOptions.columns,				
			ajax: this.model.ajaxGetRowsFn(),
			search: initSearch,
			lengthMenu: dtOptions.lengthMenu, 
			displayStart: dtOptions.displayStart, 
			pageLength: dtOptions.pageLength, 
			order: dtOptions.order
		});

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
			anchorFn = function(id) {
				var href = '#table'
					+ '/' + me.model.get('referenced')[0].table
					+ '/' + me.model.get('name') + '.id=' + id;

				return '<a href="' + href + '">' + id + '</a>';
			}

		} else if (field.get('fk') == 1) {
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



/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.FilterItemsView = Backbone.View.extend({

	events: {
		'click #selectReset': 'evFilterItemsReset',
		'click .filter-option': 'evFilterOptionClick',
		'click .filter-selected': 'evFilterSelectedClick',
		'input #inputFilterItemsSearch': 'evInputFilterSearchChange',
	},

	initialize: function () {
		console.log("FilterItemsView.init " + this.model.get('table'));
	},

	template: _.template($('#filter-option-template').html()),

	loadRender: function() {
		var me = this;
		var s = this.$('#inputFilterItemsSearch').val();
		this.model.loadSelect(s, function() {
			me.render();
		});
	},

	render: function() {
		this.$('a[href=#filterSelect]').tab('show');

		this.$('#filterSelection').empty();
		var current = Donkeylift.app.filters.getFilter(
						this.model.get('table'),
						this.model.get('field'));

		if (current && current.get('op') == Donkeylift.Filter.OPS.IN) {
			//get values from filter
			var selected = current.get('value');		
//console.log(selected);
			_.each(selected, function(val) {
				this.$('#filterSelection').append(this.template({
					name: 'filter-selected',
					value: val
				}));
			}, this);
		}

		this.$('#filterOptions').empty();
		var fn = this.model.get('field').vname();
		var opts = this.model.get('field').get('options');		
//console.log(opts);
		_.each(opts, function(opt) {
			this.$('#filterOptions').append(this.template({
				name: 'filter-option',
				value: opt[fn]
			}));
		}, this);
	},

	setFilter: function() {
		var filterValues = this.$('#filterSelection').children()
			.map(function() {
				return $(this).attr('data-target');
		}).get();

		Donkeylift.app.filters.setFilter({
			table: this.model.get('table'),
			field: this.model.get('field'),
			op: Donkeylift.Filter.OPS.IN,
			value: filterValues
		});
		
		Donkeylift.app.router.navigate("reload-table", {trigger: true});			
		//window.location.hash = "#reload-table";
	},

	evFilterOptionClick: function(ev) {
		ev.stopPropagation();
		//console.log(ev.target);
		var opt = $(ev.target).attr('data-target');
		var attr = '[data-target="' + opt + '"]';

		//avoid duplicate items in filterSelection
		if (this.$('#filterSelection').has(attr).length == 0) {
			var item = this.template({
				name: 'filter-selected',
				value: opt
			});
			this.$('#filterSelection').append(item);
			this.setFilter();
		}
	},

	evFilterSelectedClick: function(ev) {
		ev.stopPropagation();
		//console.log(ev.target);
		$(ev.target).remove();
		this.setFilter();
	},

	evInputFilterSearchChange: function(ev) {
		this.loadRender();
	},


	evFilterItemsReset: function() {
		this.$('#filterSelection').empty();			
		this.setFilter(); //actually clears filter
		this.$('#inputFilterItemsSearch').val('');
		this.loadRender();
	},

});



/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.FilterRangeView = Backbone.View.extend({

	events: {
		//range filter evs
		'click #rangeReset': 'evFilterRangeResetClick',
		'change #inputFilterMin': 'evInputFilterChange',
		'change #inputFilterMax': 'evInputFilterChange',
	},

	initialize: function () {
		console.log("FilterRangeView.init " + this.model.get('table'));
	},

	canSlide: function() {
		var field = this.model.get('field');
		var slideTypes = [Donkeylift.Field.TYPES.INTEGER,
							Donkeylift.Field.TYPES.NUMERIC];
		return ( ! field.get('fk')) &&
				_.contains(slideTypes, field.get('type'));
	},

	loadRender: function() {
		var me = this;
		this.model.loadRange(function() {
			me.render();
		});
	},

	render: function() {
		this.$('a[href=#filterRange]').tab('show');

		var stats = this.model.get('field').get('stats');

		var current = Donkeylift.app.filters.getFilter(
						this.model.get('table'),
						this.model.get('field'));

		if (current && current.get('op') == Donkeylift.Filter.OPS.BETWEEN) {
			this.$("#inputFilterMin").val(current.get('value')[0]);
			this.$("#inputFilterMax").val(current.get('value')[1]);
		} else {
			this.$("#inputFilterMin").val(stats.min);
			this.$("#inputFilterMax").val(stats.max);
		}

		//console.log('el ' + this.$el.html());

		if (this.canSlide()) {
			this.$("#sliderRange").slider({
				range: true,
				min: stats.min,
				max: stats.max,
				values: [
					this.$("#inputFilterMin").val(),
					this.$("#inputFilterMax").val()
				],	
				slide: function(ev, ui) {
					if ($(ui.handle).index() == 1) {
						$("#inputFilterMin").val(ui.values[0]);
					} else {
						$("#inputFilterMax").val(ui.values[1]);
					}
			  	},
				stop: function(ev, ui) {
					if ($(ui.handle).index() == 1) {
						$("#inputFilterMin").change();
					} else {
						$("#inputFilterMax").change();
					}
				}
			});
		}
		if (this.model.get('field').get('type') 
			== Donkeylift.Field.TYPES['DATE']) {

			var opts = { minDate: Donkeylift.Field.toDate(stats.min), 
						 maxDate: Donkeylift.Field.toDate(stats.max),
						dateFormat: 'yy-mm-dd' };
			var minVal = Donkeylift.Field.toDate($("#inputFilterMin").val());
			var maxVal = Donkeylift.Field.toDate($("#inputFilterMax").val());
			$("#inputFilterMin").datepicker(opts);
			$("#inputFilterMin").datepicker("setDate", minVal);
			$("#inputFilterMax").datepicker(opts);
			$("#inputFilterMax").datepicker("setDate", maxVal);

			$('#ui-datepicker-div').click(function(e) {
				e.stopPropagation();
			});
		}

	},

	sanitizeInputFilterValue: function(el, bounds) {

		if (/Min$/.test(el.id)) {
			bounds = [bounds[0], this.$("#inputFilterMax").val()];
		} else {
			bounds = [this.$("#inputFilterMin").val(), bounds[1]];
		}

		var val = this.model.get('field').parse(el.value);
		if (val < bounds[0]) val = bounds[0];
		if (val > bounds[1]) val = bounds[1];
		$(el).val(val);

		if (this.canSlide()) {
			var idx = /Min$/.test(el.id) ? 0 : 1;	
			this.$("#sliderRange").slider("values", idx, val);
		}
	},

	evInputFilterChange: function(ev) {
		var stats = this.model.get('field').get('stats');

		this.sanitizeInputFilterValue(ev.target, [stats.min, stats.max]);

		var filterValues = [this.$("#inputFilterMin").val(),
							this.$("#inputFilterMax").val()];

		if (filterValues[0] != stats.min || filterValues[1] != stats.max) {
			Donkeylift.app.filters.setFilter({
				table: this.model.get('table'),
				field: this.model.get('field'),
				op: Donkeylift.Filter.OPS.BETWEEN,
				value: filterValues
			});
		} else {
			Donkeylift.app.filters.clearFilter(this.model.get('table'), 
									this.model.get('field'));
		}

		Donkeylift.app.router.navigate("reload-table", {trigger: true});			
		//window.location.hash = "#reload-table";
	},

	evFilterRangeResetClick: function() {
		Donkeylift.app.filters.clearFilter(this.model.get('table'), 
								this.model.get('field'));

		Donkeylift.app.router.navigate("reload-table", {trigger: true});			
		//window.location.hash = "#reload-table";
		this.render();
	},
});



/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.FilterShowView = Backbone.View.extend({
	el:  '#modalShowFilters',

	events: {
	},

	template: _.template($('#show-filter-item-template').html()),

	initialize: function() {
		console.log("FilterShowView.init");
	},

	render: function() {
		var el = this.$('#modalTableFilters > tbody');
		el.empty();
		//el.children('tr:not(:first)').remove();	
		this.collection.each(function(filter) {
			el.append(this.template(filter.toStrings()));
		}, this);			

		$('#modalInputDataUrl').val(Donkeylift.app.table.getAllRowsUrl());
		$('#modalShowFilters').on('shown.bs.modal', function() {
			$('#modalInputDataUrl').select();
		});

		$('#modalShowFilters').modal();

		return this;
	},


});



/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.FilterView = Backbone.View.extend({

	events: {
		'click .filter-column': 'evFilterColumnClick',
		'click .nav-tabs a': 'evFilterTabClick'
	},

	initialize: function () {
		console.log("FilterView.init " + this.model.get('table'));
		this.rangeView = new Donkeylift.FilterRangeView({
									model: this.model,
									el: this.el
		});
		this.itemsView = new Donkeylift.FilterItemsView({
									model: this.model,
									el: this.el
		});
	},

	template: _.template($('#filter-template').html()),

	render: function() {
		var field = this.model.get('field');
		console.log("FilterView.render " + field.get('name'));

		this.$el.html(this.template({
			name: field.get('name'),
		}));

		if (field.get('type') == Donkeylift.Field.TYPES.VARCHAR
		 || field.get('fk') == 1) {
			this.itemsView.loadRender();
		} else {
			this.rangeView.loadRender();
		}

		return this;
	},

	evFilterColumnClick: function(ev) {
		ev.stopPropagation();
	},

	evFilterTabClick: function(ev) {
		//ev.preventDefault();

//console.log('evFilterTab ' + ev.target);
		if (/filterSelect$/.test(ev.target.href)) {
			this.itemsView.loadRender();
		} else if (/filterRange$/.test(ev.target.href)) {
			this.rangeView.loadRender();
		}
	}
});



/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.MenuDataView = Backbone.View.extend({
	el:  '#menu',

	events: {
		'click #show-filters': 'evShowFilters',
		//'click #reset-all-filters': 'evResetAllFilters'
	},

	initialize: function() {
		console.log("MenuView.init");
		//this.listenTo(Donkeylift.app.table, 'change', this.render);
	},

	template: _.template($('#data-menu-template').html()),

	render: function() {
		console.log('MenuDataView.render ');			
		if (! Donkeylift.app.table) this.$el.empty();
		else this.$el.html(this.template());
		return this;
	},

	evResetAllFilters: function() {
		Donkeylift.app.unsetFilters();
		Donkeylift.app.resetTable();
	},

	evShowFilters: function() {
		Donkeylift.app.filterShowView.collection = Donkeylift.app.filters;
		Donkeylift.app.filterShowView.render();
	},

});



module.exports = (function() {
  "use strict";

  /*
   * Generated by PEG.js 0.9.0.
   *
   * http://pegjs.org/
   */

  function peg$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }

  function peg$SyntaxError(message, expected, found, location) {
    this.message  = message;
    this.expected = expected;
    this.found    = found;
    this.location = location;
    this.name     = "SyntaxError";

    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, peg$SyntaxError);
    }
  }

  peg$subclass(peg$SyntaxError, Error);

  function peg$parse(input) {
    var options = arguments.length > 1 ? arguments[1] : {},
        parser  = this,

        peg$FAILED = {},

        peg$startRuleFunctions = { start: peg$parsestart },
        peg$startRuleFunction  = peg$parsestart,

        peg$c0 = "$skip=",
        peg$c1 = { type: "literal", value: "$skip=", description: "\"$skip=\"" },
        peg$c2 = function(a) {return {name: '$skip', value: parseInt(a) }; },
        peg$c3 = "$top=",
        peg$c4 = { type: "literal", value: "$top=", description: "\"$top=\"" },
        peg$c5 = function(a) {return {name: '$top', value: parseInt(a) }; },
        peg$c6 = "$orderby=",
        peg$c7 = { type: "literal", value: "$orderby=", description: "\"$orderby=\"" },
        peg$c8 = function(orderby) { return {name: '$orderby', value: orderby}; },
        peg$c9 = "$select=",
        peg$c10 = { type: "literal", value: "$select=", description: "\"$select=\"" },
        peg$c11 = function(fields) { return {name: '$select', value: fields}; },
        peg$c12 = "$filter=",
        peg$c13 = { type: "literal", value: "$filter=", description: "\"$filter=\"" },
        peg$c14 = function(filters) { return {name: '$filter', value: filters}; },
        peg$c15 = ",",
        peg$c16 = { type: "literal", value: ",", description: "\",\"" },
        peg$c17 = function(first, term) { return term; },
        peg$c18 = function(first, rest) { return [first].concat(rest); },
        peg$c19 = "\t",
        peg$c20 = { type: "literal", value: "\t", description: "\"\\t\"" },
        peg$c21 = ".",
        peg$c22 = { type: "literal", value: ".", description: "\".\"" },
        peg$c23 = "asc",
        peg$c24 = { type: "literal", value: "asc", description: "\"asc\"" },
        peg$c25 = "desc",
        peg$c26 = { type: "literal", value: "desc", description: "\"desc\"" },
        peg$c27 = function(table, field, order) { 
             var result = { 
               table: table ? table[0] : undefined, 
               field: field, 
               order: order || 'asc' 
             };  
             return result; 
           },
        peg$c28 = function(table, field, op) { 
           	 var result = {
            		table: table ? table[0] : undefined,
            		field: field,
            		op: op[0],
            		value: op[2]
             };	  
        	    return result;
           },
        peg$c29 = function(table, field) { 
             var result = { 
              table: table ? table[0] : undefined, 
              field: field 
             }; 
             return result; 
           },
        peg$c30 = "*",
        peg$c31 = { type: "literal", value: "*", description: "\"*\"" },
        peg$c32 = { type: "other", description: "operator" },
        peg$c33 = "eq",
        peg$c34 = { type: "literal", value: "eq", description: "\"eq\"" },
        peg$c35 = "ne",
        peg$c36 = { type: "literal", value: "ne", description: "\"ne\"" },
        peg$c37 = "ge",
        peg$c38 = { type: "literal", value: "ge", description: "\"ge\"" },
        peg$c39 = "gt",
        peg$c40 = { type: "literal", value: "gt", description: "\"gt\"" },
        peg$c41 = "le",
        peg$c42 = { type: "literal", value: "le", description: "\"le\"" },
        peg$c43 = "lt",
        peg$c44 = { type: "literal", value: "lt", description: "\"lt\"" },
        peg$c45 = "search",
        peg$c46 = { type: "literal", value: "search", description: "\"search\"" },
        peg$c47 = { type: "other", description: "vector operator" },
        peg$c48 = "in",
        peg$c49 = { type: "literal", value: "in", description: "\"in\"" },
        peg$c50 = "btwn",
        peg$c51 = { type: "literal", value: "btwn", description: "\"btwn\"" },
        peg$c52 = { type: "other", description: "identifier" },
        peg$c53 = /^[a-z]/i,
        peg$c54 = { type: "class", value: "[a-z]i", description: "[a-z]i" },
        peg$c55 = function(first, chars) { return first + chars.join(''); },
        peg$c56 = { type: "other", description: "name char" },
        peg$c57 = /^[a-z0-9_]/i,
        peg$c58 = { type: "class", value: "[a-z0-9_]i", description: "[a-z0-9_]i" },
        peg$c59 = function(first, value) { return value; },
        peg$c60 = { type: "other", description: "whitespace" },
        peg$c61 = /^[ \t\n\r]/,
        peg$c62 = { type: "class", value: "[ \\t\\n\\r]", description: "[ \\t\\n\\r]" },
        peg$c63 = { type: "other", description: "number" },
        peg$c64 = function() { return parseFloat(text()); },
        peg$c65 = /^[1-9]/,
        peg$c66 = { type: "class", value: "[1-9]", description: "[1-9]" },
        peg$c67 = /^[eE]/,
        peg$c68 = { type: "class", value: "[eE]", description: "[eE]" },
        peg$c69 = "-",
        peg$c70 = { type: "literal", value: "-", description: "\"-\"" },
        peg$c71 = "+",
        peg$c72 = { type: "literal", value: "+", description: "\"+\"" },
        peg$c73 = "0",
        peg$c74 = { type: "literal", value: "0", description: "\"0\"" },
        peg$c75 = { type: "other", description: "string" },
        peg$c76 = function(chars) { return chars.join(""); },
        peg$c77 = "'",
        peg$c78 = { type: "literal", value: "'", description: "\"'\"" },
        peg$c79 = "\\",
        peg$c80 = { type: "literal", value: "\\", description: "\"\\\\\"" },
        peg$c81 = "/",
        peg$c82 = { type: "literal", value: "/", description: "\"/\"" },
        peg$c83 = "b",
        peg$c84 = { type: "literal", value: "b", description: "\"b\"" },
        peg$c85 = function() { return "\b"; },
        peg$c86 = "f",
        peg$c87 = { type: "literal", value: "f", description: "\"f\"" },
        peg$c88 = function() { return "\f"; },
        peg$c89 = "n",
        peg$c90 = { type: "literal", value: "n", description: "\"n\"" },
        peg$c91 = function() { return "\n"; },
        peg$c92 = "r",
        peg$c93 = { type: "literal", value: "r", description: "\"r\"" },
        peg$c94 = function() { return "\r"; },
        peg$c95 = "t",
        peg$c96 = { type: "literal", value: "t", description: "\"t\"" },
        peg$c97 = function() { return "\t"; },
        peg$c98 = "u",
        peg$c99 = { type: "literal", value: "u", description: "\"u\"" },
        peg$c100 = function(digits) {
                  return String.fromCharCode(parseInt(digits, 16));
                },
        peg$c101 = function(sequence) { return sequence; },
        peg$c102 = /^[ -&(-[\]-\u10FFFF]/,
        peg$c103 = { type: "class", value: "[\\x20-\\x26\\x28-\\x5B\\x5D-\\u10FFFF]", description: "[\\x20-\\x26\\x28-\\x5B\\x5D-\\u10FFFF]" },
        peg$c104 = /^[0-9]/,
        peg$c105 = { type: "class", value: "[0-9]", description: "[0-9]" },
        peg$c106 = /^[0-9a-f]/i,
        peg$c107 = { type: "class", value: "[0-9a-f]i", description: "[0-9a-f]i" },

        peg$currPos          = 0,
        peg$savedPos         = 0,
        peg$posDetailsCache  = [{ line: 1, column: 1, seenCR: false }],
        peg$maxFailPos       = 0,
        peg$maxFailExpected  = [],
        peg$silentFails      = 0,

        peg$result;

    if ("startRule" in options) {
      if (!(options.startRule in peg$startRuleFunctions)) {
        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
      }

      peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
    }

    function text() {
      return input.substring(peg$savedPos, peg$currPos);
    }

    function location() {
      return peg$computeLocation(peg$savedPos, peg$currPos);
    }

    function expected(description) {
      throw peg$buildException(
        null,
        [{ type: "other", description: description }],
        input.substring(peg$savedPos, peg$currPos),
        peg$computeLocation(peg$savedPos, peg$currPos)
      );
    }

    function error(message) {
      throw peg$buildException(
        message,
        null,
        input.substring(peg$savedPos, peg$currPos),
        peg$computeLocation(peg$savedPos, peg$currPos)
      );
    }

    function peg$computePosDetails(pos) {
      var details = peg$posDetailsCache[pos],
          p, ch;

      if (details) {
        return details;
      } else {
        p = pos - 1;
        while (!peg$posDetailsCache[p]) {
          p--;
        }

        details = peg$posDetailsCache[p];
        details = {
          line:   details.line,
          column: details.column,
          seenCR: details.seenCR
        };

        while (p < pos) {
          ch = input.charAt(p);
          if (ch === "\n") {
            if (!details.seenCR) { details.line++; }
            details.column = 1;
            details.seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            details.line++;
            details.column = 1;
            details.seenCR = true;
          } else {
            details.column++;
            details.seenCR = false;
          }

          p++;
        }

        peg$posDetailsCache[pos] = details;
        return details;
      }
    }

    function peg$computeLocation(startPos, endPos) {
      var startPosDetails = peg$computePosDetails(startPos),
          endPosDetails   = peg$computePosDetails(endPos);

      return {
        start: {
          offset: startPos,
          line:   startPosDetails.line,
          column: startPosDetails.column
        },
        end: {
          offset: endPos,
          line:   endPosDetails.line,
          column: endPosDetails.column
        }
      };
    }

    function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) { return; }

      if (peg$currPos > peg$maxFailPos) {
        peg$maxFailPos = peg$currPos;
        peg$maxFailExpected = [];
      }

      peg$maxFailExpected.push(expected);
    }

    function peg$buildException(message, expected, found, location) {
      function cleanupExpected(expected) {
        var i = 1;

        expected.sort(function(a, b) {
          if (a.description < b.description) {
            return -1;
          } else if (a.description > b.description) {
            return 1;
          } else {
            return 0;
          }
        });

        while (i < expected.length) {
          if (expected[i - 1] === expected[i]) {
            expected.splice(i, 1);
          } else {
            i++;
          }
        }
      }

      function buildMessage(expected, found) {
        function stringEscape(s) {
          function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

          return s
            .replace(/\\/g,   '\\\\')
            .replace(/"/g,    '\\"')
            .replace(/\x08/g, '\\b')
            .replace(/\t/g,   '\\t')
            .replace(/\n/g,   '\\n')
            .replace(/\f/g,   '\\f')
            .replace(/\r/g,   '\\r')
            .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
            .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
            .replace(/[\u0100-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
            .replace(/[\u1000-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
        }

        var expectedDescs = new Array(expected.length),
            expectedDesc, foundDesc, i;

        for (i = 0; i < expected.length; i++) {
          expectedDescs[i] = expected[i].description;
        }

        expectedDesc = expected.length > 1
          ? expectedDescs.slice(0, -1).join(", ")
              + " or "
              + expectedDescs[expected.length - 1]
          : expectedDescs[0];

        foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

        return "Expected " + expectedDesc + " but " + foundDesc + " found.";
      }

      if (expected !== null) {
        cleanupExpected(expected);
      }

      return new peg$SyntaxError(
        message !== null ? message : buildMessage(expected, found),
        expected,
        found,
        location
      );
    }

    function peg$parsestart() {
      var s0;

      s0 = peg$parseparam();

      return s0;
    }

    function peg$parseparam() {
      var s0;

      s0 = peg$parseparamSkip();
      if (s0 === peg$FAILED) {
        s0 = peg$parseparamTop();
        if (s0 === peg$FAILED) {
          s0 = peg$parseparamOrderBy();
          if (s0 === peg$FAILED) {
            s0 = peg$parseparamFilter();
            if (s0 === peg$FAILED) {
              s0 = peg$parseparamSelect();
            }
          }
        }
      }

      return s0;
    }

    function peg$parseparamSkip() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6) === peg$c0) {
        s1 = peg$c0;
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c1); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        s3 = peg$parseint();
        if (s3 !== peg$FAILED) {
          s2 = input.substring(s2, peg$currPos);
        } else {
          s2 = s3;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c2(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseparamTop() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5) === peg$c3) {
        s1 = peg$c3;
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c4); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        s3 = peg$parseint();
        if (s3 !== peg$FAILED) {
          s2 = input.substring(s2, peg$currPos);
        } else {
          s2 = s3;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c5(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseparamOrderBy() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 9) === peg$c6) {
        s1 = peg$c6;
        peg$currPos += 9;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c7); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseorderByExpr();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c8(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseparamSelect() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 8) === peg$c9) {
        s1 = peg$c9;
        peg$currPos += 8;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c10); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsefieldExpr();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c11(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseparamFilter() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 8) === peg$c12) {
        s1 = peg$c12;
        peg$currPos += 8;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c13); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsefilterExpr();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c14(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseorderByExpr() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      s1 = peg$parseorderByTerm();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 44) {
          s4 = peg$c15;
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c16); }
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parsews();
          if (s5 === peg$FAILED) {
            s5 = null;
          }
          if (s5 !== peg$FAILED) {
            s6 = peg$parseorderByTerm();
            if (s6 !== peg$FAILED) {
              peg$savedPos = s3;
              s4 = peg$c17(s1, s6);
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 44) {
            s4 = peg$c15;
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c16); }
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parsews();
            if (s5 === peg$FAILED) {
              s5 = null;
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parseorderByTerm();
              if (s6 !== peg$FAILED) {
                peg$savedPos = s3;
                s4 = peg$c17(s1, s6);
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c18(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsefilterExpr() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      s1 = peg$parsefilterTerm();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 9) {
          s4 = peg$c19;
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c20); }
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parsews();
          if (s5 === peg$FAILED) {
            s5 = null;
          }
          if (s5 !== peg$FAILED) {
            s6 = peg$parsefilterTerm();
            if (s6 !== peg$FAILED) {
              peg$savedPos = s3;
              s4 = peg$c17(s1, s6);
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 9) {
            s4 = peg$c19;
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c20); }
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parsews();
            if (s5 === peg$FAILED) {
              s5 = null;
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parsefilterTerm();
              if (s6 !== peg$FAILED) {
                peg$savedPos = s3;
                s4 = peg$c17(s1, s6);
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c18(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsefieldExpr() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      s1 = peg$parsefieldTerm();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 44) {
          s4 = peg$c15;
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c16); }
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parsews();
          if (s5 === peg$FAILED) {
            s5 = null;
          }
          if (s5 !== peg$FAILED) {
            s6 = peg$parsefieldTerm();
            if (s6 !== peg$FAILED) {
              peg$savedPos = s3;
              s4 = peg$c17(s1, s6);
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 44) {
            s4 = peg$c15;
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c16); }
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parsews();
            if (s5 === peg$FAILED) {
              s5 = null;
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parsefieldTerm();
              if (s6 !== peg$FAILED) {
                peg$savedPos = s3;
                s4 = peg$c17(s1, s6);
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c18(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseorderByTerm() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$parseidentifier();
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 46) {
          s3 = peg$c21;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c22); }
        }
        if (s3 !== peg$FAILED) {
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsefield();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsews();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            if (input.substr(peg$currPos, 3).toLowerCase() === peg$c23) {
              s4 = input.substr(peg$currPos, 3);
              peg$currPos += 3;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c24); }
            }
            if (s4 === peg$FAILED) {
              if (input.substr(peg$currPos, 4).toLowerCase() === peg$c25) {
                s4 = input.substr(peg$currPos, 4);
                peg$currPos += 4;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c26); }
              }
            }
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c27(s1, s2, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsefilterTerm() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$parseidentifier();
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 46) {
          s3 = peg$c21;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c22); }
        }
        if (s3 !== peg$FAILED) {
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsefield();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsews();
          if (s3 !== peg$FAILED) {
            s4 = peg$currPos;
            s5 = peg$parseop();
            if (s5 !== peg$FAILED) {
              s6 = peg$parsews();
              if (s6 !== peg$FAILED) {
                s7 = peg$parsevalue();
                if (s7 !== peg$FAILED) {
                  s5 = [s5, s6, s7];
                  s4 = s5;
                } else {
                  peg$currPos = s4;
                  s4 = peg$FAILED;
                }
              } else {
                peg$currPos = s4;
                s4 = peg$FAILED;
              }
            } else {
              peg$currPos = s4;
              s4 = peg$FAILED;
            }
            if (s4 === peg$FAILED) {
              s4 = peg$currPos;
              s5 = peg$parsevecop();
              if (s5 !== peg$FAILED) {
                s6 = peg$parsews();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parsevalues();
                  if (s7 !== peg$FAILED) {
                    s5 = [s5, s6, s7];
                    s4 = s5;
                  } else {
                    peg$currPos = s4;
                    s4 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s4;
                  s4 = peg$FAILED;
                }
              } else {
                peg$currPos = s4;
                s4 = peg$FAILED;
              }
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c28(s1, s2, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsefieldTerm() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$parseidentifier();
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 46) {
          s3 = peg$c21;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c22); }
        }
        if (s3 !== peg$FAILED) {
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsefield();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c29(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsefield() {
      var s0;

      s0 = peg$parseidentifier();
      if (s0 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 42) {
          s0 = peg$c30;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c31); }
        }
      }

      return s0;
    }

    function peg$parseop() {
      var s0, s1;

      peg$silentFails++;
      if (input.substr(peg$currPos, 2) === peg$c33) {
        s0 = peg$c33;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c34); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c35) {
          s0 = peg$c35;
          peg$currPos += 2;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c36); }
        }
        if (s0 === peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c37) {
            s0 = peg$c37;
            peg$currPos += 2;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c38); }
          }
          if (s0 === peg$FAILED) {
            if (input.substr(peg$currPos, 2) === peg$c39) {
              s0 = peg$c39;
              peg$currPos += 2;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c40); }
            }
            if (s0 === peg$FAILED) {
              if (input.substr(peg$currPos, 2) === peg$c41) {
                s0 = peg$c41;
                peg$currPos += 2;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c42); }
              }
              if (s0 === peg$FAILED) {
                if (input.substr(peg$currPos, 2) === peg$c43) {
                  s0 = peg$c43;
                  peg$currPos += 2;
                } else {
                  s0 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c44); }
                }
                if (s0 === peg$FAILED) {
                  if (input.substr(peg$currPos, 6) === peg$c45) {
                    s0 = peg$c45;
                    peg$currPos += 6;
                  } else {
                    s0 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c46); }
                  }
                }
              }
            }
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c32); }
      }

      return s0;
    }

    function peg$parsevecop() {
      var s0, s1;

      peg$silentFails++;
      if (input.substr(peg$currPos, 2) === peg$c48) {
        s0 = peg$c48;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c49); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 4) === peg$c50) {
          s0 = peg$c50;
          peg$currPos += 4;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c51); }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c47); }
      }

      return s0;
    }

    function peg$parseidentifier() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      if (peg$c53.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c54); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsefchar();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsefchar();
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c55(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c52); }
      }

      return s0;
    }

    function peg$parsefchar() {
      var s0, s1;

      peg$silentFails++;
      if (peg$c57.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c58); }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c56); }
      }

      return s0;
    }

    function peg$parsevalues() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      s1 = peg$parsevalue();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 44) {
          s4 = peg$c15;
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c16); }
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parsews();
          if (s5 === peg$FAILED) {
            s5 = null;
          }
          if (s5 !== peg$FAILED) {
            s6 = peg$parsevalue();
            if (s6 !== peg$FAILED) {
              peg$savedPos = s3;
              s4 = peg$c59(s1, s6);
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 44) {
            s4 = peg$c15;
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c16); }
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parsews();
            if (s5 === peg$FAILED) {
              s5 = null;
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parsevalue();
              if (s6 !== peg$FAILED) {
                peg$savedPos = s3;
                s4 = peg$c59(s1, s6);
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c18(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsevalue() {
      var s0;

      s0 = peg$parsenumber();
      if (s0 === peg$FAILED) {
        s0 = peg$parsestring();
      }

      return s0;
    }

    function peg$parsews() {
      var s0, s1;

      peg$silentFails++;
      s0 = [];
      if (peg$c61.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c62); }
      }
      if (s1 !== peg$FAILED) {
        while (s1 !== peg$FAILED) {
          s0.push(s1);
          if (peg$c61.test(input.charAt(peg$currPos))) {
            s1 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c62); }
          }
        }
      } else {
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c60); }
      }

      return s0;
    }

    function peg$parsenumber() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseminus();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseint();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsefrac();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseexp();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c64();
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c63); }
      }

      return s0;
    }

    function peg$parsedecimal_point() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 46) {
        s0 = peg$c21;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c22); }
      }

      return s0;
    }

    function peg$parsedigit1_9() {
      var s0;

      if (peg$c65.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c66); }
      }

      return s0;
    }

    function peg$parsee() {
      var s0;

      if (peg$c67.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c68); }
      }

      return s0;
    }

    function peg$parseexp() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parsee();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseminus();
        if (s2 === peg$FAILED) {
          s2 = peg$parseplus();
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseDIGIT();
          if (s4 !== peg$FAILED) {
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parseDIGIT();
            }
          } else {
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parsefrac() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsedecimal_point();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseDIGIT();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parseDIGIT();
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      return s0;
    }

    function peg$parseint() {
      var s0, s1, s2, s3;

      s0 = peg$parsezero();
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsedigit1_9();
        if (s1 !== peg$FAILED) {
          s2 = [];
          s3 = peg$parseDIGIT();
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parseDIGIT();
          }
          if (s2 !== peg$FAILED) {
            s1 = [s1, s2];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }

      return s0;
    }

    function peg$parseminus() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 45) {
        s0 = peg$c69;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c70); }
      }

      return s0;
    }

    function peg$parseplus() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 43) {
        s0 = peg$c71;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c72); }
      }

      return s0;
    }

    function peg$parsezero() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 48) {
        s0 = peg$c73;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c74); }
      }

      return s0;
    }

    function peg$parsestring() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsequotation_mark();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsechar();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsechar();
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsequotation_mark();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c76(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c75); }
      }

      return s0;
    }

    function peg$parsechar() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

      s0 = peg$parseunescaped();
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseescape();
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 39) {
            s2 = peg$c77;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c78); }
          }
          if (s2 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 92) {
              s2 = peg$c79;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c80); }
            }
            if (s2 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 47) {
                s2 = peg$c81;
                peg$currPos++;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c82); }
              }
              if (s2 === peg$FAILED) {
                s2 = peg$currPos;
                if (input.charCodeAt(peg$currPos) === 98) {
                  s3 = peg$c83;
                  peg$currPos++;
                } else {
                  s3 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c84); }
                }
                if (s3 !== peg$FAILED) {
                  peg$savedPos = s2;
                  s3 = peg$c85();
                }
                s2 = s3;
                if (s2 === peg$FAILED) {
                  s2 = peg$currPos;
                  if (input.charCodeAt(peg$currPos) === 102) {
                    s3 = peg$c86;
                    peg$currPos++;
                  } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c87); }
                  }
                  if (s3 !== peg$FAILED) {
                    peg$savedPos = s2;
                    s3 = peg$c88();
                  }
                  s2 = s3;
                  if (s2 === peg$FAILED) {
                    s2 = peg$currPos;
                    if (input.charCodeAt(peg$currPos) === 110) {
                      s3 = peg$c89;
                      peg$currPos++;
                    } else {
                      s3 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c90); }
                    }
                    if (s3 !== peg$FAILED) {
                      peg$savedPos = s2;
                      s3 = peg$c91();
                    }
                    s2 = s3;
                    if (s2 === peg$FAILED) {
                      s2 = peg$currPos;
                      if (input.charCodeAt(peg$currPos) === 114) {
                        s3 = peg$c92;
                        peg$currPos++;
                      } else {
                        s3 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c93); }
                      }
                      if (s3 !== peg$FAILED) {
                        peg$savedPos = s2;
                        s3 = peg$c94();
                      }
                      s2 = s3;
                      if (s2 === peg$FAILED) {
                        s2 = peg$currPos;
                        if (input.charCodeAt(peg$currPos) === 116) {
                          s3 = peg$c95;
                          peg$currPos++;
                        } else {
                          s3 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c96); }
                        }
                        if (s3 !== peg$FAILED) {
                          peg$savedPos = s2;
                          s3 = peg$c97();
                        }
                        s2 = s3;
                        if (s2 === peg$FAILED) {
                          s2 = peg$currPos;
                          if (input.charCodeAt(peg$currPos) === 117) {
                            s3 = peg$c98;
                            peg$currPos++;
                          } else {
                            s3 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c99); }
                          }
                          if (s3 !== peg$FAILED) {
                            s4 = peg$currPos;
                            s5 = peg$currPos;
                            s6 = peg$parseHEXDIG();
                            if (s6 !== peg$FAILED) {
                              s7 = peg$parseHEXDIG();
                              if (s7 !== peg$FAILED) {
                                s8 = peg$parseHEXDIG();
                                if (s8 !== peg$FAILED) {
                                  s9 = peg$parseHEXDIG();
                                  if (s9 !== peg$FAILED) {
                                    s6 = [s6, s7, s8, s9];
                                    s5 = s6;
                                  } else {
                                    peg$currPos = s5;
                                    s5 = peg$FAILED;
                                  }
                                } else {
                                  peg$currPos = s5;
                                  s5 = peg$FAILED;
                                }
                              } else {
                                peg$currPos = s5;
                                s5 = peg$FAILED;
                              }
                            } else {
                              peg$currPos = s5;
                              s5 = peg$FAILED;
                            }
                            if (s5 !== peg$FAILED) {
                              s4 = input.substring(s4, peg$currPos);
                            } else {
                              s4 = s5;
                            }
                            if (s4 !== peg$FAILED) {
                              peg$savedPos = s2;
                              s3 = peg$c100(s4);
                              s2 = s3;
                            } else {
                              peg$currPos = s2;
                              s2 = peg$FAILED;
                            }
                          } else {
                            peg$currPos = s2;
                            s2 = peg$FAILED;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          if (s2 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c101(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }

      return s0;
    }

    function peg$parseescape() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 92) {
        s0 = peg$c79;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c80); }
      }

      return s0;
    }

    function peg$parsequotation_mark() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 39) {
        s0 = peg$c77;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c78); }
      }

      return s0;
    }

    function peg$parseunescaped() {
      var s0;

      if (peg$c102.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c103); }
      }

      return s0;
    }

    function peg$parseDIGIT() {
      var s0;

      if (peg$c104.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c105); }
      }

      return s0;
    }

    function peg$parseHEXDIG() {
      var s0;

      if (peg$c106.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c107); }
      }

      return s0;
    }

    peg$result = peg$startRuleFunction();

    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
    } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
        peg$fail({ type: "end", description: "end of input" });
      }

      throw peg$buildException(
        null,
        peg$maxFailExpected,
        peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
        peg$maxFailPos < input.length
          ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
          : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
      );
    }
  }

  return {
    SyntaxError: peg$SyntaxError,
    parse:       peg$parse
  };
})();

/*global Donkeylift, Backbone, _ */
var pegParser = module.exports;

(function () {
	'use strict';

	Donkeylift.RouterData = Backbone.Router.extend({

        routes: {
/*
            "data": "routeData",
            "schema": "routeSchema",
            "downloads": "routeDownloads",
*/
			"table/:table": "routeGotoTable",
			"table/:table/:filter": "routeGotoRows",
			"reset-filter": "routeResetFilter",
			"reload-table": "routeReloadTable",
			"data/:schema/:table(/*params)": "routeUrlTableData",
			"schema/:schema/:table": "routeUrlTableSchema"
        },

/*
        routeDownloads: function() {
			Donkeylift.app.unsetSchema();
            Donkeylift.app.gotoModule("downloads");
        },

        routeData: function() {
            Donkeylift.app.gotoModule("data");
			Donkeylift.app.resetTable();
        },

        routeSchema: function() {
            Donkeylift.app.gotoModule("schema");
			Donkeylift.app.resetTable();
        },
*/

		routeUrlTableData: function(schemaName, tableName, paramStr) {
			console.log("routeUrlTableData " 
						+ schemaName + " " + tableName + " " + paramStr);
			/* 
			 * hack to block executing router handlers twice in FF
			 * if user interactively hits a route, 
			 * block execution of this route. 
			 * isBlocked.. will be timeout reset after a short time (100ms). 
			*/
			if (this.isBlockedGotoUrl) return;

			this.gotoTable(tableName, { 
				schema: schemaName,
				params: this.parseParams(paramStr)
			});
		},

		routeGotoTable: function(tableName) {
			//console.log("routeGotoTable " + tableName);
			this.gotoTable(tableName);
		},

		routeGotoRows: function(tableName, filter) {
			var kv = filter.split('=');
			var filterTable;
			if (kv[0].indexOf('.') > 0) {
				filterTable = kv[0].substr(0, kv[0].indexOf('.'));
			} else {
				filterTable = tableName;
			}

			console.log("routeGotoRow " + tableName + " " + filter);
			Donkeylift.app.filters.setFilter({
				table: filterTable,
				field: 'id',
				op: Donkeylift.Filter.OPS.EQUAL,
				value: kv[1]
			});
			
			this.gotoTable(tableName);
		},

		routeResetFilter: function() {
			Donkeylift.app.unsetFilters();
			Donkeylift.app.resetTable();
		},

		routeReloadTable: function() {
			Donkeylift.app.table.reload();
		},

		parseParams: function(paramStr) {
			var params = {};
			_.each(paramStr.split('&'), function(p) {
				var ps = p.split('=');
				var k = decodeURIComponent(ps[0]);
				var v = ps.length > 1 
						? decodeURIComponent(ps[1])
						:  decodeURIComponent(ps[0]);
				if (k[0] == '$') {
					var param = pegParser.parse(k + "=" + v);
					params[param.name] = param.value;
				}
			});
			//console.dir(params);
			return params;
		},

		blockGotoUrl: function(ms) {
			ms = ms || 1000;
			var me = this;
			this.isBlockedGotoUrl = true;
			window.setTimeout(function() {
				me.isBlockedGotoUrl = false;
			}, ms);
		},

		updateNavigation: function(fragment, options) {
			console.log('update nav ' + fragment + ' ' + options); 
			options = options || {};
			if (options.block > 0) {
				this.blockGotoUrl(options.block); //avoid inmediate reolad FF
			}
			this.navigate(fragment, {replace: options.replace});
		},	

		gotoTable: function(tableName, options) {
			options = options || {};

			var setOthers = function() {

				var table = Donkeylift.app.schema.get('tables').find(function(t) { 
					return t.get('name') == tableName; 
				});			

				if (options.params) {
					//set filters
					var filters = _.map(options.params.$filter, function(f) {
						return new Donkeylift.Filter(f);
					});
					Donkeylift.app.setFilters(filters);
				}
				
				//load data			
				Donkeylift.app.setTable(table, options.params);
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

AppData.prototype = new Donkeylift.AppBase();
AppData.prototype.constructor=AppData; 

function AppData(opts) {

	this.filters = new Donkeylift.Filters();
	this.filterShowView = new Donkeylift.FilterShowView();
	this.menuView = new Donkeylift.MenuDataView();
	this.router = new Donkeylift.RouterData();
}

AppData.prototype.start = function() {
	Donkeylift.AppBase.prototype.start.call(this);
	$('#nav-data').closest("li").addClass("active");
}

AppData.prototype.createTableView = function(table, params) {
	return new Donkeylift.DataTableView({
		model: table,
		attributes: { params: params }
	});
}

AppData.prototype.createSchema = function(name) {
	return new Donkeylift.Database({name : name, id : name});
}

	
	/**** schema stuff ****/

AppData.prototype.unsetSchema = function() {
	Donkeylift.AppBase.prototype.unsetSchema.call(this);
	this.unsetFilters();
}

/**** data stuff ****/

AppData.prototype.setFilters = function(filters) {
	this.filters = new Donkeylift.Filters(filters);
}

AppData.prototype.unsetFilters = function() {
	this.filters = new Donkeylift.Filters();
}

AppData.prototype.setFilterView = function(filter, $parentElem) {
	if (this.filterView) this.filterView.remove();
	this.filterView = new Donkeylift.FilterView({ model: filter });
	$parentElem.append(this.filterView.el);
	this.filterView.render();
}

Donkeylift.AppData = AppData;
