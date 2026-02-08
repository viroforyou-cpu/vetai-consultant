
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { generateKnowledgeGraph, askGraphQuestion } from '../services/geminiService';
import { Consultation, KnowledgeGraphData, GraphNode, GraphLink, Language } from '../types';

interface GraphViewProps {
  consultations: Consultation[];
  language: Language;
}

const GraphView: React.FC<GraphViewProps> = ({ consultations, language }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Selection State
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedPatientKey, setSelectedPatientKey] = useState('');
  
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter State (Graph Visualization)
  const [searchTerm, setSearchTerm] = useState('');
  const [showNeighbors, setShowNeighbors] = useState(true);
  
  // Graph Query State
  const [graphQuery, setGraphQuery] = useState('');
  const [graphAnswer, setGraphAnswer] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);

  // D3 Refs
  const nodeRef = useRef<any>(null);
  const linkRef = useRef<any>(null);
  const labelRef = useRef<any>(null);
  const linkLabelRef = useRef<any>(null);
  const linksDataRef = useRef<any[]>([]);
  const nodesDataRef = useRef<any[]>([]);

  // 1. Generate Unique Patient List (Raw)
  const allUniquePatients = useMemo(() => {
    const uniqueMap = new Map<string, { key: string, label: string, pName: string, oName: string }>();

    consultations.forEach(c => {
        if (!c.patientName) return;
        const key = `${c.patientName.trim()}__${c.ownerName.trim()}`;
        const label = `${c.patientName} (Owner: ${c.ownerName}, ${c.extractedData?.administrative.species || 'Unknown'})`;
        
        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, { key, label, pName: c.patientName.toLowerCase(), oName: c.ownerName.toLowerCase() });
        }
    });

    return Array.from(uniqueMap.values());
  }, [consultations]);

  // 2. Filter Patients based on Search Query
  const filteredPatientOptions = useMemo(() => {
      if (!patientSearchQuery.trim()) return [];
      const q = patientSearchQuery.toLowerCase();
      return allUniquePatients.filter(p => p.pName.includes(q) || p.oName.includes(q));
  }, [patientSearchQuery, allUniquePatients]);

  const labels = {
    searchLabel: language === 'en' ? '1. Search Patient/Owner' : '1. Buscar Paciente/Propietario',
    searchPlaceholder: language === 'en' ? 'Enter name...' : 'Ingrese nombre...',
    selectLabel: language === 'en' ? '2. Select Patient' : '2. Seleccionar Paciente',
    selectPlaceholder: language === 'en' ? '-- Select found patient --' : '-- Seleccione paciente encontrado --',
    noMatches: language === 'en' ? 'No matches found' : 'Sin coincidencias',
    buildGraph: language === 'en' ? '3. Build Graph' : '3. Generar Grafo',
    building: language === 'en' ? 'Building...' : 'Generando...',
    searchGraph: language === 'en' ? 'Filter Nodes' : 'Filtrar Nodos',
    filterPlaceholder: language === 'en' ? 'e.g. Diagnosis, 2023-10-15, -Symptom' : 'ej. Diagnóstico, 2023-10-15, -Síntoma',
    includeNeighbors: language === 'en' ? 'Include Neighbors' : 'Incluir Vecinos',
    askGraph: language === 'en' ? 'Ask the Graph' : 'Preguntar al Grafo',
    askPlaceholder: language === 'en' ? 'e.g., What treatments is Max receiving?' : 'ej., ¿Qué tratamientos recibe Max?',
    askButton: language === 'en' ? 'Ask' : 'Preguntar',
    legend: {
      patient: language === 'en' ? 'Patient' : 'Paciente',
      consult: language === 'en' ? 'Consultation' : 'Consulta',
      symptom: language === 'en' ? 'Symptom' : 'Síntoma',
      diagnosis: language === 'en' ? 'Diagnosis' : 'Diagnóstico',
      treatment: language === 'en' ? 'Treatment' : 'Tratamiento'
    }
  };

  const handleGenerate = async () => {
    if (!selectedPatientKey) return;
    setIsLoading(true);
    setGraphAnswer('');
    
    try {
      const [pName, oName] = selectedPatientKey.split('__');
      
      const relevantConsults = consultations
        .filter(c => c.patientName.trim() === pName && c.ownerName.trim() === oName)
        .sort((a, b) => a.timestamp - b.timestamp);

      const data = await generateKnowledgeGraph(relevantConsults, { patientName: pName, ownerName: oName }, language);
      setGraphData(data);
    } catch (e) {
      console.error(e);
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

  // --- D3 IMPLEMENTATION ---
  useEffect(() => {
    if (!graphData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = 600;

    const color = d3.scaleOrdinal<string>()
      .domain(["1", "2", "3", "4", "5"])
      .range(["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"]);

    const nodes = graphData.nodes.map(d => ({ ...d })) as any[];
    const nodeIds = new Set(nodes.map(n => n.id));
    const links = graphData.links
      .filter(l => nodeIds.has(l.source) && nodeIds.has(l.target))
      .map(d => ({ ...d })) as any[];

    nodesDataRef.current = nodes;
    linksDataRef.current = links;

    const patientNode = nodes.find(n => n.group === 1);
    if (patientNode) {
      patientNode.fx = width / 2;
      patientNode.fy = height / 2;
    }

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(d => (d.target.group === 5 ? 120 : 60)))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(30));

    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 18).attr("refY", 0)
      .attr("markerWidth", 6).attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", "#999");

    const link = svg.append("g").selectAll("line").data(links).join("line")
      .attr("stroke", "#999").attr("stroke-opacity", 0.6).attr("stroke-width", 1.5).attr("marker-end", "url(#arrowhead)");
    linkRef.current = link;

    const linkLabel = svg.append("g").selectAll("text").data(links).join("text")
      .attr("class", "text-[9px] fill-slate-500 dark:fill-slate-400 font-sans bg-white")
      .attr("text-anchor", "middle").attr("dy", -3).text((d: any) => d.relation);
    linkLabelRef.current = linkLabel;

    const node = svg.append("g").attr("stroke", "#fff").attr("stroke-width", 1.5).selectAll("circle").data(nodes).join("circle")
      .attr("r", (d: any) => d.group === 1 ? 16 : d.group === 5 ? 12 : 8)
      .attr("fill", (d: any) => color(String(d.group)))
      .call(d3.drag<any, any>().on("start", dragstarted).on("drag", dragged).on("end", dragended));

    node.append("title").text((d: any) => d.label + (d.details ? `\n${d.details}` : ""));
    nodeRef.current = node;

    const label = svg.append("g").selectAll("text").data(nodes).join("text")
      .attr("class", "text-[10px] font-sans pointer-events-none fill-slate-700 dark:fill-slate-200 font-medium")
      .attr("dx", 14).attr("dy", 4).text((d: any) => d.label);
    labelRef.current = label;

    const legendData = [
        { color: "#ef4444", label: labels.legend.patient },
        { color: "#8b5cf6", label: labels.legend.consult },
        { color: "#f59e0b", label: labels.legend.symptom },
        { color: "#10b981", label: labels.legend.diagnosis },
        { color: "#3b82f6", label: labels.legend.treatment }
    ];
    
    const legend = svg.append("g").attr("transform", `translate(20, 20)`);
    legendData.forEach((item, i) => {
        const row = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
        row.append("circle").attr("r", 5).attr("fill", item.color);
        row.append("text").attr("x", 15).attr("y", 4).text(item.label).attr("class", "text-xs font-sans fill-slate-600 dark:fill-slate-400");
    });

    simulation.on("tick", () => {
      link.attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);
      linkLabel.attr("x", (d: any) => (d.source.x + d.target.x) / 2).attr("y", (d: any) => (d.source.y + d.target.y) / 2);
      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
      label.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
    });

    function dragstarted(event: any) { if (!event.active) simulation.alphaTarget(0.3).restart(); event.subject.fx = event.subject.x; event.subject.fy = event.subject.y; }
    function dragged(event: any) { event.subject.fx = event.x; event.subject.fy = event.y; }
    function dragended(event: any) { if (!event.active) simulation.alphaTarget(0); if (event.subject.group !== 1) { event.subject.fx = null; event.subject.fy = null; } }

  }, [graphData, language]);

  // --- FILTERING LOGIC ---
  useEffect(() => {
    if (!nodeRef.current || !linkRef.current) return;
    if (!searchTerm.trim()) {
        nodeRef.current.transition().duration(300).attr("opacity", 1).attr("stroke", "#fff").attr("stroke-width", 1.5);
        linkRef.current.transition().duration(300).attr("opacity", 1);
        labelRef.current.transition().duration(300).attr("opacity", 1);
        linkLabelRef.current.transition().duration(300).attr("opacity", 1);
        return;
    }

    const rawTerms = searchTerm.trim().split(/\s+/);
    const includeTerms = rawTerms.filter(t => !t.startsWith('-')).map(t => t.toLowerCase());
    const excludeTerms = rawTerms.filter(t => t.startsWith('-')).map(t => t.substring(1).toLowerCase());

    const getNodeKeywords = (n: any) => {
        const keywords = [n.label.toLowerCase(), (n.details || '').toLowerCase()];
        if (n.group === 1) keywords.push('patient');
        if (n.group === 2) keywords.push('symptom', 'sign');
        if (n.group === 3) keywords.push('diagnosis', 'pathology');
        if (n.group === 4) keywords.push('treatment', 'medication', 'drug', 'rx');
        if (n.group === 5) keywords.push('consultation', 'visit', 'date', 'history');
        return keywords;
    };

    const matchedNodeIds = new Set<string>();
    
    nodesDataRef.current.forEach(n => {
        const keywords = getNodeKeywords(n);
        if (excludeTerms.length > 0 && excludeTerms.some(exc => keywords.some(k => k.includes(exc)))) return;
        
        let match = false;
        if (includeTerms.length === 0) match = true;
        else if (includeTerms.some(inc => keywords.some(k => k.includes(inc)))) match = true;

        if (match) matchedNodeIds.add(n.id);
    });

    const highlightNodeIds = new Set<string>(matchedNodeIds);
    if (showNeighbors) {
        nodesDataRef.current.forEach(n => {
            if (!matchedNodeIds.has(n.id)) {
                 const isNeighbor = linksDataRef.current.some(l => {
                    const sId = (l.source as any).id || l.source;
                    const tId = (l.target as any).id || l.target;
                    return (matchedNodeIds.has(sId) && tId === n.id) || (matchedNodeIds.has(tId) && sId === n.id);
                 });
                 if (isNeighbor) highlightNodeIds.add(n.id);
            }
        });
    }

    nodeRef.current.transition().duration(300)
        .attr("opacity", (d: any) => highlightNodeIds.has(d.id) ? 1 : 0.1)
        .attr("stroke", (d: any) => highlightNodeIds.has(d.id) ? "#333" : "#fff")
        .attr("stroke-width", (d: any) => highlightNodeIds.has(d.id) ? 2.5 : 1.5);
        
    labelRef.current.transition().duration(300).attr("opacity", (d: any) => highlightNodeIds.has(d.id) ? 1 : 0.1);
    
    const linkOpacity = (l: any) => {
        const sId = (l.source as any).id || l.source;
        const tId = (l.target as any).id || l.target;
        return (highlightNodeIds.has(sId) && highlightNodeIds.has(tId)) ? 1 : 0.05;
    };
    linkRef.current.transition().duration(300).attr("opacity", linkOpacity);
    linkLabelRef.current.transition().duration(300).attr("opacity", linkOpacity);

  }, [searchTerm, showNeighbors]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* 3-STEP SELECTION & CONTROLS */}
      <div className="p-4 bg-white dark:bg-slate-800 shadow rounded-lg transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            
            {/* Step 1: Search */}
            <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{labels.searchLabel}</label>
                <input 
                    type="text"
                    value={patientSearchQuery}
                    onChange={(e) => {
                        setPatientSearchQuery(e.target.value);
                        setSelectedPatientKey(''); // Reset selection when searching
                    }}
                    placeholder={labels.searchPlaceholder}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 focus:ring-2 focus:ring-teal-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                />
            </div>

            {/* Step 2: Select */}
            <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{labels.selectLabel}</label>
                <select
                    value={selectedPatientKey}
                    onChange={(e) => setSelectedPatientKey(e.target.value)}
                    disabled={filteredPatientOptions.length === 0}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 focus:ring-2 focus:ring-teal-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm disabled:opacity-50"
                >
                    <option value="">
                        {patientSearchQuery 
                            ? (filteredPatientOptions.length > 0 ? labels.selectPlaceholder : labels.noMatches)
                            : labels.selectPlaceholder}
                    </option>
                    {filteredPatientOptions.map((opt, idx) => (
                        <option key={idx} value={opt.key}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {/* Step 3: Build */}
            <div className="md:col-span-1">
                 <button 
                    onClick={handleGenerate}
                    disabled={isLoading || !selectedPatientKey}
                    className="w-full bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 disabled:opacity-50 shadow-sm font-bold text-sm"
                >
                    {isLoading ? labels.building : labels.buildGraph}
                </button>
            </div>
            
            {/* Filter Graph */}
            <div className="md:col-span-1">
                {graphData && (
                    <>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{labels.searchGraph}</label>
                        <div className="flex gap-2 mb-1">
                            <input 
                                type="text" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded p-2 outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                                placeholder={labels.filterPlaceholder}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                id="showNeighbors" 
                                checked={showNeighbors} 
                                onChange={(e) => setShowNeighbors(e.target.checked)}
                                className="rounded text-teal-600 focus:ring-teal-500"
                            />
                            <label htmlFor="showNeighbors" className="text-xs text-slate-600 dark:text-slate-400 select-none cursor-pointer">
                                {labels.includeNeighbors}
                            </label>
                        </div>
                    </>
                )}
            </div>
        </div>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
         {/* Canvas */}
         <div className="flex-1 bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 relative transition-colors">
            {!graphData && !isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                    <p className="text-lg font-medium">{labels.searchLabel}</p>
                    <p className="text-sm">Search and Select a patient to visualize history.</p>
                </div>
            )}
            <svg ref={svgRef} className="w-full h-full bg-slate-50 dark:bg-slate-900 transition-colors" />
        </div>

        {/* Chat Panel */}
        {graphData && (
             <div className="w-80 bg-white dark:bg-slate-800 shadow rounded-lg flex flex-col border border-slate-200 dark:border-slate-700 transition-colors">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900 border-b border-indigo-100 dark:border-indigo-800">
                    <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-100">{labels.askGraph}</h3>
                </div>
                <div className="flex-1 p-4 overflow-y-auto text-sm">
                    {graphAnswer ? (
                         <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200">
                            {graphAnswer}
                        </div>
                    ) : (
                        <div className="text-slate-400 text-xs italic text-center mt-10">
                            Ask a question about relationships, treatments, or symptoms visible in the graph.
                        </div>
                    )}
                </div>
                <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                    <textarea 
                        value={graphQuery}
                        onChange={(e) => setGraphQuery(e.target.value)}
                        placeholder={labels.askPlaceholder}
                        className="w-full text-xs p-2 border rounded mb-2 dark:bg-slate-900 dark:border-slate-600 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                        rows={2}
                    />
                    <button 
                        onClick={handleAskGraph}
                        disabled={isAnswering || !graphQuery}
                        className="w-full bg-indigo-600 text-white py-1 rounded text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {isAnswering ? '...' : labels.askButton}
                    </button>
                </div>
             </div>
        )}
      </div>
    </div>
  );
};

export default GraphView;
