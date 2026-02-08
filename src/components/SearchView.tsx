import React, { useState } from 'react';
import { getEmbedding, semanticSearch, generateAnswerFromContext } from '../services/aiService';
import { searchLocalVectors } from '../services/qdrantService';
import { useTranslations, t } from '../translations';

export default function SearchView({ consultations, language }: any) {
  const t_translations = useTranslations(language);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [answer, setAnswer] = useState('');
  
  // Separate loading states for better UX
  const [isSearching, setIsSearching] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);

  const handleSearch = async () => {
      if (!query.trim()) return;
      
      setIsSearching(true);
      setAnswer(''); // Clear previous answer
      setResults([]); // Clear previous results

      try {
        // 1. Fast Phase: Vector Search & Retrieval
        // We get embeddings and find matches first.
        let foundRecords: any[] = [];
        try {
            const vec = await getEmbedding(query);
            const ids = searchLocalVectors(vec, consultations);
            foundRecords = ids.map(id => consultations.find((c:any) => c.id === id)).filter(Boolean);
        } catch (e) {
            console.warn("Local vector search failed, trying fallback", e);
        }

        // 1b. Fallback if vector search missed
        if(foundRecords.length === 0) {
            const ids = await semanticSearch(query, consultations);
            foundRecords = ids.map(id => consultations.find((c:any) => c.id === id)).filter(Boolean);
        }
        
        // UPDATE UI NOW: User sees records immediately
        setResults(foundRecords);
        setIsSearching(false); 

        // 2. Slow Phase: RAG AI Answer
        // Only start this if we found something
        if(foundRecords.length > 0) {
            setIsAnswering(true); // Start spinner for answer box only
            try {
                const ans = await generateAnswerFromContext(query, foundRecords, language);
                setAnswer(ans);
            } catch (err) {
                setAnswer(t_translations.search.answerError);
            } finally {
                setIsAnswering(false);
            }
        } else {
            setAnswer(t_translations.search.noRecords);
        }

      } catch (e) {
        console.error(e);
        setIsSearching(false);
        setIsAnswering(false);
      }
  };

  return (
    <div className="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-teal-100 dark:border-teal-900 h-full flex flex-col">
        <div>
            <h2 className="text-2xl font-bold text-teal-800 dark:text-teal-400 mb-4">{t_translations.search.title}</h2>
            <div className="flex gap-4">
                <input
                    value={query}
                    onChange={e=>setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="border dark:border-gray-600 p-3 flex-1 rounded-lg dark:bg-slate-700 dark:text-white"
                    placeholder={t_translations.search.placeholder}
                />
                <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="bg-teal-600 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-teal-700 disabled:opacity-50 min-w-[120px]"
                >
                    {isSearching ? t_translations.search.finding : t_translations.search.search}
                </button>
            </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto space-y-6">

            {/* AI Answer Section */}
            {(answer || isAnswering) && (
                <div className="bg-blue-50 dark:bg-blue-900/30 p-5 rounded-lg border border-blue-100 dark:border-blue-800 transition-all">
                    <h3 className="text-blue-800 dark:text-blue-300 font-bold mb-2 flex items-center gap-2">
                        <span>🤖</span> {t_translations.search.aiAnswer}
                    </h3>
                    {isAnswering ? (
                        <div className="flex space-x-2 animate-pulse">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animation-delay-200"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animation-delay-400"></div>
                            <span className="text-sm text-blue-500">{t_translations.search.synthesizing}</span>
                        </div>
                    ) : (
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{answer}</p>
                    )}
                </div>
            )}

            {/* List of Records */}
            {results.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t(t_translations.search.foundRecords, { count: results.length })}</h3>
                    {results.map((c:any) => (
                        <div key={c.id} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-lg text-teal-700 dark:text-teal-400">{c.patientName}</span>
                                <span className="text-xs text-gray-400 border border-gray-200 dark:border-gray-700 px-2 py-1 rounded-full">{new Date(c.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">{c.summary}</p>
                            <div className="flex flex-wrap gap-2 text-xs">
                                <span className="bg-white dark:bg-slate-800 border dark:border-slate-600 px-2 py-1 rounded text-slate-600 dark:text-slate-300">{t_translations.search.vet}: {c.vetName}</span>
                                <span className="bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200 px-2 py-1 rounded">{t_translations.search.diagnosis}: {c.extractedData?.clinical?.diagnosis || 'N/A'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
}
