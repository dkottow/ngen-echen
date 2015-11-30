/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	//console.log("Table class def");
	app.Alias = Backbone.Model.extend({ 
		
		initialize: function(attrs) {
		},

		toString: function() {
			return this.get('table').get('name') + '.' 
				 + this.get('field').get('name');
		}

	});

	app.Alias.parse = function(tableName, fieldName) {
console.log('Alias.parse ' + tableName + '.' + fieldName);
		var table = app.schema.get('tables').getByName(tableName);
		var field = table.get('fields').getByName(fieldName);
		return new app.Alias({table: table, field: field});
	}

})();

/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	//console.log("Field class def");
	app.Field = Backbone.Model.extend({ 
		initialize: function(field) {
			var rxp = /(\w+)(\([0-9,]+\))?/
			var match = field.type.match(rxp)
			this.set('type', app.Field.TypeAlias(match[1]));
			var spec;
			if (match[2]) spec = match[2].substr(1, match[2].length - 2);
			this.set('length', spec);
		},
		
		vname: function() {
			return (this.get('fk') == 1) ?
				this.get('fk_table') + '_ref'
			  : this.get('name');
		},

		attrJSON: function() {
			return _.clone(this.attributes);
		},		

		toJSON: function() {
			var type = app.Field.ALIAS[this.get('type')];
			if (this.get('length')) {
				type += '(' + this.get('length') + ')';
			}

			return {
				name: this.get('name'),
				type: type,
				order: this.get('order')
			};
		},

		parse: function(val) {
			if (this.get('fk') == 1 && _.isString(val)) {
				//its a string ref
				return val;
			}
			var t = this.get('type');
			if (t == app.Field.TYPES.INTEGER) {
				return parseInt(val);
			} else if(t == app.Field.TYPES.NUMERIC) {
				return parseFloat(val);
			} else if(t == app.Field.TYPES.DATE) {
				//return new Date(val); 
				return new Date(val).toISOString().substr(0,10);
			} else if (t == app.Field.TYPES.DATETIME) {
				//return new Date(val);
				return new Date(val).toISOString();
			} else {
				return val;
			}
		},

		toQS: function(val) {
			if (this.get('fk') == 1 && _.isString(val)) {
				//its a string ref
				return "'" + val + "'";
			}
			var t = this.get('type');
			if (t == app.Field.TYPES.INTEGER || t == app.Field.TYPES.NUMERIC) {
				return val;
			} else {
				return "'" + val + "'";
			}
		}

	});

	app.Field.create = function(name) {
		return new app.Field({
			name: name,
			type: 'VARCHAR'
		});
	}


	app.Field.TYPES = {
		'INTEGER': 'Integer',
		'NUMERIC': 'Decimal',
		'VARCHAR': 'Text',
		'DATE': 'Date',
		'DATETIME': 'Timestamp'
	}

	app.Field.ALIAS = _.invert(app.Field.TYPES);

	app.Field.TypeAlias = function(type) {
		return app.Field.TYPES[type]; 		
	}

	app.Field.toDate = function(dateISOString) {
		return new Date(dateISOString.split('-')[0], 
						dateISOString.split('-')[1] - 1,
						dateISOString.split('-')[2]);
	}


})();

/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	app.Relation = Backbone.Model.extend({ 
		initialize: function(relation) {
			this.set('type', app.Relation.Type(relation));
		}

	});

	app.Relation.create = function(table) {
		return new app.Relation({
			table: table,
			related: null, 
			field: null, 
		});	
	}

	app.Relation.Type = function(relation) {
  		if (relation.field && relation.field.name == 'id') return 'one-to-one';
		else return 'many-to-one';
	}
})();

