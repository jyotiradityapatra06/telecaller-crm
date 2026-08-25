import React from 'react';
import { LayoutDashboard, Users, UserCheck, Upload, PhoneCall, Clock, User } from 'lucide-react';
import { soundManager } from '../../lib/sound';

interface BottomNavProps {
  role: 'owner' | 'hr' | 'telecaller';
  currentTab: string;
  onSelectTab: (tab: string) => void;
  followUpBadgeCount?: number;
  unassignedBadgeCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  role,
  currentTab,
  onSelectTab,
  followUpBadgeCount = 0,
  unassignedBadgeCount = 0,
}) => {
  const handleTabClick = (tabId: string) => {
    soundManager.playTap();
    onSelectTab(tabId);
  };

  const adminTabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      badge: 0,
    },
    {
      id: 'allLeads',
      label: 'Leads',
      icon: <Users className="w-5 h-5" />,
      badge: unassignedBadgeCount,
      badgeColor: 'bg-amber-500',
    },
    {
      id: 'telecallers',
      label: 'Team',
      icon: <UserCheck className="w-5 h-5" />,
      badge: 0,
    },
    {
      id: 'upload',
      label: 'Import',
      icon: <Upload className="w-5 h-5" />,
      badge: 0,
    },
  ];

  const telecallerTabs = [
    {
      id: 'home',
      label: 'Calling',
      icon: <PhoneCall className="w-5 h-5" />,
      badge: 0,
    },
    {
      id: 'leads',
      label: 'My Leads',
      icon: <Users className="w-5 h-5" />,
      badge: 0,
    },
    {
      id: 'followups',
      label: 'Follow-ups',
      icon: <Clock className="w-5 h-5" />,
      badge: followUpBadgeCount,
      badgeColor: 'bg-rose-600',
    },
  ];

  const ownerTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, badge: 0 },
    { id: 'companies', label: 'Companies', icon: <Users className="w-5 h-5" />, badge: 0 },
    { id: 'hrs', label: 'HR', icon: <UserCheck className="w-5 h-5" />, badge: 0 },
    { id: 'reports', label: 'Reports', icon: <User className="w-5 h-5" />, badge: 0 },
  ];
  const hrTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, badge: 0 },
    { id: 'telecallers', label: 'Team', icon: <UserCheck className="w-5 h-5" />, badge: 0 },
    { id: 'upload', label: 'Upload', icon: <Upload className="w-5 h-5" />, badge: 0 },
    { id: 'followups', label: 'Follow-ups', icon: <Clock className="w-5 h-5" />, badge: followUpBadgeCount, badgeColor: 'bg-rose-600' },
  ];

  const tabs: any[] = role === 'owner' ? ownerTabs : role === 'hr' ? hrTabs : telecallerTabs;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1.5 flex items-center justify-around shadow-lg safe-bottom"
      aria-label="Mobile Navigation"
    >
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`nav-${tab.id}`}
            onClick={() => handleTabClick(tab.id)}
            className={`flex flex-col items-center justify-center gap-1 min-h-[48px] min-w-[56px] px-2 py-1 rounded-xl transition-all select-none cursor-pointer ${
              isActive
                ? 'text-blue-600 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div className="relative">
              {tab.icon}
              {tab.badge > 0 && (
                <span
                  className={`absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-white text-[10px] font-black leading-tight shadow-xs ${
                    tab.badgeColor || 'bg-blue-600'
                  }`}
                >
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </div>
            <span className="text-[11px] tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
