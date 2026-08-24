import React, { useState } from 'react';
import {
  UserPlus,
  KeyRound,
  GraduationCap,
  Building2,
  Layers,
  Check,
  Shield,
  Phone,
  Mail,
  Target,
  CheckCircle2,
  Plus,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  Edit,
  Info,
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

interface CreatedCredentialInfo {
  name: string;
  loginId: string;
  temporaryPassword: string;
  brandAccess: BrandAccess;
  email?: string;
  title?: string;
}

export const AdminTelecallers: React.FC<AdminTelecallersProps> = ({
  telecallers,
  leads,
  onTelecallersUpdated,
  onSelectTelecaller,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [brandFilter, setBrandFilter] = useState<'ALL' | BusinessBrand>('ALL');

  // Create Form State
  const [newName, setNewName] = useState('');
  const [newBrandAccess, setNewBrandAccess] = useState<BrandAccess>('APNI_VIDYA');
  const [newLoginId, setNewLoginId] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [newTarget, setNewTarget] = useState(50);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View Details Modal State
  const [viewModalTc, setViewModalTc] = useState<AuthUser | null>(null);

  // Edit Modal State
  const [editModalTc, setEditModalTc] = useState<AuthUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBrandAccess, setEditBrandAccess] = useState<BrandAccess>('APNI_VIDYA');
  const [editTarget, setEditTarget] = useState(50);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Reset Password Confirmation & One-Time Display States
  const [resetConfirmTc, setResetConfirmTc] = useState<AuthUser | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<CreatedCredentialInfo | null>(null);
  const [hasCopiedCredentials, setHasCopiedCredentials] = useState(false);
  const [hasCopiedPassword, setHasCopiedPassword] = useState(false);
  const [copiedLoginId, setCopiedLoginId] = useState<string | null>(null);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const num = Math.floor(1000 + Math.random() * 9000);
    return `Pass-${code}-${num}`;
  };

  const getSuggestedLoginId = (brand: BrandAccess) => {
    const prefix =
      brand === 'APNI_VIDYA'
        ? 'TC_VIDYA'
        : brand === 'APNI_ESTATE'
        ? 'TC_ESTATE'
        : 'TC_DUAL';

    let maxNum = 0;
    const regex = new RegExp(`^${prefix}_(\\d+)$`, 'i');
    for (const tc of telecallers) {
      const m = tc.loginId.match(regex);
      if (m && m[1]) {
        const n = parseInt(m[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    const nextNum = maxNum + 1;
    return `${prefix}_${nextNum < 10 ? '0' + nextNum : nextNum}`;
  };

  const openCreateModal = (brand: BrandAccess = 'APNI_VIDYA') => {
    soundManager.playTap();
    setNewBrandAccess(brand);
    setNewLoginId(getSuggestedLoginId(brand));
    setNewPassword(generateRandomPassword());
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewTarget(50);
    setFormError('');
    setShowCreateModal(true);
  };

  const openEditModal = (e: React.MouseEvent, tc: AuthUser) => {
    e.stopPropagation();
    soundManager.playTap();
    setEditModalTc(tc);
    setEditName(tc.name);
    setEditPhone(tc.phone || '');
    setEditEmail(tc.email || '');
    setEditBrandAccess(tc.brandAccess);
    setEditTarget(tc.dailyTarget || 50);
    setEditIsActive(tc.isActive);
  };

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
    if (!newName.trim()) {
      setFormError('Please enter the telecaller full name');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      const res = await api.createTelecaller({
        name: newName.trim(),
        loginId: newLoginId.trim() ? newLoginId.trim().toUpperCase() : undefined,
        brandAccess: newBrandAccess,
        phone: newPhone.trim() || undefined,
        email: newEmail.trim() || undefined,
        password: newPassword.trim() || undefined,
        dailyTarget: Number(newTarget) || 50,
      });

      soundManager.playSuccess();
      onTelecallersUpdated();
      setShowCreateModal(false);

      if (res.credentials) {
        setCreatedCredentials({
          title: 'Telecaller Created Successfully',
          name: res.credentials.name,
          loginId: res.credentials.loginId,
          temporaryPassword: res.credentials.temporaryPassword,
          brandAccess: res.credentials.brandAccess,
          email: newEmail.trim() || undefined,
        });
      } else {
        setCreatedCredentials({
          title: 'Telecaller Created Successfully',
          name: res.telecaller.name,
          loginId: res.telecaller.loginId,
          temporaryPassword: newPassword || 'Pass-Secure-123',
          brandAccess: res.telecaller.brandAccess,
          email: newEmail.trim() || undefined,
        });
      }
      setHasCopiedCredentials(false);
      setHasCopiedPassword(false);
    } catch (err: any) {
      soundManager.playError();
      setFormError(err.message || 'Failed to provision telecaller account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalTc) return;

    setEditSubmitting(true);
    try {
      await api.updateTelecaller(editModalTc.id, {
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
        email: editEmail.trim() || undefined,
        brandAccess: editBrandAccess,
        dailyTarget: Number(editTarget) || 50,
        isActive: editIsActive,
      });

      soundManager.playSuccess();
      onTelecallersUpdated();
      setEditModalTc(null);
    } catch (err: any) {
      soundManager.playError();
      alert(err.message || 'Failed to update telecaller details');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleResetPasswordConfirmed = async () => {
    if (!resetConfirmTc) return;
    setIsResetting(true);
    try {
      const res = await api.resetTelecallerPassword(resetConfirmTc.id);
      soundManager.playSuccess();
      onTelecallersUpdated();
      const targetTc = resetConfirmTc;
      setResetConfirmTc(null);

      setCreatedCredentials({
        title: 'Password Reset Successful',
        name: targetTc.name,
        loginId: targetTc.loginId,
        temporaryPassword: res.temporaryPassword,
        brandAccess: targetTc.brandAccess,
        email: targetTc.email,
      });
      setHasCopiedCredentials(false);
      setHasCopiedPassword(false);
    } catch (err: any) {
      soundManager.playError();
      alert(err.message || 'Failed to reset telecaller password');
    } finally {
      setIsResetting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    soundManager.playSuccess();
    const text = `Name: ${createdCredentials.name}\nLogin ID: ${createdCredentials.loginId}\nEmail: ${createdCredentials.email || 'N/A'}\nPassword: ${createdCredentials.temporaryPassword}\nBrand: ${createdCredentials.brandAccess}\nPortal: ${window.location.origin}`;

    navigator.clipboard.writeText(text);
    setHasCopiedCredentials(true);
    setTimeout(() => setHasCopiedCredentials(false), 3000);
  };

  const handleCopyPassword = () => {
    if (!createdCredentials) return;
    soundManager.playSuccess();
    navigator.clipboard.writeText(createdCredentials.temporaryPassword);
    setHasCopiedPassword(true);
    setTimeout(() => setHasCopiedPassword(false), 3000);
  };

  const handleCopyLoginId = (e: React.MouseEvent, loginId: string) => {
    e.stopPropagation();
    soundManager.playSuccess();
    navigator.clipboard.writeText(loginId);
    setCopiedLoginId(loginId);
    setTimeout(() => setCopiedLoginId(null), 2500);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Role-Based Access & Credential Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Telecaller Credentials & Team Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage caller credentials, reset passwords, update brand permissions, and monitor performance.
          </p>
        </div>

        <Button
          variant="indigo"
          size="sm"
          id="btn-admin-add-telecaller"
          onClick={() => openCreateModal('APNI_VIDYA')}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Provision Telecaller
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
            brandFilter === 'APNI_VIDYA'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Apni Vidya</span>
        </button>
        <button
          type="button"
          onClick={() => setBrandFilter('APNI_ESTATE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            brandFilter === 'APNI_ESTATE'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Apni Estate</span>
        </button>
      </div>

      {/* Empty State */}
      {filteredTelecallers.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No Telecallers Provisioned</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-4">
            You haven't provisioned any telecaller accounts for this organization yet. Click below to generate credentials for your first caller.
          </p>
          <Button variant="indigo" size="sm" onClick={() => openCreateModal('APNI_VIDYA')}>
            Provision First Telecaller
          </Button>
        </div>
      )}

      {/* Telecallers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTelecallers.map((tc) => {
          const tcLeads = leads.filter((l) => l.assignedTo === tc.id || l.assignedTo === tc.loginId);
          const completedCalls = tcLeads.filter(
            (l) => (l.totalCallsCount && l.totalCallsCount > 0) || l.status !== 'NEW'
          ).length;
          const targetProgress = Math.min(100, Math.round((completedCalls / (tc.dailyTarget || 50)) * 100));

          return (
            <Card
              key={tc.id}
              className="hover:border-indigo-200 transition-all hover:shadow-md cursor-pointer group flex flex-col justify-between"
              onClick={() => onSelectTelecaller(tc)}
            >
              <div>
                <CardHeader className="pb-3 border-b border-slate-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs shrink-0 ${
                          tc.brandAccess === 'APNI_VIDYA'
                            ? 'bg-indigo-600'
                            : tc.brandAccess === 'APNI_ESTATE'
                            ? 'bg-emerald-600'
                            : 'bg-purple-600'
                        }`}
                      >
                        {tc.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                          {tc.name}
                          {!tc.isActive && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                              Inactive
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-mono text-slate-600 font-semibold bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                            {tc.loginId}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyLoginId(e, tc.loginId)}
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 transition-colors p-0.5 rounded cursor-pointer"
                            title="Copy Login ID"
                          >
                            {copiedLoginId === tc.loginId ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <BrandBadge brand={tc.brandAccess} />
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-3.5">
                  {/* Contact Info */}
                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{tc.email || 'No email registered'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{tc.phone || 'No phone registered'}</span>
                    </div>
                  </div>

                  {/* Target Progress */}
                  <div>
                    <div className="flex justify-between text-xs mb-1 font-semibold">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-indigo-500" /> Daily Target
                      </span>
                      <span className="text-slate-900">
                        {completedCalls} / {tc.dailyTarget || 50} calls ({targetProgress}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          targetProgress >= 100
                            ? 'bg-emerald-500'
                            : targetProgress >= 50
                            ? 'bg-indigo-600'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${targetProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 font-medium">
                    <div className="text-slate-500">
                      <span>Assigned Leads:</span>
                      <span className="font-bold text-slate-800 ml-1">{tcLeads.length}</span>
                    </div>
                    <div className="text-slate-500 text-right">
                      <span>Conversions:</span>
                      <span className="font-bold text-emerald-600 ml-1">
                        {
                          tcLeads.filter(
                            (l) =>
                              l.status === 'SALE' ||
                              l.status === 'ENROLLED' ||
                              l.status === 'CLOSED'
                          ).length
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </div>

              {/* Action Buttons Bar */}
              <div className="p-3 bg-slate-50/80 rounded-b-2xl border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundManager.playTap();
                      setViewModalTc(tc);
                    }}
                    className="px-2 py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title="View non-sensitive telecaller profile"
                  >
                    <Info className="w-3.5 h-3.5 text-slate-500" />
                    <span>View</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundManager.playTap();
                      setResetConfirmTc(tc);
                    }}
                    className="px-2 py-1 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Generate and display new temporary password"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Reset Password</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => openEditModal(e, tc)}
                    className="px-2 py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Edit profile & targets"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleToggleStatus(e, tc)}
                    className={`px-2 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      tc.isActive
                        ? 'text-rose-600 hover:bg-rose-50'
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {tc.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Provision New Telecaller Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Provision Telecaller Account"
        subtitle="Generate collision-safe credentials for team members"
        icon={<UserPlus className="w-5 h-5 text-indigo-600" />}
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTelecaller} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {formError}
            </div>
          )}

          {/* Division Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Assigned Brand Division *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="btn-admin-brand-vidya"
                onClick={() => {
                  soundManager.playTap();
                  setNewBrandAccess('APNI_VIDYA');
                  setNewLoginId(getSuggestedLoginId('APNI_VIDYA'));
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  newBrandAccess === 'APNI_VIDYA'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-1 ring-indigo-500'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold">Apni Vidya</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">EdTech & Courses</p>
              </button>

              <button
                type="button"
                id="btn-admin-brand-estate"
                onClick={() => {
                  soundManager.playTap();
                  setNewBrandAccess('APNI_ESTATE');
                  setNewLoginId(getSuggestedLoginId('APNI_ESTATE'));
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  newBrandAccess === 'APNI_ESTATE'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold">Apni Estate</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">Realty & Property</p>
              </button>

              <button
                type="button"
                id="btn-admin-brand-dual"
                onClick={() => {
                  soundManager.playTap();
                  setNewBrandAccess('BOTH');
                  setNewLoginId(getSuggestedLoginId('BOTH'));
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  newBrandAccess === 'BOTH'
                    ? 'bg-purple-50 border-purple-500 text-purple-950 ring-1 ring-purple-500'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold">Dual Division</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">All Brand Leads</p>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name *</label>
              <input
                type="text"
                id="input-admin-tc-name"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Shalini Roy"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[42px]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Login ID / Username *</label>
                <button
                  type="button"
                  onClick={() => setNewLoginId(getSuggestedLoginId(newBrandAccess))}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                  title="Generate next ID"
                >
                  <RefreshCw className="w-3 h-3" /> Auto-suggest
                </button>
              </div>
              <input
                type="text"
                id="input-admin-tc-loginid"
                required
                value={newLoginId}
                onChange={(e) => setNewLoginId(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                placeholder="TC_VIDYA_01"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[42px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Temporary Password *</label>
                <button
                  type="button"
                  onClick={() => setNewPassword(generateRandomPassword())}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                  title="Generate secure random password"
                >
                  <RefreshCw className="w-3 h-3" /> Roll Random
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPasswordInput ? 'text' : 'password'}
                  id="input-admin-tc-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[42px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordInput(!showPasswordInput)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPasswordInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Daily Call Target</label>
              <input
                type="number"
                id="input-admin-tc-target"
                min="10"
                max="500"
                value={newTarget}
                onChange={(e) => setNewTarget(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[42px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number (Optional)</label>
              <input
                type="text"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[42px]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address (Optional)</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="caller@apnicrm.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[42px]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="indigo" type="submit" id="btn-admin-submit-provision" isLoading={isSubmitting}>
              Generate & Provision Credentials
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Telecaller Details Modal */}
      <Modal
        isOpen={Boolean(viewModalTc)}
        onClose={() => setViewModalTc(null)}
        title="Telecaller Profile Details"
        subtitle={`Login ID: ${viewModalTc?.loginId}`}
        icon={<Info className="w-5 h-5 text-indigo-600" />}
        maxWidth="md"
      >
        {viewModalTc && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-xs ${
                  viewModalTc.brandAccess === 'APNI_VIDYA'
                    ? 'bg-indigo-600'
                    : viewModalTc.brandAccess === 'APNI_ESTATE'
                    ? 'bg-emerald-600'
                    : 'bg-purple-600'
                }`}
              >
                {viewModalTc.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{viewModalTc.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-mono text-slate-600 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                    {viewModalTc.loginId}
                  </span>
                  <BrandBadge brand={viewModalTc.brandAccess} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block mb-0.5">Email Address</span>
                <span className="font-semibold text-slate-800 break-all">{viewModalTc.email || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block mb-0.5">Phone Number</span>
                <span className="font-semibold text-slate-800">{viewModalTc.phone || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block mb-0.5">Daily Call Target</span>
                <span className="font-semibold text-slate-800">{viewModalTc.dailyTarget || 50} calls / day</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block mb-0.5">Account Status</span>
                <span className={`font-bold ${viewModalTc.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {viewModalTc.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Security Notice */}
            <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 text-xs">
              <span className="font-bold block mb-0.5">Password Security Status</span>
              <span>
                Passwords are encrypted using one-way bcrypt hashing and cannot be decrypted. To issue new access credentials, use the <strong>Reset Password</strong> option.
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const target = viewModalTc;
                  setViewModalTc(null);
                  setResetConfirmTc(target);
                }}
                leftIcon={<KeyRound className="w-3.5 h-3.5 text-indigo-600" />}
              >
                Reset Password
              </Button>

              <Button variant="primary" size="sm" onClick={() => setViewModalTc(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Telecaller Modal */}
      <Modal
        isOpen={Boolean(editModalTc)}
        onClose={() => setEditModalTc(null)}
        title="Edit Telecaller Profile"
        subtitle={`Updating details for ${editModalTc?.name}`}
        icon={<Edit className="w-5 h-5 text-indigo-600" />}
        maxWidth="md"
      >
        {editModalTc && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Phone</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Brand Access</label>
                <select
                  value={editBrandAccess}
                  onChange={(e) => setEditBrandAccess(e.target.value as BrandAccess)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="APNI_VIDYA">Apni Vidya (EdTech)</option>
                  <option value="APNI_ESTATE">Apni Estate (Realty)</option>
                  <option value="BOTH">Dual Division (Both)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Daily Call Target</label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={editTarget}
                  onChange={(e) => setEditTarget(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="checkbox-edit-active"
                checked={editIsActive}
                onChange={(e) => setEditIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
              />
              <label htmlFor="checkbox-edit-active" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Account is Active (can login and receive leads)
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setEditModalTc(null)}>
                Cancel
              </Button>
              <Button variant="indigo" type="submit" isLoading={editSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Reset Password Confirmation Modal */}
      <Modal
        isOpen={Boolean(resetConfirmTc)}
        onClose={() => setResetConfirmTc(null)}
        title="Reset Telecaller Password"
        subtitle={`Generate a new temporary password for ${resetConfirmTc?.name}`}
        icon={<KeyRound className="w-5 h-5 text-amber-600" />}
        maxWidth="md"
      >
        {resetConfirmTc && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Reset Confirmation</span>
                <span>
                  Are you sure you want to reset the password for <strong>{resetConfirmTc.name}</strong> ({resetConfirmTc.loginId})? The old password will immediately stop working, and a new temporary password will be generated and displayed to you once.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setResetConfirmTc(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleResetPasswordConfirmed}
                isLoading={isResetting}
                leftIcon={<KeyRound className="w-4 h-4" />}
              >
                Generate New Password
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* One-Time Credential Confirmation Modal (Creation & Reset) */}
      <Modal
        isOpen={Boolean(createdCredentials)}
        onClose={() => {
          setCreatedCredentials(null);
          setHasCopiedCredentials(false);
          setHasCopiedPassword(false);
        }}
        title={createdCredentials?.title || 'Telecaller Credentials'}
        subtitle="One-Time Credential Handoff Panel"
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        maxWidth="md"
      >
        {createdCredentials && (
          <div className="space-y-4">
            {/* Warning Alert */}
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Important Security Notice</span>
                <span>
                  Please securely share these credentials with the team member. For privacy and security, this temporary password is now hashed with bcrypt and cannot be retrieved again after closing this window.
                </span>
              </div>
            </div>

            {/* Credential Card */}
            <div className="bg-slate-950 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-3 font-mono">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-xs text-slate-400 font-sans">Full Name:</span>
                <span className="text-sm font-bold text-white font-sans">{createdCredentials.name}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-xs text-slate-400 font-sans">Login ID:</span>
                <span className="text-sm font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
                  {createdCredentials.loginId}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-xs text-slate-400 font-sans">Temporary Password:</span>
                <span className="text-sm font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 select-all">
                  {createdCredentials.temporaryPassword}
                </span>
              </div>

              {createdCredentials.email && (
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-xs text-slate-400 font-sans">Email:</span>
                  <span className="text-xs font-semibold text-slate-300 font-sans">{createdCredentials.email}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-sans">Assigned Division:</span>
                <span className="text-xs font-bold text-slate-200 font-sans">
                  {createdCredentials.brandAccess === 'APNI_VIDYA'
                    ? 'Apni Vidya (EdTech)'
                    : createdCredentials.brandAccess === 'APNI_ESTATE'
                    ? 'Apni Estate (Realty)'
                    : 'Dual Division (Both)'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                id="btn-admin-copy-password"
                onClick={handleCopyPassword}
                className={`w-full sm:w-auto px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  hasCopiedPassword
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                }`}
              >
                {hasCopiedPassword ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Password Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Password</span>
                  </>
                )}
              </button>

              <button
                type="button"
                id="btn-admin-copy-credentials"
                onClick={handleCopyCredentials}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  hasCopiedCredentials
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                }`}
              >
                {hasCopiedCredentials ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Credentials Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Login Credentials</span>
                  </>
                )}
              </button>

              <Button
                variant="primary"
                id="btn-admin-close-credentials"
                onClick={() => {
                  setCreatedCredentials(null);
                  setHasCopiedCredentials(false);
                  setHasCopiedPassword(false);
                }}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