/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	console.log("Schema class def");
	app.Schema = Backbone.Model.extend({

		initialize: function(attrs) {
			console.log("Schema.initialize " + attrs.name);

			if ( ! attrs.table) this.set('tables', new app.Tables());

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

		parse : function(response) {
			console.log("Schema.parse " + response);
			var tables = _.map(response.tables, function(table) {
				return new app.Table(table);
			});
			response.tables = new app.Tables(tables);
			return response;
		},

		url : function() {
			return app.schemas.url() + '/' + this.get('name');
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
return;
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
			};

			//save existing database
			if (this.get('id') == this.get('name')) {
				saveOptions.parse = false;
				saveOptions.url = this.url();
				console.log("Schema.save " + saveOptions.url);
				saveOptions.success = function(model) {	
					console.log("Schema.save OK");
					cbResult();
				}

			//save new database
			} else {
				this.unset('id'); 
				saveOptions.parse = false;
				saveOptions.url = app.schemas.url();
				console.log("Schema.save " + saveOptions.url);
				saveOptions.success = function(model) {
					console.log("Schema.save new OK");
					//set id to (new) name
					model.set('id', model.get('name'));
					app.schema = model;

					//reload schema list
					app.schemas.fetch({
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
					app.unsetSchema();
					app.schemas.fetch({
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

})();

/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	//console.log("Table class def");
	app.Table = Backbone.Model.extend({ 
		
		initialize: function(attrs) {
			console.log("Table.initialize " + attrs.name);
			var fields = _.map( _.sortBy(attrs.fields, 'order'), 
						function(field) {
				return new app.Field(field);
			});			
			this.set('fields', new app.Fields(fields));
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
			var relations = [];
			_.each(this.get('parents'), function(parent_name) {
				//construct Relations
				var pt = _.find(tables, function(t) { 
					return t.get('name') == parent_name;
				});
				var fk = _.find(this.get('fields').models, 
					function(field) {
						return field.get('fk_table') == parent_name;
				});
				var relation = new app.Relation({
					table: this,
					related: pt,
					field: fk
				});
				relations.push(relation);
			}, this);
			this.set('relations', new app.Relations(relations), {silent: true});
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
				row_alias.push(new app.Alias({
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
			return new app.TableView(options);
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

	app.Table.create = function(name) {
		var fields = [ 
			{ name: 'id', type: 'INTEGER', order: 1 },
			{ name : 'modified_by', type: 'VARCHAR', order: 2 },
			{ name : 'modified_on', type: 'DATETIME', order: 3 }
		];
		return new app.Table({
			name: name,
			fields: fields
		});
	}

})();

/*global Backbone */
var app = app || {};

var ROWS_EXT = '.rows';
var STATS_EXT = '.stats';

(function () {
	'use strict';
	//console.log("Table class def");
	app.DataTable = app.Table.extend({ 

		createView: function(options) {
			return new app.DataTableView(options);
		},

		getColumns: function() {

			return this.get('fields')
				.sortBy(function(field) {
					return field.get('order');
				})
				.map(function(field) {
					return { 
			data : field.vname(),
		    render: function ( data, type, full, meta ) {
				      	return type == 'display' && data && data.length > 40 
							?  '<span title="'
								+ data + '">'
								+ data.substr( 0, 38) 
								+ '...</span>' 
							: data;
    					},
						field: field 
					};
				});
		},

		getFullUrl: function() {
			return decodeURI(this.lastAjaxUrl);
		},

		ajaxGetRowsFn: function() {
			var me = this;
			return function(data, callback, settings) {
				console.log('request to REST');
				var orderField = me.get('fields')
								.at(data.order[0].column);

				var orderParam = '$orderby=' 
								+ encodeURIComponent(orderField.vname() 
								+ ' ' + data.order[0].dir);
				
				var skipParam = '$skip=' + data.start;
				var topParam = '$top=' + data.length;

				if (data.search.value.length > 0) {
					app.filters.setFilter({
						table: me,
						op: app.Filter.OPS.SEARCH,
						value: data.search.value
					});
				} else {
					app.filters.clearFilter(me);
				}

				var q = orderParam
					+ '&' + skipParam 
					+ '&' + topParam
					+ '&' + app.filters.toParam();
				var url = REST_ROOT + me.get('url') + ROWS_EXT + '?' + q;

				console.log(url);

				me.lastAjaxUrl = url;

				$.ajax(url, {
					cache: false
				}).done(function(response) {
					//console.log('response from REST');
					//console.dir(response);

					var fragment = 
								app.module() 
								+ '/' + app.schema.get('name')
								+ '/' + app.table.get('name') 
								+ '/' + q; 

/*
						//seems to avoid reload on FF but ugly
					var fragment = 
								app.module() 
								+ '/' + app.schema.get('name')
								+ '/' + app.table.get('name') 
								+ '/' + encodeURIComponent(q); 
*/

					//console.log(fragment);
					app.router.navigate(fragment, {replace: true});

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

			var filters = app.filters.apply(filter);
			q = q + '&' + app.Filters.toParam(filters);

			var url = REST_ROOT + this.get('url') + STATS_EXT 
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
				'$distinct': true,
				'$select': fieldName,				
				'$orderby': fieldName
			};

			var q = _.map(params, function(v,k) { return k + "=" + v; })
					.join('&');

			var filters = app.filters.apply(filter, searchTerm);
			q = q + '&' + app.Filters.toParam(filters);

			var url = REST_ROOT + this.get('url') + ROWS_EXT 
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

})();

/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	//console.log("Table class def");
	app.Database = app.Schema.extend({ 

		initialize : function(attrs, options) {
			console.log("Database.initialize " + (attrs.name || ''));
			app.Schema.prototype.initialize.call(this, attrs);
		},

		parse : function(response) {
			console.log("Database.parse " + response);

			var tables = _.map(response.tables, function(table) {
				return new app.DataTable(table);
			});
			response.tables = new app.Tables(tables);
			return response;
		},

	});		

/*
	app.Database.load = function(name, baseUrl, cbAfter) {
		var db = new app.Database({name: name});
		db.url = function() {
			return baseUrl + '/' + this.get('name');
		}
		db.fetch({success: function() {
				db.orgJSON = db.toJSON();
				cbAfter();
		}});
		return db;
	}

	app.Database.create = function(baseUrl, cbAfter) {
		var db = new app.Database({tmp: true});
		db.url = function() {
			return this.get('name') 
				? baseUrl + '/' + this.get('name')
				: baseUrl;
		}
		db.save(function() {
			cbAfter();
		});
		return db;
	}
*/

})();

/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	app.Filter = Backbone.Model.extend({

		initialize: function(attrs) {
			console.log("Filter.initialize ");			

			
			if (_.isString(attrs.table)) {
				this.set('table', 
					app.schema.get('tables').getByName(attrs.table));
			}

			if (attrs.field && _.isString(attrs.field)) {
				this.set('field', 
					this.get('table').get('fields').getByName(attrs.field));
			}

			this.set('id', app.Filter.Key(attrs.table, attrs.field));

		},

		values: function() {
			var me = this;

			var val = _.isArray(this.get('value')) ? 
						this.get('value') : [ this.get('value') ];

			return val.map(function(v) {
				if (me.get('field').get('fk') == 1 
					&& me.get('op') == app.Filter.OPS.IN) {

					if (_.isNumber(v)) return v;
					//extract fk from ref such as 'Book (12)'
					var m = v.match(/^(.*)\(([0-9]+)\)$/);
					//console.log(val + " matches " + m);
					return m[2];
				} else {
					return me.get('field').toQS(v);
				}
			});
		},

		toParam: function() {
			var f = this.get('field') ? this.get('field').vname() : null;
			var key = app.Filter.Key(this.get('table'), f);
			var param;

			if (this.get('op') == app.Filter.OPS.SEARCH) {
				//add asterisk and enclose in double quotes (prefix last + phrase query)
				param = key + " search '" 
						+ '"' + this.get('value') + '*"' + "'";

			} else {
				var values = this.values();
				if (this.get('op') == app.Filter.OPS.BETWEEN) {
					param = key + " btwn " + values[0] + ',' + values[1];

				} else if (this.get('op') == app.Filter.OPS.IN) {
					key = app.Filter.Key(this.get('table'), this.get('field'));
					param = key + " in " + values.join(",");
				}
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
			if (this.get('op') == app.Filter.OPS.SEARCH) {
				result.op = 'search';
				result.value = this.get('value');

			} else if (this.get('op') == app.Filter.OPS.BETWEEN) {
				result.op = 'between';
				result.field = this.get('field').get('name');
				result.value = this.get('value')[0] 
							+ ' and ' + this.get('value')[1];

			} else if (this.get('op') == app.Filter.OPS.IN) {
				result.op = 'in';
				result.field = this.get('field').get('name');
				result.value = this.get('value').join(', '); 
			}
			return result;
		}

	});

	app.Filter.Key = function(table, field) {		
		if (_.isObject(table)) table = table.get('name');
		if ( ! field) field = table;
		else if (_.isObject(field)) field = field.get('name'); //not vname
		return table + '.' + field;
	}

	app.Filter.OPS = {
		'SEARCH': 'search',
		'BETWEEN': 'btwn',
		'IN': 'in'
	}

	app.Filter.CONJUNCTION = ' and ';

})();

/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	// Tables Collection
	// ---------------

	app.Fields = Backbone.Collection.extend({
		// Reference to this collection's model.
		model: app.Field,
		
		initialize: function(attrs) {
			//this.on('change', function(ev) { console.log('Fields.ev ' + ev); });
		},

		addNew: function() {
			var field = app.Field.create('field' + this.length);
			field.set('order', this.length);
			this.add(field);
			return field;
		},

		getByName: function(name) {
			return this.find(function(f) { 
				return f.vname() == name || f.get('name') == name; 
			});
		}
	});

})();

/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	// Tables Collection
	// ---------------

	app.Relations = Backbone.Collection.extend({
		// Reference to this collection's model.
		model: app.Relation,
		
		addNew: function(table) {
			console.log('Relations addNew ' + table.get('name'));
			var relation = new app.Relation.create(table);
			this.add(relation);
			return relation;
		}

	});

})();

/*global Backbone */
var app = app || {};

(function () {
	'use strict';
	app.Schemas = Backbone.Collection.extend({

		initialize: function(models, options) {
			console.log("Schemas.initialize " + options);
			this._url = options.url;
		},

		//Schemas is just a list of schema names
		//model: app.Schema,

		url	: function() { 
			return this._url;
			//return REST_ROOT + "/" + app.user; 
		},

		parse : function(response) {
			console.log("Schemas.parse ");
			return _.values(response.databases);
			//return _.values(response);
		},

	});

})();

/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	// Tables Collection
	// ---------------

	app.Tables = Backbone.Collection.extend({
		// Reference to this collection's model.
		model: app.Table,

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

})();

/*global Backbone */
var app = app || {};

(function () {
	'use strict';

	// Tables Collection
	// ---------------

	app.Filters = Backbone.Collection.extend({
		// Reference to this collection's model.
		model: app.Filter,
		
		toParam: function() {
			return app.Filters.toParam(this.models);	
		},

		//used by Datable.stats & Datatable.options to get context:
		//min/max, opts
		apply: function(exFilter, searchTerm) {

			var filters = this.filter(function(f) {

				//exclude callee
				if (f.id == exFilter.id) return false;

				//exclude existing search on same table
				if (f.get('op') == app.Filter.OPS.SEARCH 
				 && f.get('table') == exFilter.get('table')) {
					return false;
				}

				return true;
			});
			
			//add search term
			if (searchTerm && searchTerm.length > 0) {
				var searchFilter = new app.Filter({
						table: exFilter.get('table'),
						field: exFilter.get('field'),
						op: app.Filter.OPS.SEARCH,
						value: searchTerm
				});
				filters.push(searchFilter);
			}
			
			return filters;
		},

		setFilter: function(attrs) {
			var filter = new app.Filter(attrs);		
			var current = this.get(filter.id);
			if (current) this.remove(current);
			if (attrs.value.length > 0) {
				this.add(filter);
			}
		},

		getFilter: function(table, field) {
			return this.get(app.Filter.Key(table, field));
		},

		clearFilter: function(table, field) {
			var current = this.getFilter(table, field);
			if (current) this.remove(current);
		},

	});

	app.Filters.toParam = function(filters) {
		var result = '';
		if (filters.length > 0) {
			var params = _.reduce(filters, function(memo, f) {
				return memo.length == 0 ? f.toParam() 
					: memo + app.Filter.CONJUNCTION + f.toParam();
			}, '');				
			result = '$filter=' + encodeURIComponent(params);
		}
		return result;
	}

})();

/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.SchemaCurrentView = Backbone.View.extend({
		el:  '#schema-list',

		initialize: function() {
		},

		render: function() {
			console.log('SchemaCurrentView.render ');			
			if (app.schema) {
				this.$('a:first span').html(' DB ' + app.schema.get('name'));
			} else {
				this.$('a:first span').html(' Choose DB ');
			}		
			return this;
		},


	});

})(jQuery);



/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.SchemaListView = Backbone.View.extend({
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
			app.setSchema(name);
/*
			var schema = this.collection.find(function(c) { 
				return c.get('name') == name; 
			});
			app.setSchema(schema);
*/			
		}

	});

})(jQuery);



/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.TableListView = Backbone.View.extend({

		
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

})(jQuery);



/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.DataTableView = Backbone.View.extend({

		id: 'grid-panel',
		className: 'panel',

		initialize: function() {
			console.log("DataTableView.init " + this.model);			
			this.listenTo(app.filters, 'update', this.renderFilterButtons);
		},

		tableTemplate: _.template($('#grid-table-template').html()),
		columnTemplate: _.template($('#grid-column-template').html()),

		renderFilterButtons: function() {
			var columns = this.model.getColumns();
			_.each(columns, function(c, idx) {
				
				var filter = app.filters.getFilter(
						this.model, 
						c.field.get('name')
					);
				
				var active = filter ? true : false;
				var $el = this.$('#col-' + c.data + ' button').first();
				$el.toggleClass('filter-btn-active', active); 

			}, this);
		},

		render: function() {
			console.log('DataTableView.render ');			
			var me = this;
			this.$el.html(this.tableTemplate());

			var columns = this.model.getColumns();

			_.each(columns, function(c, idx) {
				var align = idx < columns.length / 2 ? 
					'dropdown-menu-left' : 'dropdown-menu-right';
				
				this.$('thead > tr').append(this.columnTemplate({
					name: c.data,
					dropalign: align	
				}));					

			}, this);

			this.renderFilterButtons();

			var filter = app.filters.getFilter(this.model);			
			var initSearch = {};
			if (filter) initSearch.search = filter.get('value');

			this.$('#grid').dataTable({
				'serverSide': true,
				'columns': this.model.getColumns(),				
				'ajax': this.model.ajaxGetRowsFn(),
				'search': initSearch
			});

			if (filter) {
				this.$('#grid_filter input').val(filter.get('value'));
			}

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

				var filter = new app.Filter({
					table: me.model,
					field: field
				});

				app.setFilterView(filter, el);
			});

/*
			this.$('#grid').on( 'init.dt', function () {
			    console.log('grid ev init');
			});
*/
			return this;
		},

	});

})(jQuery);



