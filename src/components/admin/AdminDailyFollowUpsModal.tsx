import React, { useState } from 'react';
import { Calendar, ChevronRight, User, Clock, AlertCircle, Phone } from 'lucide-react';
import { Lead, AuthUser } from '../../types';
import { soundManager } from '../../lib/sound';
import { BrandBadge } from '../common/BrandBadge';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../ui/Modal';

interface AdminDailyFollowUpsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  telecallers: AuthUser[];
  onSelectLeadForDetail: (lead: Lead) => void;
  onLeadsUpdated: () => void;
}

export const AdminDailyFollowUpsModal: React.FC<AdminDailyFollowUpsModalProps> = ({
  isOpen,
  onClose,
  leads,
  telecallers,
  onSelectLeadForDetail,
}) => {
  const [filterTcId, setFilterTcId] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'today' | 'overdue' | 'upcoming'>('ALL');

  const todayStr = new Date().toISOString().split('T')[0];

  const followUpLeads = leads.filter((l) => {
    if (!l.activeFollowUp) return false;
    const isToday = l.activeFollowUp.dueDate === todayStr;
    const isOverdue = l.activeFollowUp.dueDate < todayStr;
    const isUpcoming = l.activeFollowUp.dueDate > todayStr;

    const cat = isOverdue ? 'overdue' : isToday ? 'today' : 'upcoming';

    if (filterTcId !== 'ALL' && l.assignedTo !== filterTcId) return false;
    if (filterCategory !== 'ALL' && cat !== filterCategory) return false;

    return true;
  });

  // Summary counts
  const overdueCount = leads.filter((l) => l.activeFollowUp && l.activeFollowUp.dueDate < todayStr).length;
  const todayCount = leads.filter((l) => l.activeFollowUp && l.activeFollowUp.dueDate === todayStr).length;
  const upcomingCount = leads.filter((l) => l.activeFollowUp && l.activeFollowUp.dueDate > todayStr).length;

  const getTelecallerName = (tcId?: string) => {
    if (!tcId) return 'Unassigned';
    const found = telecallers.find((t) => t.id === tcId);
    return found ? found.name : 'Unknown';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Organization Follow-up Monitor"
      subtitle="Tracking daily scheduled calls and overdue customer touchpoints across all telecallers"
      icon={<Calendar className="w-5 h-5 text-amber-600" />}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Quick Filter Pills */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              soundManager.playTap();
              setFilterCategory('today');
            }}
            className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
              filterCategory === 'today'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Today Due ({todayCount})
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playTap();
              setFilterCategory('overdue');
            }}
            className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
              filterCategory === 'overdue'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Overdue ({overdueCount})
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playTap();
              setFilterCategory('ALL');
            }}
            className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
              filterCategory === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Scheduled ({overdueCount + todayCount + upcomingCount})
          </button>
        </div>

        {/* Telecaller Filter Dropdown */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Filter by Assigned Telecaller
          </label>
          <select
            value={filterTcId}
            onChange={(e) => setFilterTcId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-h-[38px]"
          >
            <option value="ALL">All Telecallers</option>
            {telecallers.map((tc) => (
              <option key={tc.id} value={tc.id}>
                {tc.name} ({tc.loginId})
              </option>
            ))}
          </select>
        </div>

        {/* Follow-up List */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar pt-2">
          {followUpLeads.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <Clock className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-600">No follow-ups match selected filter.</p>
            </div>
          ) : (
            followUpLeads.map((lead) => {
              const fu = lead.activeFollowUp!;
              const isToday = fu.dueDate === todayStr;
              const isOverdue = fu.dueDate < todayStr;

              return (
                <div
                  key={lead.id}
                  onClick={() => {
                    soundManager.playTap();
                    onSelectLeadForDetail(lead);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    isOverdue
                      ? 'bg-rose-50/50 border-rose-200 hover:bg-rose-50'
                      : isToday
                      ? 'bg-amber-50/50 border-amber-200 hover:bg-amber-50'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{lead.name}</h4>
                      <BrandBadge brand={lead.brand} size="xs" />
                      {isOverdue && (
                        <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                          Overdue
                        </span>
                      )}
                      {isToday && (
                        <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          Today
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span className="font-mono">{lead.phone}</span>
                      <span>•</span>
                      <span>Assigned to: <strong className="text-slate-700">{getTelecallerName(lead.assignedTo)}</strong></span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700">Scheduled: {fu.dueDate} {fu.dueTime || ''}</span>
                    </div>

                    {fu.note && (
                      <p className="text-xs text-slate-600 bg-white/70 p-2 rounded-lg border border-slate-100 italic">
                        "{fu.note}"
                      </p>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
