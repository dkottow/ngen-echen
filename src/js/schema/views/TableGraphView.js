/*global Donkeylift, Backbone, jQuery, _ */

Donkeylift.TableGraphView = Backbone.View.extend({

	el:  '#content',

	initialize: function() {
		console.log("TableGraphView.init");
	},

	template: _.template('<div id="vis-graph"></div>'),

	render: function() {
		console.log("TableGraphView.render " + this.model.get("name"));
		this.$el.html(this.template());
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
		
		return this;
	},

});