/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.FilterItemsView = Backbone.View.extend({

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
			var current = app.filters.getFilter(
							this.model.get('table'),
							this.model.get('field'));

			if (current && current.get('op') == app.Filter.OPS.IN) {
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

			app.filters.setFilter({
				table: this.model.get('table'),
				field: this.model.get('field'),
				op: app.Filter.OPS.IN,
				value: filterValues
			});
			
			app.router.navigate("reload-table", {trigger: true});			
			//window.location.hash = "#reload-table";
		},

		evFilterOptionClick: function(ev) {
			//console.log(ev.target);
			var opt = $(ev.target).attr('data-target');
			var attr = 'a[data-target="' + opt + '"]';

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

})(jQuery);



/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.FilterRangeView = Backbone.View.extend({

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
			var slideTypes = [app.Field.TYPES.INTEGER,
								app.Field.TYPES.NUMERIC];
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

			var current = app.filters.getFilter(
							this.model.get('table'),
							this.model.get('field'));

			if (current && current.get('op') == app.Filter.OPS.BETWEEN) {
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
				== app.Field.TYPES['DATE']) {

				var opts = { minDate: app.Field.toDate(stats.min), 
							 maxDate: app.Field.toDate(stats.max),
							dateFormat: 'yy-mm-dd' };
				var minVal = app.Field.toDate($("#inputFilterMin").val());
				var maxVal = app.Field.toDate($("#inputFilterMax").val());
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
				app.filters.setFilter({
					table: this.model.get('table'),
					field: this.model.get('field'),
					op: app.Filter.OPS.BETWEEN,
					value: filterValues
				});
			} else {
				app.filters.clearFilter(this.model.get('table'), 
										this.model.get('field'));
			}

			app.router.navigate("reload-table", {trigger: true});			
			//window.location.hash = "#reload-table";
		},

		evFilterRangeResetClick: function() {
			app.filters.clearFilter(this.model.get('table'), 
									this.model.get('field'));

			app.router.navigate("reload-table", {trigger: true});			
			//window.location.hash = "#reload-table";
			this.render();
		},
	});

})(jQuery);



/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.FilterShowView = Backbone.View.extend({
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

			$('#modalInputDataUrl').val(app.table.getFullUrl());
			$('#modalShowFilters').on('shown.bs.modal', function() {
				$('#modalInputDataUrl').select();
			});

			$('#modalShowFilters').modal();

			return this;
		},


	});

})(jQuery);



/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.FilterView = Backbone.View.extend({

		events: {
			'click .filter-column': 'evFilterColumnClick',
			'click .nav-tabs a': 'evFilterTabClick'
		},

		initialize: function () {
			console.log("FilterView.init " + this.model.get('table'));
			this.rangeView = new app.FilterRangeView({
										model: this.model,
										el: this.el
			});
			this.itemsView = new app.FilterItemsView({
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

			if (field.get('type') == app.Field.TYPES.VARCHAR
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
			ev.preventDefault();

	//console.log('evFilterTab ' + ev.target);
			if (/filterSelect$/.test(ev.target.href)) {
				this.itemsView.loadRender();
			} else if (/filterRange$/.test(ev.target.href)) {
				this.rangeView.loadRender();
			}
		}
	});

})(jQuery);



/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.MenuDataView = Backbone.View.extend({
		el:  '#menu',

		events: {
			'click #show-filters': 'evShowFilters',
			//'click #reset-all-filters': 'evResetAllFilters'
		},

		initialize: function() {
			console.log("MenuView.init");
			//this.listenTo(app.table, 'change', this.render);
		},

		template: _.template($('#data-menu-template').html()),

		render: function() {
			console.log('MenuDataView.render ');			
			if (! app.table) this.$el.empty();
			else this.$el.html(this.template());
			return this;
		},

		evResetAllFilters: function() {
			app.unsetFilters();
			app.resetTable();
		},

		evShowFilters: function() {
			app.filterShowView.collection = app.filters;
			app.filterShowView.render();
		},

	});

})(jQuery);



