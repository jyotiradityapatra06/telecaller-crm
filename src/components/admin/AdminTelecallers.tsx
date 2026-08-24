import React, { useState } from 'react';
import {
  UserPlus,
  ChevronRight,
  KeyRound,
  GraduationCap,
  Building2,
  Layers,
  Filter,
  Check,
  Shield,
  Phone,
  Mail,
  Target,
  CheckCircle2,
  Plus,
  Lock,
} from 'lucide-react';
import { Lead, AuthUser, BrandAccess, BusinessBrand } from '../../types';
import { api } from '../../lib/api';
import { soundManager } from '../../lib/sound';
import { BrandBadge } from '../common/BrandBadge';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Modal } from '../ui/Modal';

interface AdminTelecallersProps {
  telecallers: AuthUser[];
  leads: Lead[];
  onTelecallersUpdated: () => void;
  onSelectTelecaller: (tc: AuthUser) => void;
}

export const AdminTelecallers: React.FC<AdminTelecallersProps> = ({
  telecallers,
  leads,
  onTelecallersUpdated,
  onSelectTelecaller,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [brandFilter, setBrandFilter] = useState<'ALL' | BusinessBrand>('ALL');

  // Form State
  const [newName, setNewName] = useState('');
  const [newLoginId, setNewLoginId] = useState(`TC_VIDYA_${telecallers.length + 1}`);
  const [newBrandAccess, setNewBrandAccess] = useState<BrandAccess>('APNI_VIDYA');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('password123');
  const [newTarget, setNewTarget] = useState(50);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick reset password state
  const [resetModalTc, setResetModalTc] = useState<AuthUser | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('welcome123');

  const filteredTelecallers = telecallers.filter((tc) => {
    if (brandFilter === 'ALL') return true;
    return tc.brandAccess === brandFilter || tc.brandAccess === 'BOTH';
  });

  const handleToggleStatus = async (e: React.MouseEvent, tc: AuthUser) => {
    e.stopPropagation();
    soundManager.playTap();
    try {
      await api.updateTelecaller(tc.id, { isActive: !tc.isActive });
      onTelecallersUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to update telecaller status');
    }
  };

  const handleCreateTelecaller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newLoginId.trim() || !newPassword.trim()) {
      setFormError('Please enter full name, login ID, and password');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      await api.createTelecaller({
        name: newName.trim(),
        loginId: newLoginId.trim().toUpperCase(),
        brandAccess: newBrandAccess,
        phone: newPhone.trim() || undefined,
        email: newEmail.trim() || `${newLoginId.toLowerCase()}@apnicrm.com`,
        password: newPassword,
        dailyTarget: Number(newTarget) || 50,
      });

      soundManager.playSuccess();
      onTelecallersUpdated();
      setShowCreateModal(false);
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setFormError('');
    } catch (err: any) {
      soundManager.playError();
      setFormError(err.message || 'Failed to create telecaller account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalTc) return;
    try {
      await api.updateTelecaller(resetModalTc.id, { password: resetPasswordVal });
      soundManager.playSuccess();
      alert(`Password for ${resetModalTc.name} updated to "${resetPasswordVal}"`);
      setResetModalTc(null);
    } catch (err: any) {
      alert(err.message || 'Failed to reset password');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Role-Based Access Control</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Telecaller Team Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure caller profiles, daily call targets, brand permissions, and passwords.
          </p>
        </div>

        <Button
          variant="indigo"
          size="sm"
          onClick={() => {
            soundManager.playTap();
            const prefix =
              newBrandAccess === 'APNI_VIDYA'
                ? 'TC_VIDYA'
                : newBrandAccess === 'APNI_ESTATE'
                ? 'TC_ESTATE'
                : 'TC_DUAL';
            setNewLoginId(`${prefix}_${telecallers.length + 1}`);
            setShowCreateModal(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add New Telecaller
        </Button>
      </div>

      {/* Brand Filter Pills */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80 w-fit">
        <button
          type="button"
          onClick={() => setBrandFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            brandFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Callers ({telecallers.length})
        </button>
        <button
          type="button"
          onClick={() => setBrandFilter('APNI_VIDYA')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            brandFilter === 'APNI_VIDYA' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-600'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Apni Vidya</span>
        </button>
        <button
          type="button"
          onClick={() => setBrandFilter('APNI_ESTATE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            brandFilter === 'APNI_ESTATE' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-600'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Apni Estate</span>
        </button>
      </div>

      {/* Telecallers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredTelecallers.map((tc) => {
          const tcLeads = leads.filter((l) => l.assignedTo === tc.id);
          const callsMade = tcLeads.filter(
            (l) => (l.totalCallsCount && l.totalCallsCount > 0) || l.status !== 'NEW'
          ).length;
          const target = tc.dailyTarget || 50;
          const progress = target > 0 ? Math.min(100, Math.round((callsMade / target) * 100)) : 0;
          const wonDeals = tcLeads.filter(
            (l) => l.status === 'ENROLLED' || l.status === 'CLOSED' || l.status === 'SALE'
          ).length;

          return (
            <Card
              key={tc.id}
              onClick={() => {
                soundManager.playTap();
                onSelectTelecaller(tc);
              }}
              className="hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <CardHeader className="bg-slate-50/70">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                      {tc.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-slate-900 text-sm truncate">{tc.name}</h3>
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            tc.isActive ? 'bg-emerald-500' : 'bg-rose-400'
                          }`}
                        />
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{tc.loginId}</p>
                    </div>
                  </div>

                  <BrandBadge brand={tc.brandAccess} size="xs" />
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Progress Ring / Bar */}
                  <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-500">Daily Calls Target</span>
                      <span className="text-slate-900 font-bold">
                        {callsMade} / {target} ({progress}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          progress >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Stat Counters */}
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <p className="text-slate-500 text-[11px]">Assigned Leads</p>
                      <p className="text-base font-extrabold text-slate-900 mt-0.5">{tcLeads.length}</p>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                      <p className="text-emerald-700 text-[11px] font-semibold">Won Conversions</p>
                      <p className="text-base font-extrabold text-emerald-800 mt-0.5">{wonDeals}</p>
                    </div>
                  </div>
                </CardContent>
              </div>

              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundManager.playTap();
                    setResetModalTc(tc);
                  }}
                  className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Reset Key</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleToggleStatus(e, tc)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition-all cursor-pointer ${
                    tc.isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {tc.isActive ? 'Active' : 'Disabled'}
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Create Telecaller Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Telecaller Account"
        subtitle="Provision caller credentials and brand assignments"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTelecaller} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {formError}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Brand Queue Access</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  setNewBrandAccess('APNI_VIDYA');
                  setNewLoginId(`TC_VIDYA_${telecallers.length + 1}`);
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  newBrandAccess === 'APNI_VIDYA'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Apni Vidya</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  setNewBrandAccess('APNI_ESTATE');
                  setNewLoginId(`TC_ESTATE_${telecallers.length + 1}`);
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  newBrandAccess === 'APNI_ESTATE'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Apni Estate</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  setNewBrandAccess('BOTH');
                  setNewLoginId(`TC_DUAL_${telecallers.length + 1}`);
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  newBrandAccess === 'BOTH'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Dual (Both)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Vikas Gupta"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[42px]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Login ID / Username *</label>
              <input
                type="text"
                required
                value={newLoginId}
                onChange={(e) => setNewLoginId(e.target.value.toUpperCase())}
                placeholder="TC_VIDYA_3"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[42px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Temporary Password *</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[42px]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Daily Call Target</label>
              <input
                type="number"
                min="10"
                max="200"
                value={newTarget}
                onChange={(e) => setNewTarget(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[42px]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="indigo" type="submit" isLoading={isSubmitting}>
              Create Telecaller
            </Button>
          </div>
        </form>
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        isOpen={Boolean(resetModalTc)}
        onClose={() => setResetModalTc(null)}
        title={`Reset Password for ${resetModalTc?.name}`}
        subtitle={`Login ID: ${resetModalTc?.loginId}`}
        maxWidth="md"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">New Password</label>
            <input
              type="text"
              required
              value={resetPasswordVal}
              onChange={(e) => setResetPasswordVal(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[42px]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setResetModalTc(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
