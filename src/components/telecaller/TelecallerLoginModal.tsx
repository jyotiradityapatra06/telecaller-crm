import React, { useState } from 'react';
import { PhoneCall, Key, User, AlertCircle, LogIn, GraduationCap, Building2, Layers } from 'lucide-react';
import { AuthUser } from '../../types';
import { BrandBadge } from '../common/BrandBadge';
import { api } from '../../lib/api';
import { soundManager } from '../../lib/sound';

interface TelecallerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  telecallers: AuthUser[];
  onLoginSuccess: (telecaller: AuthUser) => void;
}

export const TelecallerLoginModal: React.FC<TelecallerLoginModalProps> = ({
  isOpen,
  onClose,
  telecallers,
  onLoginSuccess,
}) => {
  const [identifier, setIdentifier] = useState('TC001');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your Telecaller ID');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await api.login(identifier.trim(), password.trim());
      soundManager.playSuccess();
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      soundManager.playError();
      setError(err.message || 'Invalid Telecaller ID or Password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSelect = (tc: AuthUser) => {
    soundManager.playTap();
    setIdentifier(tc.loginId);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-slate-900 overflow-hidden relative">
        {/* Header */}
        <div className="text-center pb-4 border-b border-slate-100">
          <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
            <PhoneCall className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Telecaller Portal Login</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based login for Apni Vidya & Apni Estate teams
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Telecaller Login ID
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="e.g. TC001, TC002, TC003"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Account Password
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-slate-900/20 active:scale-98 transition-all mt-1 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>{isLoading ? 'Verifying...' : 'Sign In to Portal'}</span>
          </button>
        </form>

        {/* 1-Tap Quick Account Selectors */}
        {telecallers.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              Quick 1-Tap Role Accounts
            </span>
            <div className="space-y-1.5 max-h-44 overflow-y-auto">
              {telecallers.map((tc) => (
                <button
                  key={tc.id}
                  type="button"
                  onClick={() => handleQuickSelect(tc)}
                  className={`w-full p-2 rounded-xl border text-left flex items-center justify-between transition-all text-xs cursor-pointer ${
                    identifier === tc.loginId
                      ? 'bg-slate-900 text-white border-slate-900 font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 ${
                        identifier === tc.loginId ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tc.name.charAt(0)}
                    </div>
                    <div className="truncate min-w-0">
                      <p className="truncate text-[11px] leading-tight">{tc.name}</p>
                      <p className={`text-[9px] font-mono ${identifier === tc.loginId ? 'text-slate-300' : 'text-slate-400'}`}>
                        {tc.loginId}
                      </p>
                    </div>
                  </div>

                  <BrandBadge brand={tc.brandAccess || 'APNI_VIDYA'} size="xs" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dismiss Button */}
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
