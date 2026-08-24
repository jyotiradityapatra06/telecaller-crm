import React, { useState } from 'react';
import {
  Phone,
  MessageSquare,
  Check,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Lead, FollowUp, AuthUser } from '../../types';
import { api } from '../../lib/api';
import { soundManager } from '../../lib/sound';
import { BrandBadge } from '../common/BrandBadge';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardContent } from '../ui/Card';

interface TelecallerFollowUpsProps {
  leads: Lead[];
  currentUser?: AuthUser;
  currentTelecaller?: AuthUser;
  followUps?: {
    overdue: FollowUp[];
    today: FollowUp[];
    upcoming: FollowUp[];
    completed: FollowUp[];
  };
  onSelectLead: (lead: Lead) => void;
  onInitiateCall: (lead: Lead) => void;
  onInitiateWhatsApp: (lead: Lead) => void;
  onFollowUpCompleted: () => void;
}

export const TelecallerFollowUps: React.FC<TelecallerFollowUpsProps> = ({
  leads = [],
  currentUser: propCurrentUser,
  currentTelecaller,
  followUps: propFollowUps,
  onSelectLead,
  onInitiateCall,
  onInitiateWhatsApp,
  onFollowUpCompleted,
}) => {
  const _currentUser = propCurrentUser || currentTelecaller;
  const [activeSection, setActiveSection] = useState<'all' | 'overdue' | 'today' | 'upcoming'>('all');

  const todayStr = new Date().toISOString().split('T')[0];

  const followUps = React.useMemo(() => {
    if (propFollowUps) return propFollowUps;
    const overdue: FollowUp[] = [];
    const today: FollowUp[] = [];
    const upcoming: FollowUp[] = [];
    const completed: FollowUp[] = [];

    leads.forEach((l) => {
      if (l.activeFollowUp) {
        if (l.activeFollowUp.isCompleted || l.activeFollowUp.status === 'COMPLETED') {
          completed.push(l.activeFollowUp);
        } else if (l.activeFollowUp.dueDate < todayStr) {
          overdue.push(l.activeFollowUp);
        } else if (l.activeFollowUp.dueDate === todayStr) {
          today.push(l.activeFollowUp);
        } else {
          upcoming.push(l.activeFollowUp);
        }
      }
    });

    return { overdue, today, upcoming, completed };
  }, [propFollowUps, leads, todayStr]);

  const overdue = followUps?.overdue || [];
  const today = followUps?.today || [];
  const upcoming = followUps?.upcoming || [];
  const totalActive = overdue.length + today.length + upcoming.length;

  const handleComplete = async (e: React.MouseEvent, followUpId: string) => {
    e.stopPropagation();
    try {
      await api.completeFollowUp(followUpId);
      soundManager.playSuccess();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
      onFollowUpCompleted();
    } catch (err: any) {
      soundManager.playError();
      alert(err.message || 'Failed to complete follow up');
    }
  };

  const getLeadForFollowUp = (fu: FollowUp): Lead => {
    const found = leads.find((l) => l.id === fu.leadId);
    if (found) return found;
    return {
      id: fu.leadId,
      name: fu.leadName,
      phone: fu.leadPhone,
      brand: fu.brand || 'APNI_VIDYA',
      status: 'FOLLOW_UP',
      totalCallsCount: 1,
      createdAt: fu.createdAt,
      updatedAt: fu.createdAt,
      assignedTo: fu.telecallerId,
    };
  };

  const displayedList =
    activeSection === 'overdue'
      ? overdue
      : activeSection === 'today'
      ? today
      : activeSection === 'upcoming'
      ? upcoming
      : [...overdue, ...today, ...upcoming];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Follow-up Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Scheduled Touchpoints ({totalActive})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Keep track of promised callbacks and customer meeting schedules.
          </p>
        </div>

        {overdue.length > 0 && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{overdue.length} Overdue Calls Need Action</span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={() => {
            soundManager.playTap();
            setActiveSection('all');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeSection === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider opacity-75">All Active</p>
          <p className="text-xl font-extrabold mt-1">{totalActive}</p>
        </button>

        <button
          type="button"
          onClick={() => {
            soundManager.playTap();
            setActiveSection('overdue');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeSection === 'overdue'
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-rose-50/50'
          }`}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider opacity-75">Overdue</p>
          <p className="text-xl font-extrabold mt-1">{overdue.length}</p>
        </button>

        <button
          type="button"
          onClick={() => {
            soundManager.playTap();
            setActiveSection('today');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeSection === 'today'
              ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50/50'
          }`}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider opacity-75">Due Today</p>
          <p className="text-xl font-extrabold mt-1">{today.length}</p>
        </button>

        <button
          type="button"
          onClick={() => {
            soundManager.playTap();
            setActiveSection('upcoming');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeSection === 'upcoming'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50/50'
          }`}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider opacity-75">Upcoming</p>
          <p className="text-xl font-extrabold mt-1">{upcoming.length}</p>
        </button>
      </div>

      {/* Follow-up Cards List */}
      <div className="space-y-3">
        {displayedList.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
              <p className="text-sm font-bold text-slate-700">No pending follow-ups in this tab!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedList.map((fu) => {
              const lead = getLeadForFollowUp(fu);
              const isOverdue = fu.dueDate < todayStr;
              const isToday = fu.dueDate === todayStr;

              return (
                <Card
                  key={fu.id}
                  onClick={() => {
                    soundManager.playTap();
                    onSelectLead(lead);
                  }}
                  className={`hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between ${
                    isOverdue ? 'border-rose-300 bg-rose-50/20' : ''
                  }`}
                >
                  <CardContent className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-slate-900 text-base truncate">
                            {fu.leadName}
                          </h3>
                          <BrandBadge brand={fu.brand} size="xs" />
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{fu.leadPhone}</p>
                      </div>

                      {isOverdue && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-rose-100 text-rose-700 border border-rose-200">
                          Overdue
                        </span>
                      )}
                      {isToday && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                          Today
                        </span>
                      )}
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>Date: {fu.dueDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Time: {fu.dueTime || '11:00 AM'}</span>
                      </div>
                    </div>

                    {fu.note && (
                      <p className="text-xs text-slate-600 italic bg-white/80 p-2 rounded-lg border border-slate-100">
                        "{fu.note}"
                      </p>
                    )}
                  </CardContent>

                  {/* Actions Bar */}
                  <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/70 rounded-b-2xl flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleComplete(e, fu.id)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Done</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="success"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundManager.playTap();
                          onInitiateWhatsApp(lead);
                        }}
                        leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                      >
                        WhatsApp
                      </Button>

                      <Button
                        size="sm"
                        variant="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundManager.playTap();
                          onInitiateCall(lead);
                        }}
                        leftIcon={<Phone className="w-3.5 h-3.5" />}
                      >
                        Call
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
