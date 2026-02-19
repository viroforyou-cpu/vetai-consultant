import React, { useState, useEffect } from 'react';
import { generatePatientExecutiveSummary } from '../services/aiService';
import { useTranslations } from '../translations';

export default function HistoryView({ consultations, language }: any) {
    const t = useTranslations(language);
    const [selectedPatient, setSelectedPatient] = useState('');
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);

    // Derive unique patients
    const patients = Array.from(new Set(consultations.map((c: any) => c.patientName)));
    const history = consultations.filter((c: any) => c.patientName === selectedPatient).sort((a: any, b: any) => b.timestamp - a.timestamp);

    useEffect(() => {
        if (history.length > 0) {
            setLoading(true);
            generatePatientExecutiveSummary(history, language).then(setSummary).finally(() => setLoading(false));
        } else {
            setSummary('');
        }
    }, [selectedPatient, history, language]);

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t.history.title}</h2>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow border border-slate-200 dark:border-slate-700">
                <label className="block text-sm font-bold text-slate-500 mb-2">{t.history.selectPatient}</label>
                <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)} className="w-full p-3 border rounded-lg dark:bg-slate-900 dark:text-white dark:border-slate-600">
                    <option value="">{t.history.selectPatientDefault}</option>
                    {patients.map((p: any) => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>

            {selectedPatient && (
                <>
                    <div className="bg-teal-50 dark:bg-teal-900/20 p-6 rounded-xl border border-teal-200 dark:border-teal-800">
                        <h3 className="text-teal-800 dark:text-teal-300 font-bold mb-3 flex items-center">
                            <span className="text-xl mr-2">📋</span> {t.history.executiveSummary}
                        </h3>
                        {loading ? (
                            <div className="animate-pulse space-y-2">
                                <div className="h-4 bg-teal-200 dark:bg-teal-800 rounded w-3/4"></div>
                                <div className="h-4 bg-teal-200 dark:bg-teal-800 rounded w-1/2"></div>
                            </div>
                        ) : (
                            <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{summary}</p>
                        )}
                    </div>

                    <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 space-y-8 pl-8 py-4">
                        {history.map((c: any) => (
                            <div key={c.id} className="relative">
                                <div className="absolute -left-[41px] bg-teal-500 w-6 h-6 rounded-full border-4 border-white dark:border-slate-900"></div>
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="font-bold text-lg text-slate-800 dark:text-slate-100">{new Date(c.timestamp).toLocaleDateString()}</div>
                                        <div className="text-xs font-bold uppercase text-slate-400">{c.vetName}</div>
                                    </div>
                                    <div className="text-sm font-bold text-teal-600 dark:text-teal-400 mb-2">{c.extractedData?.clinical?.diagnosis || t.history.consultation}</div>
                                    <p className="text-slate-600 dark:text-slate-300 text-sm">{c.summary}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
