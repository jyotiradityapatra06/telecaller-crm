import React from 'react';
import { LeadStatus } from '../../types';

interface StatusBadgeProps {
  status: LeadStatus | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', showDot = true }) => {
  const normalized = (status || '').toUpperCase().replace(/[-\s]+/g, '_');

  const getStyles = () => {
    switch (normalized) {
      case 'NEW':
        return 'bg-blue-50 text-blue-700 border-blue-200/80';
      case 'INTERESTED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
      case 'CALLBACK':
        return 'bg-sky-50 text-sky-700 border-sky-200 font-medium';
      case 'FOLLOW_UP':
        return 'bg-amber-50 text-amber-800 border-amber-300 font-medium';
      // Apni Vidya Tags
      case 'DEMO':
        return 'bg-purple-50 text-purple-700 border-purple-200 font-semibold';
      case 'ENROLLED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold shadow-2xs';
      // Apni Estate Tags
      case 'SITE_VISIT_SCHEDULED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold';
      case 'NEGOTIATING':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-semibold';
      case 'CLOSED':
      case 'SALE':
      case 'BOOKING':
        return 'bg-teal-100 text-teal-900 border-teal-300 font-bold shadow-2xs';
      case 'RINGING':
      case 'NO_ANSWER':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'BUSY':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'NOT_INTERESTED':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-medium';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getDotColor = () => {
    switch (normalized) {
      case 'NEW':
        return 'bg-blue-500';
      case 'INTERESTED':
        return 'bg-emerald-500';
      case 'CALLBACK':
        return 'bg-sky-500';
      case 'FOLLOW_UP':
        return 'bg-amber-500';
      case 'DEMO':
        return 'bg-purple-500';
      case 'ENROLLED':
        return 'bg-emerald-600';
      case 'SITE_VISIT_SCHEDULED':
        return 'bg-indigo-500';
      case 'NEGOTIATING':
        return 'bg-amber-600';
      case 'CLOSED':
      case 'SALE':
      case 'BOOKING':
        return 'bg-teal-600';
      case 'RINGING':
      case 'NO_ANSWER':
        return 'bg-slate-400';
      case 'BUSY':
        return 'bg-orange-500';
      case 'NOT_INTERESTED':
        return 'bg-rose-500';
      default:
        return 'bg-slate-400';
    }
  };

  const getLabel = () => {
    switch (normalized) {
      case 'NEW':
        return 'New Lead';
      case 'INTERESTED':
        return 'Interested';
      case 'CALLBACK':
        return 'Callback';
      case 'FOLLOW_UP':
        return 'Follow-up';
      case 'DEMO':
        return 'Demo Class 🎓';
      case 'ENROLLED':
        return 'Enrolled 🏆';
      case 'SITE_VISIT_SCHEDULED':
        return 'Site Visit 📍';
      case 'NEGOTIATING':
        return 'Negotiating 🤝';
      case 'CLOSED':
        return 'Closed Deal 🏆';
      case 'BOOKING':
        return 'Booking 🏆';
      case 'SALE':
        return 'Sale Won 🏆';
      case 'RINGING':
        return 'Ringing';
      case 'NO_ANSWER':
        return 'No Answer';
      case 'BUSY':
        return 'Busy';
      case 'NOT_INTERESTED':
        return 'Not Interested';
      default:
        return status;
    }
  };

  const sizeClasses = {
    xs: 'text-xs px-2 py-0.5 font-medium',
    sm: 'text-xs px-2.5 py-0.5 font-semibold',
    md: 'text-xs sm:text-sm px-3 py-1 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border whitespace-nowrap tracking-tight ${getStyles()} ${sizeClasses[size]}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getDotColor()}`} />}
      <span>{getLabel()}</span>
    </span>
  );
};