/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.AliasEditView = Backbone.View.extend({
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
					.concat(app.schema.get('tables').getAncestors(this.model));
						
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
			var alias = app.Alias.parse(
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

})(jQuery);



/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.AliasView = Backbone.View.extend({

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
			app.aliasEditView.setModel(this.model, alias);
			app.aliasEditView.render();
		},

	});

})(jQuery);



/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.FieldEditView = Backbone.View.extend({
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
			this.model.set('name', $('#modalInputFieldName').val());
			this.model.set('type', $('#modalInputFieldType').val());
			this.model.set('length', $('#modalInputFieldLength').val());
			if ( ! app.table.get('fields').contains(this.model)) {
				this.model.set('order', app.table.get('fields').length + 1);
				app.table.get('fields').add(this.model);
			}
			app.schema.update();
		},

		removeClick: function() {	
			console.log("FieldEditView.removeClick " + this.model.collection);
			if (this.model.collection) {
				this.model.collection.remove(this.model);
				app.schema.update();
			}
		}

	});

})(jQuery);



/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.FieldView = Backbone.View.extend({

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
			this.$el.html(this.template(this.model.attrJSON()));
			return this;
		},

		editFieldClick: function(ev) {				
			app.fieldEditView.model = this.model;
			app.fieldEditView.render();
		},


	});

})(jQuery);



/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.MenuSchemaView = Backbone.View.extend({
		el:  '#menu',

		events: {
			'click #add-table': 'evAddTableClick',
			'click #new-schema': 'evNewSchemaClick',
			'click #save-schema': 'evSaveSchemaClick',
		},

		initialize: function() {
			console.log("MenuView.init");
			//this.listenTo(app.schema, 'change', this.render);
		},

		template: _.template($('#schema-menu-template').html()),

		render: function() {
			console.log('MenuSchemaView.render ');			
			this.$el.show();
			this.$el.html(this.template());
			this.$('#add-table').prop('disabled', app.schema == null);
			this.$('#save-schema').prop('disabled', app.schema == null);

			return this;
		},

		evAddTableClick: function() {
			var table = app.Table.create();
			app.tableEditView.model = table;
			app.tableEditView.render();
			
		},


		evSaveSchemaClick: function() {
			app.schemaEditView.model = app.schema;
			app.schemaEditView.render();
		},


		evNewSchemaClick: function() {
			app.schemaEditView.model = new app.Database({});
			app.schemaEditView.render();
		},

	});

})(jQuery);


/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.RelationEditView = Backbone.View.extend({
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
			app.schema.get('tables').each(function(table) {
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
				f.set('type', app.Field.TYPES.INTEGER);
			}

			newField = this.model.get('table').get('fields').getByName(newField);
			newTable = app.schema.get('tables').getByName(newTable);
			//console.log('new field ' + fields.getByName(newField).get('name'));
			//console.log('new related table ' + tables.getByName(newTable).get('name'));
			
			this.model.set({
				'type': newType,
				'field': newField,
				'related': newTable
			});	
			if ( ! app.table.get('relations').contains(this.model)) {
				app.table.get('relations').add(this.model);
			}
			app.schema.update();
		},

		removeClick: function() {	
			console.log("RelationEditView.removeClick " + this.model.collection);
			if (this.model.collection) {
				this.model.collection.remove(this.model);
				app.schema.update();
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

})(jQuery);



/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.RelationView = Backbone.View.extend({

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
			app.relationEditView.model = this.model;
			app.relationEditView.render();
		},


	});

})(jQuery);



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
			app.schemaCurrentView.render();
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
			this.model.save(function(err) { return me.renderResult(err); });
		},

		evRemoveClick: function() {	
			var me = this;
			$('#modalSchemaAction > button').prop('disabled', true);
			this.model.destroy(function(err) { return me.renderResult(err); });
		}

	});

})(jQuery);



/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.SchemaTableView = Backbone.View.extend({

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
						var name = $('td:eq(1)', this).text();
						//console.log(name + ' = ' + (index + 1));
						var field = me.model.get('fields').getByName(name);
						field.set('order', index + 1);
					});
				}
			});

			this.setFields();
			this.setRelations();

			this.aliasView = new app.AliasView({
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
			app.tableEditView.model = this.model;
			app.tableEditView.render();
		},

		evNewFieldClick: function() {
			console.log('TableView.evNewFieldClick');
			var field = app.Field.create();
			//var field = this.model.get('fields').addNew();
			app.fieldEditView.model = field;
			app.fieldEditView.render();
		},

		removeField: function(field) {
			console.log('SchemaView.removeField ' + field.get('name'));
			this.fieldViews[field.cid].remove();
		},

		addField: function(field) {
			console.log('TableView.addField ' + field.get("name"));
			var view = new app.FieldView({model: field});
			this.elFields().append(view.render().el);
			this.fieldViews[field.cid] = view;
		},

		setFields: function() {
			console.log('TableView.setFields ' + this.model.get('name'));
			_.each(this.fieldViews, function(view) {
				view.remove();
			});
			this.elFields().html('');

			_.each(this.model.get('fields').sortBy(function(field) {
					return field.get('order');
				}), this.addField, this);
		},

		evNewRelationClick: function() {
			console.log('TableView.evNewRelationClick');
			var relation = app.Relation.create(this.model);
			//console.log(relation.attributes);
			app.relationEditView.model = relation;
			app.relationEditView.render();
		},

		removeRelation: function(relation) {
			console.log('SchemaView.removeRelation ' + relation.cid);
			this.relationViews[relation.cid].remove();
		},

		addRelation: function(relation) {
			console.log('SchemaView.addRelation ' + relation.cid);
			var view = new app.RelationView({model: relation});
			this.elRelations().append(view.render().el);
			this.relationViews[relation.cid] = view;
		},

		setRelations: function() {
			this.elRelations().html('');
			this.model.get('relations').each(this.addRelation, this);
		},


		evNewAliasClick: function() {
			console.log('TableView.evNewAliasClick');
			app.aliasEditView.setModel(this.model, null);
			app.aliasEditView.render();
		}


	});

})(jQuery);



/*global Backbone, jQuery, _ */
var app = app || {};

(function ($) {
	'use strict';

	app.TableEditView = Backbone.View.extend({
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
			if ( ! app.schema.get('tables').contains(this.model)) {
				app.schema.get('tables').add(this.model);
				app.setTable(this.model);
			}
			app.schema.update();
		},

		removeClick: function() {	
			if (this.model.collection) {
				this.model.collection.remove(this.model);
				app.tableView.remove();
				app.schema.update();
			}
		}

	});

})(jQuery);



