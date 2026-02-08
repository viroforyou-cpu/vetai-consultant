import React, { useState, useEffect } from 'react';
import { Consultation, Language } from '../types';
import { generatePatientExecutiveSummary } from '../services/groqService';

interface HistoryViewProps {
  consultations: Consultation[];
  language: Language;
}

const HistoryView: React.FC<HistoryViewProps> = ({ consultations, language }) => {
  const [selectedPatientKey, setSelectedPatientKey] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const patients = React.useMemo(() => {
    const map = new Map();
    consultations.forEach(c => {
        const key = `${c.patientName}__${c.ownerName}`;
        if(!map.has(key)) map.set(key, { key, p: c.patientName, o: c.ownerName });
    });
    return Array.from(map.values());
  }, [consultations]);

  const history = React.useMemo(() => {
    if(!selectedPatientKey) return [];
    const [p, o] = selectedPatientKey.split('__');
    return consultations
        .filter(c => c.patientName === p && c.ownerName === o)
        .sort((a,b) => b.timestamp - a.timestamp);
  }, [selectedPatientKey, consultations]);

  useEffect(() => {
    if(history.length > 0) {
        setLoading(true);
        generatePatientExecutiveSummary(history, language).then(setSummary).finally(() => setLoading(false));
    } else {
        setSummary('');
    }
  }, [history, language]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Clinical History</h2>
      
      <div className="bg-white dark:bg-slate-800 p-4 rounded shadow border border-slate-200 dark:border-slate-700">
          <label className="block text-sm font-bold text-slate-500 mb-2">Select Patient</label>
          <select value={selectedPatientKey} onChange={e => setSelectedPatientKey(e.target.value)} className="w-full p-2 border rounded dark:bg-slate-900 dark:text-white">
              <option value="">-- Select --</option>
              {patients.map(pt => (<option key={pt.key} value={pt.key}>{pt.p} (Owner: {pt.o})</option>))}
          </select>
      </div>

      {selectedPatientKey && (
          <>
            <div className="bg-orange-50 dark:bg-orange-900/30 p-6 rounded-lg border border-orange-200 dark:border-orange-800">
                <h3 className="text-orange-800 dark:text-orange-200 font-bold mb-2 flex items-center"><span className="text-xl mr-2">📋</span> Executive Summary (Llama 3)</h3>
                {loading ? <div className="animate-pulse h-16 bg-orange-200/50 rounded"></div> : <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{summary}</p>}
            </div>

            <div className="space-y-4">
                {history.map(c => (
                    <div key={c.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden transition-all">
                        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                            <div className="flex items-center gap-4">
                                <div className="text-center w-16">
                                    <div className="text-xs font-bold text-slate-400">{new Date(c.timestamp).toLocaleDateString(undefined, {month:'short'})}</div>
                                    <div className="text-xl font-bold text-slate-700 dark:text-slate-200">{new Date(c.timestamp).getDate()}</div>
                                    <div className="text-xs text-slate-400">{new Date(c.timestamp).getFullYear()}</div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-teal-700 dark:text-teal-400">{c.extractedData?.clinical.diagnosis || 'Consultation'}</h4>
                                    <p className="text-xs text-slate-500">{c.vetName}</p>
                                </div>
                            </div>
                            <div className="text-slate-400">{expandedId === c.id ? '▲' : '▼'}</div>
                        </div>
                        {expandedId === c.id && (
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 text-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><p className="font-bold text-slate-500 text-xs uppercase">Summary</p><p className="mb-2 text-slate-700 dark:text-slate-300">{c.summary}</p></div>
                                    <div><p className="font-bold text-slate-500 text-xs uppercase">Treatment</p><p className="mb-2 text-slate-700 dark:text-slate-300">{c.extractedData?.clinical.treatment}</p></div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
          </>
      )}
    </div>
  );
};
export default HistoryView;