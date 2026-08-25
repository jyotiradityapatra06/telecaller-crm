import React from 'react';
import {
  PhoneCall,
  Shield,
  GraduationCap,
  Building2,
  Volume2,
  VolumeX,
  LogOut,
  User,
} from 'lucide-react';
import { AuthUser } from '../../types';
import { soundManager } from '../../lib/sound';

interface TopHeaderProps {
  currentUser: AuthUser;
  allTelecallers: AuthUser[];
  onSwitchUser: (loginId: string) => void;
  onLogout: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentUser,
  allTelecallers,
  onSwitchUser,
  onLogout,
}) => {
  const isSoundOn = soundManager.isEnabled();
  const isAdmin = currentUser.role === 'ADMIN';

  const handleToggleSound = () => {
    soundManager.toggleMute();
    soundManager.playTap();
  };

  return (
    <header className="bg-slate-950 text-white border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between gap-3 sticky top-0 z-20 shrink-0 select-none">
      {/* Brand & Mobile Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-xs shrink-0">
          <PhoneCall className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-white text-sm">
            <span>TeleCaller CRM</span>
            {isAdmin ? (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-950 border border-indigo-800 px-1.5 py-0.5 rounded">
                <Shield className="w-2.5 h-2.5" /> HQ
              </span>
            ) : currentUser.brandAccess === 'APNI_VIDYA' ? (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-950 border border-indigo-800 px-1.5 py-0.5 rounded">
                <GraduationCap className="w-2.5 h-2.5" /> Vidya
              </span>
            ) : currentUser.brandAccess === 'APNI_ESTATE' ? (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-1.5 py-0.5 rounded">
                <Building2 className="w-2.5 h-2.5" /> Estate
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-purple-400 bg-purple-950 border border-purple-800 px-1.5 py-0.5 rounded">
                Dual
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 truncate max-w-[140px] sm:max-w-none">
            {currentUser.name}
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Quick User Switch Dropdown (Development Testing Only) */}
        {import.meta.env.DEV && (
          <div className="flex items-center gap-1 bg-slate-900 px-2 py-1.5 rounded-xl border border-slate-800">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={currentUser.loginId}
              onChange={(e) => {
                soundManager.playTap();
                onSwitchUser(e.target.value);
              }}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer max-w-[110px] sm:max-w-[170px] truncate"
              aria-label="Switch User Role"
            >
              <option value="admin" className="bg-slate-900 text-indigo-300">
                🛡️ Master Admin
              </option>
              <optgroup label="🎓 Apni Vidya" className="bg-slate-900 text-slate-400">
                {allTelecallers
                  .filter((tc) => tc.brandAccess === 'APNI_VIDYA')
                  .map((tc) => (
                    <option key={tc.id} value={tc.loginId} className="bg-slate-900 text-white">
                      🎓 {tc.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="🏢 Apni Estate" className="bg-slate-900 text-slate-400">
                {allTelecallers
                  .filter((tc) => tc.brandAccess === 'APNI_ESTATE')
                  .map((tc) => (
                    <option key={tc.id} value={tc.loginId} className="bg-slate-900 text-white">
                      🏢 {tc.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="🌐 Dual Brand" className="bg-slate-900 text-slate-400">
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
        )}

        {/* Audio FX Toggle */}
        <button
          type="button"
          onClick={handleToggleSound}
          className={`p-2 rounded-xl border transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center ${
            isSoundOn
              ? 'bg-slate-900 border-slate-800 text-emerald-400 hover:bg-slate-800'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
          }`}
          title={isSoundOn ? 'Mute Sounds' : 'Enable Sounds'}
          aria-label="Toggle interaction sounds"
        >
          {isSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Sign Out */}
        <button
          type="button"
          onClick={onLogout}
          className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900 text-rose-300 border border-rose-900/40 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
