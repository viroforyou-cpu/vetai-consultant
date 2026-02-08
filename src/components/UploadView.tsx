import React, { useState } from 'react';
import { transcribeAndSummarize, extractClinicalData } from '../services/aiService';
import { Consultation, Language } from '../types';
import { useTranslations } from '../translations';

interface UploadViewProps {
  onSave: (consultation: Consultation) => void;
  language: Language;
  setIsProcessing: (val: boolean) => void;
}

const UploadView: React.FC<UploadViewProps> = ({ onSave, language, setIsProcessing }) => {
  const t = useTranslations(language);
  const [transcription, setTranscription] = useState('');
  const [summary, setSummary] = useState('');
  const [extracted, setExtracted] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [vetName, setVetName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [patientName, setPatientName] = useState('');
  const [status, setStatus] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setLoading(true);
      setIsProcessing(true);
      setStatus(t.upload.statusUploading);

      const reader = new FileReader();
      reader.onloadend = async () => {
          try {
              const b64 = (reader.result as string).split(',')[1];
              const res = await transcribeAndSummarize(b64, file.type, language);
              setTranscription(res.transcription);
              setSummary(res.summary);
              setStatus(t.upload.statusTranscriptionComplete);
          } catch (e) {
              console.error(e);
              setStatus(t.upload.statusTranscriptionError);
          } finally {
              setLoading(false);
              setIsProcessing(false);
          }
      };
      reader.readAsDataURL(file);
  };

  const handleExtract = async () => {
      setLoading(true); setIsProcessing(true);
      setStatus(t.upload.statusExtracting);
      try {
          const res = await extractClinicalData(transcription, language);
          setExtracted(res);
          setStatus(t.upload.statusExtracted);
      } catch(e) {
          setStatus(t.upload.statusExtractionFailed);
      } finally {
          setLoading(false); setIsProcessing(false);
      }
  };

  const handleSave = async () => {
      setIsProcessing(true);
      setStatus(t.upload.statusSaving);
      try {
          const c: Consultation = {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              uniqueTag: `${new Date().toISOString().split('T')[0]}_${patientName}`,
              vetName, ownerName, patientName,
              attachments: [],
              transcription,
              summary,
              extractedData: extracted
          };
          await onSave(c);
          setStatus(t.upload.statusSaved);
          // Reset fields
          setVetName(''); setOwnerName(''); setPatientName('');
          setTranscription(''); setSummary(''); setExtracted(null);
      } catch (e) {
          setStatus(t.upload.statusSavingError);
      } finally {
          setIsProcessing(false);
      }
  };

  return (
    <div className="space-y-6 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-teal-100 dark:border-teal-900">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h2 className="text-2xl font-bold text-teal-800 dark:text-teal-400 flex items-center gap-2">
                <span>📂</span> {t.upload.title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.upload.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder={t.upload.vetName} value={vetName} onChange={e=>setVetName(e.target.value)} className="border dark:border-gray-600 p-3 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"/>
            <input placeholder={t.upload.ownerName} value={ownerName} onChange={e=>setOwnerName(e.target.value)} className="border dark:border-gray-600 p-3 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"/>
            <input placeholder={t.upload.patientName} value={patientName} onChange={e=>setPatientName(e.target.value)} className="border dark:border-gray-600 p-3 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"/>
        </div>

        <div className="p-6 border-2 border-dashed border-teal-200 dark:border-teal-800 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-center">
             <input type="file" onChange={handleUpload} disabled={!vetName || !ownerName || !patientName || loading} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-600 file:text-white hover:file:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"/>
             {loading && <div className="mt-2 text-teal-600 font-medium animate-pulse">{status}</div>}
             {!loading && status && <div className="mt-2 text-green-600 font-medium">{status}</div>}
             {!vetName && !ownerName && !patientName && <div className="mt-2 text-gray-500 text-sm">{t.upload.uploadDisabled}</div>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">{t.upload.transcription}</label>
                <textarea value={transcription} readOnly className="w-full border dark:border-gray-600 p-3 h-48 rounded-lg dark:bg-slate-700 dark:text-white text-sm" placeholder={t.upload.transcriptionPlaceholder} />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300">{t.upload.aiSummary}</label>
                <textarea value={summary} readOnly className="w-full border dark:border-gray-600 p-3 h-48 rounded-lg dark:bg-slate-700 dark:text-white text-sm" placeholder={t.upload.summaryPlaceholder} />
            </div>
        </div>

        <button onClick={handleExtract} disabled={!transcription} className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {t.upload.extractClinicalData}
        </button>

        {extracted && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-auto max-h-40">{JSON.stringify(extracted, null, 2)}</pre>
                </div>
                <button onClick={handleSave} className="w-full bg-teal-600 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-teal-700 transition-colors">
                    {t.upload.saveRecord}
                </button>
            </div>
        )}
    </div>
  );
}

export default UploadView;
