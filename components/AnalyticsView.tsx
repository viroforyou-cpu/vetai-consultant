
import React, { useMemo } from 'react';
import { Consultation, Language } from '../types';

interface AnalyticsViewProps {
  consultations: Consultation[];
  language: Language;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ consultations, language }) => {
  
  const labels = {
    title: language === 'en' ? 'Practice Analytics' : 'Analítica de la Práctica',
    subtitle: language === 'en' ? 'Insights from your consultation records.' : 'Perspectivas de sus registros de consulta.',
    kpi: {
        total: language === 'en' ? 'Total Consultations' : 'Total Consultas',
        patients: language === 'en' ? 'Unique Patients' : 'Pacientes Únicos',
        avgDays: language === 'en' ? 'Avg. Consults/Day' : 'Prom. Consultas/Día',
        species: language === 'en' ? 'Top Species' : 'Especies Principales',
    },
    charts: {
        diagnosis: language === 'en' ? 'Top Diagnoses' : 'Diagnósticos Frecuentes',
        speciesDist: language === 'en' ? 'Patient Demographics' : 'Demografía de Pacientes',
        activity: language === 'en' ? 'Recent Activity' : 'Actividad Reciente',
        noData: language === 'en' ? 'No data available yet.' : 'No hay datos disponibles aún.'
    }
  };

  // Calculations
  const stats = useMemo(() => {
    const total = consultations.length;
    const uniquePatients = new Set(consultations.map(c => c.patientName.toLowerCase())).size;
    
    // Species Count
    const speciesCount: Record<string, number> = {};
    consultations.forEach(c => {
        const s = c.extractedData?.administrative.species || 'Unknown';
        const key = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        speciesCount[key] = (speciesCount[key] || 0) + 1;
    });
    const sortedSpecies = Object.entries(speciesCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

    // Diagnosis Count
    const diagnosisCount: Record<string, number> = {};
    consultations.forEach(c => {
        let d = c.extractedData?.clinical.diagnosis || 'Unknown';
        // Simple normalization
        d = d.replace(/[.,]/g, '').trim(); 
        if (d.length > 30) d = d.substring(0, 30) + '...'; // Truncate long diagnoses
        diagnosisCount[d] = (diagnosisCount[d] || 0) + 1;
    });
    const sortedDiagnosis = Object.entries(diagnosisCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);

    // Activity (Last 7 unique dates)
    const activityMap: Record<string, number> = {};
    consultations.forEach(c => {
        const date = new Date(c.timestamp).toLocaleDateString();
        activityMap[date] = (activityMap[date] || 0) + 1;
    });
    // Get last 7 entries sorted
    const sortedActivity = Object.entries(activityMap)
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .slice(-7);

    return { total, uniquePatients, sortedSpecies, sortedDiagnosis, sortedActivity };
  }, [consultations]);

  const StatCard = ({ title, value, icon, colorClass }: any) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border border-slate-200 dark:border-slate-700 flex items-center">
        <div className={`p-3 rounded-full mr-4 ${colorClass}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase">{title}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
        </div>
    </div>
  );

  const BarChart = ({ data, color }: { data: [string, number][], color: string }) => {
      const max = Math.max(...data.map(([, v]) => v), 1);
      return (
          <div className="space-y-3">
              {data.map(([label, value], idx) => (
                  <div key={idx}>
                      <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
                          <span className="text-slate-500">{value}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${color}`} 
                            style={{ width: `${(value / max) * 100}%` }}
                          ></div>
                      </div>
                  </div>
              ))}
              {data.length === 0 && <p className="text-xs text-slate-400 italic">{labels.charts.noData}</p>}
          </div>
      );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <div className="mb-6">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{labels.title}</h2>
            <p className="text-slate-500 dark:text-slate-400">{labels.subtitle}</p>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
                title={labels.kpi.total} 
                value={stats.total}
                colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
            />
            <StatCard 
                title={labels.kpi.patients} 
                value={stats.uniquePatients}
                colorClass="bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-300"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            />
             <StatCard 
                title={labels.kpi.species} 
                value={stats.sortedSpecies[0]?.[0] || "N/A"}
                colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
            />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Species Distribution */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4">{labels.charts.speciesDist}</h3>
                <BarChart data={stats.sortedSpecies} color="bg-purple-500" />
            </div>

            {/* Top Diagnosis */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4">{labels.charts.diagnosis}</h3>
                <BarChart data={stats.sortedDiagnosis} color="bg-teal-500" />
            </div>
        </div>

        {/* Recent Activity */}
         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-6">{labels.charts.activity}</h3>
            <div className="h-48 flex items-end justify-between gap-2 px-4">
                {stats.sortedActivity.length === 0 && <p className="w-full text-center text-slate-400">{labels.charts.noData}</p>}
                {stats.sortedActivity.map(([date, count], i) => {
                     const max = Math.max(...stats.sortedActivity.map(([, v]) => v), 1);
                     const height = Math.max((count / max) * 100, 5); // min 5% height
                     return (
                         <div key={i} className="flex-1 flex flex-col items-center group">
                             <div className="text-xs font-bold text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{count}</div>
                             <div 
                                className="w-full max-w-[40px] bg-indigo-500 rounded-t-md transition-all hover:bg-indigo-400 relative"
                                style={{ height: `${height}%` }}
                             ></div>
                             <div className="text-[10px] text-slate-400 mt-2 text-center truncate w-full">{date.split('/')[0]}/{date.split('/')[1]}</div>
                         </div>
                     )
                })}
            </div>
        </div>
    </div>
  );
};

export default AnalyticsView;
