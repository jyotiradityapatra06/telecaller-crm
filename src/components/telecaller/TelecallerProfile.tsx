import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Shield,
  LogOut,
  KeyRound,
  CheckCircle2,
  GraduationCap,
  Building2,
  Target,
  Award,
  PhoneCall,
  Clock,
  RotateCcw,
  User,
} from 'lucide-react';
import { AuthUser, TelecallerMetrics, Lead } from '../../types';
import { BrandBadge } from '../common/BrandBadge';
import { api } from '../../lib/api';
import { soundManager } from '../../lib/sound';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { StatCard } from '../ui/StatCard';
import { Modal } from '../ui/Modal';

interface TelecallerProfileProps {
  currentUser?: AuthUser;
  telecaller?: AuthUser;
  metrics?: TelecallerMetrics | null;
  leads?: Lead[];
  allTelecallers?: AuthUser[];
  onSwitchTelecaller?: (loginId: string) => void;
  onSwitchToAdmin?: () => void;
  onLogout: () => void;
}

export const TelecallerProfile: React.FC<TelecallerProfileProps> = ({
  currentUser: propCurrentUser,
  telecaller: propTelecaller,
  metrics: propMetrics,
  leads = [],
  allTelecallers = [],
  onSwitchTelecaller,
  onSwitchToAdmin,
  onLogout,
}) => {
  const currentUser = propCurrentUser || propTelecaller || {
    id: 'tc-1',
    loginId: 'TC001',
    name: 'Telecaller',
    role: 'TELECALLER',
    dailyTarget: 50,
    phone: '',
    email: '',
    isActive: true,
    brandAccess: 'APNI_VIDYA',
  };

  const metrics = React.useMemo(() => {
    if (propMetrics) return propMetrics;
    const assignedLeads = leads.length;
    const callsMade = leads.filter((l) => (l.totalCallsCount && l.totalCallsCount > 0) || l.status !== 'NEW').length;
    const target = currentUser.dailyTarget || 50;
    const targetProgress = target > 0 ? Math.min(100, Math.round((callsMade / target) * 100)) : 0;
    const interested = leads.filter((l) => l.status === 'INTERESTED').length;
    const notInterested = leads.filter((l) => l.status === 'NOT_INTERESTED').length;
    const followUps = leads.filter((l) => l.status === 'FOLLOW_UP').length;
    const noAnswer = leads.filter((l) => l.status === 'NO_ANSWER').length;
    const busy = leads.filter((l) => l.status === 'BUSY').length;
    const demos = leads.filter((l) => l.status === 'DEMO' || l.status === 'SITE_VISIT_SCHEDULED').length;
    const bookings = leads.filter((l) => l.status === 'BOOKING' || l.status === 'NEGOTIATING').length;
    const sales = leads.filter((l) => l.status === 'SALE' || l.status === 'ENROLLED' || l.status === 'CLOSED').length;

    return {
      telecallerId: currentUser.id,
      telecallerName: currentUser.name,
      loginId: currentUser.loginId,
      dailyTarget: target,
      assignedLeads,
      callsMade,
      targetProgress,
      interested,
      notInterested,
      followUps,
      noAnswer,
      busy,
      demos,
      bookings,
      sales,
    };
  }, [propMetrics, leads, currentUser]);

  const isSoundOn = soundManager.isEnabled();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleToggleSound = () => {
    soundManager.toggleMute();
    soundManager.playTap();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 4 characters.' });
      return;
    }

    setIsChangingPass(true);
    setPasswordMsg(null);
    try {
      await api.changePassword(oldPassword, newPassword);
      soundManager.playSuccess();
      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setOldPassword('');
        setNewPassword('');
        setPasswordMsg(null);
      }, 1200);
    } catch (err: any) {
      soundManager.playError();
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to change password' });
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center text-xl shadow-md shrink-0">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {currentUser.name}
              </h1>
              <BrandBadge brand={currentUser.brandAccess} size="sm" />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-mono mt-0.5">
              Login ID: {currentUser.loginId} • {currentUser.email || `${currentUser.loginId.toLowerCase()}@apnicrm.com`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPasswordModal(true)}
            leftIcon={<KeyRound className="w-4 h-4" />}
          >
            Change Password
          </Button>

          <Button
            size="sm"
            variant="danger"
            onClick={onLogout}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Target Progress & Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Daily Goal Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-extrabold text-slate-900">Daily Target Pace</h3>
            </div>
            <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
              {metrics.targetProgress}% Complete
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-black text-slate-900">{metrics.callsMade}</span>
                <span className="text-sm text-slate-500 font-medium"> / {metrics.dailyTarget} calls logged</span>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                {Math.max(0, metrics.dailyTarget - metrics.callsMade)} remaining
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  metrics.targetProgress >= 100
                    ? 'bg-emerald-500'
                    : metrics.targetProgress >= 60
                    ? 'bg-blue-600'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${metrics.targetProgress}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Won Deals Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-extrabold text-slate-900">Won Conversions</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-black text-emerald-700">{metrics.sales}</div>
            <p className="text-xs text-slate-500">
              High-value client conversions completed across your pipeline.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Outcome Breakdown Statistics */}
      <Card>
        <CardHeader>
          <h3 className="text-base font-extrabold text-slate-900">Disposition Breakdown</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-500 font-semibold">Total In Queue</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{metrics.assignedLeads}</p>
            </div>
            <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100">
              <p className="text-xs text-emerald-700 font-semibold">Interested</p>
              <p className="text-2xl font-black text-emerald-800 mt-1">{metrics.interested}</p>
            </div>
            <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-100">
              <p className="text-xs text-purple-700 font-semibold">Demos / Site Visits</p>
              <p className="text-2xl font-black text-purple-800 mt-1">{metrics.demos}</p>
            </div>
            <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-100">
              <p className="text-xs text-amber-700 font-semibold">Follow-ups</p>
              <p className="text-2xl font-black text-amber-800 mt-1">{metrics.followUps}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Update Account Password"
        subtitle="Ensure your credentials are safe and secure"
        maxWidth="md"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          {passwordMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-bold ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {passwordMsg.text}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Old Password</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </Button>
            <Button variant="indigo" type="submit" isLoading={isChangingPass}>
              Save Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
