import React from 'react';
import {
  Phone,
  MessageSquare,
  CheckCircle,
  ChevronRight,
  GraduationCap,
  Building2,
  Layers,
  MapPin,
  Calendar,
  Clock,
  Zap,
  Target,
  Sparkles,
  ArrowRight,
  Award,
} from 'lucide-react';
import { Lead, AuthUser, TelecallerMetrics, FollowUp } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { BrandBadge } from '../common/BrandBadge';
import { soundManager } from '../../lib/sound';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { StatCard } from '../ui/StatCard';

interface TelecallerHomeProps {
  leads: Lead[];
  currentUser?: AuthUser;
  currentTelecaller?: AuthUser;
  metrics?: TelecallerMetrics | null;
  followUps?: {
    overdue: FollowUp[];
    today: FollowUp[];
    upcoming: FollowUp[];
    completed: FollowUp[];
  };
  onSelectLead: (lead: Lead) => void;
  onInitiateCall: (lead: Lead) => void;
  onInitiateWhatsApp: (lead: Lead) => void;
  onNavigateToTab: (tab: string) => void;
}

export const TelecallerHome: React.FC<TelecallerHomeProps> = ({
  leads = [],
  currentUser: propCurrentUser,
  currentTelecaller,
  metrics,
  followUps: propFollowUps,
  onSelectLead,
  onInitiateCall,
  onInitiateWhatsApp,
  onNavigateToTab,
}) => {
  const currentUser = propCurrentUser || currentTelecaller || {
    id: 'tc-1',
    loginId: 'TC_VIDYA_1',
    name: 'Telecaller',
    role: 'TELECALLER',
    brandAccess: 'APNI_VIDYA',
    dailyTarget: 50,
    phone: '',
    email: '',
    isActive: true,
  };

  const isVidya = currentUser.brandAccess === 'APNI_VIDYA';
  const isEstate = currentUser.brandAccess === 'APNI_ESTATE';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Derive followups if not explicitly provided
  const followUps = React.useMemo(() => {
    if (propFollowUps) return propFollowUps;
    const overdue: FollowUp[] = [];
    const today: FollowUp[] = [];
    const upcoming: FollowUp[] = [];
    const completed: FollowUp[] = [];

    leads.forEach((l) => {
      if (l.activeFollowUp) {
        if (l.activeFollowUp.isCompleted || l.activeFollowUp.status === 'COMPLETED') {
          completed.push(l.activeFollowUp);
        } else if (l.activeFollowUp.dueDate < todayStr) {
          overdue.push(l.activeFollowUp);
        } else if (l.activeFollowUp.dueDate === todayStr) {
          today.push(l.activeFollowUp);
        } else {
          upcoming.push(l.activeFollowUp);
        }
      }
    });

    return { overdue, today, upcoming, completed };
  }, [propFollowUps, leads, todayStr]);

  const overdueList = followUps?.overdue || [];
  const todayList = followUps?.today || [];
  const newLeads = leads.filter((l) => l.status === 'NEW');

  const dailyTarget = currentUser?.dailyTarget || metrics?.dailyTarget || 50;
  const callsMade = metrics?.callsMade ?? leads.filter((l) => (l.totalCallsCount && l.totalCallsCount > 0) || l.status !== 'NEW').length;
  const targetProgress = dailyTarget > 0 ? Math.min(100, Math.round((callsMade / dailyTarget) * 100)) : 0;
  const wonDeals = leads.filter(
    (l) => l.status === 'ENROLLED' || l.status === 'CLOSED' || l.status === 'SALE'
  ).length;

  // Queue priority leads: Overdue first, then Today Due, then New leads, then Interested
  const priorityQueueLeads = React.useMemo(() => {
    const overdueLeadIds = overdueList.map((f) => f.leadId);
    const todayLeadIds = todayList.map((f) => f.leadId);

    const overdue = leads.filter((l) => overdueLeadIds.includes(l.id));
    const today = leads.filter((l) => todayLeadIds.includes(l.id) && !overdueLeadIds.includes(l.id));
    const fresh = leads.filter((l) => l.status === 'NEW' && !overdueLeadIds.includes(l.id) && !todayLeadIds.includes(l.id));
    const active = leads.filter((l) => (l.status === 'INTERESTED' || l.status === 'FOLLOW_UP') && !overdueLeadIds.includes(l.id) && !todayLeadIds.includes(l.id));

    return [...overdue, ...today, ...fresh, ...active].slice(0, 8);
  }, [leads, overdueList, todayList]);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Welcome Banner */}
      <div
        className={`p-6 rounded-3xl text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 ${
          isVidya
            ? 'bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-900 border border-indigo-800/60'
            : isEstate
            ? 'bg-gradient-to-r from-slate-950 via-emerald-950 to-teal-900 border border-emerald-800/60'
            : 'bg-gradient-to-r from-slate-950 via-purple-950 to-indigo-900 border border-purple-800/60'
        }`}
      >
        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <BrandBadge brand={currentUser.brandAccess} size="xs" />
            <span className="text-xs font-semibold text-slate-300">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {getGreeting()}, {currentUser.name}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            You have <strong className="text-white">{leads.length} total leads</strong> in your queue.
            {overdueList.length > 0 && (
              <span className="text-rose-300 font-bold ml-1">
                ⚠️ {overdueList.length} follow-up calls are overdue!
              </span>
            )}
          </p>
        </div>

        {/* Daily Target Progress Widget */}
        <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 min-w-[260px] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-amber-400" /> Daily Call Goal
            </span>
            <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full text-white">
              {targetProgress}%
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{callsMade}</span>
            <span className="text-xs text-slate-300 font-medium">/ {dailyTarget} calls completed</span>
          </div>

          <div className="w-full bg-black/30 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                targetProgress >= 100
                  ? 'bg-emerald-400'
                  : targetProgress >= 60
                  ? 'bg-blue-400'
                  : 'bg-amber-400'
              }`}
              style={{ width: `${targetProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Assigned Leads"
          value={leads.length}
          subtitle={`${newLeads.length} Uncalled / Fresh`}
          icon={<UsersIcon className="w-5 h-5" />}
          iconBgColor="bg-blue-50 text-blue-600 border border-blue-200"
          onClick={() => onNavigateToTab('leads')}
        />

        <StatCard
          title="Calls Made Today"
          value={callsMade}
          subtitle={`Goal: ${dailyTarget} calls`}
          icon={<Phone className="w-5 h-5" />}
          iconBgColor="bg-indigo-50 text-indigo-600 border border-indigo-200"
          badge={{ text: targetProgress >= 100 ? 'Goal Met' : `${dailyTarget - callsMade} left`, variant: targetProgress >= 100 ? 'positive' : 'warning' }}
          onClick={() => onNavigateToTab('leads')}
        />

        <StatCard
          title="Pending Follow-ups"
          value={overdueList.length + todayList.length}
          subtitle={`${overdueList.length} Overdue • ${todayList.length} Today`}
          icon={<Clock className="w-5 h-5" />}
          iconBgColor="bg-amber-50 text-amber-600 border border-amber-200"
          badge={{ text: overdueList.length > 0 ? 'Action Required' : 'On Track', variant: overdueList.length > 0 ? 'danger' : 'positive' }}
          onClick={() => onNavigateToTab('followups')}
        />

        <StatCard
          title="Won Conversions"
          value={wonDeals}
          subtitle={isVidya ? 'Students Enrolled' : isEstate ? 'Properties Closed' : 'Deals Closed'}
          icon={<Award className="w-5 h-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600 border border-emerald-200"
          badge={{ text: 'Revenue Won', variant: 'positive' }}
          onClick={() => onNavigateToTab('profile')}
        />
      </div>

      {/* Urgent Calling Queue Section */}
      <Card>
        <CardHeader className="bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Priority Calling Queue
              </h2>
              <p className="text-xs text-slate-500">
                Highest priority follow-ups and fresh inquiries ready for 1-tap call
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onNavigateToTab('leads')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            View All ({leads.length})
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {priorityQueueLeads.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <CheckCircle className="w-10 h-10 mx-auto text-emerald-500" />
              <p className="text-sm font-bold text-slate-700">All caught up! No priority calls pending.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {priorityQueueLeads.map((lead) => {
                const isOverdue = lead.activeFollowUp && lead.activeFollowUp.dueDate < todayStr;
                const isToday = lead.activeFollowUp && lead.activeFollowUp.dueDate === todayStr;

                return (
                  <div
                    key={lead.id}
                    onClick={() => {
                      soundManager.playTap();
                      onSelectLead(lead);
                    }}
                    className={`p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer ${
                      isOverdue ? 'bg-rose-50/40' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white font-black flex items-center justify-center text-xs shrink-0 mt-0.5 sm:mt-0">
                        {lead.name.charAt(0)}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-slate-900 text-sm truncate">{lead.name}</h3>
                          <BrandBadge brand={lead.brand} size="xs" />
                          <StatusBadge status={lead.status} size="xs" />
                          {isOverdue && (
                            <span className="text-xs font-bold uppercase bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-200">
                              ⏰ Overdue
                            </span>
                          )}
                          {isToday && (
                            <span className="text-xs font-bold uppercase bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                              📅 Today
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 font-mono">
                          {lead.phone} {lead.city && `• ${lead.city}`}
                        </p>

                        <p className="text-xs text-slate-600 font-medium truncate">
                          {lead.brand === 'APNI_VIDYA'
                            ? lead.courseInterest || 'Course Inquiry'
                            : lead.propertyType || 'Property Inquiry'}
                          {lead.budget && ` • Budget: ${lead.budget}`}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons with 44px+ mobile touch height */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 w-full sm:w-auto justify-end">
                      <Button
                        size="md"
                        variant="success"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundManager.playTap();
                          onInitiateWhatsApp(lead);
                        }}
                        leftIcon={<MessageSquare className="w-4 h-4" />}
                        className="flex-1 sm:flex-initial"
                      >
                        WhatsApp
                      </Button>

                      <Button
                        size="md"
                        variant="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundManager.playTap();
                          onInitiateCall(lead);
                        }}
                        leftIcon={<Phone className="w-4 h-4" />}
                        className="flex-1 sm:flex-initial"
                      >
                        Call Now
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}
