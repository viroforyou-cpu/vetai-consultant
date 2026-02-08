
import React, { useState, useEffect } from 'react';
import { Consultation, ViewState, Language } from './src/types';
import UploadView from './src/components/UploadView';
import GraphView from './src/components/GraphView';
import SearchView from './src/components/SearchView';
import AnalyticsView from './src/components/AnalyticsView';
import { initQdrant, upsertConsultation } from './src/services/qdrantService';
import { saveConsultationToDisk } from './src/services/backendService';
import { getEmbedding } from './src/services/aiService';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('upload');
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [language, setLanguage] = useState<Language>('en');
  const [isProcessing, setIsProcessing] = useState(false);

  // Status tracking
  const [qdrantStatus, setQdrantStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [aiModel, setAiModel] = useState<string>(process.env.AI_MODEL || 'glm');

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const saved = localStorage.getItem('vetConsultations');
    if (saved) {
      const parsed = JSON.parse(saved);
      setConsultations(parsed);

      // Self-Repair: Check for missing embeddings in old data and fix them
      fixMissingEmbeddings(parsed);
    }
    initQdrant();

    // Check real-time status
    checkStatus();
  }, []);

  // Check real-time status of services
  const checkStatus = async () => {
    setQdrantStatus('checking');
    setBackendStatus('checking');

    // Check Qdrant
    try {
      const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
      const response = await fetch(`${qdrantUrl}/collections`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      setQdrantStatus(response.ok ? 'online' : 'offline');
    } catch {
      setQdrantStatus('offline');
    }

    // Check Backend
    try {
      const response = await fetch('/api/consultations', {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      setBackendStatus(response.ok ? 'online' : 'offline');
    } catch {
      setBackendStatus('offline');
    }
  };

  // Load mock data for testing
  const loadMockData = () => {
    const mockConsultations: Consultation[] = [
      {
        id: crypto.randomUUID(),
        timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000,
        uniqueTag: '2024-12-01_Max',
        vetName: 'Dr. Sarah Smith',
        ownerName: 'John Johnson',
        patientName: 'Max',
        attachments: [],
        transcription: 'Patient presents with vomiting and lethargy for 2 days. Owner reports possible ingestion of chocolate. Physical exam shows abdominal tenderness. Recommend immediate treatment.',
        summary: 'Dog presented with chocolate ingestion, vomiting, and lethargy. Abdominal tenderness noted on exam.',
        extractedData: {
          administrative: {
            vetName: 'Dr. Sarah Smith',
            date: '2024-12-01',
            ownerName: 'John Johnson',
            patientName: 'Max',
            breed: 'Golden Retriever',
            species: 'Dog',
            visitPurpose: 'Emergency - Chocolate Ingestion'
          },
          clinical: {
            chiefComplaint: 'Vomiting and lethargy for 2 days, possible chocolate ingestion',
            examinationFindings: 'Abdominal tenderness on palpation, slightly elevated heart rate',
            diagnosis: 'Chocolate toxicity with gastroenteritis',
            treatment: 'Activated charcoal administration, IV fluids, anti-emetics, monitoring',
            recoveryTime: '3-5 days',
            followUp: 'Recheck in 2 days to monitor hydration and symptoms'
          }
        },
        embedding: []
      },
      {
        id: crypto.randomUUID(),
        timestamp: Date.now() - 15 * 24 * 60 * 60 * 1000,
        uniqueTag: '2024-12-16_Max',
        vetName: 'Dr. Sarah Smith',
        ownerName: 'John Johnson',
        patientName: 'Max',
        attachments: [],
        transcription: 'Follow-up visit. Patient is doing well. Vomiting has resolved. Appetite is good. Owner reports normal energy levels.',
        summary: 'Follow-up visit showing complete recovery from chocolate toxicity incident.',
        extractedData: {
          administrative: {
            vetName: 'Dr. Sarah Smith',
            date: '2024-12-16',
            ownerName: 'John Johnson',
            patientName: 'Max',
            breed: 'Golden Retriever',
            species: 'Dog',
            visitPurpose: 'Follow-up'
          },
          clinical: {
            chiefComplaint: 'Routine follow-up - no current complaints',
            examinationFindings: 'Normal physical examination, good hydration status',
            diagnosis: 'Recovered - no active issues',
            treatment: 'Continue normal diet and exercise, no medications needed',
            recoveryTime: 'Complete',
            followUp: 'Routine wellness exam in 6 months'
          }
        },
        embedding: []
      },
      {
        id: crypto.randomUUID(),
        timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
        uniqueTag: '2024-12-24_Luna',
        vetName: 'Dr. Michael Chen',
        ownerName: 'Emily Davis',
        patientName: 'Luna',
        attachments: [],
        transcription: 'Cat presents with respiratory distress and coughing. Owner mentions recent adoption from shelter. Chest sounds show wheezing.',
        summary: 'Newly adopted cat with respiratory distress and wheezing, suspected upper respiratory infection.',
        extractedData: {
          administrative: {
            vetName: 'Dr. Michael Chen',
            date: '2024-12-24',
            ownerName: 'Emily Davis',
            patientName: 'Luna',
            breed: 'Domestic Shorthair',
            species: 'Cat',
            visitPurpose: 'Respiratory Issues'
          },
          clinical: {
            chiefComplaint: 'Coughing and difficulty breathing for 3 days',
            examinationFindings: 'Wheezing on auscultation, mild nasal discharge, slightly elevated temperature',
            diagnosis: 'Feline upper respiratory infection',
            treatment: 'Antibiotics (doxycycline), nebulization, supportive care',
            recoveryTime: '7-10 days',
            followUp: 'Recheck in 5 days to assess respiratory improvement'
          }
        },
        embedding: []
      },
      {
        id: crypto.randomUUID(),
        timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
        uniqueTag: '2024-12-29_Rocky',
        vetName: 'Dr. Sarah Smith',
        ownerName: 'Robert Wilson',
        patientName: 'Rocky',
        attachments: [],
        transcription: 'Routine annual wellness exam. Dog is healthy and up to date on vaccines. Owner has concerns about weight gain.',
        summary: 'Annual wellness exam with weight management discussion.',
        extractedData: {
          administrative: {
            vetName: 'Dr. Sarah Smith',
            date: '2024-12-29',
            ownerName: 'Robert Wilson',
            patientName: 'Rocky',
            breed: 'Bulldog',
            species: 'Dog',
            visitPurpose: 'Annual Wellness Exam'
          },
          clinical: {
            chiefComplaint: 'Weight gain concern, otherwise healthy',
            examinationFindings: 'Overweight condition (BCS 7/9), normal heart and lung sounds, healthy coat',
            diagnosis: 'Canine obesity - no other health concerns',
            treatment: 'Prescribed weight management diet, reduced treat intake, increased exercise',
            recoveryTime: '3-6 months for target weight',
            followUp: 'Weight check in 4 weeks'
          }
        },
        embedding: []
      },
      {
        id: crypto.randomUUID(),
        timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
        uniqueTag: '2024-12-30_Max',
        vetName: 'Dr. Sarah Smith',
        ownerName: 'John Johnson',
        patientName: 'Max',
        attachments: [],
        transcription: 'Patient presents with skin irritation and excessive scratching. Owner reports recent hiking trips. Found several ticks during examination.',
        summary: 'Dog with tick bites and dermatitis, likely from hiking exposure.',
        extractedData: {
          administrative: {
            vetName: 'Dr. Sarah Smith',
            date: '2024-12-30',
            ownerName: 'John Johnson',
            patientName: 'Max',
            breed: 'Golden Retriever',
            species: 'Dog',
            visitPurpose: 'Skin Issues'
          },
          clinical: {
            chiefComplaint: 'Excessive scratching and skin irritation',
            examinationFindings: 'Multiple tick bites found, areas of redness and inflammation, mild hot spot on left flank',
            diagnosis: 'Tick bite dermatitis with secondary bacterial infection',
            treatment: 'Tick removal, topical antibiotic, antihistamine, tick prevention recommended',
            recoveryTime: '1-2 weeks',
            followUp: 'Recheck in 7 days if not improved'
          }
        },
        embedding: []
      }
    ];
    setConsultations(mockConsultations);
    localStorage.setItem('vetConsultations', JSON.stringify(mockConsultations));
  };

  const fixMissingEmbeddings = async (data: Consultation[]) => {
      let updated = false;
      const fixedData = [...data];

      for (let i = 0; i < fixedData.length; i++) {
          const c = fixedData[i];
          if (!c.embedding && c.summary) {
              console.log(`Generating missing embedding for ${c.patientName}...`);
              try {
                  const contentToEmbed = `
                    Patient: ${c.patientName} (${c.extractedData?.administrative.species})
                    Summary: ${c.summary}
                    Diagnosis: ${c.extractedData?.clinical.diagnosis}
                  `;
                  const vector = await getEmbedding(contentToEmbed);
                  fixedData[i] = { ...c, embedding: vector };
                  updated = true;
                  // Small delay to prevent rate limits
                  await new Promise(r => setTimeout(r, 500));
              } catch (e) {
                  console.error("Failed to generate embedding for old record", e);
              }
          }
      }

      if (updated) {
          console.log("Embeddings repaired. Updating storage.");
          setConsultations(fixedData);
          localStorage.setItem('vetConsultations', JSON.stringify(fixedData));
          
          // Also try to update backend/Qdrant
          fixedData.forEach(c => {
              if (c.embedding) {
                 upsertConsultation(c, c.embedding);
                 saveConsultationToDisk(c).catch(() => {});
              }
          });
      }
  };

  const saveConsultation = async (c: Consultation) => {
    try {
      // 1. Generate Embedding (Vector)
      const contentToEmbed = `
        Patient: ${c.patientName} (${c.extractedData?.administrative.species})
        Summary: ${c.summary}
        Diagnosis: ${c.extractedData?.clinical.diagnosis}
        Treatment: ${c.extractedData?.clinical.treatment}
      `;
      const vector = await getEmbedding(contentToEmbed);
      
      // 2. Add embedding to the consultation object for Local Fallback
      const consultationWithVector = { ...c, embedding: vector };

      // 3. Update State & LocalStorage
      const updated = [consultationWithVector, ...consultations];
      setConsultations(updated);
      localStorage.setItem('vetConsultations', JSON.stringify(updated));

      // 4. Save to Qdrant (External DB) - Best effort
      await upsertConsultation(consultationWithVector, vector);

      // 5. Save to Backend (Local Files)
      await saveConsultationToDisk(consultationWithVector);
      
    } catch (e) {
      console.error("Failed to process save:", e);
      alert("Error saving data. Check console.");
      // Even if AI/Backend fails, try to save state
      const updated = [c, ...consultations];
      setConsultations(updated);
    }

    // REMOVED auto navigation to ensure user stays on screen to see success
    // setView('search');
  };

  const NavButton = ({ id, label, icon }: { id: ViewState; label: string; icon: React.ReactNode }) => {
    const isActive = view === id;
    // Logic: If active, show active style (even if processing). If not active, disable if processing.
    const buttonClass = isActive
        ? 'bg-teal-700 text-white shadow-inner'
        : isProcessing
            ? 'text-teal-400/50 cursor-not-allowed opacity-50'
            : 'text-teal-100 hover:bg-teal-800';

    return (
        <button
        onClick={() => {
            if (!isProcessing) setView(id);
        }}
        disabled={isProcessing && !isActive}
        className={`w-full text-left px-4 py-3 rounded-lg mb-1 flex items-center transition-colors ${buttonClass}`}
        >
        {icon}
        <span className="ml-3 font-medium">{label}</span>
        {isProcessing && !isActive && <span className="ml-auto text-xs">🔒</span>}
        {isProcessing && isActive && <span className="ml-auto text-xs animate-pulse">⏳</span>}
        </button>
    );
  };

  const labels = {
    title: 'VetAI Consultant',
    subtitle: 'Powered by Gemini 2.5',
    newConsult: language === 'en' ? 'New Consultation' : 'Nueva Consulta',
    search: language === 'en' ? 'Search Records' : 'Buscar Registros',
    graph: language === 'en' ? 'Patient Graph' : 'Grafo de Paciente',
    analytics: language === 'en' ? 'Analytics' : 'Analítica',
    darkMode: darkMode ? (language === 'en' ? 'Light Mode' : 'Modo Claro') : (language === 'en' ? 'Dark Mode' : 'Modo Oscuro'),
    records: language === 'en' ? 'Records' : 'Registros'
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 overflow-hidden transition-colors duration-200">
      <aside className="w-64 bg-teal-900 dark:bg-teal-950 flex-shrink-0 flex flex-col shadow-xl">
        <div className="p-6 border-b border-teal-800 dark:border-teal-900">
          <h1 className="text-xl font-bold text-white flex items-center gap-3">
            {/* Paw Print Icon */}
            <svg className="w-8 h-8 text-teal-200" fill="currentColor" viewBox="0 0 24 24">
               <path d="M17.65 6.35C16.2 6.35 15.02 7.53 15.02 8.98C15.02 10.43 16.2 11.61 17.65 11.61C19.1 11.61 20.28 10.43 20.28 8.98C20.28 7.53 19.1 6.35 17.65 6.35ZM6.35 6.35C4.9 6.35 3.72 7.53 3.72 8.98C3.72 10.43 4.9 11.61 6.35 11.61C7.8 11.61 8.98 10.43 8.98 8.98C8.98 7.53 7.8 6.35 6.35 6.35ZM12 13.23C9.38 13.23 7.12 14.26 5.76 16.16C5.15 17.02 5.27 18.21 5.95 18.98C7.37 20.59 9.55 21.61 12 21.61C14.45 21.61 16.63 20.59 18.05 18.98C18.73 18.21 18.85 17.02 18.24 16.16C16.88 14.26 14.62 13.23 12 13.23ZM12 2.39C9.74 2.39 7.9 4.23 7.9 6.49C7.9 8.75 9.74 10.59 12 10.59C14.26 10.59 16.1 8.75 16.1 6.49C16.1 4.23 14.26 2.39 12 2.39Z" />
            </svg>
            {labels.title}
          </h1>
          <p className="text-teal-400 text-xs mt-1 ml-11">{labels.subtitle}</p>
        </div>
        <nav className="flex-1 p-4">
          <NavButton 
            id="upload" 
            label={labels.newConsult} 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>} 
          />
          <NavButton 
            id="search" 
            label={labels.search} 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>} 
          />
          <NavButton 
            id="analytics" 
            label={labels.analytics} 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} 
          />
          <NavButton 
            id="graph" 
            label={labels.graph} 
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} 
          />
        </nav>
        <div className="p-4 border-t border-teal-800 dark:border-teal-900 text-teal-400 text-xs space-y-3">
           {/* Language Toggle */}
           <div className="flex bg-teal-800 dark:bg-teal-900 rounded p-1">
             <button
                onClick={() => setLanguage('en')}
                className={`flex-1 py-1 rounded text-xs font-bold ${language === 'en' ? 'bg-white text-teal-900 shadow' : 'text-teal-300'}`}
             >
               EN
             </button>
             <button
                onClick={() => setLanguage('es')}
                className={`flex-1 py-1 rounded text-xs font-bold ${language === 'es' ? 'bg-white text-teal-900 shadow' : 'text-teal-300'}`}
             >
               ES
             </button>
           </div>

           {/* Dark Mode Toggle */}
           <button
             onClick={() => setDarkMode(!darkMode)}
             className="w-full flex items-center justify-between px-3 py-2 bg-teal-800 dark:bg-teal-900 rounded-md text-teal-100 hover:bg-teal-700 dark:hover:bg-teal-800 transition-colors"
           >
              <span className="flex items-center">
                {darkMode ? (
                   <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                   <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
                {labels.darkMode}
              </span>
           </button>

           {/* Load Mock Data Button */}
           <button
             onClick={loadMockData}
             className="w-full flex items-center justify-between px-3 py-2 bg-teal-700 dark:bg-teal-800 rounded-md text-teal-100 hover:bg-teal-600 dark:hover:bg-teal-700 transition-colors"
           >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Load Mock Data
              </span>
           </button>

           {/* Status Bar */}
           <div className="pt-2 border-t border-teal-700/50 space-y-1">
             <div className="flex items-center justify-between mb-2">
               <span className="text-xs text-teal-500 font-bold uppercase">System Status</span>
               <button
                 onClick={checkStatus}
                 className="text-teal-400 hover:text-teal-200 text-xs flex items-center"
                 title="Refresh status"
               >
                 <svg className={`w-3 h-3 ${qdrantStatus === 'checking' ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                 </svg>
               </button>
             </div>
             <div className="flex items-center justify-between text-xs">
               <span className="text-teal-500">AI:</span>
               <span className="font-bold text-teal-300">{aiModel.toUpperCase()}</span>
             </div>
             <div className="flex items-center justify-between text-xs">
               <span className="text-teal-500">Qdrant:</span>
               <span className={`font-bold ${
                 qdrantStatus === 'online' ? 'text-green-400' :
                 qdrantStatus === 'offline' ? 'text-orange-400' :
                 'text-yellow-400 animate-pulse'
               }`}>
                 {qdrantStatus === 'online' ? '● Online' :
                  qdrantStatus === 'offline' ? '○ Local' :
                  '◐ Checking...'}
               </span>
             </div>
             <div className="flex items-center justify-between text-xs">
               <span className="text-teal-500">Backend:</span>
               <span className={`font-bold ${
                 backendStatus === 'online' ? 'text-green-400' :
                 backendStatus === 'offline' ? 'text-orange-400' :
                 'text-yellow-400 animate-pulse'
               }`}>
                 {backendStatus === 'online' ? '● Online' :
                  backendStatus === 'offline' ? '○ Offline' :
                  '◐ Checking...'}
               </span>
             </div>
             <div className="flex items-center justify-between text-xs pt-1">
               <span className="text-teal-500">Records:</span>
               <span className="font-mono font-bold text-teal-300">{consultations.length}</span>
             </div>
           </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 transition-colors duration-200">
        <div className="max-w-6xl mx-auto h-full">
          {view === 'upload' && (
            <div>
               <UploadView onSave={saveConsultation} language={language} setIsProcessing={setIsProcessing} />
            </div>
          )}
          
          {view === 'search' && (
            <div>
              <SearchView consultations={consultations} language={language} />
            </div>
          )}
          
          {view === 'analytics' && (
            <div>
              <AnalyticsView consultations={consultations} language={language} />
            </div>
          )}

          {view === 'graph' && (
            <div className="h-full flex flex-col">
               <div className="mb-6">
                 <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{labels.graph}</h2>
                 <p className="text-slate-500 dark:text-slate-400">{language === 'en' ? 'Visualize patient history and clinical relationships.' : 'Visualice la historia del paciente y las relaciones clínicas.'}</p>
               </div>
              <GraphView consultations={consultations} language={language} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
