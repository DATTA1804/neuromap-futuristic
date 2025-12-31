let root;
let i = 0;
const duration = 750;
let selectedNode = null;

const width = window.innerWidth - 320;
const height = window.innerHeight - 60;

const zoom = d3.zoom()
  .scaleExtent([0.1, 3])
  .on("zoom", (event) => {
    g.attr("transform", event.transform);
  });

const svg = d3.select("#mindmap")
  .attr("width", width)
  .attr("height", height)
  .call(zoom);

window.addEventListener('resize', () => {
  const newWidth = window.innerWidth - 320;
  const newHeight = window.innerHeight - 60;
  svg.attr("width", newWidth).attr("height", newHeight);
  fitView();
});


const g = svg.append("g")
  .attr("transform", "translate(100, " + height / 2 + ")");

const tree = d3.tree().nodeSize([40, 200]);

d3.json("./public/data.json").then(data => {
  root = d3.hierarchy(data, d => d.children);
  root.x0 = height / 2;
  root.y0 = 0;

  // Collapse by default
  if (root.children) {
    root.children.forEach(collapse);
  }

  update(root);
  fitView();
});

function collapse(d) {
  if (d.children) {
    d._children = d.children;
    d._children.forEach(collapse);
    d.children = null;
  }
}

function update(source) {
  const treeData = tree(root);
  const nodes = treeData.descendants();
  const links = treeData.links();

  nodes.forEach(d => { d.y = d.depth * 180 });

  // --- Nodes ---
  const node = g.selectAll('g.node')
    .data(nodes, d => d.id || (d.id = ++i));

  const nodeEnter = node.enter().append('g')
    .attr('class', 'node')
    .attr("transform", d => `translate(${source.y0},${source.x0})`)
    .on('click', (event, d) => {
      if (event.defaultPrevented) return;
      toggleNode(d);
    })
    .on('mouseover', (event, d) => {
      showTooltip(event, d);
    })
    .on('mouseout', hideTooltip);

  nodeEnter.append('circle')
    .attr('class', 'node-circle')
    .attr('r', 1e-6)
    .style("fill", d => d._children ? "#3b82f6" : "#1e293b");

  nodeEnter.append('text')
    .attr("dy", ".35em")
    .attr("x", d => d.children || d._children ? -20 : 20)
    .attr("text-anchor", d => d.children || d._children ? "end" : "start")
    .text(d => d.data.name)
    .style("fill-opacity", 1e-6);

  const nodeUpdate = nodeEnter.merge(node);

  nodeUpdate.transition()
    .duration(duration)
    .attr("transform", d => `translate(${d.y},${d.x})`);

  nodeUpdate.select('circle.node-circle')
    .attr('r', 12)
    .style("fill", d => d._children ? "#3b82f6" : "#1e293b")
    .style("stroke", d => selectedNode === d ? "#60a5fa" : "#334155")
    .style("stroke-width", d => selectedNode === d ? "4px" : "2px")
    .attr('cursor', 'pointer');

  nodeUpdate.select('text')
    .style("fill-opacity", 1);

  const nodeExit = node.exit().transition()
    .duration(duration)
    .attr("transform", d => `translate(${source.y},${source.x})`)
    .remove();

  nodeExit.select('circle')
    .attr('r', 1e-6);

  nodeExit.select('text')
    .style("fill-opacity", 1e-6);

  // --- Links ---
  const link = g.selectAll('path.link')
    .data(links, d => d.target.id);

  const linkEnter = link.enter().insert('path', "g")
    .attr("class", "link")
    .attr('d', d => {
      const o = { x: source.x0, y: source.y0 };
      return diagonal(o, o);
    });

  const linkUpdate = linkEnter.merge(link);

  linkUpdate.transition()
    .duration(duration)
    .attr('d', d => diagonal(d.source, d.target));

  const linkExit = link.exit().transition()
    .duration(duration)
    .attr('d', d => {
      const o = { x: source.x, y: source.y };
      return diagonal(o, o);
    })
    .remove();

  nodes.forEach(d => {
    d.x0 = d.x;
    d.y0 = d.y;
  });

  function diagonal(s, t) {
    return `M ${s.y} ${s.x}
            C ${(s.y + t.y) / 2} ${s.x},
              ${(s.y + t.y) / 2} ${t.x},
              ${t.y} ${t.x}`;
  }
}

function toggleNode(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  selectNode(d);
  update(d);
}

function selectNode(d) {
  selectedNode = d;
  document.getElementById("panel-title").innerText = d.data.name;
  document.getElementById("panel-desc").value = d.data.description || "";
  
  // Create a set of ancestor IDs for highlighting
  const ancestors = new Set();
  let curr = d;
  while (curr) {
    ancestors.add(curr.id);
    curr = curr.parent;
  }

  // Highlight the nodes
  g.selectAll('circle.node-circle')
    .style("stroke", node => node === d ? "#60a5fa" : (ancestors.has(node.id) ? "#3b82f6" : "#334155"))
    .style("stroke-width", node => node === d ? "4px" : (ancestors.has(node.id) ? "3px" : "2px"));

  // Highlight the links
  g.selectAll('path.link')
    .style("stroke", link => ancestors.has(link.target.id) ? "#3b82f6" : "#1e293b")
    .style("stroke-width", link => ancestors.has(link.target.id) ? "3px" : "2px");
}


function saveNode() {
  if (selectedNode) {
    selectedNode.data.description = document.getElementById("panel-desc").value;
    update(selectedNode);
  }
}

function expand(d) {
  if (d._children) {
    d.children = d._children;
    d._children = null;
  }
  if (d.children) {
    d.children.forEach(expand);
  }
}

function expandAll() {
  expand(root);
  update(root);
}

function collapseAll() {
  root.children.forEach(collapse);
  update(root);
}

function fitView() {
  const bounds = g.node().getBBox();
  const parent = svg.node();
  const fullWidth = parent.clientWidth,
    fullHeight = parent.clientHeight;
  const width = bounds.width,
    height = bounds.height;
  const midX = bounds.x + width / 2,
    midY = bounds.y + height / 2;
  if (width === 0 || height === 0) return;
  
  const scale = 0.8 / Math.max(width / fullWidth, height / fullHeight);
  const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

  svg.transition().duration(duration)
    .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
}

function showTooltip(event, d) {
  let tooltip = d3.select("#tooltip");
  if (tooltip.empty()) {
    tooltip = d3.select("body").append("div")
      .attr("id", "tooltip")
      .style("position", "absolute")
      .style("background", "rgba(15, 23, 42, 0.9)")
      .style("border", "1px solid #3b82f6")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("color", "white")
      .style("pointer-events", "none")
      .style("font-size", "12px")
      .style("z-index", "1000");
  }

  tooltip.transition().duration(200).style("opacity", 1);
  tooltip.html(`<strong>${d.data.name}</strong><br/>${d.data.description || "No description"}`)
    .style("left", (event.pageX + 10) + "px")
    .style("top", (event.pageY - 10) + "px");
}

function hideTooltip() {
  d3.select("#tooltip").transition().duration(500).style("opacity", 0);
}

