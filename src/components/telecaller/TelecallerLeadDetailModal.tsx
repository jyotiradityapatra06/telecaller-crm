import React, { useState } from 'react';
import {
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Tag,
  Check,
  GraduationCap,
  Building2,
  Edit3,
  Sparkles,
  Send,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Lead, LeadStatus, AuthUser, BusinessBrand } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { BrandBadge } from '../common/BrandBadge';
import { LeadHistoryTimeline } from '../common/LeadHistoryTimeline';
import { api } from '../../lib/api';
import { soundManager } from '../../lib/sound';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface TelecallerLeadDetailModalProps {
  lead: Lead | null;
  currentUser?: AuthUser | null;
  currentTelecaller?: AuthUser | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: () => void;
  onInitiateCall: (lead: Lead) => void;
  onInitiateWhatsApp: (lead: Lead) => void;
}

const VIDYA_STATUS_OPTIONS: {
  status: LeadStatus;
  label: string;
  bg: string;
  activeBg: string;
  icon: string;
}[] = [
  { status: 'INTERESTED', label: 'Interested', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', activeBg: 'bg-emerald-600 text-white', icon: '🟢' },
  { status: 'FOLLOW_UP', label: 'Follow-up Call', bg: 'bg-amber-50 text-amber-800 border-amber-200', activeBg: 'bg-amber-500 text-white', icon: '🟠' },
  { status: 'DEMO', label: 'Demo Scheduled', bg: 'bg-purple-50 text-purple-800 border-purple-200', activeBg: 'bg-purple-600 text-white', icon: '🎓' },
  { status: 'ENROLLED', label: 'Enrolled Won 🏆', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', activeBg: 'bg-emerald-700 text-white', icon: '🏆' },
  { status: 'CALLBACK', label: 'Callback', bg: 'bg-sky-50 text-sky-800 border-sky-200', activeBg: 'bg-sky-600 text-white', icon: '📞' },
  { status: 'NO_ANSWER', label: 'No Answer', bg: 'bg-slate-100 text-slate-700 border-slate-200', activeBg: 'bg-slate-700 text-white', icon: '⚪' },
  { status: 'BUSY', label: 'Busy / In Class', bg: 'bg-orange-50 text-orange-800 border-orange-200', activeBg: 'bg-orange-600 text-white', icon: '🟡' },
  { status: 'NOT_INTERESTED', label: 'Not Interested', bg: 'bg-rose-50 text-rose-800 border-rose-200', activeBg: 'bg-rose-600 text-white', icon: '🔴' },
];

const ESTATE_STATUS_OPTIONS: {
  status: LeadStatus;
  label: string;
  bg: string;
  activeBg: string;
  icon: string;
}[] = [
  { status: 'INTERESTED', label: 'Interested Buyer', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', activeBg: 'bg-emerald-600 text-white', icon: '🟢' },
  { status: 'SITE_VISIT_SCHEDULED', label: 'Site Visit Scheduled', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200', activeBg: 'bg-indigo-600 text-white', icon: '📍' },
  { status: 'NEGOTIATING', label: 'Negotiating', bg: 'bg-amber-100 text-amber-900 border-amber-300', activeBg: 'bg-amber-600 text-white', icon: '🤝' },
  { status: 'CLOSED', label: 'Closed Deal 🏆', bg: 'bg-teal-100 text-teal-900 border-teal-300', activeBg: 'bg-teal-700 text-white', icon: '🏆' },
  { status: 'FOLLOW_UP', label: 'Follow-up', bg: 'bg-amber-50 text-amber-800 border-amber-200', activeBg: 'bg-amber-500 text-white', icon: '🟠' },
  { status: 'CALLBACK', label: 'Callback', bg: 'bg-sky-50 text-sky-800 border-sky-200', activeBg: 'bg-sky-600 text-white', icon: '📞' },
  { status: 'NO_ANSWER', label: 'No Answer', bg: 'bg-slate-100 text-slate-700 border-slate-200', activeBg: 'bg-slate-700 text-white', icon: '⚪' },
  { status: 'NOT_INTERESTED', label: 'Not Interested', bg: 'bg-rose-50 text-rose-800 border-rose-200', activeBg: 'bg-rose-600 text-white', icon: '🔴' },
];

export const TelecallerLeadDetailModal: React.FC<TelecallerLeadDetailModalProps> = ({
  lead,
  currentUser: _currentUser,
  currentTelecaller: _currentTelecaller,
  isOpen,
  onClose,
  onLeadUpdated,
  onInitiateCall,
  onInitiateWhatsApp,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | null>(null);
  const [noteText, setNoteText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('11:00 AM');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState(false);

  React.useEffect(() => {
    if (lead) {
      setSelectedStatus(lead.status);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDueDate(tomorrow.toISOString().split('T')[0]);
      setNoteText('');
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const isVidya = lead.brand === 'APNI_VIDYA';
  const statusOptions = isVidya ? VIDYA_STATUS_OPTIONS : ESTATE_STATUS_OPTIONS;

  const handleUpdateStatus = async (status: LeadStatus) => {
    soundManager.playTap();
    setSelectedStatus(status);
    setIsUpdating(true);

    try {
      if (status === 'ENROLLED' || status === 'CLOSED' || status === 'SALE') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        soundManager.playSuccess();
      }

      await api.recordCall({
        leadId: lead.id,
        status,
        note: `Outcome updated to ${status}`,
      });
      setStatusSuccess(true);
      setTimeout(() => setStatusSuccess(false), 2000);
      onLeadUpdated();
    } catch (err: any) {
      soundManager.playError();
      alert(err.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleScheduleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueDate) {
      alert('Please choose a follow up date.');
      return;
    }

    try {
      await api.scheduleFollowUp({
        leadId: lead.id,
        dueDate,
        dueTime,
        note: noteText || undefined,
      });
      soundManager.playSuccess();
      alert(`Follow-up scheduled for ${dueDate} at ${dueTime}`);
      setNoteText('');
      onLeadUpdated();
    } catch (err: any) {
      soundManager.playError();
      alert(err.message || 'Failed to schedule follow-up');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setIsAddingNote(true);

    try {
      await api.recordCall({
        leadId: lead.id,
        status: lead.status,
        note: noteText.trim(),
      });
      soundManager.playSuccess();
      setNoteText('');
      onLeadUpdated();
    } catch (err: any) {
      soundManager.playError();
      alert(err.message || 'Failed to add note');
    } finally {
      setIsAddingNote(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lead.name}
      subtitle={`Phone: ${lead.phone} • ${lead.city || 'City not specified'}`}
      icon={
        lead.brand === 'APNI_VIDYA' ? (
          <GraduationCap className="w-5 h-5 text-indigo-600" />
        ) : (
          <Building2 className="w-5 h-5 text-emerald-600" />
        )
      }
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Quick Action Dial Buttons */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black flex items-center justify-center text-lg shrink-0">
              {lead.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-white text-base sm:text-lg">{lead.name}</h3>
                <BrandBadge brand={lead.brand} size="xs" />
                <StatusBadge status={lead.status} size="xs" />
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{lead.phone}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="md"
              variant="success"
              onClick={() => onInitiateWhatsApp(lead)}
              leftIcon={<MessageSquare className="w-4 h-4" />}
              className="flex-1 sm:flex-initial min-h-[44px]"
            >
              WhatsApp
            </Button>

            <Button
              size="md"
              variant="primary"
              onClick={() => onInitiateCall(lead)}
              leftIcon={<Phone className="w-4 h-4" />}
              className="flex-1 sm:flex-initial min-h-[44px]"
            >
              Call Dialer
            </Button>
          </div>
        </div>

        {/* Lead Profile Specification Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {lead.brand === 'APNI_VIDYA' ? (
            <>
              <div className="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-100 text-xs space-y-1">
                <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">
                  Course Interest
                </span>
                <p className="font-extrabold text-slate-900 text-sm">
                  {lead.courseInterest || 'Full Stack Web Development'}
                </p>
                <p className="text-slate-500">Batch: {lead.preferredBatch || 'Weekday Morning'}</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Background
                </span>
                <p className="font-semibold text-slate-900">
                  {lead.qualification || 'Graduate'}
                </p>
                <p className="text-slate-500">Source: {lead.source || 'Direct Website'}</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100 text-xs space-y-1">
                <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                  Property Configuration
                </span>
                <p className="font-extrabold text-slate-900 text-sm">
                  {lead.propertyType || '3 BHK Luxury Apartment'}
                </p>
                <p className="text-emerald-800 font-bold">Budget: {lead.budget || '₹1.5 Cr - ₹2.5 Cr'}</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Preferred Location
                </span>
                <p className="font-semibold text-slate-900">
                  {lead.preferredLocation || lead.city || 'Prime Micro-Market'}
                </p>
                <p className="text-slate-500">Source: {lead.source || 'Direct Inquiry'}</p>
              </div>
            </>
          )}
        </div>

        {/* 1-Tap Outcome Disposition Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              1-Tap Call Outcome Classification
            </h4>
            {statusSuccess && (
              <span className="text-xs font-bold text-emerald-600 animate-in fade-in">
                ✓ Updated!
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {statusOptions.map((opt) => {
              const isSelected = selectedStatus === opt.status;
              return (
                <button
                  key={opt.status}
                  type="button"
                  onClick={() => handleUpdateStatus(opt.status)}
                  className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[44px] ${
                    isSelected ? opt.activeBg + ' shadow-sm' : opt.bg + ' hover:opacity-90'
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Follow-up Scheduler */}
        <form onSubmit={handleScheduleFollowUp} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Schedule Next Follow-up
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Follow-up Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[38px]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Target Time</label>
              <select
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[38px] cursor-pointer"
              >
                <option value="09:30 AM">09:30 AM (Morning)</option>
                <option value="11:00 AM">11:00 AM (Mid-Morning)</option>
                <option value="02:30 PM">02:30 PM (Afternoon)</option>
                <option value="04:30 PM">04:30 PM (Tea Time)</option>
                <option value="06:30 PM">06:30 PM (Evening)</option>
                <option value="08:00 PM">08:00 PM (Post-Work)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button size="sm" variant="outline" type="submit">
              Set Follow-up Reminder
            </Button>
          </div>
        </form>

        {/* Add Note & Interaction History Timeline */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Call Notes & History Timeline
          </h4>

          <form onSubmit={handleAddNote} className="flex gap-2">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add call conversation notes or client requirements..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[42px]"
            />
            <Button size="sm" variant="indigo" type="submit" isLoading={isAddingNote}>
              Add Note
            </Button>
          </form>

          <div className="pt-2">
            <LeadHistoryTimeline history={lead.history || []} />
          </div>
        </div>
      </div>
    </Modal>
  );
};
