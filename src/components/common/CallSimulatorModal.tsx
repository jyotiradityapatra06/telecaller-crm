import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MessageSquare,
  ExternalLink,
  Check,
  Clock,
  Send,
  Copy,
  Calendar,
  Sparkles,
  AlertCircle,
  GraduationCap,
  Building2,
  User,
  History,
  CheckCircle2,
  FileText,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Lead, LeadStatus, AuthUser, BusinessBrand } from '../../types';
import { soundManager } from '../../lib/sound';
import { normalizePhoneNumberForWhatsApp, getWhatsAppUrl } from '../../lib/phoneUtils';
import { api } from '../../lib/api';
import { BrandBadge } from './BrandBadge';
import { StatusBadge } from './StatusBadge';
import { LeadHistoryTimeline } from './LeadHistoryTimeline';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface CallSimulatorModalProps {
  lead: Lead | null;
  currentUser?: AuthUser | null;
  isOpen: boolean;
  onClose: () => void;
  onCallSaved: (updatedLead?: Lead) => void;
  mode: 'call' | 'whatsapp';
}

const VIDYA_STATUS_OPTIONS: {
  status: LeadStatus;
  label: string;
  bg: string;
  activeBg: string;
  icon: string;
}[] = [
  { status: 'INTERESTED', label: 'Interested', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', activeBg: 'bg-emerald-600 text-white shadow-md', icon: '🟢' },
  { status: 'FOLLOW_UP', label: 'Follow-up Call', bg: 'bg-amber-50 text-amber-800 border-amber-200', activeBg: 'bg-amber-500 text-white shadow-md', icon: '🟠' },
  { status: 'DEMO', label: 'Demo Scheduled', bg: 'bg-purple-50 text-purple-800 border-purple-200', activeBg: 'bg-purple-600 text-white shadow-md', icon: '🎓' },
  { status: 'ENROLLED', label: 'Enrolled Won 🏆', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', activeBg: 'bg-emerald-700 text-white shadow-md', icon: '🏆' },
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
  { status: 'INTERESTED', label: 'Interested Buyer', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', activeBg: 'bg-emerald-600 text-white shadow-md', icon: '🟢' },
  { status: 'SITE_VISIT_SCHEDULED', label: 'Site Visit Scheduled', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200', activeBg: 'bg-indigo-600 text-white shadow-md', icon: '📍' },
  { status: 'NEGOTIATING', label: 'Negotiating', bg: 'bg-amber-100 text-amber-900 border-amber-300', activeBg: 'bg-amber-600 text-white shadow-md', icon: '🤝' },
  { status: 'CLOSED', label: 'Closed Deal 🏆', bg: 'bg-teal-100 text-teal-900 border-teal-300', activeBg: 'bg-teal-700 text-white shadow-md', icon: '🏆' },
  { status: 'FOLLOW_UP', label: 'Follow-up', bg: 'bg-amber-50 text-amber-800 border-amber-200', activeBg: 'bg-amber-500 text-white shadow-md', icon: '🟠' },
  { status: 'CALLBACK', label: 'Callback', bg: 'bg-sky-50 text-sky-800 border-sky-200', activeBg: 'bg-sky-600 text-white', icon: '📞' },
  { status: 'NO_ANSWER', label: 'No Answer', bg: 'bg-slate-100 text-slate-700 border-slate-200', activeBg: 'bg-slate-700 text-white', icon: '⚪' },
  { status: 'NOT_INTERESTED', label: 'Not Interested', bg: 'bg-rose-50 text-rose-800 border-rose-200', activeBg: 'bg-rose-600 text-white', icon: '🔴' },
];

export const CallSimulatorModal: React.FC<CallSimulatorModalProps> = ({
  lead,
  currentUser,
  isOpen,
  onClose,
  onCallSaved,
  mode,
}) => {
  // Call state: 'ringing' | 'connected' | 'ended'
  const [callState, setCallState] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);

  // Disposition & After-Call State
  const [selectedOutcome, setSelectedOutcome] = useState<LeadStatus>('INTERESTED');
  const [callNote, setCallNote] = useState('');
  const [enableFollowUp, setEnableFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('11:00 AM');
  const [isSavingCall, setIsSavingCall] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // WhatsApp State
  const [whatsAppText, setWhatsAppText] = useState('');
  const [copiedWA, setCopiedWA] = useState(false);
  const [isSendingWA, setIsSendingWA] = useState(false);

  // Lead History state loaded from lead or API
  const [leadHistoryList, setLeadHistoryList] = useState(lead?.history || []);

  useEffect(() => {
    if (!isOpen || !lead) {
      setCallState('ringing');
      setDuration(0);
      setIsMuted(false);
      setIsSpeaker(false);
      setCallNote('');
      setErrorMessage('');
      setEnableFollowUp(false);
      return;
    }

    // Default outcome to lead's current status or 'INTERESTED'
    setSelectedOutcome(lead.status === 'NEW' ? 'INTERESTED' : lead.status);
    setLeadHistoryList(lead.history || []);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setFollowUpDate(tomorrow.toISOString().split('T')[0]);

    if (mode === 'call') {
      setCallState('ringing');
      soundManager.playRing();
      // Smooth simulation: transition to connected after 1.8s
      const timer = setTimeout(() => {
        setCallState('connected');
        soundManager.playTap();
      }, 1800);
      return () => clearTimeout(timer);
    } else {
      // Build dynamic contextual WhatsApp message
      const callerName = currentUser?.name || 'Your Sales Advisor';
      const brandName = lead.brand === 'APNI_VIDYA' ? 'Apni Vidya' : 'Apni Estate';
      const requirement =
        lead.brand === 'APNI_VIDYA'
          ? lead.courseInterest || 'our upcoming certification batches'
          : lead.propertyType || 'our premium property projects';

      setWhatsAppText(
        `Hi ${lead.name}, this is ${callerName} from ${brandName}. I'm following up regarding your enquiry for ${requirement}. Would you be free for a brief 2-minute conversation today?`
      );
    }
  }, [isOpen, lead, mode, currentUser]);

  // Call stopwatch timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState === 'connected') {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  if (!isOpen || !lead) return null;

  const isVidya = lead.brand === 'APNI_VIDYA';
  const statusOptions = isVidya ? VIDYA_STATUS_OPTIONS : ESTATE_STATUS_OPTIONS;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    soundManager.playTap();
    setCallState('ended');
  };

  const handleNativeCall = () => {
    const cleanPhone = lead.phone.replace(/[^0-9+]/g, '');
    window.location.href = `tel:${cleanPhone}`;
  };

  const handleSaveCallActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    setIsSavingCall(true);
    setErrorMessage('');

    try {
      if (
        selectedOutcome === 'ENROLLED' ||
        selectedOutcome === 'CLOSED' ||
        selectedOutcome === 'SALE'
      ) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        soundManager.playSuccess();
      }

      const followUpPayload =
        enableFollowUp && followUpDate
          ? {
              dueDate: followUpDate,
              dueTime: followUpTime,
              note: callNote || `Follow-up after call outcome [${selectedOutcome}]`,
            }
          : undefined;

      const response = await api.recordCall({
        leadId: lead.id,
        status: selectedOutcome,
        durationSeconds: duration,
        callType: 'CALL',
        note: callNote.trim() || `Call completed (${formatDuration(duration)}). Outcome: ${selectedOutcome}`,
        followUp: followUpPayload,
      });

      soundManager.playSuccess();
      onCallSaved(response.lead);
      onClose();
    } catch (err: any) {
      soundManager.playError();
      setErrorMessage(err.message || 'Failed to save call activity. Please verify connection.');
    } finally {
      setIsSavingCall(false);
    }
  };

  const handleSendWhatsApp = async (openApp: boolean = true) => {
    if (!lead) return;
    setIsSendingWA(true);
    setErrorMessage('');

    try {
      const url = getWhatsAppUrl(lead.phone, whatsAppText);
      soundManager.playSuccess();

      if (openApp) {
        window.open(url, '_blank');
      }

      // Record WhatsApp activity to CRM API
      const response = await api.recordCall({
        leadId: lead.id,
        status: lead.status,
        durationSeconds: 0,
        callType: 'WHATSAPP',
        note: `WhatsApp message initiated: "${whatsAppText.substring(0, 80)}..."`,
      });

      onCallSaved(response.lead);
      onClose();
    } catch (err: any) {
      soundManager.playError();
      setErrorMessage(err.message || 'Failed to record WhatsApp activity');
    } finally {
      setIsSendingWA(false);
    }
  };

  const copyTemplate = () => {
    navigator.clipboard.writeText(whatsAppText);
    setCopiedWA(true);
    soundManager.playTap();
    setTimeout(() => setCopiedWA(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === 'call' ? (
          <span className="flex items-center gap-2">
            <span>Call Workspace</span>
            <BrandBadge brand={lead.brand} size="xs" />
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <span>WhatsApp Connect</span>
            <BrandBadge brand={lead.brand} size="xs" />
          </span>
        )
      }
      subtitle={
        mode === 'call'
          ? `Active Session with ${lead.name} (${lead.phone})`
          : `Direct WhatsApp message to ${lead.name}`
      }
      icon={
        mode === 'call' ? (
          <Phone className="w-5 h-5 text-blue-600" />
        ) : (
          <MessageSquare className="w-5 h-5 text-emerald-600" />
        )
      }
      maxWidth="4xl"
    >
      {mode === 'call' ? (
        <div className="space-y-6">
          {/* Desktop/Tablet 2-Column CRM Workspace (Stacked on Mobile) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (5 cols on lg): In-Call & Disposition Station */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-6">
              {/* Client Visual Header */}
              <div className="text-center space-y-3">
                <div className="relative inline-flex items-center justify-center">
                  {callState === 'ringing' && (
                    <span className="absolute w-24 h-24 rounded-full bg-blue-500/25 animate-ping pointer-events-none" />
                  )}
                  {callState === 'connected' && (
                    <span className="absolute w-24 h-24 rounded-full bg-emerald-500/25 animate-pulse pointer-events-none" />
                  )}
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 text-white font-black text-2xl flex items-center justify-center shadow-lg relative z-10 border-2 border-slate-700">
                    {lead.name.charAt(0)}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight truncate">
                    {lead.name}
                  </h3>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">{lead.phone}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {lead.city ? `${lead.city} • ` : ''}
                    {lead.brand === 'APNI_VIDYA' ? 'Apni Vidya EdTech' : 'Apni Estate Realty'}
                  </p>
                </div>

                {/* Call Status Indicator Pill */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-slate-950/80 border border-slate-800">
                  {callState === 'ringing' && (
                    <>
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                      <span className="text-blue-300">Dialing Client...</span>
                    </>
                  )}
                  {callState === 'connected' && (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-emerald-300 font-mono text-sm font-black tracking-wider">
                        {formatDuration(duration)}
                      </span>
                    </>
                  )}
                  {callState === 'ended' && (
                    <span className="text-slate-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Call Ended ({formatDuration(duration)})</span>
                    </span>
                  )}
                </div>
              </div>

              {/* In-Call Controls (Visible when active/connected) */}
              {callState !== 'ended' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playTap();
                        setIsMuted(!isMuted);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${
                        isMuted
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                      title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                      aria-label="Mute"
                    >
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playTap();
                        setIsSpeaker(!isSpeaker);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${
                        isSpeaker
                          ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                      title={isSpeaker ? 'Disable speaker' : 'Enable speaker'}
                      aria-label="Speaker"
                    >
                      {isSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>
                  </div>

                  <Button
                    variant="danger"
                    size="lg"
                    onClick={handleEndCall}
                    leftIcon={<PhoneOff className="w-5 h-5" />}
                    className="w-full shadow-lg min-h-[48px] text-sm sm:text-base font-extrabold"
                  >
                    End Call & Record Disposition
                  </Button>

                  <button
                    type="button"
                    onClick={handleNativeCall}
                    className="text-xs text-blue-400 hover:underline font-semibold block mx-auto pt-1 cursor-pointer"
                  >
                    Dial via Device Native App
                  </button>
                </div>
              ) : (
                /* Ended State banner */
                <div className="bg-emerald-950/50 border border-emerald-800/60 p-3.5 rounded-2xl text-center text-xs text-emerald-200">
                  <p className="font-bold">Call Completed Successfully ✓</p>
                  <p className="text-xs text-emerald-400/90 mt-0.5">
                    Select outcome on the right and save activity to update CRM pipeline.
                  </p>
                </div>
              )}
            </div>

            {/* Right Column (7 cols on lg): CRM Intelligence & After-Call Disposition */}
            <div className="lg:col-span-7 space-y-5">
              {/* Error Notification */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Lead Profile Specification Preview */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Lead CRM Context
                  </span>
                  <StatusBadge status={lead.status} size="xs" />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold block">
                      {lead.brand === 'APNI_VIDYA' ? 'Course Interest' : 'Property Interest'}
                    </span>
                    <span className="font-bold text-slate-900 text-sm truncate block">
                      {lead.brand === 'APNI_VIDYA'
                        ? lead.courseInterest || 'Course Inquiry'
                        : lead.propertyType || 'Property Inquiry'}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 font-semibold block">
                      {lead.brand === 'APNI_VIDYA' ? 'Qualification / Batch' : 'Budget / Location'}
                    </span>
                    <span className="font-semibold text-slate-700 truncate block">
                      {lead.brand === 'APNI_VIDYA'
                        ? lead.qualification || lead.preferredBatch || 'No batch specified'
                        : lead.budget || lead.preferredLocation || 'Budget open'}
                    </span>
                  </div>
                </div>

                {lead.activeFollowUp && (
                  <div className="p-2 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-900 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      Active Follow-up Reminder: <strong>{lead.activeFollowUp.dueDate}</strong> ({lead.activeFollowUp.dueTime || '11:00 AM'})
                    </span>
                  </div>
                )}
              </div>

              {/* After-Call Disposition Form */}
              <form onSubmit={handleSaveCallActivity} className="space-y-4">
                {/* 1. Call Outcome Selector */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                    1. Select Call Outcome
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {statusOptions.map((opt) => {
                      const isSelected = selectedOutcome === opt.status;
                      return (
                        <button
                          key={opt.status}
                          type="button"
                          onClick={() => {
                            soundManager.playTap();
                            setSelectedOutcome(opt.status);
                            if (opt.status === 'FOLLOW_UP' || opt.status === 'CALLBACK') {
                              setEnableFollowUp(true);
                            }
                          }}
                          className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[44px] ${
                            isSelected
                              ? opt.activeBg
                              : opt.bg + ' hover:opacity-90'
                          }`}
                        >
                          <span>{opt.icon}</span>
                          <span className="truncate">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Conversation Notes */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                    2. Conversation Notes
                  </label>
                  <textarea
                    rows={2}
                    value={callNote}
                    onChange={(e) => setCallNote(e.target.value)}
                    placeholder="Enter customer objections, budget feedback, or course requirements discussed..."
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 3. Follow-up Scheduler */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={enableFollowUp}
                        onChange={(e) => setEnableFollowUp(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>Schedule Next Follow-up Reminder</span>
                    </label>

                    {enableFollowUp && (
                      <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        Required
                      </span>
                    )}
                  </div>

                  {enableFollowUp && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-in fade-in">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">
                          Follow-up Date *
                        </label>
                        <input
                          type="date"
                          required={enableFollowUp}
                          value={followUpDate}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[38px]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">
                          Target Time
                        </label>
                        <select
                          value={followUpTime}
                          onChange={(e) => setFollowUpTime(e.target.value)}
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
                  )}
                </div>

                {/* Save & Submit Button */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    Duration: <strong className="text-slate-800">{formatDuration(duration)}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={onClose} type="button">
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      type="submit"
                      isLoading={isSavingCall}
                      leftIcon={<Check className="w-4 h-4" />}
                      className="min-h-[44px] px-5 font-bold shadow-md shadow-blue-600/20"
                    >
                      Save Call Activity
                    </Button>
                  </div>
                </div>
              </form>

              {/* Lead Recent History Timeline */}
              {leadHistoryList.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" /> Recent Lead Activity
                  </span>
                  <div className="max-h-36 overflow-y-auto custom-scrollbar">
                    <LeadHistoryTimeline history={leadHistoryList} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* WhatsApp Workflow Station */
        <div className="space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
            <p className="font-extrabold text-sm flex items-center gap-2 text-emerald-900">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>1-Tap WhatsApp Outreach</span>
            </p>
            <p className="text-emerald-800">
              Personalized template generated for <strong className="text-emerald-950">{lead.name}</strong> ({normalizePhoneNumberForWhatsApp(lead.phone)}).
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Personalized WhatsApp Message
            </label>
            <textarea
              rows={4}
              value={whatsAppText}
              onChange={(e) => setWhatsAppText(e.target.value)}
              className="w-full p-3.5 rounded-2xl border border-slate-300 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={copyTemplate}
              leftIcon={copiedWA ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            >
              {copiedWA ? 'Copied to Clipboard!' : 'Copy Text'}
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="md" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="success"
                size="md"
                onClick={() => handleSendWhatsApp(true)}
                isLoading={isSendingWA}
                leftIcon={<Send className="w-4 h-4" />}
                className="font-bold min-h-[44px]"
              >
                Send via WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
