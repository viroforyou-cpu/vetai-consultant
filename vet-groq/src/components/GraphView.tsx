import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { getPatientGraph } from '../services/backendService';
import { askGraphQuestion } from '../services/groqService';
import { Consultation, KnowledgeGraphData, Language } from '../types';

interface GraphViewProps {
  consultations: Consultation[];
  language: Language;
}

const GraphView: React.FC<GraphViewProps> = ({ consultations, language }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedPatientKey, setSelectedPatientKey] = useState('');
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [graphQuery, setGraphQuery] = useState('');
  const [graphAnswer, setGraphAnswer] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const allUniquePatients = useMemo(() => {
    const uniqueMap = new Map<string, { key: string, label: string, pName: string, oName: string }>();
    consultations.forEach(c => {
        if (!c.patientName) return;
        const key = `${c.patientName.trim()}`;
        const label = `${c.patientName} (Owner: ${c.ownerName})`;
        if (!uniqueMap.has(key)) uniqueMap.set(key, { key, label, pName: c.patientName.toLowerCase(), oName: c.ownerName.toLowerCase() });
    });
    return Array.from(uniqueMap.values());
  }, [consultations]);

  const filteredPatientOptions = useMemo(() => {
      if (!patientSearchQuery.trim()) return [];
      const q = patientSearchQuery.toLowerCase();
      return allUniquePatients.filter(p => p.pName.includes(q));
  }, [patientSearchQuery, allUniquePatients]);

  const handleGenerate = async () => {
    if (!selectedPatientKey) return;
    setIsLoading(true);
    setGraphAnswer('');
    
    try {
      const data = await getPatientGraph(selectedPatientKey);
      if (data.nodes.length === 0) alert("No graph data found in FalkorDB.");
      setGraphData(data);
    } catch (e) {
      console.error(e);
      alert("Failed to fetch from Database");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskGraph = async () => {
    if (!graphData || !graphQuery) return;
    setIsAnswering(true);
    try {
      const answer = await askGraphQuestion(graphData, graphQuery, language);
      setGraphAnswer(answer);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnswering(false);
    }
  };

  useEffect(() => {
    if (!graphData || !svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    const width = svgRef.current.clientWidth || 800;
    const height = 600;

    const color = d3.scaleOrdinal<string>()
      .domain(["1", "2", "3", "4", "5"])
      .range(["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"]);

    const nodes = graphData.nodes.map(d => ({ ...d })) as any[];
    const links = graphData.links.map(d => ({ ...d })) as any[];

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(25));

    const link = svg.append("g").selectAll("line").data(links).join("line")
      .attr("stroke", "#999").attr("stroke-opacity", 0.6).attr("stroke-width", 1.5);

    const linkLabel = svg.append("g").selectAll("text").data(links).join("text")
      .text((d:any) => d.relation).attr("font-size", 8).attr("fill", "#666").attr("text-anchor", "middle");

    const node = svg.append("g").selectAll("circle").data(nodes).join("circle")
      .attr("r", (d:any) => d.group === 1 ? 18 : 10)
      .attr("fill", (d:any) => color(String(d.group)))
      .attr("stroke", "#fff").attr("stroke-width", 1.5)
      .call(d3.drag<any, any>()
        .on("start", (e) => { if(!e.active) simulation.alphaTarget(0.3).restart(); e.subject.fx = e.subject.x; e.subject.fy = e.subject.y; })
        .on("drag", (e) => { e.subject.fx = e.x; e.subject.fy = e.y; })
        .on("end", (e) => { if(!e.active) simulation.alphaTarget(0); e.subject.fx = null; e.subject.fy = null; })
      );

    const label = svg.append("g").selectAll("text").data(nodes).join("text")
      .text((d:any) => d.label).attr("dx", 14).attr("dy", 4)
      .attr("font-size", 10).attr("class", "font-sans font-medium pointer-events-none fill-slate-700 dark:fill-slate-200");

    simulation.on("tick", () => {
      link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      linkLabel.attr("x", d => (d.source.x + d.target.x)/2).attr("y", d => (d.source.y + d.target.y)/2);
      node.attr("cx", d => d.x).attr("cy", d => d.y);
      label.attr("x", d => d.x).attr("y", d => d.y);
    });
  }, [graphData]);

  useEffect(() => {
     if (!svgRef.current) return;
     const svg = d3.select(svgRef.current);
     const term = searchTerm.toLowerCase();
     
     svg.selectAll("circle").style("opacity", (d:any) => {
         if (!term) return 1;
         return d.label.toLowerCase().includes(term) ? 1 : 0.1;
     });
     svg.selectAll("text").style("opacity", (d:any) => {
        if (!term) return 1;
        if (!d || !d.label) return 0.1; 
        return d.label.toLowerCase().includes(term) ? 1 : 0.1;
     });
  }, [searchTerm]);

  return (
    <div className="flex h-full gap-4">
      <div className="flex-1 bg-white dark:bg-slate-800 shadow rounded p-4 flex flex-col">
         <div className="grid grid-cols-3 gap-4 mb-4">
             <input value={patientSearchQuery} onChange={e=>setPatientSearchQuery(e.target.value)} placeholder="Search Patient Name..." className="border p-2 rounded dark:bg-slate-900" />
             <select value={selectedPatientKey} onChange={e=>setSelectedPatientKey(e.target.value)} className="border p-2 rounded dark:bg-slate-900">
                <option value="">Select Patient...</option>
                {filteredPatientOptions.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
             </select>
             <button onClick={handleGenerate} disabled={isLoading || !selectedPatientKey} className="bg-teal-600 text-white rounded font-bold hover:bg-teal-700 disabled:opacity-50">
                {isLoading ? "Fetching from DB..." : "Load Graph (FalkorDB)"}
             </button>
         </div>
         <div className="flex-1 border rounded relative bg-slate-50 dark:bg-slate-900">
             <svg ref={svgRef} className="w-full h-full" />
             <div className="absolute top-2 right-2">
                 <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Filter nodes..." className="p-1 text-xs border rounded shadow" />
             </div>
         </div>
      </div>
      {graphData && (
          <div className="w-80 bg-white dark:bg-slate-800 shadow rounded p-4 flex flex-col">
              <h3 className="font-bold mb-2 text-indigo-600">Ask the Graph</h3>
              <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded p-2 text-sm overflow-y-auto mb-2 border">
                  {graphAnswer || <span className="text-slate-400 italic">Ask about the patient's history...</span>}
              </div>
              <input value={graphQuery} onChange={e=>setGraphQuery(e.target.value)} placeholder="e.g. What treatments?" className="border p-2 rounded mb-2 text-sm" />
              <button onClick={handleAskGraph} disabled={isAnswering} className="bg-indigo-600 text-white py-1 rounded font-bold">{isAnswering ? 'Thinking...' : 'Ask'}</button>
          </div>
      )}
    </div>
  );
};

export default GraphView;