import React from 'react';
import {
  PhoneCall,
  Calendar,
  CheckCircle2,
  Sparkles,
  UserCheck,
  PlusCircle,
  FileText,
  AlertCircle,
  Award,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { LeadHistory } from '../../types';

interface LeadHistoryTimelineProps {
  history: LeadHistory[];
}

export const LeadHistoryTimeline: React.FC<LeadHistoryTimelineProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
        <Clock className="w-6 h-6 mx-auto mb-2 text-slate-300" />
        <span className="text-xs font-semibold">No activity logs recorded yet.</span>
      </div>
    );
  }

  const getActionIcon = (action: LeadHistory['action']) => {
    switch (action) {
      case 'SALE_CLOSED':
        return <Award className="w-4 h-4 text-emerald-600" />;
      case 'BOOKING_RECORDED':
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
      case 'DEMO_SCHEDULED':
        return <Calendar className="w-4 h-4 text-purple-600" />;
      case 'CALL_MADE':
        return <PhoneCall className="w-4 h-4 text-blue-600" />;
      case 'FOLLOW_UP_CREATED':
        return <Calendar className="w-4 h-4 text-amber-600" />;
      case 'FOLLOW_UP_COMPLETED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'ASSIGNED':
      case 'REASSIGNED':
        return <UserCheck className="w-4 h-4 text-cyan-600" />;
      case 'CREATED':
        return <PlusCircle className="w-4 h-4 text-slate-600" />;
      case 'NOTE_ADDED':
        return <MessageSquare className="w-4 h-4 text-slate-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  const getActionBg = (action: LeadHistory['action']) => {
    switch (action) {
      case 'SALE_CLOSED':
        return 'bg-emerald-100 border-emerald-300';
      case 'BOOKING_RECORDED':
        return 'bg-indigo-100 border-indigo-300';
      case 'DEMO_SCHEDULED':
        return 'bg-purple-100 border-purple-300';
      case 'CALL_MADE':
        return 'bg-blue-100 border-blue-300';
      case 'FOLLOW_UP_CREATED':
        return 'bg-amber-100 border-amber-300';
      case 'FOLLOW_UP_COMPLETED':
        return 'bg-emerald-100 border-emerald-300';
      case 'ASSIGNED':
      case 'REASSIGNED':
        return 'bg-cyan-100 border-cyan-300';
      case 'CREATED':
        return 'bg-slate-100 border-slate-300';
      default:
        return 'bg-slate-100 border-slate-300';
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:top-2 before:bottom-2 before:left-2.5 before:w-0.5 before:bg-slate-200">
      {history.map((item, idx) => (
        <div key={item.id || idx} className="relative group">
          {/* Dot / Icon container */}
          <div
            className={`absolute -left-6 top-1 w-5 h-5 rounded-full border flex items-center justify-center ${getActionBg(
              item.action
            )} shadow-xs`}
          >
            {getActionIcon(item.action)}
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                  {item.userName}
                </span>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {item.action.replace(/_/g, ' ')}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                {formatDate(item.timestamp)}
              </span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-normal">
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
