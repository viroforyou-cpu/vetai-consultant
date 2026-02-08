
import React, { useState, useRef, useEffect } from 'react';
import { transcribeAndSummarize, extractClinicalData } from '../services/geminiService';
import { Consultation, ExtractedInfo, Attachment, Language, AdminData, ClinicalData } from '../types';

interface UploadViewProps {
  onSave: (consultation: Consultation) => void;
  language: Language;
  setIsProcessing: (isProcessing: boolean) => void;
}

const UploadView: React.FC<UploadViewProps> = ({ onSave, language, setIsProcessing }) => {
  const [vetName, setVetName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [patientName, setPatientName] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [transcription, setTranscription] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [extractedData, setExtractedData] = useState<ExtractedInfo | null>(null);

  const progressIntervalRef = useRef<number | null>(null);

  // Requirement: Check if metadata is filled
  const isMetadataComplete = vetName.trim() !== '' && ownerName.trim() !== '' && patientName.trim() !== '';

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current);
    };
  }, []);

  const labels = {
    title: language === 'en' ? 'New Consultation' : 'Nueva Consulta',
    subtitle: language === 'en' ? 'Upload audio, transcribe, and extract clinical data.' : 'Suba audio, transcriba y extraiga datos clínicos.',
    step1: language === 'en' ? 'STEP 1' : 'PASO 1',
    metaTitle: language === 'en' ? 'Consultation Metadata' : 'Metadatos de Consulta',
    metaDesc: language === 'en' ? 'Enter the core details to initialize the consultation folder.' : 'Ingrese los detalles principales.',
    vet: language === 'en' ? 'Veterinarian Name *' : 'Nombre del Veterinario *',
    owner: language === 'en' ? 'Owner Name *' : 'Nombre del Propietario *',
    patient: language === 'en' ? 'Patient Name *' : 'Nombre del Paciente *',
    step2: language === 'en' ? 'STEP 2' : 'PASO 2',
    filesTitle: language === 'en' ? 'Files & Media' : 'Archivos y Medios',
    uploadAudio: language === 'en' ? '1. Upload Consultation Audio (MP3)' : '1. Subir Audio de Consulta (MP3)',
    uploadAttach: language === 'en' ? '2. Attach X-Rays, Lab Results' : '2. Adjuntar Rayos-X, Resultados',
    savedAttach: language === 'en' ? 'Saved as attachments.' : 'Guardado como adjuntos.',
    transcription: language === 'en' ? 'Transcription (Editable)' : 'Transcripción (Editable)',
    summary: language === 'en' ? 'Summary (Editable)' : 'Resumen (Editable)',
    extractTitle: language === 'en' ? 'Data Extraction (For Database)' : 'Extracción de Datos (Para Base de Datos)',
    extractBtn: language === 'en' ? 'Extract Administrative & Clinical Data' : 'Extraer Datos Administrativos y Clínicos',
    adminData: language === 'en' ? 'Administrative Data (Editable)' : 'Datos Administrativos (Editable)',
    clinicalData: language === 'en' ? 'Clinical Data (Editable)' : 'Datos Clínicos (Editable)',
    saveBtn: language === 'en' ? 'Save to Database (Qdrant) & Local Files' : 'Guardar en BD (Qdrant) y Archivos Locales',
    waiting: language === 'en' ? 'Waiting for extraction...' : 'Esperando extracción...',
    lockMsg: language === 'en' ? '🔒 Please complete Step 1 (Vet, Owner, Patient) to enable uploads.' : '🔒 Por favor complete el Paso 1 para habilitar la carga.',
    status: {
      upload: language === 'en' ? 'Uploading and transcribing...' : 'Subiendo y transcribiendo...',
      transcribed: language === 'en' ? 'Transcription complete.' : 'Transcripción completa.',
      errorAudio: language === 'en' ? 'Error processing audio.' : 'Error procesando audio.',
      extracting: language === 'en' ? 'Extracting data...' : 'Extrayendo datos...',
      extracted: language === 'en' ? 'Extraction complete.' : 'Extracción completa.',
      errorExtract: language === 'en' ? 'Error extracting data.' : 'Error extrayendo datos.',
      saved: language === 'en' ? 'Saved successfully.' : 'Guardado exitosamente.',
      saving: language === 'en' ? 'Saving to database and folders...' : 'Guardando en base de datos y carpetas...',
      fillAlert: language === 'en' ? 'Please fill in Vet, Owner, and Patient names.' : 'Por favor complete los nombres.'
    },
    fields: {
        chief: language === 'en' ? 'Chief Complaint' : 'Queja Principal',
        findings: language === 'en' ? 'Examination Findings' : 'Hallazgos del Examen',
        diagnosis: language === 'en' ? 'Diagnosis' : 'Diagnóstico',
        treatment: language === 'en' ? 'Treatment' : 'Tratamiento',
        recovery: language === 'en' ? 'Recovery Time' : 'Tiempo de Recuperación',
        followUp: language === 'en' ? 'Follow-up' : 'Seguimiento',
        date: language === 'en' ? 'Date' : 'Fecha',
        breed: language === 'en' ? 'Breed' : 'Raza',
        species: language === 'en' ? 'Species' : 'Especie',
        purpose: language === 'en' ? 'Purpose' : 'Propósito'
    }
  };

  const startProgress = () => {
    setProgress(0);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    
    // Simulate fast progress at first, then slower
    progressIntervalRef.current = window.setInterval(() => {
        setProgress(prev => {
            if (prev >= 90) return 90; // Cap at 90% until done
            const remaining = 90 - prev;
            // Slow down as we get closer to 90
            const increment = Math.max(0.5, remaining * 0.1); 
            return prev + increment;
        });
    }, 200);
  };

  const stopProgress = (success: boolean) => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setProgress(success ? 100 : 0);
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setAudioFile(file);
    setIsLoading(true);
    setIsProcessing(true); // Lock navigation
    setStatus(labels.status.upload);
    startProgress();
    
    const reader = new FileReader();
    reader.onloadend = async () => {
        try {
            const base64String = (reader.result as string).split(',')[1];
            const result = await transcribeAndSummarize(base64String, file.type, language);
            
            stopProgress(true);
            setTranscription(result.transcription);
            setSummary(result.summary);
            setStatus(labels.status.transcribed);
        } catch (error) {
            console.error(error);
            stopProgress(false);
            setStatus(labels.status.errorAudio);
        } finally {
            setIsLoading(false);
            setIsProcessing(false); // Unlock navigation
        }
    };
    reader.readAsDataURL(file);
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    (Array.from(files) as File[]).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setAttachments(prev => [...prev, {
          name: file.name,
          mimeType: file.type,
          data: base64String
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleExtraction = async () => {
    if (!transcription) return;
    setIsLoading(true);
    setIsProcessing(true); // Lock navigation
    setStatus(labels.status.extracting);
    startProgress();

    try {
      const data = await extractClinicalData(transcription, language);
      stopProgress(true);
      setExtractedData(data);
      setStatus(labels.status.extracted);
    } catch (error) {
      console.error(error);
      stopProgress(false);
      setStatus(labels.status.errorExtract);
    } finally {
      setIsLoading(false);
      setIsProcessing(false); // Unlock navigation
    }
  };

  const handleSave = async () => {
    if (!vetName || !ownerName || !patientName) {
      alert(labels.status.fillAlert);
      return;
    }

    setIsProcessing(true); // Lock navigation during save
    setStatus(labels.status.saving);
    startProgress();
    
    try {
        const uniqueId = crypto.randomUUID();
        
        // Generate Human Readable Tag: YYYY-MM-DD_Patient_Vet
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const safePatient = patientName.replace(/[^a-zA-Z0-9]/g, '');
        const safeVet = vetName.replace(/[^a-zA-Z0-9]/g, '');
        const tag = `${dateStr}_${safePatient}_${safeVet}`;
    
        const newConsultation: Consultation = {
          id: uniqueId,
          timestamp: Date.now(),
          uniqueTag: tag,
          vetName,
          ownerName,
          patientName,
          audioFileName: audioFile?.name,
          attachments,
          transcription,
          summary,
          extractedData: extractedData || undefined,
          tags: [patientName, vetName, tag, extractedData?.administrative.breed || '']
        };
    
        await onSave(newConsultation); // Wait for save
        
        // Reset form only on success
        setVetName('');
        setOwnerName('');
        setPatientName('');
        setAudioFile(null);
        setAttachments([]);
        setTranscription('');
        setSummary('');
        setExtractedData(null);
        stopProgress(true);
        setStatus(labels.status.saved);
        
        // Small delay to let user see "Saved" before resetting status
        setTimeout(() => setStatus(''), 3000);
        
    } catch (error) {
        console.error(error);
        stopProgress(false);
        alert("Error saving.");
    } finally {
        setIsProcessing(false); // Unlock navigation
    }
  };

  const updateAdmin = (field: keyof AdminData, val: string) => {
      if(!extractedData) return;
      setExtractedData({...extractedData, administrative: {...extractedData.administrative, [field]: val}});
  }

  const updateClinical = (field: keyof ClinicalData, val: string) => {
      if(!extractedData) return;
      setExtractedData({...extractedData, clinical: {...extractedData.clinical, [field]: val}});
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="mb-6">
         <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{labels.title}</h2>
         <p className="text-slate-500 dark:text-slate-400">{labels.subtitle}</p>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 border border-slate-200 dark:border-slate-700 transition-colors">
        <h2 className="text-lg font-bold text-teal-900 dark:text-teal-400 mb-4 flex items-center">
          <span className="bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-xs font-bold px-2 py-1 rounded-full mr-2">{labels.step1}</span>
          <span className="mr-2 text-xl">📋</span>
          {labels.metaTitle}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{labels.metaDesc}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{labels.vet}</label>
            <input 
                type="text" 
                value={vetName} 
                onChange={e => setVetName(e.target.value)} 
                disabled={isLoading} 
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded p-2 disabled:opacity-50 focus:ring-2 focus:ring-teal-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{labels.owner}</label>
            <input 
                type="text" 
                value={ownerName} 
                onChange={e => setOwnerName(e.target.value)} 
                disabled={isLoading} 
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded p-2 disabled:opacity-50 focus:ring-2 focus:ring-teal-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{labels.patient}</label>
            <input 
                type="text" 
                value={patientName} 
                onChange={e => setPatientName(e.target.value)} 
                disabled={isLoading} 
                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded p-2 disabled:opacity-50 focus:ring-2 focus:ring-teal-500 outline-none" 
            />
          </div>
        </div>
      </div>

      <div className={`bg-white dark:bg-slate-800 shadow rounded-lg p-6 border border-slate-200 dark:border-slate-700 transition-colors ${!isMetadataComplete ? 'opacity-75' : ''}`}>
        <div className="flex justify-between items-start">
            <h2 className="text-lg font-bold text-teal-900 dark:text-teal-400 mb-4 flex items-center">
                <span className="bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-xs font-bold px-2 py-1 rounded-full mr-2">{labels.step2}</span>
                {labels.filesTitle}
            </h2>
            {!isMetadataComplete && (
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/50 px-3 py-1 rounded-full animate-pulse border border-amber-200 dark:border-amber-700">
                    {labels.lockMsg}
                </span>
            )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
          {/* Overlay to block clicks if metadata not complete */}
          {!isMetadataComplete && <div className="absolute inset-0 z-10 cursor-not-allowed"></div>}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{labels.uploadAudio}</label>
            <input 
                type="file" 
                accept="audio/*" 
                onChange={handleAudioUpload} 
                disabled={!isMetadataComplete || isLoading} 
                className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 dark:file:bg-teal-900 dark:file:text-teal-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{labels.uploadAttach}</label>
            <input 
                type="file" 
                accept="image/jpeg, image/png, application/pdf" 
                multiple 
                onChange={handleAttachmentUpload} 
                disabled={!isMetadataComplete || isLoading} 
                className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900 dark:file:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all" 
            />
          </div>
        </div>
        
        {/* Progress Bar Section */}
        {isLoading && (
            <div className="mt-6">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
                    <span>{status}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <div 
                        className="bg-teal-600 h-2.5 rounded-full transition-all duration-300 ease-out shadow-lg" 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <p className="text-center text-xs text-red-400 mt-2 italic">⚠️ Navigation disabled while processing</p>
            </div>
        )}
        {!isLoading && status && (
             <div className="mt-6 flex items-center text-sm font-medium text-slate-600 dark:text-slate-300">
                {status.includes('Error') ? '❌ ' : '✅ '} {status}
            </div>
        )}

      </div>

      {(transcription || summary) && (
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{labels.transcription}</h3>
              <textarea value={transcription} onChange={(e) => setTranscription(e.target.value)} disabled={isLoading} className="w-full h-48 p-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 rounded disabled:opacity-50" />
            </div>
            <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{labels.summary}</h3>
              <textarea value={summary} onChange={(e) => setSummary(e.target.value)} disabled={isLoading} className="w-full h-48 p-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 rounded disabled:opacity-50" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-teal-900 dark:text-teal-400">{labels.extractTitle}</h3>
                {!extractedData && <button onClick={handleExtraction} disabled={isLoading} className="py-2 px-6 bg-indigo-600 text-white text-sm rounded shadow-sm hover:bg-indigo-700 disabled:opacity-50">{labels.extractBtn}</button>}
            </div>
            
            {extractedData ? (
                <div className="space-y-6">
                    <div className="overflow-hidden border border-slate-200 dark:border-slate-700 rounded-lg">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-50 dark:bg-slate-900"><tr><th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase" colSpan={2}>{labels.adminData}</th></tr></thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700 text-sm text-slate-700 dark:text-slate-300">
                                <tr><td className="px-6 py-3 w-1/3">{labels.vet}</td><td className="px-6 py-1"><input type="text" className="w-full border-0 p-0 dark:bg-slate-800" value={extractedData.administrative.vetName} onChange={(e) => updateAdmin('vetName', e.target.value)} disabled={isLoading} /></td></tr>
                                <tr><td className="px-6 py-3 w-1/3">{labels.fields.date}</td><td className="px-6 py-1"><input type="text" className="w-full border-0 p-0 dark:bg-slate-800" value={extractedData.administrative.date} onChange={(e) => updateAdmin('date', e.target.value)} disabled={isLoading} /></td></tr>
                                <tr><td className="px-6 py-3 w-1/3">{labels.owner}</td><td className="px-6 py-1"><input type="text" className="w-full border-0 p-0 dark:bg-slate-800" value={extractedData.administrative.ownerName} onChange={(e) => updateAdmin('ownerName', e.target.value)} disabled={isLoading} /></td></tr>
                                <tr><td className="px-6 py-3 w-1/3">{labels.patient}</td><td className="px-6 py-1"><input type="text" className="w-full border-0 p-0 dark:bg-slate-800" value={extractedData.administrative.patientName} onChange={(e) => updateAdmin('patientName', e.target.value)} disabled={isLoading} /></td></tr>
                                <tr><td className="px-6 py-3 w-1/3">{labels.fields.species}</td><td className="px-6 py-1"><input type="text" className="w-full border-0 p-0 dark:bg-slate-800" value={extractedData.administrative.species} onChange={(e) => updateAdmin('species', e.target.value)} disabled={isLoading} /></td></tr>
                                <tr><td className="px-6 py-3 w-1/3">{labels.fields.breed}</td><td className="px-6 py-1"><input type="text" className="w-full border-0 p-0 dark:bg-slate-800" value={extractedData.administrative.breed} onChange={(e) => updateAdmin('breed', e.target.value)} disabled={isLoading} /></td></tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="overflow-hidden border border-slate-200 dark:border-slate-700 rounded-lg">
                         <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-teal-50 dark:bg-teal-900"><tr><th className="px-6 py-3 text-left text-xs font-medium text-teal-800 dark:text-teal-200 uppercase" colSpan={2}>{labels.clinicalData}</th></tr></thead>
                            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700 text-sm text-slate-700 dark:text-slate-300">
                                <tr><td className="px-6 py-3 w-1/3">{labels.fields.chief}</td><td className="px-6 py-1"><textarea className="w-full border-0 p-0 dark:bg-slate-800 resize-none" value={extractedData.clinical.chiefComplaint} onChange={(e) => updateClinical('chiefComplaint', e.target.value)} disabled={isLoading} /></td></tr>
                                <tr><td className="px-6 py-3 w-1/3">{labels.fields.findings}</td><td className="px-6 py-1"><textarea className="w-full border-0 p-0 dark:bg-slate-800 resize-none" value={extractedData.clinical.examinationFindings} onChange={(e) => updateClinical('examinationFindings', e.target.value)} disabled={isLoading} /></td></tr>
                                <tr><td className="px-6 py-3 w-1/3">{labels.fields.diagnosis}</td><td className="px-6 py-1"><textarea className="w-full border-0 p-0 dark:bg-slate-800 resize-none" value={extractedData.clinical.diagnosis} onChange={(e) => updateClinical('diagnosis', e.target.value)} disabled={isLoading} /></td></tr>
                                <tr><td className="px-6 py-3 w-1/3">{labels.fields.treatment}</td><td className="px-6 py-1"><textarea className="w-full border-0 p-0 dark:bg-slate-800 resize-none" value={extractedData.clinical.treatment} onChange={(e) => updateClinical('treatment', e.target.value)} disabled={isLoading} /></td></tr>
                            </tbody>
                        </table>
                    </div>

                     <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <button onClick={handleSave} disabled={isLoading} className="w-full py-3 px-8 bg-teal-700 text-white rounded-lg font-bold shadow-lg hover:bg-teal-800 disabled:opacity-50">{labels.saveBtn}</button>
                    </div>
                </div>
            ) : (
                <div className="h-32 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm bg-slate-50 dark:bg-slate-900 rounded border border-dashed border-slate-300 dark:border-slate-700">{labels.waiting}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadView;
