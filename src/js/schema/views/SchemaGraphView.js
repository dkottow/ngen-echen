/*global Donkeylift, vis, Backbone, $, _ */

Donkeylift.SchemaGraphView = Backbone.View.extend({

	el:  '#content',
	events: {
		'click .join-tree-item': 'evJoinTreeClick'
	},

	initialize: function() {
		console.log("SchemaGraphView.init");
	},

	template: _.template($('#schema-graph-template').html()),
	drop_template: _.template('<li><a href="#" class="join-tree-item">Tree #{{ id }}</a></li>'),

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
	    	, interaction: {
	    		multiselect: true
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


