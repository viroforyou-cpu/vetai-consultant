import React, { useState, useEffect } from 'react';
import { Consultation, ViewState, Language } from './types';
import UploadView from './components/UploadView';
import GraphView from './components/GraphView';
import SearchView from './components/SearchView';
import AnalyticsView from './components/AnalyticsView';
import AppointmentView from './components/AppointmentView';
import HistoryView from './components/HistoryView';
import { initQdrant, upsertConsultation } from './services/qdrantService';
import { saveConsultationToDisk, loadConsultationsFromDisk } from './services/backendService';
import { getEmbedding } from './services/aiService';
import { useTranslations } from './translations';
import {
    loadConsultationsFromStorage,
    saveConsultationToStorage,
    isMigrationNeeded,
    migrateFromLocalStorage,
    checkStorageHealth
} from './services/storageService';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('upload');
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [language, setLanguage] = useState<Language>('en');
  const [isProcessing, setIsProcessing] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const t = useTranslations(language);

  useEffect(() => {
    // Initialize Qdrant
    initQdrant();

    // Load consultations with storage service
    loadConsultationsFromStorage().then(({ storage, consultations }) => {
      setConsultations(consultations);
      console.log(`Loaded ${consultations.length} consultations from ${storage}`);

      // Check if migration is needed
      isMigrationNeeded().then(needed => {
        if (needed) {
          console.log('Migration from localStorage is needed');
          // Show migration prompt to user
          const shouldMigrate = window.confirm(
            'There are consultations in localStorage that can be migrated to the database. Migrate now?'
          );
          if (shouldMigrate) {
            migrateFromLocalStorage().then(result => {
              console.log('Migration result:', result);
              if (result.success) {
                alert(`Successfully migrated ${result.migrated} consultations to the database.`);
                // Reload consultations from database
                loadConsultationsFromStorage().then(({ consultations: reloaded }) => {
                  setConsultations(reloaded);
                });
              } else {
                alert(`Migration completed with errors:\n${result.errors.join('\n')}`);
              }
            });
          }
        }
      });
    });

    // Check storage health on mount (for debugging)
    checkStorageHealth().then(health => {
      console.log('Storage health:', health);
    });
  }, []);

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
  };

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const handleSave = async (c: Consultation) => {
    try {
      // 1. Generate Embedding (This takes ~1s, required for search)
      // We do this before updating state to ensure data integrity
      let vector: number[] = [];
      try {
        const contentToEmbed = `Patient: ${c.patientName} ${c.summary} Diagnosis: ${c.extractedData?.clinical.diagnosis}`;
        vector = await getEmbedding(contentToEmbed);
      } catch (e) {
        console.warn("Embedding generation failed, continuing without vector", e);
      }

      const toSave = { ...c, embedding: vector };

      // 2. Optimistic UI Update (Instant)
      setConsultations(prev => [toSave, ...prev]);

      // 3. Parallelize Background Saves (Storage + Qdrant)
      // We don't await these to block the user interface if they want to navigate away
      // but we do log errors.
      Promise.all([
        saveConsultationToStorage(toSave).then(({ storage }) => {
          console.log(`Saved consultation to ${storage}`);
        }),
        vector.length > 0 ? upsertConsultation(toSave, vector) : Promise.resolve()
      ]).catch(err => console.error("Background save error:", err));

    } catch (e) {
      console.error("Critical Save Error:", e);
      alert("Error processing record.");
    }
  };

  const NavButton = ({ id, label, icon }: any) => (
    <button
      onClick={() => !isProcessing && setView(id)}
      disabled={isProcessing && view !== id}
      className={`w-full text-left px-4 py-3 rounded-lg mb-1 flex items-center transition-all duration-200 font-medium ${view === id
          ? 'bg-teal-700 text-white shadow-md transform scale-105'
          : 'text-teal-100 hover:bg-teal-800 hover:pl-5'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className="mr-3 flex-shrink-0">{typeof icon === 'string' ? <span className="text-lg">{icon}</span> : icon}</span> {label}
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 font-sans transition-colors duration-200">
      <aside className="w-72 bg-gradient-to-b from-teal-900 to-teal-950 dark:from-teal-950 dark:to-teal-900 flex-shrink-0 flex flex-col shadow-2xl z-10">
        <div className="p-8 border-b border-teal-800/50">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
            <svg className="w-10 h-10" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Stethoscope shape */}
              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="3" className="text-teal-400" fill="none" />
              <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="2" className="text-teal-500" fill="none" />
              {/* Medical cross */}
              <rect x="28" y="16" width="8" height="32" rx="2" className="fill-white" />
              <rect x="16" y="28" width="32" height="8" rx="2" className="fill-white" />
              {/* Heart pulse line */}
              <path d="M 12 44 Q 20 44, 24 38 Q 28 32, 32 44 Q 36 32, 40 38 Q 44 44, 52 44"
                stroke="currentColor" strokeWidth="2" className="text-teal-300" fill="none" />
              {/* Paw print inside */}
              <circle cx="32" cy="32" r="6" className="fill-teal-300" />
              <circle cx="32" cy="24" r="3" className="fill-teal-300" />
              <circle cx="38" cy="28" r="3" className="fill-teal-300" />
              <circle cx="38" cy="36" r="3" className="fill-teal-300" />
              <circle cx="26" cy="28" r="3" className="fill-teal-300" />
            </svg>
            <span>VetAI</span>
          </h1>
          <p className="text-teal-400 text-xs mt-2 font-mono uppercase tracking-widest ml-14">Gemini Edition</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavButton id="upload" label={t.nav.newConsultation} icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" />
              <path d="M8 12h.01M16 12h.01M12 8v.01M12 16v.01" strokeLinecap="round" />
            </svg>
          } />
          <NavButton id="appointment" label={t.nav.appointments} icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" />
              <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
              <circle cx="12" cy="14" r="3" fill="currentColor" />
              <path d="M12 17v2M12 11v1" strokeLinecap="round" />
            </svg>
          } />
          <NavButton id="history" label={t.nav.history} icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" strokeLinecap="round" />
            </svg>
          } />
          <NavButton id="search" label={t.nav.searchRecords} icon="🔍" />
          <NavButton id="graph" label={t.nav.patientGraph} icon="🕸️" />
          <NavButton id="analytics" label={t.nav.analytics} icon="📊" />
        </nav>

        <div className="p-6 border-t border-teal-800 bg-teal-950/50">
          <button onClick={() => setDarkMode(!darkMode)} className="flex items-center text-sm font-bold text-teal-300 w-full hover:text-white transition-colors mb-3">
            <span className="mr-2 text-lg">{darkMode ? '☀️' : '🌙'}</span>
            {darkMode ? t.sidebar.lightMode : t.sidebar.darkMode}
          </button>
          <button onClick={() => setLanguage(language === 'en' ? 'es' : 'en')} className="flex items-center text-sm font-bold text-teal-300 w-full hover:text-white transition-colors mb-3">
            <span className="mr-2 text-lg">{language === 'en' ? '🇺🇸' : '🇪🇸'}</span>
            {language === 'en' ? 'English' : 'Español'}
          </button>
          <button onClick={loadMockData} className="flex items-center text-xs font-bold text-teal-400 w-full hover:text-teal-200 transition-colors mb-4 py-1">
            <span className="mr-2">📋</span>
            {t.sidebar.loadMockData}
          </button>
          <div className="flex items-center justify-between text-xs text-teal-500 font-mono">
            <span>{t.sidebar.status}: {t.sidebar.online}</span>
            <span>{consultations.length} {t.sidebar.records}</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-900 pointer-events-none -z-10"></div>
        <div className="max-w-7xl mx-auto p-8">
          {view === 'upload' && <UploadView onSave={handleSave} language={language} setIsProcessing={setIsProcessing} />}
          {view === 'appointment' && <AppointmentView language={language} />}
          {view === 'history' && <HistoryView consultations={consultations} language={language} />}
          {view === 'search' && <SearchView consultations={consultations} language={language} />}
          {view === 'graph' && <GraphView consultations={consultations} language={language} />}
          {view === 'analytics' && <AnalyticsView consultations={consultations} language={language} />}
        </div>
      </main>
    </div>
  );
};

export default App;
