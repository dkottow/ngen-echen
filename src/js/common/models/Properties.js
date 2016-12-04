/*global Donkeylift, Backbone, _ */

Donkeylift.Properties = Backbone.Model.extend({

	initialize: function(props, params) {

        this.parent = params.parent;
        this.defs = params.propDefs; 

        //this.parent instanceof Donkeylift.Field
        
		_.each(this.defs, function(p) {
			if (this.getDefinition(p.name) && this.get(p.name) === undefined) {
				this.setDefault(p);
			}
		}, this);
	},
	
	getDefinition: function(name) {
		var prop = _.find(this.defs, function(p) { return p.name == name; });
		if (! prop) return undefined;
		if (! prop.scope) return prop;
        return _.contains(prop.scope, this.parent.get('type'))
            ? prop : undefined;
	},

	getAll: function() {
		var props = [];
		for(var i=0; i<this.defs.length; ++i) {
			var prop = this.getDefinition(this.defs[i].name);
			if (prop) {
				prop.value = this.get(prop.name);
				props.push(prop);
			}
		}
		return props;
	},

	setFromArray: function(inputValues) {
		var props = _.object(_.pluck(inputValues, 'name'), 
							 _.pluck(inputValues, 'value'));
		_.each(this.getAll(), function(p) {

			var val;
			if (p.type == 'Boolean') {
				this.set(p.name, props[p.name] == "on");

			} else if (p.type == 'Integer') {
				var val = parseInt(props[p.name]);
				if ( ! isNaN(val)) this.set(p.name, val);

			} else if (p.type == 'Decimal') {
				var val = parseFloat(props[p.name]);
				if ( ! isNaN(val)) this.set(p.name, val);

			} else {
				var val = props[p.name];
				if (val) this.set(p.name, val);
			}

		}, this);

	},

	setDefault: function(propDef) {

        if (this.parent instanceof Donkeylift.Field) {
			if (propDef.name == 'visible') {
				var v = _.contains(Donkeylift.Table.INITHIDE_FIELDS, this.parent.get('name'))
						? false : true;
				this.set(propDef.name, v);
	
			} else {
				this.set(propDef.name, propDef.default);			
			}
        }
	},

});
	
