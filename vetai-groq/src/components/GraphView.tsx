import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { generateKnowledgeGraph } from '../services/groqService';
import { Consultation, KnowledgeGraphData, Language } from '../types';

export default function GraphView({ consultations, language }: { consultations: Consultation[], language: Language }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<KnowledgeGraphData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if(consultations.length > 0 && !data && !loading) {
       setLoading(true);
       generateKnowledgeGraph(consultations, undefined, language)
         .then(setData)
         .finally(()=>setLoading(false));
    }
  }, [consultations]);

  useEffect(() => {
    if (!data || !svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const width = 800, height = 600;
    
    const nodes = data.nodes.map(d => ({ ...d }));
    const links = data.links.map(d => ({ ...d }));

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g").selectAll("line").data(links).join("line").attr("stroke", "#999");
    const node = svg.append("g").selectAll("circle").data(nodes).join("circle").attr("r", 10).attr("fill", "#ff6b6b");
    const label = svg.append("g").selectAll("text").data(nodes).join("text").text((d: any) => d.label).attr("font-size", 10);

    simulation.on("tick", () => {
      link.attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);
      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
      label.attr("x", (d: any) => d.x + 12).attr("y", (d: any) => d.y + 4);
    });
  }, [data]);

  return (
    <div className="h-full bg-white dark:bg-slate-800 rounded shadow p-4">
      <h2 className="text-xl font-bold mb-4">Knowledge Graph (Llama 3)</h2>
      {loading && <p>Generating graph with Llama 3...</p>}
      <svg ref={svgRef} className="w-full h-[500px] border" />
    </div>
  );
}