module.exports = (function() {
  /*
   * Generated by PEG.js 0.8.0.
   *
   * http://pegjs.majda.cz/
   */

  function peg$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }

  function SyntaxError(message, expected, found, offset, line, column) {
    this.message  = message;
    this.expected = expected;
    this.found    = found;
    this.offset   = offset;
    this.line     = line;
    this.column   = column;

    this.name     = "SyntaxError";
  }

  peg$subclass(SyntaxError, Error);

  function parse(input) {
    var options = arguments.length > 1 ? arguments[1] : {},

        peg$FAILED = {},

        peg$startRuleFunctions = { start: peg$parsestart },
        peg$startRuleFunction  = peg$parsestart,

        peg$c0 = peg$FAILED,
        peg$c1 = "$skip=",
        peg$c2 = { type: "literal", value: "$skip=", description: "\"$skip=\"" },
        peg$c3 = function(a) {return {name: '$skip', value: parseInt(a) }; },
        peg$c4 = "$top=",
        peg$c5 = { type: "literal", value: "$top=", description: "\"$top=\"" },
        peg$c6 = function(a) {return {name: '$top', value: parseInt(a) }; },
        peg$c7 = "$orderby=",
        peg$c8 = { type: "literal", value: "$orderby=", description: "\"$orderby=\"" },
        peg$c9 = function(expr) { return {name: '$orderby', value: expr}; },
        peg$c10 = "$select=",
        peg$c11 = { type: "literal", value: "$select=", description: "\"$select=\"" },
        peg$c12 = function(fields) { return {name: '$select', value: fields}; },
        peg$c13 = "$filter=",
        peg$c14 = { type: "literal", value: "$filter=", description: "\"$filter=\"" },
        peg$c15 = function(filters) { return {name: '$filter', value: filters}; },
        peg$c16 = "$distinct=",
        peg$c17 = { type: "literal", value: "$distinct=", description: "\"$distinct=\"" },
        peg$c18 = "true",
        peg$c19 = { type: "literal", value: "true", description: "\"true\"" },
        peg$c20 = "false",
        peg$c21 = { type: "literal", value: "false", description: "\"false\"" },
        peg$c22 = function(distinct) { return {name: '$distinct', value: (distinct == "true") }; },
        peg$c23 = [],
        peg$c24 = ",",
        peg$c25 = { type: "literal", value: ",", description: "\",\"" },
        peg$c26 = null,
        peg$c27 = function(term) { return term; },
        peg$c28 = function(first, rest) { return [first].concat(rest); },
        peg$c29 = "asc",
        peg$c30 = { type: "literal", value: "asc", description: "\"asc\"" },
        peg$c31 = "desc",
        peg$c32 = { type: "literal", value: "desc", description: "\"desc\"" },
        peg$c33 = function(field, ord) { var result = {}; result[field] = ord || 'asc';  return result; },
        peg$c34 = "and",
        peg$c35 = { type: "literal", value: "and", description: "\"and\"" },
        peg$c36 = ".",
        peg$c37 = { type: "literal", value: ".", description: "\".\"" },
        peg$c38 = function(table, field, op) { 
        	 var result = {
        		field: field,
        		op: op[0],
        		value: op[2]     
             };	  
             if (table) result.table = table[0];
        	 return result;
           },
        peg$c39 = { type: "other", description: "operator" },
        peg$c40 = "eq",
        peg$c41 = { type: "literal", value: "eq", description: "\"eq\"" },
        peg$c42 = "ne",
        peg$c43 = { type: "literal", value: "ne", description: "\"ne\"" },
        peg$c44 = "ge",
        peg$c45 = { type: "literal", value: "ge", description: "\"ge\"" },
        peg$c46 = "gt",
        peg$c47 = { type: "literal", value: "gt", description: "\"gt\"" },
        peg$c48 = "le",
        peg$c49 = { type: "literal", value: "le", description: "\"le\"" },
        peg$c50 = "lt",
        peg$c51 = { type: "literal", value: "lt", description: "\"lt\"" },
        peg$c52 = "search",
        peg$c53 = { type: "literal", value: "search", description: "\"search\"" },
        peg$c54 = { type: "other", description: "vector operator" },
        peg$c55 = "in",
        peg$c56 = { type: "literal", value: "in", description: "\"in\"" },
        peg$c57 = "btwn",
        peg$c58 = { type: "literal", value: "btwn", description: "\"btwn\"" },
        peg$c59 = function(field) { return field; },
        peg$c60 = { type: "other", description: "identifier" },
        peg$c61 = /^[a-z]/i,
        peg$c62 = { type: "class", value: "[a-z]i", description: "[a-z]i" },
        peg$c63 = function(first, chars) { return first + chars.join(''); },
        peg$c64 = { type: "other", description: "name char" },
        peg$c65 = /^[a-z0-9_]/i,
        peg$c66 = { type: "class", value: "[a-z0-9_]i", description: "[a-z0-9_]i" },
        peg$c67 = function(value) { return value; },
        peg$c68 = { type: "other", description: "whitespace" },
        peg$c69 = /^[ \t\n\r]/,
        peg$c70 = { type: "class", value: "[ \\t\\n\\r]", description: "[ \\t\\n\\r]" },
        peg$c71 = { type: "other", description: "number" },
        peg$c72 = function() { return parseFloat(text()); },
        peg$c73 = /^[1-9]/,
        peg$c74 = { type: "class", value: "[1-9]", description: "[1-9]" },
        peg$c75 = /^[eE]/,
        peg$c76 = { type: "class", value: "[eE]", description: "[eE]" },
        peg$c77 = "-",
        peg$c78 = { type: "literal", value: "-", description: "\"-\"" },
        peg$c79 = "+",
        peg$c80 = { type: "literal", value: "+", description: "\"+\"" },
        peg$c81 = "0",
        peg$c82 = { type: "literal", value: "0", description: "\"0\"" },
        peg$c83 = { type: "other", description: "string" },
        peg$c84 = function(chars) { return chars.join(""); },
        peg$c85 = "'",
        peg$c86 = { type: "literal", value: "'", description: "\"'\"" },
        peg$c87 = "\\",
        peg$c88 = { type: "literal", value: "\\", description: "\"\\\\\"" },
        peg$c89 = "/",
        peg$c90 = { type: "literal", value: "/", description: "\"/\"" },
        peg$c91 = "b",
        peg$c92 = { type: "literal", value: "b", description: "\"b\"" },
        peg$c93 = function() { return "\b"; },
        peg$c94 = "f",
        peg$c95 = { type: "literal", value: "f", description: "\"f\"" },
        peg$c96 = function() { return "\f"; },
        peg$c97 = "n",
        peg$c98 = { type: "literal", value: "n", description: "\"n\"" },
        peg$c99 = function() { return "\n"; },
        peg$c100 = "r",
        peg$c101 = { type: "literal", value: "r", description: "\"r\"" },
        peg$c102 = function() { return "\r"; },
        peg$c103 = "t",
        peg$c104 = { type: "literal", value: "t", description: "\"t\"" },
        peg$c105 = function() { return "\t"; },
        peg$c106 = "u",
        peg$c107 = { type: "literal", value: "u", description: "\"u\"" },
        peg$c108 = function(digits) {
                  return String.fromCharCode(parseInt(digits, 16));
                },
        peg$c109 = function(sequence) { return sequence; },
        peg$c110 = /^[ -&(-[\]-\u10FFFF]/,
        peg$c111 = { type: "class", value: "[ -&(-[\\]-\\u10FFFF]", description: "[ -&(-[\\]-\\u10FFFF]" },
        peg$c112 = /^[0-9]/,
        peg$c113 = { type: "class", value: "[0-9]", description: "[0-9]" },
        peg$c114 = /^[0-9a-f]/i,
        peg$c115 = { type: "class", value: "[0-9a-f]i", description: "[0-9a-f]i" },

        peg$currPos          = 0,
        peg$reportedPos      = 0,
        peg$cachedPos        = 0,
        peg$cachedPosDetails = { line: 1, column: 1, seenCR: false },
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
      return input.substring(peg$reportedPos, peg$currPos);
    }

    function offset() {
      return peg$reportedPos;
    }

    function line() {
      return peg$computePosDetails(peg$reportedPos).line;
    }

    function column() {
      return peg$computePosDetails(peg$reportedPos).column;
    }

    function expected(description) {
      throw peg$buildException(
        null,
        [{ type: "other", description: description }],
        peg$reportedPos
      );
    }

    function error(message) {
      throw peg$buildException(message, null, peg$reportedPos);
    }

    function peg$computePosDetails(pos) {
      function advance(details, startPos, endPos) {
        var p, ch;

        for (p = startPos; p < endPos; p++) {
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
        }
      }

      if (peg$cachedPos !== pos) {
        if (peg$cachedPos > pos) {
          peg$cachedPos = 0;
          peg$cachedPosDetails = { line: 1, column: 1, seenCR: false };
        }
        advance(peg$cachedPosDetails, peg$cachedPos, pos);
        peg$cachedPos = pos;
      }

      return peg$cachedPosDetails;
    }

    function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) { return; }

      if (peg$currPos > peg$maxFailPos) {
        peg$maxFailPos = peg$currPos;
        peg$maxFailExpected = [];
      }

      peg$maxFailExpected.push(expected);
    }

    function peg$buildException(message, expected, pos) {
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
            .replace(/[\u0180-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
            .replace(/[\u1080-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
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

      var posDetails = peg$computePosDetails(pos),
          found      = pos < input.length ? input.charAt(pos) : null;

      if (expected !== null) {
        cleanupExpected(expected);
      }

      return new SyntaxError(
        message !== null ? message : buildMessage(expected, found),
        expected,
        found,
        pos,
        posDetails.line,
        posDetails.column
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
              if (s0 === peg$FAILED) {
                s0 = peg$parseparamDistinct();
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parseparamSkip() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6) === peg$c1) {
        s1 = peg$c1;
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c2); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        s3 = peg$parseint();
        if (s3 !== peg$FAILED) {
          s3 = input.substring(s2, peg$currPos);
        }
        s2 = s3;
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c3(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseparamTop() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 5) === peg$c4) {
        s1 = peg$c4;
        peg$currPos += 5;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c5); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        s3 = peg$parseint();
        if (s3 !== peg$FAILED) {
          s3 = input.substring(s2, peg$currPos);
        }
        s2 = s3;
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c6(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseparamOrderBy() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 9) === peg$c7) {
        s1 = peg$c7;
        peg$currPos += 9;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c8); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseorderByExpr();
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c9(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseparamSelect() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 8) === peg$c10) {
        s1 = peg$c10;
        peg$currPos += 8;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c11); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsefields();
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c12(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseparamFilter() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 8) === peg$c13) {
        s1 = peg$c13;
        peg$currPos += 8;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c14); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsefilterExpr();
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c15(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseparamDistinct() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 10) === peg$c16) {
        s1 = peg$c16;
        peg$currPos += 10;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c17); }
      }
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 4) === peg$c18) {
          s2 = peg$c18;
          peg$currPos += 4;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c19); }
        }
        if (s2 === peg$FAILED) {
          if (input.substr(peg$currPos, 5) === peg$c20) {
            s2 = peg$c20;
            peg$currPos += 5;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c21); }
          }
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c22(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
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
          s4 = peg$c24;
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c25); }
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parsews();
          if (s5 === peg$FAILED) {
            s5 = peg$c26;
          }
          if (s5 !== peg$FAILED) {
            s6 = peg$parseorderByTerm();
            if (s6 !== peg$FAILED) {
              peg$reportedPos = s3;
              s4 = peg$c27(s6);
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$c0;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 44) {
            s4 = peg$c24;
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c25); }
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parsews();
            if (s5 === peg$FAILED) {
              s5 = peg$c26;
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parseorderByTerm();
              if (s6 !== peg$FAILED) {
                peg$reportedPos = s3;
                s4 = peg$c27(s6);
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c28(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseorderByTerm() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseidentifier();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsews();
        if (s2 === peg$FAILED) {
          s2 = peg$c26;
        }
        if (s2 !== peg$FAILED) {
          if (input.substr(peg$currPos, 3).toLowerCase() === peg$c29) {
            s3 = input.substr(peg$currPos, 3);
            peg$currPos += 3;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c30); }
          }
          if (s3 === peg$FAILED) {
            if (input.substr(peg$currPos, 4).toLowerCase() === peg$c31) {
              s3 = input.substr(peg$currPos, 4);
              peg$currPos += 4;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c32); }
            }
          }
          if (s3 === peg$FAILED) {
            s3 = peg$c26;
          }
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c33(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parsefilterExpr() {
      var s0, s1, s2, s3, s4, s5, s6, s7;

      s0 = peg$currPos;
      s1 = peg$parsefilterTerm();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parsews();
        if (s4 !== peg$FAILED) {
          if (input.substr(peg$currPos, 3) === peg$c34) {
            s5 = peg$c34;
            peg$currPos += 3;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c35); }
          }
          if (s5 !== peg$FAILED) {
            s6 = peg$parsews();
            if (s6 !== peg$FAILED) {
              s7 = peg$parsefilterTerm();
              if (s7 !== peg$FAILED) {
                peg$reportedPos = s3;
                s4 = peg$c27(s7);
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$c0;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parsews();
          if (s4 !== peg$FAILED) {
            if (input.substr(peg$currPos, 3) === peg$c34) {
              s5 = peg$c34;
              peg$currPos += 3;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c35); }
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parsews();
              if (s6 !== peg$FAILED) {
                s7 = peg$parsefilterTerm();
                if (s7 !== peg$FAILED) {
                  peg$reportedPos = s3;
                  s4 = peg$c27(s7);
                  s3 = s4;
                } else {
                  peg$currPos = s3;
                  s3 = peg$c0;
                }
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c28(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
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
          s3 = peg$c36;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c37); }
        }
        if (s3 !== peg$FAILED) {
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$c0;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$c0;
      }
      if (s1 === peg$FAILED) {
        s1 = peg$c26;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseidentifier();
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
                  s4 = peg$c0;
                }
              } else {
                peg$currPos = s4;
                s4 = peg$c0;
              }
            } else {
              peg$currPos = s4;
              s4 = peg$c0;
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
                    s4 = peg$c0;
                  }
                } else {
                  peg$currPos = s4;
                  s4 = peg$c0;
                }
              } else {
                peg$currPos = s4;
                s4 = peg$c0;
              }
            }
            if (s4 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c38(s1, s2, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseop() {
      var s0, s1;

      peg$silentFails++;
      if (input.substr(peg$currPos, 2) === peg$c40) {
        s0 = peg$c40;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c41); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c42) {
          s0 = peg$c42;
          peg$currPos += 2;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c43); }
        }
        if (s0 === peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c44) {
            s0 = peg$c44;
            peg$currPos += 2;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c45); }
          }
          if (s0 === peg$FAILED) {
            if (input.substr(peg$currPos, 2) === peg$c46) {
              s0 = peg$c46;
              peg$currPos += 2;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c47); }
            }
            if (s0 === peg$FAILED) {
              if (input.substr(peg$currPos, 2) === peg$c48) {
                s0 = peg$c48;
                peg$currPos += 2;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c49); }
              }
              if (s0 === peg$FAILED) {
                if (input.substr(peg$currPos, 2) === peg$c50) {
                  s0 = peg$c50;
                  peg$currPos += 2;
                } else {
                  s0 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c51); }
                }
                if (s0 === peg$FAILED) {
                  if (input.substr(peg$currPos, 6) === peg$c52) {
                    s0 = peg$c52;
                    peg$currPos += 6;
                  } else {
                    s0 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c53); }
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
        if (peg$silentFails === 0) { peg$fail(peg$c39); }
      }

      return s0;
    }

    function peg$parsevecop() {
      var s0, s1;

      peg$silentFails++;
      if (input.substr(peg$currPos, 2) === peg$c55) {
        s0 = peg$c55;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c56); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 4) === peg$c57) {
          s0 = peg$c57;
          peg$currPos += 4;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c58); }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c54); }
      }

      return s0;
    }

    function peg$parsefields() {
      var s0, s1, s2, s3, s4, s5, s6;

      s0 = peg$currPos;
      s1 = peg$parseidentifier();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 44) {
          s4 = peg$c24;
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c25); }
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parsews();
          if (s5 === peg$FAILED) {
            s5 = peg$c26;
          }
          if (s5 !== peg$FAILED) {
            s6 = peg$parseidentifier();
            if (s6 !== peg$FAILED) {
              peg$reportedPos = s3;
              s4 = peg$c59(s6);
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$c0;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 44) {
            s4 = peg$c24;
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c25); }
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parsews();
            if (s5 === peg$FAILED) {
              s5 = peg$c26;
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parseidentifier();
              if (s6 !== peg$FAILED) {
                peg$reportedPos = s3;
                s4 = peg$c59(s6);
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c28(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseidentifier() {
      var s0, s1, s2, s3;

      peg$silentFails++;
      s0 = peg$currPos;
      if (peg$c61.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c62); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsefchar();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsefchar();
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c63(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c60); }
      }

      return s0;
    }

    function peg$parsefchar() {
      var s0, s1;

      peg$silentFails++;
      if (peg$c65.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c66); }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c64); }
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
          s4 = peg$c24;
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c25); }
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parsews();
          if (s5 === peg$FAILED) {
            s5 = peg$c26;
          }
          if (s5 !== peg$FAILED) {
            s6 = peg$parsevalue();
            if (s6 !== peg$FAILED) {
              peg$reportedPos = s3;
              s4 = peg$c67(s6);
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$c0;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 44) {
            s4 = peg$c24;
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c25); }
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parsews();
            if (s5 === peg$FAILED) {
              s5 = peg$c26;
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parsevalue();
              if (s6 !== peg$FAILED) {
                peg$reportedPos = s3;
                s4 = peg$c67(s6);
                s3 = s4;
              } else {
                peg$currPos = s3;
                s3 = peg$c0;
              }
            } else {
              peg$currPos = s3;
              s3 = peg$c0;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$c0;
          }
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c28(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
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
      if (peg$c69.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c70); }
      }
      if (s1 !== peg$FAILED) {
        while (s1 !== peg$FAILED) {
          s0.push(s1);
          if (peg$c69.test(input.charAt(peg$currPos))) {
            s1 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c70); }
          }
        }
      } else {
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c68); }
      }

      return s0;
    }

    function peg$parsenumber() {
      var s0, s1, s2, s3, s4;

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseminus();
      if (s1 === peg$FAILED) {
        s1 = peg$c26;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseint();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsefrac();
          if (s3 === peg$FAILED) {
            s3 = peg$c26;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseexp();
            if (s4 === peg$FAILED) {
              s4 = peg$c26;
            }
            if (s4 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c72();
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c71); }
      }

      return s0;
    }

    function peg$parsedecimal_point() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 46) {
        s0 = peg$c36;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c37); }
      }

      return s0;
    }

    function peg$parsedigit1_9() {
      var s0;

      if (peg$c73.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c74); }
      }

      return s0;
    }

    function peg$parsee() {
      var s0;

      if (peg$c75.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c76); }
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
          s2 = peg$c26;
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
            s3 = peg$c0;
          }
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
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
          s2 = peg$c0;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
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
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      }

      return s0;
    }

    function peg$parseminus() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 45) {
        s0 = peg$c77;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c78); }
      }

      return s0;
    }

    function peg$parseplus() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 43) {
        s0 = peg$c79;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c80); }
      }

      return s0;
    }

    function peg$parsezero() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 48) {
        s0 = peg$c81;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c82); }
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
            peg$reportedPos = s0;
            s1 = peg$c84(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c83); }
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
            s2 = peg$c85;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c86); }
          }
          if (s2 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 92) {
              s2 = peg$c87;
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c88); }
            }
            if (s2 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 47) {
                s2 = peg$c89;
                peg$currPos++;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c90); }
              }
              if (s2 === peg$FAILED) {
                s2 = peg$currPos;
                if (input.charCodeAt(peg$currPos) === 98) {
                  s3 = peg$c91;
                  peg$currPos++;
                } else {
                  s3 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c92); }
                }
                if (s3 !== peg$FAILED) {
                  peg$reportedPos = s2;
                  s3 = peg$c93();
                }
                s2 = s3;
                if (s2 === peg$FAILED) {
                  s2 = peg$currPos;
                  if (input.charCodeAt(peg$currPos) === 102) {
                    s3 = peg$c94;
                    peg$currPos++;
                  } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c95); }
                  }
                  if (s3 !== peg$FAILED) {
                    peg$reportedPos = s2;
                    s3 = peg$c96();
                  }
                  s2 = s3;
                  if (s2 === peg$FAILED) {
                    s2 = peg$currPos;
                    if (input.charCodeAt(peg$currPos) === 110) {
                      s3 = peg$c97;
                      peg$currPos++;
                    } else {
                      s3 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c98); }
                    }
                    if (s3 !== peg$FAILED) {
                      peg$reportedPos = s2;
                      s3 = peg$c99();
                    }
                    s2 = s3;
                    if (s2 === peg$FAILED) {
                      s2 = peg$currPos;
                      if (input.charCodeAt(peg$currPos) === 114) {
                        s3 = peg$c100;
                        peg$currPos++;
                      } else {
                        s3 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c101); }
                      }
                      if (s3 !== peg$FAILED) {
                        peg$reportedPos = s2;
                        s3 = peg$c102();
                      }
                      s2 = s3;
                      if (s2 === peg$FAILED) {
                        s2 = peg$currPos;
                        if (input.charCodeAt(peg$currPos) === 116) {
                          s3 = peg$c103;
                          peg$currPos++;
                        } else {
                          s3 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c104); }
                        }
                        if (s3 !== peg$FAILED) {
                          peg$reportedPos = s2;
                          s3 = peg$c105();
                        }
                        s2 = s3;
                        if (s2 === peg$FAILED) {
                          s2 = peg$currPos;
                          if (input.charCodeAt(peg$currPos) === 117) {
                            s3 = peg$c106;
                            peg$currPos++;
                          } else {
                            s3 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c107); }
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
                                    s5 = peg$c0;
                                  }
                                } else {
                                  peg$currPos = s5;
                                  s5 = peg$c0;
                                }
                              } else {
                                peg$currPos = s5;
                                s5 = peg$c0;
                              }
                            } else {
                              peg$currPos = s5;
                              s5 = peg$c0;
                            }
                            if (s5 !== peg$FAILED) {
                              s5 = input.substring(s4, peg$currPos);
                            }
                            s4 = s5;
                            if (s4 !== peg$FAILED) {
                              peg$reportedPos = s2;
                              s3 = peg$c108(s4);
                              s2 = s3;
                            } else {
                              peg$currPos = s2;
                              s2 = peg$c0;
                            }
                          } else {
                            peg$currPos = s2;
                            s2 = peg$c0;
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
            peg$reportedPos = s0;
            s1 = peg$c109(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      }

      return s0;
    }

    function peg$parseescape() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 92) {
        s0 = peg$c87;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c88); }
      }

      return s0;
    }

    function peg$parsequotation_mark() {
      var s0;

      if (input.charCodeAt(peg$currPos) === 39) {
        s0 = peg$c85;
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c86); }
      }

      return s0;
    }

    function peg$parseunescaped() {
      var s0;

      if (peg$c110.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c111); }
      }

      return s0;
    }

    function peg$parseDIGIT() {
      var s0;

      if (peg$c112.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c113); }
      }

      return s0;
    }

    function peg$parseHEXDIG() {
      var s0;

      if (peg$c114.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c115); }
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

      throw peg$buildException(null, peg$maxFailExpected, peg$maxFailPos);
    }
  }

  return {
    SyntaxError: SyntaxError,
    parse:       parse
  };
})();

