
import React, { useState } from 'react';
import { searchPubMed, getEmbedding, semanticSearch, generateAnswerFromContext } from '../services/geminiService';
import { searchQdrant, searchLocalVectors } from '../services/qdrantService';
import { Consultation, Language } from '../types';

interface SearchViewProps {
  consultations: Consultation[];
  language: Language;
}

interface SearchHistoryItem {
  id: string;
  query: string;
  type: 'semantic' | 'pubmed';
  timestamp: number;
  isLoading?: boolean;
  results?: Consultation[];
  answer?: string; // New field for the specific AI answer
  pubmedData?: { text: string; sources: any[] };
}

const SearchView: React.FC<SearchViewProps> = ({ consultations, language }) => {
  const [activeTab, setActiveTab] = useState<'semantic' | 'pubmed'>('semantic');
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);

  const labels = {
    title: language === 'en' ? 'Search & Research' : 'Búsqueda e Investigación',
    subtitle: language === 'en' ? 'Ask multiple questions to search records or medical literature.' : 'Haga múltiples preguntas para buscar en registros o literatura médica.',
    tabDB: language === 'en' ? 'Database Search (Vector)' : 'Búsqueda en BD (Vector)',
    tabPubMed: language === 'en' ? 'PubMed / Literature' : 'PubMed / Literatura',
    placeholderDB: language === 'en' ? "Ask a question about your records..." : "Haga una pregunta sobre sus registros...",
    placeholderPubMed: language === 'en' ? "Search clinical literature..." : "Buscar literatura clínica...",
    searchBtn: language === 'en' ? 'Ask' : 'Preguntar',
    searching: language === 'en' ? 'Thinking...' : 'Pensando...',
    found: language === 'en' ? 'Found Matching Records' : 'Registros Encontrados',
    noResults: language === 'en' ? 'No results found.' : 'No se encontraron resultados.',
    owner: language === 'en' ? 'Owner' : 'Propietario',
    vet: language === 'en' ? 'Vet' : 'Vet',
    diagnosis: language === 'en' ? 'Diagnosis' : 'Diagnóstico',
    treatment: language === 'en' ? 'Treatment' : 'Tratamiento',
    litReview: language === 'en' ? 'Literature Review' : 'Revisión de Literatura',
    sources: language === 'en' ? 'Sources' : 'Fuentes',
    youAsked: language === 'en' ? 'Query:' : 'Consulta:',
    clearHistory: language === 'en' ? 'Clear History' : 'Borrar Historial',
    aiAnswer: language === 'en' ? 'AI Answer' : 'Respuesta IA'
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    const currentQuery = query;
    const currentTab = activeTab;
    const tempId = Date.now().toString();

    const newItem: SearchHistoryItem = {
        id: tempId,
        query: currentQuery,
        type: currentTab,
        timestamp: Date.now(),
        isLoading: true
    };

    setHistory(prev => [newItem, ...prev]);
    setQuery(''); 
    setIsGlobalLoading(true);

    try {
      if (currentTab === 'semantic') {
        // 1. Generate Query Vector
        let vector: number[] | null = null;
        try {
            vector = await getEmbedding(currentQuery);
        } catch (e) {
            console.warn("Embedding generation failed, falling back to text search", e);
        }
        
        let matchedIds: string[] = [];

        // 2. Try Qdrant or Local Vector if embedding succeeded
        if (vector) {
             matchedIds = await searchQdrant(vector);
             if (matchedIds.length === 0) {
                console.log("Qdrant offline/empty. Using Local Vector Search.");
                matchedIds = searchLocalVectors(vector, consultations);
             }
        }
        
        let found: Consultation[] = [];
        if (matchedIds.length > 0) {
             found = matchedIds.map(id => consultations.find(c => c.id === id)).filter(Boolean) as Consultation[];
        } 
        
        // 3. Last Resort: Gemini simple search
        if (found.length === 0) {
            console.log("Vector search no results. Using generic AI fallback.");
            const ids = await semanticSearch(currentQuery, consultations);
            found = ids.map(id => consultations.find(c => c.id === id)).filter(Boolean) as Consultation[];
        }

        // 4. Generate Specific Answer (RAG)
        let specificAnswer = "";
        if (found.length > 0) {
            specificAnswer = await generateAnswerFromContext(currentQuery, found, language);
        }
        
        setHistory(prev => prev.map(item => 
            item.id === tempId 
            ? { ...item, isLoading: false, results: found, answer: specificAnswer } 
            : item
        ));

      } else {
        const data = await searchPubMed(currentQuery, language);
        setHistory(prev => prev.map(item => 
            item.id === tempId 
            ? { ...item, isLoading: false, pubmedData: data } 
            : item
        ));
      }
      
    } catch (error) {
      console.error(error);
      setHistory(prev => prev.map(item => 
        item.id === tempId 
        ? { ...item, isLoading: false, results: [] } 
        : item
      ));
      alert("Search failed. Check console for details.");
    } finally {
        setIsGlobalLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 h-full flex flex-col">
       <div className="mb-6 flex justify-between items-end shrink-0">
         <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{labels.title}</h2>
            <p className="text-slate-500 dark:text-slate-400">{labels.subtitle}</p>
         </div>
         {history.length > 0 && (
             <button onClick={() => setHistory([])} className="text-xs text-red-500 hover:underline">{labels.clearHistory}</button>
         )}
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 mb-8 transition-colors sticky top-0 z-10 shrink-0">
          <div className="flex justify-center mb-4">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-full p-1 inline-flex">
                <button 
                    onClick={() => setActiveTab('semantic')}
                    className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${activeTab === 'semantic' ? 'bg-teal-600 text-white shadow' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    {labels.tabDB}
                </button>
                <button 
                    onClick={() => setActiveTab('pubmed')}
                    className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${activeTab === 'pubmed' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    {labels.tabPubMed}
                </button>
            </div>
          </div>

        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={activeTab === 'semantic' ? labels.placeholderDB : labels.placeholderPubMed}
            className="w-full p-3 pr-32 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg text-base focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none shadow-inner"
          />
          <button
            onClick={handleSearch}
            disabled={isGlobalLoading}
            className={`absolute right-2 top-2 bottom-2 px-6 rounded-md font-semibold text-white transition-colors shadow-sm ${activeTab === 'semantic' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isGlobalLoading ? labels.searching : labels.searchBtn}
          </button>
        </div>
      </div>

      <div className="space-y-12 flex-1 overflow-y-auto">
        {history.map((item) => (
            <div key={item.id} className="animate-fadeIn">
                <div className="flex items-center gap-3 mb-6">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${item.type === 'semantic' ? 'bg-teal-100 text-teal-600' : 'bg-blue-100 text-blue-600'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                     </div>
                     <div>
                         <p className="text-xs text-slate-400 uppercase font-bold">{labels.youAsked}</p>
                         <p className="text-lg font-medium text-slate-800 dark:text-slate-200">{item.query}</p>
                     </div>
                </div>

                <div className="pl-11 border-l-2 border-slate-100 dark:border-slate-800 ml-4">
                    {item.isLoading ? (
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                            <div className="flex space-x-3 animate-pulse">
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                            </div>
                            <div className="mt-4 flex space-x-3 animate-pulse">
                                <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                            </div>
                            <p className="mt-2 text-xs text-slate-400">{labels.searching}</p>
                        </div>
                    ) : (
                        <>
                            {item.type === 'semantic' && item.results && (
                                <>
                                    {item.answer && (
                                        <div className="bg-teal-50 dark:bg-teal-900/30 p-5 rounded-lg border border-teal-100 dark:border-teal-800 mb-6 shadow-sm">
                                            <h3 className="text-xs font-bold text-teal-800 dark:text-teal-200 uppercase mb-2 flex items-center">
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                {labels.aiAnswer}
                                            </h3>
                                            <p className="text-slate-800 dark:text-slate-100 leading-relaxed text-sm md:text-base">
                                                {item.answer}
                                            </p>
                                        </div>
                                    )}

                                    {item.results.length > 0 ? (
                                        <div className="grid gap-4">
                                            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">{item.results.length} {labels.found}</h3>
                                            {item.results.map(result => (
                                                <div key={result.id} className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <div className="flex items-center space-x-2 mb-1">
                                                                <span className="bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-xs px-2 py-1 rounded font-bold uppercase">
                                                                    {result.patientName}
                                                                </span>
                                                                <span className="text-xs text-slate-400 font-mono">
                                                                    {result.uniqueTag}
                                                                </span>
                                                            </div>
                                                            <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                                            {labels.owner}: {result.ownerName} | {labels.vet}: {result.vetName} | {result.extractedData?.administrative.species}
                                                            </h4>
                                                        </div>
                                                        <span className="text-xs text-slate-400">{new Date(result.timestamp).toLocaleDateString()}</span>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded border border-slate-100 dark:border-slate-700">
                                                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{labels.diagnosis}</p>
                                                            <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">{result.extractedData?.clinical.diagnosis || "N/A"}</p>
                                                        </div>
                                                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded border border-slate-100 dark:border-slate-700">
                                                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{labels.treatment}</p>
                                                            <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">{result.extractedData?.clinical.treatment || "N/A"}</p>
                                                        </div>
                                                    </div>
                        
                                                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 italic">"{result.summary}"</p>
                                                    
                                                    {result.attachments.length > 0 && (
                                                        <div className="flex gap-2 mt-2 border-t border-slate-100 dark:border-slate-700 pt-2">
                                                            {result.attachments.map((att, i) => (
                                                                <span key={i} className="text-xs bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200 px-2 py-1 rounded border border-blue-100 dark:border-blue-800 flex items-center">
                                                                    <span className="mr-1">📎</span> {att.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900 p-4 rounded">{labels.noResults}</div>
                                    )}
                                </>
                            )}

                            {item.type === 'pubmed' && item.pubmedData && (
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border border-blue-100 dark:border-blue-900">
                                    <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-4 flex items-center uppercase tracking-wider">
                                        {labels.litReview}
                                    </h3>
                                    <div className="prose prose-sm prose-blue dark:prose-invert max-w-none mb-6">
                                        <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">
                                            {item.pubmedData.text}
                                        </div>
                                    </div>
                                    {item.pubmedData.sources && item.pubmedData.sources.length > 0 && (
                                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                                            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{labels.sources}</h4>
                                            <ul className="space-y-1">
                                                {item.pubmedData.sources.map((chunk: any, idx: number) => (
                                                    chunk.web ? (
                                                        <li key={idx}>
                                                            <a href={chunk.web.uri} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-xs flex items-center">
                                                                <span className="w-4 h-4 mr-2 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-[9px] text-blue-600 dark:text-blue-300 font-bold">{idx + 1}</span>
                                                                {chunk.web.title}
                                                            </a>
                                                        </li>
                                                    ) : null
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default SearchView;
