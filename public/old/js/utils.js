/*
var treeData = [
  {
    "name": "Top Level",
    "parent": "null",
    "children": [
      {
        "name": "Level 2: A",
        "parent": "Top Level",
        "children": [
          {
            "name": "Son of A",
            "supertype": "Level 2: A"
          },
          {
            "name": "Daughter of A",
            "parent": "Level 2: A"
          }
        ]
      },
      {
        "name": "Level 2: B",
        "supertype": "Top Level"
      }

     ,{
        "name": "Level 2: C",
        "parent": "Top Level"
      },
      {
        "name": "Level 2: D",
        "supertype": "Top Level"
      }

    ]
  }
];

*/

function generateTableDiagram(htmlNode) {
	// ************** Generate the tree diagram	 *****************
	var margin = {top: 20, right: 120, bottom: 20, left: 100},
		width = 960 - margin.right - margin.left,
		height = 400 - margin.top - margin.bottom;
	
	var i = 0;

	var tree = d3.layout.tree()
		.size([height, width]);

	var diagonal = d3.svg.diagonal()
		.projection(function(d) { return [d.y, d.x]; });

	var svg = d3.select(htmlNode).append("svg")
		.attr("width", width + margin.right + margin.left)
		.attr("height", height + margin.top + margin.bottom)
	  .append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	root = treeData[0];
	  
	update(root);

	function update(source) {

	  // Compute the new tree layout.
	  var nodes = tree.nodes(root).reverse(),
		  links = tree.links(nodes);

	  // Normalize for fixed-depth.
	  nodes.forEach(function(d) { d.y = d.depth * 150; });

	  // Declare the nodes…
	  var node = svg.selectAll("g.node")
		  .data(nodes, function(d) { return d.id || (d.id = ++i); });

	  // Enter the nodes.
	  var nodeEnter = node.enter().append("g")
		  .attr("class", "node")
		  .attr("transform", function(d) { 
			  return "translate(" + d.y + "," + d.x + ")"; });

	  nodeEnter.append("circle")
		  .attr("r", 10)
		  .style("fill", "#fff");

	  nodeEnter.append("text")
		  .attr("x", 0)
		  .attr("dy", "2em")
		  .attr("text-anchor", "middle")	
		  .text(function(d) { return d.name; })
		  .style("fill-opacity", 1);

	  // Declare the links…
	  var link = svg.selectAll("path.link")
		  .data(links, function(d) { return d.target.id; });

	  // Enter the links.
	  link.enter().insert("path", "g")
		  .attr("class", "link")
		  .attr("d", diagonal);

	  var superLinks = links.filter(function(l) { 
		return l.target.supertype; 
	  });

	  svg.selectAll("g.supertype")
		.data(superLinks)
		.enter()
		.append("line")
		.attr("class", "linkspec")
		.attr("transform", function(d) { 
			var t = "translate(" 
					+ (d.source.y + 0.9*(d.target.y - d.source.y)) + ","
					+ d.target.x + ")"; 
			return t; })
		.attr("x1", -2)
		.attr("y1", -6)
		.attr("x2", -2)
		.attr("y2", 6);

	  var parentLinks = links.filter(function(l) { 
		return l.target.supertype == undefined; 
	  });

	  svg.selectAll("g.parent")
	    .data(parentLinks)
	    .enter()
		.append("polyline")
		.attr("class", "linkspec")
		.attr("transform", function(d) { 
			var t = "translate(" 
					+ (d.source.y + 0.9*(d.target.y - d.source.y)) + ","
					+ d.target.x + ")"; 
			return t; })
		.attr("points", "0,-6 -6,0 0,6");
	}
}

function generateSchemaDiagram(htmlNode, graph)
{
	var width = 960, height = 480;

	var svg = d3.select(htmlNode).append("svg")
		.attr("width", width)
		.attr("height", height);

	//TODO use cola instead
	// http://marvl.infotech.monash.edu/webcola/

	var force = d3.layout.force()
	    .nodes(graph.nodes)
    	.links(graph.links)
	    .size([width, height])
    	.linkDistance(180)
	    .charge(-120)
    	.linkStrength(0.1)
	    .friction(0.9)
    	.gravity(0.1)
	    .theta(0.8)
    	.alpha(0.1)
	    .start()
		;

	 var link = svg.selectAll(".link")
		  .data(graph.links)
		.enter().append("line")
		  .attr("class", "link");
		  //.style("stroke-width", function(d) { return Math.sqrt(d.value); });

	  var node = svg.selectAll(".node")
		  .data(graph.nodes)
		.enter().append("g")
		  .attr("transform", function(d) { 
			  return "translate(0,0)"; })
		  .call(force.drag)
		;

		node.append("circle")
		  .attr("class", "node")
		  .attr("r", 5)
		;

	  	node.append("text")
		  .attr("x", 0)
		  .attr("dy", "2em")
		  .attr("text-anchor", "middle")	
		  .text(function(d) { return d.value; })
		  .style("fill-opacity", 1);

	force.on("tick", function() {
	  link.attr("x1", function(d) { return d.source.x; })
    	  .attr("y1", function(d) { return d.source.y; })
	      .attr("x2", function(d) { return d.target.x; })
    	  .attr("y2", function(d) { return d.target.y; });

	  node.attr("transform", function(d) { 
					return "translate(" + d.x + "," + d.y + ")"; });
});

}





