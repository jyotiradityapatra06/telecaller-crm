import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Upload,
  PhoneCall,
  Clock,
  Shield,
  GraduationCap,
  Building2,
  LogOut,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AuthUser } from '../../types';
import { soundManager } from '../../lib/sound';

interface SidebarProps {
  currentUser: AuthUser;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  allTelecallers: AuthUser[];
  onSwitchUser: (loginId: string) => void;
  onLogout: () => void;
  followUpBadgeCount?: number;
  unassignedBadgeCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  currentTab,
  onSelectTab,
  allTelecallers,
  onSwitchUser,
  onLogout,
  followUpBadgeCount = 0,
  unassignedBadgeCount = 0,
}) => {
  const isSoundOn = soundManager.isEnabled();
  const isAdmin = currentUser.role !== 'TELECALLER';

  const handleToggleSound = () => {
    soundManager.toggleMute();
    soundManager.playTap();
  };

  const adminNavItems = [
    {
      id: 'dashboard',
      label: 'HQ Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      badge: null,
    },
    {
      id: 'allLeads',
      label: 'All Leads',
      icon: <Users className="w-5 h-5" />,
      badge: unassignedBadgeCount > 0 ? `${unassignedBadgeCount} unassigned` : null,
      badgeVariant: 'amber',
    },
    {
      id: 'telecallers',
      label: 'Team & Callers',
      icon: <UserCheck className="w-5 h-5" />,
      badge: `${allTelecallers.length}`,
      badgeVariant: 'slate',
    },
    {
      id: 'upload',
      label: 'Import Leads',
      icon: <Upload className="w-5 h-5" />,
      badge: 'Excel/CSV',
      badgeVariant: 'indigo',
    },
  ];

  const telecallerNavItems = [
    {
      id: 'home',
      label: 'Dashboard',
      icon: <PhoneCall className="w-5 h-5" />,
      badge: null,
    },
    {
      id: 'leads',
      label: 'My Leads',
      icon: <Users className="w-5 h-5" />,
      badge: null,
    },
    {
      id: 'followups',
      label: 'Follow-ups',
      icon: <Clock className="w-5 h-5" />,
      badge: followUpBadgeCount > 0 ? `${followUpBadgeCount}` : null,
      badgeVariant: 'rose',
    },
  ];

  const ownerNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, badge: null },
    { id: 'companies', label: 'Companies', icon: <Building2 className="w-5 h-5" />, badge: null },
    { id: 'hrs', label: 'HR Management', icon: <UserCheck className="w-5 h-5" />, badge: null },
    { id: 'reports', label: 'Reports', icon: <Users className="w-5 h-5" />, badge: null },
  ];
  const hrNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, badge: null },
    { id: 'telecallers', label: 'Telecallers', icon: <UserCheck className="w-5 h-5" />, badge: `${allTelecallers.length}`, badgeVariant: 'slate' },
    { id: 'upload', label: 'Upload Leads', icon: <Upload className="w-5 h-5" />, badge: null },
    { id: 'followups', label: 'Follow-ups', icon: <Clock className="w-5 h-5" />, badge: followUpBadgeCount ? `${followUpBadgeCount}` : null, badgeVariant: 'rose' },
  ];

  const navItems: any[] = currentUser.role === 'OWNER' ? ownerNavItems : currentUser.role === 'HR' ? hrNavItems : telecallerNavItems;

  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-slate-950 text-slate-100 border-r border-slate-800/80 shrink-0 h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
              TeleCaller <span className="text-blue-400">CRM</span>
            </h1>
            <p className="text-[11px] font-semibold text-slate-400">Enterprise Edition</p>
          </div>
        </div>
      </div>

      {/* Brand Access Pill */}
      <div className="px-5 py-3 border-b border-slate-850 bg-slate-900/60">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Access Scope</span>
          {currentUser.role === 'OWNER' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 bg-indigo-950/80 border border-indigo-800/60 px-2 py-0.5 rounded-md">
              <Shield className="w-3 h-3" /> Master HQ (Both)
            </span>
          ) : currentUser.brandAccess === 'APNI_VIDYA' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 bg-indigo-950/80 border border-indigo-800/60 px-2 py-0.5 rounded-md">
              <GraduationCap className="w-3 h-3" /> Apni Vidya
            </span>
          ) : currentUser.brandAccess === 'APNI_ESTATE' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-md">
              <Building2 className="w-3 h-3" /> Apni Estate
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-400 bg-purple-950/80 border border-purple-800/60 px-2 py-0.5 rounded-md">
              <Shield className="w-3 h-3" /> Dual Brand
            </span>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {currentUser.role === 'OWNER' ? 'Owner Console' : currentUser.role === 'HR' ? 'Team Workspace' : 'Calling Workspace'}
        </div>

        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                soundManager.playTap();
                onSelectTab(item.id);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-bold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.badgeVariant === 'rose'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : item.badgeVariant === 'amber'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Switch User & Utilities Section */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/40 space-y-2">
        {/* Development Quick Switch */}
        {import.meta.env.DEV && (
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1 block">
              Dev Switch Account
            </label>
            <select
              value={currentUser.loginId}
              onChange={(e) => {
                soundManager.playTap();
                onSwitchUser(e.target.value);
              }}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="admin">🛡️ Master Admin HQ</option>
              <optgroup label="🎓 Apni Vidya">
                {allTelecallers
                  .filter((tc) => tc.brandAccess === 'APNI_VIDYA')
                  .map((tc) => (
                    <option key={tc.id} value={tc.loginId}>
                      🎓 {tc.name} ({tc.loginId})
                    </option>
                  ))}
              </optgroup>
              <optgroup label="🏢 Apni Estate">
                {allTelecallers
                  .filter((tc) => tc.brandAccess === 'APNI_ESTATE')
                  .map((tc) => (
                    <option key={tc.id} value={tc.loginId}>
                      🏢 {tc.name} ({tc.loginId})
                    </option>
                  ))}
              </optgroup>
              <optgroup label="🌐 Dual Brand">
                {allTelecallers
                  .filter((tc) => tc.brandAccess === 'BOTH')
                  .map((tc) => (
                    <option key={tc.id} value={tc.loginId}>
                      🌐 {tc.name} ({tc.loginId})
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>
        )}

        {/* Quick Toolbar */}
        <div className="flex items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={handleToggleSound}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              isSoundOn
                ? 'bg-slate-900 border-slate-700 text-emerald-400 hover:bg-slate-800'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
            title="Toggle Sound Effects"
          >
            {isSoundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{isSoundOn ? 'Sound On' : 'Muted'}</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="flex items-center justify-center p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-300 border border-rose-900/40 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* User Profile Badge Footer */}
      <div className="p-3.5 border-t border-slate-800/80 flex items-center gap-3 bg-slate-950">
        <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
          {currentUser.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
          <p className="text-[11px] text-slate-400 truncate">{currentUser.loginId}</p>
        </div>
      </div>
    </aside>
  );
};
