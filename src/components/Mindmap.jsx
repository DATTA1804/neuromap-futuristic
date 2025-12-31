import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const Mindmap = ({ data, onNodeSelect, setFunctions }) => {
  const svgRef = useRef();
  const gRef = useRef();
  const zoomRef = useRef();

  useEffect(() => {
    if (!data) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const zoom = d3.zoom()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    const g = svg.append("g");
    gRef.current = g;

    const root = d3.hierarchy(data);
    let currentRoot = root;
    let selectedNodeRef = null;
    
    // Initial collapse
    if (root.children) {
      root.children.forEach(collapse);
    }

    const tree = d3.tree().nodeSize([120, 300]);

    function collapse(d) {
      if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
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

    function update(source) {
      const nodes = tree(currentRoot).descendants();
      const links = tree(currentRoot).links();

      nodes.forEach(d => {
        d.y = (d.depth - currentRoot.depth) * 280;
      });

      // --- Links ---
      const link = g.selectAll(".link")
        .data(links, d => d.target.id || (d.target.id = Math.random()));

      link.enter().append("path")
        .attr("class", "link")
        .merge(link)
        .transition().duration(750)
        .attr("d", d3.linkHorizontal()
          .x(d => d.y)
          .y(d => d.x)
        )
        .style("stroke", d => {
          if (d.source.depth === 0) return "#fb923c";
          if (d.source.depth === 1) return "#facc15";
          return "#4ade80";
        });

      link.exit().remove();

      // --- Nodes ---
      const node = g.selectAll(".node")
        .data(nodes, d => d.id || (d.id = Math.random()));

      const nodeEnter = node.enter().append("g")
        .attr("class", d => `node level-${d.depth}`)
        .attr("transform", d => `translate(${source.y},${source.x})`)
        .on("click", (event, d) => {
          selectedNodeRef = d;
          if (d.children) {
            d._children = d.children;
            d.children = null;
          } else {
            d.children = d._children;
            d._children = null;
          }
          onNodeSelect(d);
          update(d);
        });

      nodeEnter.append("circle")
        .attr("r", 15)
        .attr("class", "node-circle")
        .style("fill", d => {
          if (d.depth === 0) return "#fb923c"; // Orange
          if (d.depth === 1) return "#facc15"; // Yellow
          return "#4ade80"; // Light Green
        })
        .style("stroke", "#fff")
        .style("stroke-width", "2px");

      nodeEnter.append("text")
        .attr("dy", ".35em")
        .attr("x", d => d.children || d._children ? -20 : 20)
        .attr("text-anchor", d => d.children || d._children ? "end" : "start")
        .text(d => d.data.name)
        .style("fill", "#fff")
        .style("font-size", "14px")
        .style("font-weight", "500");

      const nodeUpdate = nodeEnter.merge(node);

      nodeUpdate.transition().duration(750)
        .attr("transform", d => `translate(${d.y},${d.x})`);
      
      nodeUpdate.select("circle")
        .style("fill", d => {
          if (d.depth === 0) return "#fb923c";
          if (d.depth === 1) return "#facc15";
          return "#4ade80";
        });

      node.exit().remove();

      nodes.forEach(d => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    function wrap(text, width) {
      text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
          }
        }
      });
    }

    // Set functions for Topbar
    const fitView = () => {
      const bounds = g.node().getBBox();
      const fullWidth = svgRef.current.clientWidth;
      const fullHeight = svgRef.current.clientHeight;
      const scale = 0.8 / Math.max(bounds.width / fullWidth, bounds.height / fullHeight);
      const transform = d3.zoomIdentity
        .translate(fullWidth / 2 - scale * (bounds.x + bounds.width / 2), 
                   fullHeight / 2 - scale * (bounds.y + bounds.height / 2))
        .scale(scale);
      svg.transition().duration(750).call(zoom.transform, transform);
    };

    setFunctions({
      expandAll: () => { expand(root); update(root); },
      collapseAll: () => { root.children?.forEach(collapse); update(root); },
      fitView: fitView,
      drillDown: () => {
        if (selectedNodeRef) {
          currentRoot = selectedNodeRef;
          update(currentRoot);
          fitView();
        }
      },
      drillUp: () => {
        if (currentRoot.parent) {
          currentRoot = currentRoot.parent;
          update(currentRoot);
          fitView();
        } else if (currentRoot !== root) {
          currentRoot = root;
          update(currentRoot);
          fitView();
        }
      },
      addNode: () => {
        if (selectedNodeRef) {
          const newNodeData = { name: "New Node", description: "" };
          if (!selectedNodeRef.data.children) {
            selectedNodeRef.data.children = [];
          }
          selectedNodeRef.data.children.push(newNodeData);
          
          // Create new node in hierarchy
          const newNode = d3.hierarchy(newNodeData);
          newNode.depth = selectedNodeRef.depth + 1;
          newNode.parent = selectedNodeRef;
          
          if (!selectedNodeRef.children && !selectedNodeRef._children) {
            selectedNodeRef.children = [newNode];
          } else if (selectedNodeRef.children) {
            selectedNodeRef.children.push(newNode);
          } else {
            selectedNodeRef._children.push(newNode);
          }
          update(selectedNodeRef);
        }
      }
    });

    update(root);
    // Initial center
    svg.call(zoom.transform, d3.zoomIdentity.translate(100, height/2).scale(0.8));

  }, [data]);

  return <svg ref={svgRef} id="mindmap" style={{ width: '100%', height: '100%' }}></svg>;
};

export default Mindmap;
