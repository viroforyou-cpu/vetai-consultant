import React, { useState } from 'react';
import { getLocalEmbedding } from '../services/backendService';
import { generateAnswerFromContext, semanticSearch } from '../services/groqService';
import { Consultation, Language } from '../types';

export default function SearchView({ consultations, language }: { consultations: Consultation[], language: Language }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Consultation[]>([]);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
        let found: Consultation[] = [];
        try {
            const qVector = await getLocalEmbedding(query);
            const scores = consultations.map(c => {
                 if (!c.embedding) return { id: c.id, score: 0 };
                 const dot = c.embedding.reduce((a, b, i) => a + b * qVector[i], 0);
                 return { id: c.id, score: dot };
            }).sort((a,b) => b.score - a.score).filter(x => x.score > 0.15);
            found = scores.map(s => consultations.find(c => c.id === s.id)!);
        } catch(e) { console.log("Vector failed, generic fallback"); }

        if (found.length === 0) {
            const ids = await semanticSearch(query, consultations);
            found = ids.map(id => consultations.find(c => c.id === id)!).filter(Boolean);
        }

        setResults(found);
        if (found.length > 0) {
            const ans = await generateAnswerFromContext(query, found, language);
            setAnswer(ans);
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Speed Search (Local Vector + Groq RAG)</h2>
        <div className="flex gap-2 mb-6">
            <input value={query} onChange={e => setQuery(e.target.value)} className="flex-1 p-2 border rounded dark:bg-slate-700" placeholder="Ask..." />
            <button onClick={handleSearch} disabled={loading} className="bg-teal-600 text-white px-6 rounded">Search</button>
        </div>
        
        {loading && <div className="animate-pulse text-teal-600 font-bold">Thinking (Groq Llama 3)...</div>}
        
        {answer && <div className="p-4 bg-teal-50 dark:bg-teal-900 mb-6 rounded border border-teal-200"><strong>AI Answer:</strong> {answer}</div>}
        
        <div className="space-y-4">
            {results.map(c => (
                <div key={c.id} className="p-4 border rounded shadow bg-white dark:bg-slate-800">
                    <div className="font-bold">{c.patientName} ({c.uniqueTag})</div>
                    <div className="text-sm text-slate-500">{c.summary}</div>
                </div>
            ))}
        </div>
    </div>
  );
}