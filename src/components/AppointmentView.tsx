import React, { useState, useEffect } from 'react';
import { Appointment, Species, Language } from '../types';
import { useTranslations } from '../translations';

interface AppointmentViewProps {
  language: Language;
}

const AppointmentView: React.FC<AppointmentViewProps> = ({ language }) => {
  const t = useTranslations(language);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [patientName, setPatientName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [species, setSpecies] = useState<Species>(Species.DOG);
  const [breed, setBreed] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [appointmentType, setAppointmentType] = useState<Appointment['appointmentType']>('consultation');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Appointment['status']>('scheduled');

  // Load appointments from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('vetai_appointments');
    if (saved) {
      try {
        setAppointments(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading appointments:', e);
      }
    }
  }, []);

  // Save appointments to localStorage
  const saveAppointments = (updated: Appointment[]) => {
    setAppointments(updated);
    localStorage.setItem('vetai_appointments', JSON.stringify(updated));
  };

  const resetForm = () => {
    setPatientName('');
    setOwnerName('');
    setSpecies(Species.DOG);
    setBreed('');
    setAppointmentDate('');
    setAppointmentTime('');
    setDuration(30);
    setAppointmentType('consultation');
    setReason('');
    setNotes('');
    setStatus('scheduled');
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientName || !ownerName || !appointmentDate || !appointmentTime || !reason) {
      alert(t.appointments.requiredFields);
      return;
    }

    const appointmentData: Appointment = {
      id: editingId || crypto.randomUUID(),
      timestamp: Date.now(),
      patientName,
      ownerName,
      species,
      breed: breed || undefined,
      appointmentDate,
      appointmentTime,
      duration,
      appointmentType,
      reason,
      notes: notes || undefined,
      status,
    };

    if (editingId) {
      // Update existing
      saveAppointments(appointments.map(a => a.id === editingId ? appointmentData : a));
    } else {
      // Create new
      saveAppointments([appointmentData, ...appointments]);
    }

    resetForm();
    setShowForm(false);
  };

  const handleEdit = (appointment: Appointment) => {
    setPatientName(appointment.patientName);
    setOwnerName(appointment.ownerName);
    setSpecies(appointment.species);
    setBreed(appointment.breed || '');
    setAppointmentDate(appointment.appointmentDate);
    setAppointmentTime(appointment.appointmentTime);
    setDuration(appointment.duration);
    setAppointmentType(appointment.appointmentType);
    setReason(appointment.reason);
    setNotes(appointment.notes || '');
    setStatus(appointment.status);
    setEditingId(appointment.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t.appointments.deleteConfirm)) {
      saveAppointments(appointments.filter(a => a.id !== id));
    }
  };

  const handleStatusChange = (id: string, newStatus: Appointment['status']) => {
    saveAppointments(appointments.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  // Sort appointments by date/time
  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateCompare = a.appointmentDate.localeCompare(b.appointmentDate);
    if (dateCompare !== 0) return dateCompare;
    return a.appointmentTime.localeCompare(b.appointmentTime);
  });

  const statusColors: Record<Appointment['status'], string> = {
    'scheduled': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'confirmed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'completed': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    'no-show': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  };

  const typeLabels: Record<Appointment['appointmentType'], string> = {
    'wellness': t.appointments.typeWellness,
    'consultation': t.appointments.typeConsultation,
    'emergency': t.appointments.typeEmergency,
    'follow-up': t.appointments.typeFollowUp,
    'surgery': t.appointments.typeSurgery,
    'vaccination': t.appointments.typeVaccination,
    'other': t.appointments.typeOther,
  };

  const statusLabels: Record<Appointment['status'], string> = {
    'scheduled': t.appointments.statusScheduled,
    'confirmed': t.appointments.statusConfirmed,
    'completed': t.appointments.statusCompleted,
    'cancelled': t.appointments.statusCancelled,
    'no-show': t.appointments.statusNoShow,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-teal-100 dark:border-teal-900">
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-teal-800 dark:text-teal-400 flex items-center gap-2">
              <span>📅</span> {t.appointments.title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t.appointments.subtitle}
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-bold shadow transition-colors"
          >
            {showForm ? t.appointments.cancel : t.appointments.newAppointment}
          </button>
        </div>

        {/* Appointment Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Patient Information */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-2">
                  {t.appointments.patientInfo}
                </h3>
                <input
                  type="text"
                  placeholder={t.appointments.patientName}
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  required
                  className="w-full border dark:border-gray-600 p-3 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <input
                  type="text"
                  placeholder={t.appointments.ownerName}
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  required
                  className="w-full border dark:border-gray-600 p-3 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <select
                  value={species}
                  onChange={e => setSpecies(e.target.value as Species)}
                  className="w-full border dark:border-gray-600 p-3 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  {Object.values(Species).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder={t.appointments.breed}
                  value={breed}
                  onChange={e => setBreed(e.target.value)}
                  className="w-full border dark:border-gray-600 p-3 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* Appointment Details */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-2">
                  {t.appointments.appointmentDetails}
                </h3>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={e => setAppointmentDate(e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border dark:border-gray-600 p-3 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <input
                  type="time"
                  value={appointmentTime}
                  onChange={e => setAppointmentTime(e.target.value)}
                  required
                  className="w-full border dark:border-gray-600 p-3 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <div className="flex gap-4">
                  <select
                    value={duration.toString()}
                    onChange={e => setDuration(parseInt(e.target.value))}
                    className="flex-1 border dark:border-gray-600 p-3 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="15">15 {t.appointments.minutes}</option>
                    <option value="30">30 {t.appointments.minutes}</option>
                    <option value="45">45 {t.appointments.minutes}</option>
                    <option value="60">1 {t.appointments.hour}</option>
                    <option value="90">1.5 {t.appointments.hours}</option>
                    <option value="120">2 {t.appointments.hours}</option>
                  </select>
                  <select
                    value={appointmentType}
                    onChange={e => setAppointmentType(e.target.value as Appointment['appointmentType'])}
                    className="flex-1 border dark:border-gray-600 p-3 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="wellness">{typeLabels.wellness}</option>
                    <option value="consultation">{typeLabels.consultation}</option>
                    <option value="emergency">{typeLabels.emergency}</option>
                    <option value="follow-up">{typeLabels.followup}</option>
                    <option value="surgery">{typeLabels.surgery}</option>
                    <option value="vaccination">{typeLabels.vaccination}</option>
                    <option value="other">{typeLabels.other}</option>
                  </select>
                </div>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as Appointment['status'])}
                  className="w-full border dark:border-gray-600 p-3 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="scheduled">{statusLabels.scheduled}</option>
                  <option value="confirmed">{statusLabels.confirmed}</option>
                  <option value="completed">{statusLabels.completed}</option>
                  <option value="cancelled">{statusLabels.cancelled}</option>
                  <option value="no-show">{statusLabels.noShow}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-2">
                {t.appointments.reason}
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
                rows={2}
                className="w-full border dark:border-gray-600 p-3 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder={t.appointments.reasonPlaceholder}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-2">
                {t.appointments.notes}
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full border dark:border-gray-600 p-3 rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder={t.appointments.notesPlaceholder}
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-bold shadow transition-colors"
              >
                {editingId ? t.appointments.updateAppointment : t.appointments.scheduleAppointment}
              </button>
              <button
                type="button"
                onClick={() => { resetForm(); setShowForm(false); }}
                className="px-6 py-3 rounded-lg font-bold border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                {t.appointments.cancel}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Appointments List */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-teal-100 dark:border-teal-900">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
          {t.appointments.scheduledAppointments} ({appointments.length})
        </h3>

        {appointments.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <span className="text-4xl mb-4 block">📅</span>
            <p>{t.appointments.noAppointments}</p>
            <p className="text-sm mt-2">{t.appointments.getStarted}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedAppointments.map(appointment => (
              <div
                key={appointment.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-slate-700"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold text-gray-800 dark:text-white">
                        {appointment.patientName}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColors[appointment.status]}`}>
                        {statusLabels[appointment.status]}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                        {typeLabels[appointment.appointmentType]}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-medium">{t.appointments.owner}:</span> {appointment.ownerName}
                      </div>
                      <div>
                        <span className="font-medium">{t.appointments.date}:</span> {new Date(appointment.appointmentDate).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}
                      </div>
                      <div>
                        <span className="font-medium">{t.appointments.time}:</span> {appointment.appointmentTime}
                      </div>
                      <div>
                        <span className="font-medium">{t.appointments.duration}:</span> {appointment.duration} {t.appointments.minutes}
                      </div>
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{t.appointments.reason.replace(' *', '')}:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">{appointment.reason}</span>
                    </div>
                    {appointment.notes && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{t.appointments.notes.replace(' (optional)', '')}:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">{appointment.notes}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <select
                      value={appointment.status}
                      onChange={e => handleStatusChange(appointment.id, e.target.value as Appointment['status'])}
                      className="text-xs border dark:border-gray-600 rounded p-1 dark:bg-slate-600 dark:text-white"
                    >
                      <option value="scheduled">{statusLabels.scheduled}</option>
                      <option value="confirmed">{statusLabels.confirmed}</option>
                      <option value="completed">{statusLabels.completed}</option>
                      <option value="cancelled">{statusLabels.cancelled}</option>
                      <option value="no-show">{statusLabels.noShow}</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(appointment)}
                        className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors"
                      >
                        {t.appointments.edit}
                      </button>
                      <button
                        onClick={() => handleDelete(appointment.id)}
                        className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors"
                      >
                        {t.appointments.delete}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentView;
