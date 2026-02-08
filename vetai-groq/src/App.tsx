
import React, { useState, useEffect } from 'react';
import { Consultation, ViewState } from './types';
import UploadView from './components/UploadView';
import GraphView from './components/GraphView';
import SearchView from './components/SearchView';
import AnalyticsView from './components/AnalyticsView';
import { saveConsultationToDisk, loadConsultationsFromDisk, getLocalEmbedding } from './services/backendService';

export default function App() {
  const [view, setView] = useState<ViewState>('upload');
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Load from disk on startup
    loadConsultationsFromDisk().then(setConsultations);
  }, []);

  const handleSave = async (c: Consultation) => {
    try {
        // Generate Embedding LOCALLY via Python before saving
        const text = `${c.patientName} ${c.summary} ${c.extractedData?.clinical.diagnosis}`;
        const vector = await getLocalEmbedding(text);
        const toSave = { ...c, embedding: vector };
        
        await saveConsultationToDisk(toSave);
        setConsultations([toSave, ...consultations]);
    } catch (e) {
        alert("Save failed. Is the Python backend running?");
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 font-sans">
      <aside className="w-64 bg-orange-700 text-white flex-shrink-0 flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-orange-600">
             <h1 className="text-xl font-bold flex items-center gap-2">
                <span>⚡</span> VetAI Speed
             </h1>
             <p className="text-xs text-orange-200 mt-1">Groq + Local Embeddings</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            <button 
                onClick={() => setView('upload')} 
                className={`w-full text-left p-3 rounded flex items-center gap-2 ${view === 'upload' ? 'bg-orange-800 shadow-inner' : 'hover:bg-orange-600'}`}
            >
                <span>📂</span> New Consultation
            </button>
            <button 
                onClick={() => setView('search')} 
                className={`w-full text-left p-3 rounded flex items-center gap-2 ${view === 'search' ? 'bg-orange-800 shadow-inner' : 'hover:bg-orange-600'}`}
            >
                <span>🔍</span> Search Records
            </button>
            <button 
                onClick={() => setView('graph')} 
                className={`w-full text-left p-3 rounded flex items-center gap-2 ${view === 'graph' ? 'bg-orange-800 shadow-inner' : 'hover:bg-orange-600'}`}
            >
                <span>🕸️</span> Knowledge Graph
            </button>
            <button 
                onClick={() => setView('analytics')} 
                className={`w-full text-left p-3 rounded flex items-center gap-2 ${view === 'analytics' ? 'bg-orange-800 shadow-inner' : 'hover:bg-orange-600'}`}
            >
                <span>📊</span> Analytics
            </button>
        </nav>
        <div className="p-4 text-xs text-orange-200 border-t border-orange-600">
            {consultations.length} records loaded.
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
            {view === 'upload' && <UploadView onSave={handleSave} language="en" setIsProcessing={setIsProcessing} />}
            {view === 'search' && <SearchView consultations={consultations} language="en" />}
            {view === 'graph' && <GraphView consultations={consultations} language="en" />}
            {view === 'analytics' && <AnalyticsView consultations={consultations} />}
        </div>
      </main>
    </div>
  );
}
