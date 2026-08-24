import React, { useState } from 'react';
import { ChevronRight, ArrowLeftRight, Shield, Check, Trash2, Edit3, Target, Phone, Mail, UserCheck } from 'lucide-react';
import { Lead, AuthUser } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { BrandBadge } from '../common/BrandBadge';
import { api } from '../../lib/api';
import { soundManager } from '../../lib/sound';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface AdminTelecallerDetailModalProps {
  telecaller: AuthUser | null;
  allTelecallers: AuthUser[];
  leads: Lead[];
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: () => void;
  onTelecallerUpdated?: () => void;
}

export const AdminTelecallerDetailModal: React.FC<AdminTelecallerDetailModalProps> = ({
  telecaller,
  allTelecallers,
  leads,
  isOpen,
  onClose,
  onLeadUpdated,
  onTelecallerUpdated,
}) => {
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [editName, setEditName] = useState(telecaller?.name || '');
  const [editPhone, setEditPhone] = useState(telecaller?.phone || '');
  const [editEmail, setEditEmail] = useState(telecaller?.email || '');
  const [editPassword, setEditPassword] = useState('');
  const [editTarget, setEditTarget] = useState(telecaller?.dailyTarget || 50);
  const [editActive, setEditActive] = useState(telecaller?.isActive ?? true);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [reassignTargetTcId, setReassignTargetTcId] = useState<string>('');
  const [reassignSuccess, setReassignSuccess] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (telecaller) {
      setEditName(telecaller.name || '');
      setEditPhone(telecaller.phone || '');
      setEditEmail(telecaller.email || '');
      setEditTarget(telecaller.dailyTarget || 50);
      setEditActive(telecaller.isActive ?? true);
      setEditPassword('');
      setIsEditingAccount(false);
    }
  }, [telecaller]);

  if (!isOpen || !telecaller) return null;

  const tcLeads = leads.filter((l) => l.assignedTo === telecaller.id);
  const callsMade = tcLeads.filter((l) => (l.totalCallsCount && l.totalCallsCount > 0) || l.status !== 'NEW').length;
  const sales = tcLeads.filter((l) => l.status === 'SALE' || l.status === 'ENROLLED' || l.status === 'CLOSED').length;
  const interested = tcLeads.filter((l) => l.status === 'INTERESTED').length;
  const followUps = tcLeads.filter((l) => l.status === 'FOLLOW_UP').length;
  const demos = tcLeads.filter((l) => l.status === 'DEMO' || l.status === 'SITE_VISIT_SCHEDULED').length;

  const handleReassignLead = async (leadId: string) => {
    if (!reassignTargetTcId) return;
    try {
      await api.assignLeads(
        [leadId],
        reassignTargetTcId === 'UNASSIGNED' ? null : reassignTargetTcId
      );
      soundManager.playSuccess();
      setReassignSuccess(true);
      setTimeout(() => {
        setReassignSuccess(false);
        onLeadUpdated();
        setSelectedLead(null);
      }, 400);
    } catch (err: any) {
      soundManager.playError();
      alert(err.message || 'Failed to reassign lead');
    }
  };

  const handleSaveAccountChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateTelecaller(telecaller.id, {
        name: editName.trim() || telecaller.name,
        phone: editPhone.trim() || undefined,
        email: editEmail.trim() || undefined,
        password: editPassword.trim() || undefined,
        dailyTarget: Number(editTarget) || 50,
        isActive: editActive,
      });

      soundManager.playSuccess();
      setSaveSuccessMessage('Account details updated successfully!');
      if (onTelecallerUpdated) onTelecallerUpdated();

      setTimeout(() => {
        setSaveSuccessMessage('');
        setIsEditingAccount(false);
      }, 1500);
    } catch (err: any) {
      soundManager.playError();
      alert(err.message || 'Failed to update account details');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={telecaller.name}
      subtitle={`Login ID: ${telecaller.loginId} • Role: Telecaller`}
      icon={<UserCheck className="w-5 h-5 text-indigo-600" />}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Top Profile Summary Card */}
        <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black flex items-center justify-center text-base shadow-sm shrink-0">
              {telecaller.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">{telecaller.name}</h3>
                <BrandBadge brand={telecaller.brandAccess} size="xs" />
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {telecaller.email || `${telecaller.loginId.toLowerCase()}@apnicrm.com`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isEditingAccount ? 'ghost' : 'outline'}
              onClick={() => setIsEditingAccount(!isEditingAccount)}
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
            >
              {isEditingAccount ? 'Cancel Edit' : 'Edit Profile'}
            </Button>
          </div>
        </div>

        {/* Edit Form (if toggled) */}
        {isEditingAccount && (
          <form onSubmit={handleSaveAccountChanges} className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4 animate-in fade-in">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
              Edit Account Information
            </h4>

            {saveSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                {saveSuccessMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Reset Password (Optional)</label>
                <input
                  type="password"
                  placeholder="Leave empty to keep current password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Daily Call Target</label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={editTarget}
                  onChange={(e) => setEditTarget(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Account Active Status</label>
                <select
                  value={editActive ? 'true' : 'false'}
                  onChange={(e) => setEditActive(e.target.value === 'true')}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs cursor-pointer"
                >
                  <option value="true">Active (Can log in & receive leads)</option>
                  <option value="false">Disabled / Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="ghost" onClick={() => setIsEditingAccount(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="indigo" type="submit" isLoading={isSaving}>
                Save Changes
              </Button>
            </div>
          </form>
        )}

        {/* Productivity Metrics Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <p className="text-[11px] text-slate-500 font-semibold">Assigned Leads</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{tcLeads.length}</p>
          </div>
          <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-100">
            <p className="text-[11px] text-blue-700 font-semibold">Calls Logged</p>
            <p className="text-xl font-black text-blue-800 mt-0.5">{callsMade}</p>
          </div>
          <div className="bg-purple-50/70 p-3 rounded-2xl border border-purple-100">
            <p className="text-[11px] text-purple-700 font-semibold">Demos / Visits</p>
            <p className="text-xl font-black text-purple-800 mt-0.5">{demos}</p>
          </div>
          <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100">
            <p className="text-[11px] text-emerald-700 font-semibold">Won Deals</p>
            <p className="text-xl font-black text-emerald-800 mt-0.5">{sales}</p>
          </div>
        </div>

        {/* Assigned Leads Table & Reassignment Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-slate-900">
              Assigned Leads ({tcLeads.length})
            </h4>
            <span className="text-xs text-slate-500">Click a lead to reassign</span>
          </div>

          <div className="max-h-60 overflow-y-auto custom-scrollbar border border-slate-200 rounded-2xl divide-y divide-slate-100">
            {tcLeads.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No leads currently assigned to this telecaller.
              </div>
            ) : (
              tcLeads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`p-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                    selectedLead?.id === lead.id ? 'bg-blue-50/70' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs truncate">{lead.name}</span>
                      <BrandBadge brand={lead.brand} size="xs" />
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{lead.phone}</p>
                  </div>

                  <StatusBadge status={lead.status} size="xs" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Lead Reassignment Control Panel */}
        {selectedLead && (
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">
                Reassign Lead: <strong className="text-white">{selectedLead.name}</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <select
                value={reassignTargetTcId}
                onChange={(e) => setReassignTargetTcId(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-h-[38px]"
              >
                <option value="">Choose Target Telecaller...</option>
                <option value="UNASSIGNED">⚠️ Unassign Lead (Return to Pool)</option>
                {allTelecallers
                  .filter((t) => t.id !== telecaller.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.loginId} - {t.brandAccess})
                    </option>
                  ))}
              </select>

              <Button
                size="sm"
                variant="primary"
                disabled={!reassignTargetTcId}
                onClick={() => handleReassignLead(selectedLead.id)}
                leftIcon={<ArrowLeftRight className="w-3.5 h-3.5" />}
              >
                {reassignSuccess ? 'Reassigned!' : 'Confirm Reassign'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
