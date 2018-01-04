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
		//relations and row_alias are set in initRefs
	},

	initRefs: function(tables) {
		this.initRelations(tables);
		this.initAlias(tables);
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
	
	getProp: function(name) {
		if ( ! this.propKey) return undefined;
		return Donkeylift.app.getProp(this.propKey(name));
	},

	setProp: function(name, value) {
		if ( ! this.propKey) return;
		Donkeylift.app.setProp(this.propKey(name), value);
	},

	allProps : function() {
		//TODO
	},

	visible: function() {
		var visible = this.getProp('visible');
		if (visible === undefined) {
			visible = this.get('name')[0] != '_';	
		}  
		return visible;
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
		//fields = _.object(_.pluck(fields, 'name'), fields);

		this.get('relations').each(function(relation) {
			var field = _.find(fields, function(f) {
				return f.name == relation.get('field').get('name');				
			});
			field.fk_table = relation.get('related').get('name');
		});

		var row_alias = _.map(this.get('row_alias'), function(a) {
			if (a.get('table') == this) return a.get('field').get('name');
			else return a.toString();	
		}, this);

		return {
			name: this.get('name')
			, row_alias: row_alias
			, access_control: this.get('access_control')
			, fields: _.object(_.pluck(fields, 'name'), fields)
		};
	},

	parse: function(row, opts) {
		opts = opts || {};
		var resolveRefs = opts.resolveRefs || false;

		return _.object(_.map(row, function(val, fn) {
			var field = this.get('fields').getByName(fn);			
			if (resolveRefs) fn = field.get('name');
			return [fn, field.parse(val, opts)];
		}, this));

	},

	dataCache: {},

	fieldValues: function(fieldName, searchTerm, callback) {
 		var me = this;

		var filterTerm = [
			fieldName, 
			Donkeylift.Filter.OPS.SEARCH, 
			"'" + searchTerm + "'"
		].join(' ');

		var params = {
			'$top': 10,
			'$select': fieldName,
			'$orderby': fieldName,
			'$filter': filterTerm
		};

		var q = _.map(params, function(v,k) { return k + "=" + encodeURIComponent(v); })
				.join('&');

		var url = this.fullUrl() + '?' + q;
		console.log(url);
		if (this.dataCache[url]) {
			//console.log(this.dataCache[url]);
			callback(this.dataCache[url]['rows'], { cached: true });

		} else {
			Donkeylift.ajax(url, {})
			
			.then(function(result) {
				var response = result.response;
				//console.dir(response.rows);
				me.dataCache[url] = response;
				callback(response.rows);
			});
		}
	},


	addFieldsByExample: function(data) {
		var rows = data.trim().split('\n');
		if (rows.length < 2)  return;

		var fieldNames = _.map(rows[0].trim().split('\t'), function(fn, idx) {
			fn = Donkeylift.util.removeDiacritics(fn.trim());
			fn = fn.replace(/\s+/g, '_').replace(/\W/g, '');
			var match = fn.match(/[a-zA-Z]\w*/);
			return match ? match[0] : 'NA' + idx;
		});
		console.log(fieldNames);
		
		var values = _.map(rows[1].trim().split('\t'), function(val) {
			return val.trim();
		});
		console.log(values);

		var fields = [];
		for(var i = 0; i < fieldNames.length; ++i) {
			var field = Donkeylift.Field.create(fieldNames[i]);
			field.setProp('order', 10*(i + 1));
			fields.push(field);

			if (values.length <= i) continue;

			field.setTypeByExample(values[i]);
		}

		this.get('fields').add(fields);
	},

	sanitizeFieldOrdering: function() {
		var orderedFields = this.get('fields').sortBy(function(f) {
			return f.getProp('order');
		});	
		for(var i = 0; i < orderedFields.length; ++i) {
			orderedFields[i].setProp('order', 10*(i + 1));
		}
	}

});

Donkeylift.Table.create = function(name) {
	var table = new Donkeylift.Table({
		name: name,
	});
	table.initRefs();
	return table;
}

Donkeylift.Table.NONEDITABLE_FIELDS = ['id', 'mod_by', 'mod_on', 'add_by', 'add_on'];
Donkeylift.Table.INITHIDE_FIELDS = ['own_by', 'mod_by', 'mod_on', 'add_by', 'add_on'];
