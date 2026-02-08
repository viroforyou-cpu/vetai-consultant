
import React, { useState } from 'react';
import { transcribeAudio, summarizeText, extractClinicalData } from '../services/groqService';
import { Consultation, ExtractedInfo, Attachment, Language } from '../types';

interface UploadViewProps {
  onSave: (consultation: Consultation) => void;
  language: Language;
  setIsProcessing: (val: boolean) => void;
}

const UploadView: React.FC<UploadViewProps> = ({ onSave, language, setIsProcessing }) => {
  const [vetName, setVetName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [patientName, setPatientName] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  
  const [transcription, setTranscription] = useState('');
  const [summary, setSummary] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedInfo | null>(null);

  const isMetadataComplete = vetName && ownerName && patientName;

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setAudioFile(file);
    setIsLoading(true);
    setIsProcessing(true);
    setStatus("⚡ GROQ SPEED: Transcribing with Whisper Large V3...");
    setProgress(10);

    try {
        const start = performance.now();
        
        // 1. Transcribe (Groq Whisper)
        console.log("Starting Groq Transcription...");
        const tx = await transcribeAudio(file);
        console.log("Transcription done:", tx.substring(0, 50));
        
        setProgress(50);
        setStatus(`⚡ GROQ SPEED: Summarizing with Llama 3 (${((performance.now() - start)/1000).toFixed(2)}s)...`);
        
        // 2. Summarize (Groq Llama 3)
        const sum = await summarizeText(tx, language);
        
        const totalTime = ((performance.now() - start)/1000).toFixed(2);
        
        setTranscription(tx);
        setSummary(sum);
        setProgress(100);
        setStatus(`✅ Done in ${totalTime}s!`);
        
    } catch (error) {
        console.error("Groq Process Error:", error);
        setStatus("Error: " + String(error));
        // If we see this, we know it's the Groq code failing, not the old Gemini code.
    } finally {
        setIsLoading(false);
        setIsProcessing(false);
    }
  };

  const handleExtraction = async () => {
    if (!transcription) return;
    setIsLoading(true);
    setIsProcessing(true);
    setStatus("⚡ GROQ SPEED: Extracting Clinical Data...");
    
    try {
        const start = performance.now();
        const data = await extractClinicalData(transcription, language);
        const totalTime = ((performance.now() - start)/1000).toFixed(2);
        
        setExtractedData(data);
        setStatus(`✅ Extracted in ${totalTime}s!`);
    } catch (error) {
        setStatus("Extraction Error: " + String(error));
    } finally {
        setIsLoading(false);
        setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    setIsProcessing(true);
    setStatus("Saving to Local Disk...");
    try {
        const tag = `${new Date().toISOString().split('T')[0]}_${patientName}_${vetName}`.replace(/[^a-z0-9_]/gi, '');
        const consultation: Consultation = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            uniqueTag: tag,
            vetName, ownerName, patientName,
            transcription, summary, extractedData: extractedData!,
            attachments
        };
        await onSave(consultation);
        setStatus("Saved Successfully!");
        
        // Reset
        setVetName(''); setOwnerName(''); setPatientName(''); setAudioFile(null);
        setTranscription(''); setSummary(''); setExtractedData(null);
        setTimeout(() => setStatus(''), 3000);
    } catch(e) {
        setStatus("Save Failed");
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6 bg-white dark:bg-slate-800 rounded-lg shadow border-t-4 border-orange-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-orange-600">⚡ New Consultation (Groq)</h2>
        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">High Speed Mode</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
            <label className="text-xs font-bold text-slate-500">VET NAME</label>
            <input value={vetName} onChange={e=>setVetName(e.target.value)} className="w-full border p-2 rounded dark:bg-slate-700 dark:text-white" placeholder="e.g. Dr. Smith" />
        </div>
        <div>
            <label className="text-xs font-bold text-slate-500">OWNER NAME</label>
            <input value={ownerName} onChange={e=>setOwnerName(e.target.value)} className="w-full border p-2 rounded dark:bg-slate-700 dark:text-white" placeholder="e.g. John Doe" />
        </div>
        <div>
            <label className="text-xs font-bold text-slate-500">PATIENT NAME</label>
            <input value={patientName} onChange={e=>setPatientName(e.target.value)} className="w-full border p-2 rounded dark:bg-slate-700 dark:text-white" placeholder="e.g. Rex" />
        </div>
      </div>

      <div className={`p-6 border-2 border-dashed rounded-lg transition-colors ${!isMetadataComplete ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'bg-orange-50 border-orange-200'}`}>
        <p className="mb-2 font-bold text-slate-700">1. Upload Audio (MP3/WAV)</p>
        <input 
            type="file" 
            accept="audio/*" 
            onChange={handleAudioUpload} 
            disabled={!isMetadataComplete || isLoading}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-600 file:text-white hover:file:bg-orange-700" 
        />
        
        {isLoading && (
            <div className="mt-4">
                <div className="text-xs font-bold text-orange-600 mb-1 flex justify-between">
                    <span>{status}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-orange-200 rounded-full h-2.5">
                    <div className="bg-orange-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        )}
        {!isLoading && status && (
            <div className={`mt-4 text-sm font-bold p-2 rounded ${status.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {status}
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <h3 className="text-sm font-bold text-slate-500 mb-1">TRANSCRIPTION (Llama 3 Output)</h3>
            <textarea value={transcription} readOnly className="w-full h-40 border p-2 rounded dark:bg-slate-700 dark:text-white text-xs font-mono" />
        </div>
        <div>
            <h3 className="text-sm font-bold text-slate-500 mb-1">SUMMARY</h3>
            <textarea value={summary} readOnly className="w-full h-40 border p-2 rounded dark:bg-slate-700 dark:text-white text-xs" />
        </div>
      </div>

      <div className="flex justify-end gap-4">
          <button 
            onClick={handleExtraction} 
            disabled={!transcription || isLoading} 
            className="bg-indigo-600 text-white px-6 py-2 rounded shadow hover:bg-indigo-700 disabled:opacity-50"
        >
            2. Extract Data
          </button>
      </div>
      
      {extractedData && (
        <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 animate-fadeIn">
            <h3 className="text-sm font-bold text-slate-500 mb-2">EXTRACTED DATA JSON</h3>
            <pre className="text-xs overflow-auto max-h-40 bg-white dark:bg-slate-800 p-2 rounded border">{JSON.stringify(extractedData, null, 2)}</pre>
            <button 
                onClick={handleSave} 
                disabled={isLoading}
                className="mt-4 bg-teal-600 text-white px-8 py-3 rounded w-full font-bold shadow-lg hover:bg-teal-700"
            >
                3. Save to Database
            </button>
        </div>
      )}
    </div>
  );
};

export default UploadView;
