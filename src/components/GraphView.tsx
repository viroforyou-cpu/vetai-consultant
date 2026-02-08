import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { getPatientKnowledgeGraph } from '../services/graphService';
import { Consultation, KnowledgeGraphData, Language } from '../types';
import { useTranslations, t } from '../translations';

interface GraphViewProps {
  consultations: Consultation[];
  language: Language;
}

const GraphView: React.FC<GraphViewProps> = ({ consultations, language }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const t_translations = useTranslations(language);

  // Selection State
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedPatientKey, setSelectedPatientKey] = useState('');

  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Graph Query State
  const [graphQuery, setGraphQuery] = useState('');
  const [graphAnswer, setGraphAnswer] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);

  // Node Type Filter State
  const [visibleNodeTypes, setVisibleNodeTypes] = useState<Set<number>>(new Set([1, 2, 3, 4, 5])); // All visible by default

  const nodeTypeLabels: Record<number, string> = {
    1: t_translations.graph.nodeTypePatient,
    2: t_translations.graph.nodeTypeVisits,
    3: t_translations.graph.nodeTypeDiagnoses,
    4: t_translations.graph.nodeTypeTreatments,
    5: t_translations.graph.nodeTypePeople,
  };

  const toggleNodeType = (type: number) => {
    const newVisible = new Set(visibleNodeTypes);
    if (newVisible.has(type)) {
      // Don't allow hiding the patient node (type 1)
      if (type !== 1) {
        newVisible.delete(type);
      }
    } else {
      newVisible.add(type);
    }
    setVisibleNodeTypes(newVisible);
  };

  // 1. Generate Unique Patient List
  const allUniquePatients = useMemo(() => {
    const uniqueMap = new Map<string, { key: string, label: string, pName: string, oName: string }>();

    consultations.forEach(c => {
        if (!c.patientName) return;
        const key = `${c.patientName.trim()}`;
        // Simple label
        const label = `${c.patientName} (${c.ownerName})`;
        
        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, { key, label, pName: c.patientName.toLowerCase(), oName: c.ownerName.toLowerCase() });
        }
    });

    return Array.from(uniqueMap.values());
  }, [consultations]);

  // 2. Filter Patients
  const filteredPatientOptions = useMemo(() => {
      if (!patientSearchQuery.trim()) {
        // Show all patients when no search query (max 50 for performance)
        return allUniquePatients.slice(0, 50);
      }
      const q = patientSearchQuery.toLowerCase();
      return allUniquePatients.filter(p => p.pName.includes(q) || p.oName.includes(q));
  }, [patientSearchQuery, allUniquePatients]);

  const handleGenerate = async () => {
    if (!selectedPatientKey) return;
    setIsLoading(true);
    setGraphAnswer('');
    setGraphData(null);

    try {
      // Try to fetch from Graphiti knowledge graph first
      const data = await getPatientKnowledgeGraph(selectedPatientKey);

      if (!data || data.nodes.length === 0) {
        // Generate mock graph data for testing
        const patientConsultations = consultations.filter(c => c.patientName.trim().toLowerCase() === selectedPatientKey.toLowerCase());

        if (patientConsultations.length === 0) {
          setGraphData({ nodes: [], links: [] });
        } else {
          // Generate mock knowledge graph from consultations
          const mockGraph = generateMockGraph(selectedPatientKey, patientConsultations);
          setGraphData(mockGraph);
        }
      } else {
        setGraphData(data);
      }
    } catch (e) {
      console.error(e);
      // Fallback to mock data
      const patientConsultations = consultations.filter(c => c.patientName.trim().toLowerCase() === selectedPatientKey.toLowerCase());
      if (patientConsultations.length > 0) {
        const mockGraph = generateMockGraph(selectedPatientKey, patientConsultations);
        setGraphData(mockGraph);
      } else {
        setGraphData({ nodes: [], links: [] });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to generate mock graph data
  const generateMockGraph = (patientName: string, patientConsultations: any[]): KnowledgeGraphData => {
    const nodes: any[] = [];
    const links: any[] = [];
    let nodeIdCounter = 1;

    // Add patient node (center)
    const patientNode = {
      id: patientName,
      group: 1,
      label: patientName,
      details: 'Patient'
    };
    nodes.push(patientNode);

    // Track unique entities to avoid duplicates
    const entities = new Map<string, { id: string, group: number, label: string, details: string }>();

    patientConsultations.forEach((c, idx) => {
      const consultId = `visit_${idx + 1}`;
      const date = c.extractedData?.administrative?.date || new Date(c.timestamp).toLocaleDateString();

      // Add visit node
      nodes.push({
        id: consultId,
        group: 2,
        label: `Visit: ${date}`,
        details: `Dr: ${c.vetName}`
      });
      links.push({
        source: patientName,
        target: consultId,
        value: 1,
        relation: 'visited'
      });

      // Add diagnosis node
      const diagnosis = c.extractedData?.clinical?.diagnosis;
      if (diagnosis) {
        const diagKey = `diag_${diagnosis.substring(0, 20).replace(/\s+/g, '_')}`;
        if (!entities.has(diagKey)) {
          entities.set(diagKey, {
            id: diagKey,
            group: 3,
            label: diagnosis.length > 25 ? diagnosis.substring(0, 22) + '...' : diagnosis,
            details: 'Diagnosis'
          });
        }
        links.push({
          source: consultId,
          target: diagKey,
          value: 1,
          relation: 'diagnosed_with'
        });
      }

      // Add treatment node
      const treatment = c.extractedData?.clinical?.treatment;
      if (treatment) {
        const treatKey = `treat_${treatment.substring(0, 20).replace(/\s+/g, '_')}`;
        if (!entities.has(treatKey)) {
          entities.set(treatKey, {
            id: treatKey,
            group: 4,
            label: treatment.length > 25 ? treatment.substring(0, 22) + '...' : treatment,
            details: 'Treatment'
          });
        }
        links.push({
          source: consultId,
          target: treatKey,
          value: 1,
          relation: 'treated_with'
        });
      }

      // Add owner node
      const owner = c.ownerName;
      if (owner && !entities.has(`owner_${owner}`)) {
        entities.set(`owner_${owner}`, {
          id: `owner_${owner}`,
          group: 5,
          label: owner,
          details: 'Owner'
        });
        links.push({
          source: patientName,
          target: `owner_${owner}`,
          value: 1,
          relation: 'owned_by'
        });
      }

      // Add vet node
      const vet = c.vetName;
      if (vet && !entities.has(`vet_${vet}`)) {
        entities.set(`vet_${vet}`, {
          id: `vet_${vet}`,
          group: 5,
          label: vet,
          details: 'Veterinarian'
        });
        links.push({
          source: consultId,
          target: `vet_${vet}`,
          value: 1,
          relation: 'treated_by'
        });
      }
    });

    // Add all unique entities to nodes
    entities.forEach(entity => {
      nodes.push(entity);
    });

    return { nodes, links };
  };

  const handleAskGraph = async () => {
    if (!graphData || !graphQuery) return;
    setIsAnswering(true);
    setGraphAnswer('');
    try {
      console.log('[GraphView] Asking question:', graphQuery);
      console.log('[GraphView] Using GLM-4.7 with local graph data');
      console.log('[GraphView] Graph data:', graphData);

      // Use GLM directly with graph data instead of backend API
      const { askGraphQuestion } = await import('../services/aiService');
      const answer = await askGraphQuestion(graphData, graphQuery, language);
      console.log('[GraphView] Answer received:', answer);
      setGraphAnswer(answer);
    } catch (e: any) {
      console.error('[GraphView] Error asking question:', e);
      setGraphAnswer(`Error: ${e.message || t_translations.search.answerError}`);
    } finally {
      setIsAnswering(false);
    }
  };

  // --- D3 IMPLEMENTATION ---
  useEffect(() => {
    if (!graphData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth || 800;
    const height = 600;

    const color = d3.scaleOrdinal<string>()
      .domain(["1", "2", "3", "4", "5"])
      .range(["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"]);

    // Filter nodes based on visible types
    const filteredNodes = graphData.nodes.filter(n => visibleNodeTypes.has(n.group));
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));

    // Filter links - only show if both endpoints are visible
    const filteredLinks = graphData.links.filter(l =>
      filteredNodeIds.has(l.source as any) && filteredNodeIds.has(l.target as any)
    );

    const nodes = filteredNodes.map(d => ({ ...d })) as any[];
    const links = filteredLinks.map(d => ({ ...d })) as any[];

    // Pin patient node
    const patientNode = nodes.find(n => n.group === 1);
    if (patientNode) {
      patientNode.fx = width / 2;
      patientNode.fy = height / 2;
    }

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(30));

    // Arrows
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 18).attr("refY", 0)
      .attr("markerWidth", 6).attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", "#999");

    const link = svg.append("g").selectAll("line").data(links).join("line")
      .attr("stroke", "#999").attr("stroke-opacity", 0.6).attr("stroke-width", 1.5).attr("marker-end", "url(#arrowhead)");

    const linkLabel = svg.append("g").selectAll("text").data(links).join("text")
      .attr("class", "text-[9px] fill-slate-500 font-sans bg-white")
      .attr("text-anchor", "middle").attr("dy", -3).text((d: any) => d.relation);

    const node = svg.append("g").attr("stroke", "#fff").attr("stroke-width", 1.5).selectAll("circle").data(nodes).join("circle")
      .attr("r", (d: any) => d.group === 1 ? 16 : d.group === 5 ? 12 : 8)
      .attr("fill", (d: any) => color(String(d.group)))
      .call(d3.drag<any, any>().on("start", dragstarted).on("drag", dragged).on("end", dragended));

    node.append("title").text((d: any) => d.label);

    const label = svg.append("g").selectAll("text").data(nodes).join("text")
      .attr("class", "text-[10px] font-sans pointer-events-none fill-slate-700 dark:fill-slate-200 font-medium")
      .attr("dx", 14).attr("dy", 4).text((d: any) => d.label);

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

  }, [graphData, visibleNodeTypes]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* CONTROLS */}
      <div className="p-4 bg-white dark:bg-slate-800 shadow rounded-lg">
        {allUniquePatients.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500 mb-2">{t_translations.graph.noPatients}</p>
            <p className="text-sm text-slate-400">{t_translations.graph.noPatientsHint}</p>
          </div>
        ) : (
          <>
            <div className="flex gap-4 items-end mb-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  {t(t_translations.graph.searchPatient, { count: allUniquePatients.length })}
                </label>
                <input
                  type="text"
                  value={patientSearchQuery}
                  onChange={(e) => { setPatientSearchQuery(e.target.value); setSelectedPatientKey(''); }}
                  placeholder={t_translations.graph.searchPlaceholder}
                  className="w-full border dark:border-slate-600 rounded p-2 text-sm dark:bg-slate-900 dark:text-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-1">{t_translations.graph.selectPatient}</label>
                <select
                  value={selectedPatientKey}
                  onChange={(e) => setSelectedPatientKey(e.target.value)}
                  className="w-full border dark:border-slate-600 rounded p-2 text-sm dark:bg-slate-900 dark:text-white"
                >
                  <option value="">{t_translations.graph.selectPatientDefault}</option>
                  {filteredPatientOptions.map((opt, idx) => (
                    <option key={idx} value={opt.key}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex-none">
                <button
                  onClick={handleGenerate}
                  disabled={isLoading || !selectedPatientKey}
                  className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 disabled:opacity-50 text-sm font-bold"
                >
                  {isLoading ? t_translations.graph.loading : t_translations.graph.loadGraph}
                </button>
              </div>
            </div>

            {/* Node Type Filter */}
            {graphData && graphData.nodes.length > 0 && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  {t_translations.graph.filterNodeTypes}
                </label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map(type => (
                    <button
                      key={type}
                      onClick={() => toggleNodeType(type)}
                      disabled={type === 1}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        visibleNodeTypes.has(type)
                          ? `bg-opacity-100 text-white ${
                              type === 1 ? 'bg-red-500' :
                              type === 2 ? 'bg-amber-500' :
                              type === 3 ? 'bg-emerald-500' :
                              type === 4 ? 'bg-blue-500' :
                              'bg-purple-500'
                            }`
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 opacity-50'
                      } ${type === 1 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      title={type === 1 ? 'Patient node cannot be hidden' : `Toggle ${nodeTypeLabels[type]}`}
                    >
                      {visibleNodeTypes.has(type) ? '✓ ' : '○ '}
                      {nodeTypeLabels[type]}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {t_translations.graph.filterHint}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
         {/* Canvas */}
         <div className="flex-1 bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 relative">
            {!graphData && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                    <p>{t_translations.graph.selectPatientHint}</p>
                </div>
            )}
            {graphData && graphData.nodes.length === 0 && !isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                    <p className="text-lg font-medium mb-2">{t_translations.graph.noGraphData}</p>
                    <p className="text-sm">{t_translations.graph.noGraphDataHint}</p>
                    <p className="text-xs mt-2 text-slate-500">{t_translations.graph.loadMockDataHint}</p>
                </div>
            )}
            {graphData && graphData.nodes.length > 0 && !isLoading && (
                <div className="absolute top-2 left-2 bg-indigo-100 dark:bg-indigo-900/50 px-3 py-1 rounded-full text-xs text-indigo-800 dark:text-indigo-200 font-medium">
                    {t_translations.graph.graphitiLabel}
                </div>
            )}
            <svg ref={svgRef} className="w-full h-full bg-slate-50 dark:bg-slate-900" />
        </div>

        {/* Chat */}
        {graphData && (
             <div className="w-80 bg-white dark:bg-slate-800 shadow rounded-lg flex flex-col border border-slate-200 dark:border-slate-700">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900 border-b border-indigo-100 dark:border-indigo-800 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-100">{t_translations.graph.askKnowledgeGraph}</h3>
                    <span className="text-xs text-indigo-600 dark:text-indigo-300">{t_translations.graph.graphitiRag}</span>
                </div>
                <div className="flex-1 p-4 overflow-y-auto text-sm">
                    {graphAnswer ? (
                         <div className={`p-3 rounded whitespace-pre-wrap break-words ${
                           graphAnswer.startsWith('Error:')
                             ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                             : 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                         }`}>
                           {graphAnswer}
                         </div>
                    ) : isAnswering ? (
                        <div className="flex flex-col items-center justify-center h-full">
                          <div className="flex space-x-1 mb-2">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <p className="text-xs text-slate-400">{t_translations.graph.analyzingGraph}</p>
                        </div>
                    ) : (
                        <div className="text-slate-400 text-xs italic text-center mt-10">
                          <p className="mb-2">{t_translations.graph.askAboutRelationships}</p>
                          <p className="text-[10px]">{t_translations.graph.examples}</p>
                          <ul className="text-[10px] mt-1 space-y-1">
                            <li>• {t_translations.graph.exampleTreatments}</li>
                            <li>• {t_translations.graph.exampleOwner}</li>
                            <li>• {t_translations.graph.exampleVisits}</li>
                          </ul>
                        </div>
                    )}
                </div>
                <div className="p-3 border-t">
                    <textarea
                        value={graphQuery}
                        onChange={(e) => setGraphQuery(e.target.value)}
                        placeholder={t_translations.graph.questionPlaceholder}
                        className="w-full text-xs p-2 border rounded mb-2 dark:bg-slate-900 dark:text-white resize-none"
                        rows={2}
                    />
                    <button
                        onClick={handleAskGraph}
                        disabled={isAnswering || !graphQuery}
                        className="w-full bg-indigo-600 text-white py-2 rounded text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isAnswering ? t_translations.graph.analyzing : t_translations.graph.askAi}
                    </button>
                </div>
             </div>
        )}
      </div>
    </div>
  );
};

export default GraphView;
