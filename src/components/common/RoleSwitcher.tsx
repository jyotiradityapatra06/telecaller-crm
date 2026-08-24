import React from 'react';
import { Shield, GraduationCap, Building2, PhoneCall, Volume2, VolumeX, RotateCcw, User, LogOut } from 'lucide-react';
import { AuthUser } from '../../types';
import { soundManager } from '../../lib/sound';

interface RoleSwitcherProps {
  currentUser: AuthUser | null;
  allTelecallers: AuthUser[];
  onSwitchUser: (loginId: string) => void;
  onLogout: () => void;
  isMobileFrame?: boolean;
  onToggleFrame?: () => void;
  onResetData: () => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentUser,
  allTelecallers,
  onSwitchUser,
  onLogout,
  onResetData,
}) => {
  const isSoundOn = soundManager.isEnabled();

  const handleToggleSound = () => {
    soundManager.toggleMute();
    soundManager.playTap();
  };

  if (!currentUser) return null;

  return (
    <header className="bg-slate-950 text-white border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between gap-3 sticky top-0 z-20 select-none">
      {/* Brand Logo & Active Role Status */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2 font-bold tracking-tight text-white pr-3 border-r border-slate-800">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-xs">
            <PhoneCall className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm sm:text-base font-black tracking-tight">TeleCaller CRM</span>
        </div>

        {/* Current User Role / Brand Pill */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
          {currentUser.role === 'ADMIN' ? (
            <span className="flex items-center gap-1.5 text-indigo-400 font-bold text-xs">
              <Shield className="w-3.5 h-3.5" />
              <span>Master Admin HQ (Dual Brand)</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 font-bold text-xs">
              {currentUser.brandAccess === 'APNI_VIDYA' ? (
                <span className="flex items-center gap-1 text-indigo-400">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Apni Vidya</span>
                </span>
              ) : currentUser.brandAccess === 'APNI_ESTATE' ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Apni Estate</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-purple-400">
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Dual Brand</span>
                </span>
              )}
              <span className="text-slate-400 font-normal">| {currentUser.name}</span>
            </span>
          )}
        </div>
      </div>

      {/* Right controls: Quick Switcher Dropdown, Audio, Reset, Logout */}
      <div className="flex items-center gap-2">
        {/* Quick Role Switch Dropdown */}
        <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={currentUser.loginId}
            onChange={(e) => {
              soundManager.playTap();
              onSwitchUser(e.target.value);
            }}
            className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[180px] truncate"
            aria-label="Switch demo account"
          >
            <option value="admin" className="bg-slate-900 text-indigo-300">
              🛡️ Master Admin
            </option>
            <optgroup label="🎓 Apni Vidya Callers" className="bg-slate-900 text-slate-400">
              {allTelecallers
                .filter((tc) => tc.brandAccess === 'APNI_VIDYA')
                .map((tc) => (
                  <option key={tc.id} value={tc.loginId} className="bg-slate-900 text-white">
                    🎓 {tc.name}
                  </option>
                ))}
            </optgroup>
            <optgroup label="🏢 Apni Estate Callers" className="bg-slate-900 text-slate-400">
              {allTelecallers
                .filter((tc) => tc.brandAccess === 'APNI_ESTATE')
                .map((tc) => (
                  <option key={tc.id} value={tc.loginId} className="bg-slate-900 text-white">
                    🏢 {tc.name}
                  </option>
                ))}
            </optgroup>
            <optgroup label="🌐 Dual Brand Callers" className="bg-slate-900 text-slate-400">
              {allTelecallers
                .filter((tc) => tc.brandAccess === 'BOTH')
                .map((tc) => (
                  <option key={tc.id} value={tc.loginId} className="bg-slate-900 text-white">
                    🌐 {tc.name}
                  </option>
                ))}
            </optgroup>
          </select>
        </div>

        {/* Sound FX Toggle */}
        <button
          type="button"
          onClick={handleToggleSound}
          className={`p-2 rounded-xl border transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center ${
            isSoundOn
              ? 'bg-slate-900 border-slate-800 text-emerald-400 hover:bg-slate-800'
              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
          }`}
          title={isSoundOn ? 'Mute Sounds' : 'Enable Sounds'}
          aria-label="Toggle sound effects"
        >
          {isSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Reset Database */}
        <button
          type="button"
          onClick={onResetData}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
          title="Reset Sample Data"
          aria-label="Reset database to sample state"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900 text-rose-300 border border-rose-900/40 flex items-center gap-1.5 transition-colors cursor-pointer min-h-[38px]"
          title="Sign Out"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-xs font-semibold hidden md:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};
