import React from 'react';
import { Consultation } from '../types';
export default function AnalyticsView({ consultations }: { consultations: Consultation[] }) {
  return <div className="p-6">Analytics: {consultations.length} records loaded.</div>;
}