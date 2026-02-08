import React from 'react';
import { Language } from '../types';
import { useTranslations } from '../translations';

export default function AnalyticsView({ consultations, language }: any) {
  const t = useTranslations(language);
  const total = consultations.length;
  const patients = new Set(consultations.map((c:any) => c.patientName)).size;

  return (
    <div className="space-y-6">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t.analytics.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-500 font-bold uppercase mb-1">{t.analytics.totalConsultations}</div>
                <div className="text-4xl font-bold text-teal-600">{total}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-500 font-bold uppercase mb-1">{t.analytics.uniquePatients}</div>
                <div className="text-4xl font-bold text-indigo-600">{patients}</div>
            </div>
        </div>
    </div>
  );
}