/*global Backbone */
var app = app || {};
var pegParser = module.exports;

(function () {
	'use strict';

	app.Router = Backbone.Router.extend({
        routes: {
            "data": "data",
            "schema": "schema",
			"table/:table": "navTable",
			"reset-filter": "unsetFilters",
			"reload-table": "reloadTable",
			"data/:schema/:table(/*params)": "urlTableData",
			"schema/:schema/:table": "urlTableSchema"
        },
        
        data: function() {
            app.gotoModule("data");
			app.resetTable();
        },

        schema: function() {
            app.gotoModule("schema");
			app.resetTable();
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

		urlTableData: function(schemaName, tableName, paramStr) {
			console.log("urlTableData " 
						+ schemaName + " " + tableName + " " + paramStr);

			this.gotoTable(tableName, { 
				module: 'data', 
				schema: schemaName,
				params: this.parseParams(paramStr)
			});
		},

		urlTableSchema: function(schemaName, tableName) {
			this.gotoTable(tableName, {
				module: 'schema', 
				schema: schemaName
			});
		},

		navTable: function(tableName) {
			//console.log("clickTable " + tableName);
			this.gotoTable(tableName);
		},

		unsetFilters: function() {
			app.unsetFilters();
			app.resetTable();
		},

		reloadTable: function() {
			app.table.reload();
		},

		gotoTable: function(tableName, options) {
			options = options || {};

			var setOthers = function() {

				var table = app.schema.get('tables').find(function(t) { 
					return t.get('name') == tableName; 
				});			

				//set filters
				if (options.params) {
					var filters = _.map(options.params.$filter, function(f) {
						return new app.Filter(f);
					});
					app.setFilters(filters);
				}
				
				//load data			
				app.setTable(table);
			}

			if (options.module) {
				app.gotoModule(options.module);
			}

			if (options.schema) {
				app.setSchema(options.schema, setOthers);

			} else {
				setOthers();
			}


		}

        
	});


})();

/*global Backbone */
var REST_ROOT = "http://api.donkeylift.com";  //set by gulp according to env var. e.g. "http://api.donkeylift.com";
var app = app || {};

$(function () {
	'use strict';

	/**** init app - called at the end ***/
	app.init = function() {

		//fixed user named demo
		app.user = 'demo';

		app.schemas = new app.Schemas(null, {url: REST_ROOT + '/' + app.user});

		app.filters = new app.Filters();

		app.schemaCurrentView = new app.SchemaCurrentView();

		app.schemaEditView = new app.SchemaEditView();
		app.tableEditView = new app.TableEditView();
		app.fieldEditView = new app.FieldEditView();
		app.relationEditView = new app.RelationEditView();
		app.aliasEditView = new app.AliasEditView();

		app.filterShowView = new app.FilterShowView();

		app.schemas.fetch({success: function() {
			app.schemaListView = new app.SchemaListView({collection: app.schemas});
			$('#schema-list').append(app.schemaListView.render().el);
		}});

		app.router = new app.Router();
		Backbone.history.start();

		app.gotoModule('data');

		$('#toggle-sidebar').hide();
	}
	
	$('#toggle-sidebar').click(function() {
		app.toggleSidebar();
	}); 

	$(document).ajaxStart(function() {
		$('#ajax-progress-spinner').show();
	});
	$(document).ajaxStop(function() {
		$('#ajax-progress-spinner').hide();
	});

	app.toggleSidebar = function() {
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

	app.gotoModule = function(name) {
		console.log('switching to module ' + name);

		$('#goto-options li').removeClass('active');
		$('#goto-options a[data-target="' + name + '"]')
			.parent().addClass('active');

		if (name == 'schema') {
			app.menuView = new app.MenuSchemaView();
		} else if (name == 'data') {
			app.menuView = new app.MenuDataView();
		}
		app.menuView.render();

	}

	app.module = function() {
		var m;
		if (app.menuView instanceof app.MenuSchemaView) m = 'schema';
		else if (app.menuView instanceof app.MenuDataView) m = 'data';
		//console.log('module ' + m);
		return m;		
	}

	app.setTable = function(table) {
		console.log('app.setTable');
		var $a = $("#table-list a[data-target='" + table.get('name') + "']");
		$('#table-list a').removeClass('active');
		$a.addClass('active');

		app.table = table;
		if (app.tableView) app.tableView.remove();

		if (app.module() == 'data') {
			app.tableView = new app.DataTableView({model: table});
		} else if (app.module() == 'schema') {
			app.tableView = new app.SchemaTableView({model: table});
		}

		$('#content').append(app.tableView.render().el);			
		app.menuView.render();			
	}

	app.resetTable = function() {
		if (app.table) app.setTable(app.table);
	}

	/**** schema stuff ****/

	app.unsetSchema = function() {
		app.table = null;
		app.schema = null;
		if (app.gridView) app.gridView.remove();
		if (app.tableView) app.tableView.remove();
		if (app.tableListView) app.tableListView.remove();
		
		app.schemaCurrentView.render();
	}

	app.setSchema = function(name, cbAfter) {
		var loadRequired = ! app.schema || app.schema.get('name') != name;

		if (loadRequired) {
			app.unsetSchema();
			app.schema = new app.Database({name : name, id : name});
			app.schema.fetch(function() {
				app.tableListView = new app.TableListView({
					collection: app.schema.get('tables')
				});
				$('#sidebar').append(app.tableListView.render().el);
				$('#toggle-sidebar').show();

				//render current schema label
				app.schemaCurrentView.render();
				if (cbAfter) cbAfter();
			});
		} else {
			if (cbAfter) cbAfter();
		}
	}

	app.newSchema = function(name) {
		app.unsetSchema();
		app.schema = new app.Database({name : name});
		app.schema.save(function() {
			app.tableListView = new app.TableListView({
				collection: app.schema.get('tables')
			});
			$('#sidebar').append(app.tableListView.render().el);

			//render current schema label
			app.schemaCurrentView.render();
		});
	}

	/**** data stuff ****/

	app.setFilters = function(filters) {
		app.filters = new app.Filters(filters);
	}

	app.unsetFilters = function() {
		app.filters = new app.Filters();
	}

	app.setFilterView = function(filter, $parentElem) {
		if (app.filterView) app.filterView.remove();
		app.filterView = new app.FilterView({ model: filter });
		$parentElem.append(app.filterView.el);
		app.filterView.render();
	}

	//start
	app.init();

});

