import React, { useState } from 'react';
import {
  Users,
  Upload,
  ChevronRight,
  GraduationCap,
  Building2,
  Layers,
  CheckCircle2,
  Calendar,
  Award,
  Clock,
  Shield,
  Filter,
} from 'lucide-react';
import { Lead, AuthUser, AdminMetrics, BusinessBrand } from '../../types';
import { soundManager } from '../../lib/sound';
import { AdminDailyFollowUpsModal } from './AdminDailyFollowUpsModal';
import { BrandBadge } from '../common/BrandBadge';
import { StatCard } from '../ui/StatCard';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardContent } from '../ui/Card';

interface AdminDashboardProps {
  leads: Lead[];
  telecallers: AuthUser[];
  metrics?: AdminMetrics | null;
  selectedBrand?: 'ALL' | BusinessBrand;
  onSelectBrand?: (brand: 'ALL' | BusinessBrand) => void;
  onSelectTelecaller: (telecaller: AuthUser) => void;
  onNavigateToUpload: () => void;
  onNavigateToTelecallers: () => void;
  onNavigateToAllLeads: () => void;
  onSelectLeadForDetail?: (lead: Lead) => void;
  onLeadsUpdated?: () => void;
  onAutoDistribute?: () => void;
  isDistributing?: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  leads,
  telecallers,
  selectedBrand: propBrand = 'ALL',
  onSelectBrand: propOnSelectBrand,
  onSelectTelecaller,
  onNavigateToUpload,
  onNavigateToTelecallers,
  onNavigateToAllLeads,
  onSelectLeadForDetail,
  onLeadsUpdated,
}) => {
  const [internalBrand, setInternalBrand] = useState<'ALL' | BusinessBrand>(propBrand);
  const [showFollowUpsModal, setShowFollowUpsModal] = useState(false);

  // Sync internal brand if prop changes
  const selectedBrand = propOnSelectBrand ? propBrand : internalBrand;

  const handleSelectBrand = (brand: 'ALL' | BusinessBrand) => {
    soundManager.playTap();
    setInternalBrand(brand);
    if (propOnSelectBrand) {
      propOnSelectBrand(brand);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Brand-level total inventory counts (unfiltered totals for filter badges)
  const totalAllLeads = leads.length;
  const vidyaLeadsCount = leads.filter((l) => l.brand === 'APNI_VIDYA').length;
  const estateLeadsCount = leads.filter((l) => l.brand === 'APNI_ESTATE').length;

  // Active leads filtered by the current selected brand
  const activeLeads =
    selectedBrand === 'ALL'
      ? leads
      : leads.filter((l) => l.brand === selectedBrand);

  // Follow-ups calculations based on active leads
  const todayFollowUps = activeLeads.filter(
    (l) => l.activeFollowUp && !l.activeFollowUp.isCompleted && l.activeFollowUp.dueDate === todayStr
  );
  const overdueFollowUps = activeLeads.filter(
    (l) => l.activeFollowUp && !l.activeFollowUp.isCompleted && l.activeFollowUp.dueDate < todayStr
  );
  const totalFollowUps = todayFollowUps.length + overdueFollowUps.length;

  // Pipeline metrics for current view
  const totalLeads = activeLeads.length;
  const assigned = activeLeads.filter((l) => l.assignedTo).length;
  const unassigned = activeLeads.filter((l) => !l.assignedTo).length;

  // Vidya & Estate breakdown counts for the active division view
  const vidyaEnrolled = activeLeads.filter(
    (l) => l.brand === 'APNI_VIDYA' && (l.status === 'ENROLLED' || l.status === 'SALE')
  ).length;
  const vidyaDemos = activeLeads.filter(
    (l) => l.brand === 'APNI_VIDYA' && l.status === 'DEMO'
  ).length;
  const vidyaInterested = activeLeads.filter(
    (l) => l.brand === 'APNI_VIDYA' && l.status === 'INTERESTED'
  ).length;

  const estateClosed = activeLeads.filter(
    (l) => l.brand === 'APNI_ESTATE' && (l.status === 'CLOSED' || l.status === 'BOOKING' || l.status === 'SALE')
  ).length;
  const estateVisits = activeLeads.filter(
    (l) => l.brand === 'APNI_ESTATE' && l.status === 'SITE_VISIT_SCHEDULED'
  ).length;
  const estateInterested = activeLeads.filter(
    (l) => l.brand === 'APNI_ESTATE' && l.status === 'INTERESTED'
  ).length;

  const wonDealsCount =
    selectedBrand === 'APNI_VIDYA'
      ? vidyaEnrolled
      : selectedBrand === 'APNI_ESTATE'
      ? estateClosed
      : vidyaEnrolled + estateClosed;

  // Filter telecallers list according to active brand
  const filteredTelecallers = telecallers.filter((tc) => {
    if (selectedBrand === 'ALL') return true;
    return tc.brandAccess === selectedBrand || tc.brandAccess === 'BOTH';
  });

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner / Breadcrumb & Brand Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Master Admin HQ</span>
            <span className="text-slate-300">•</span>
            <span>Enterprise Operations</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Dual-Brand Performance Control Room
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time pipeline visibility, team productivity, and lead distribution.
          </p>
        </div>

        {/* Brand Filter Tabs Segmented Control */}
        <div
          role="tablist"
          aria-label="Brand division filters"
          className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 overflow-x-auto max-w-full"
        >
          {/* All Brands Tab */}
          <button
            type="button"
            role="tab"
            aria-selected={selectedBrand === 'ALL'}
            aria-label={`All Brands filter with ${totalAllLeads} leads`}
            onClick={() => handleSelectBrand('ALL')}
            className={`min-h-[44px] px-3.5 py-2 sm:py-1.5 rounded-xl text-xs sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 ${
              selectedBrand === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs ring-1 ring-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>All Brands</span>
            <span
              className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded-md ${
                selectedBrand === 'ALL'
                  ? 'bg-slate-800 text-slate-200'
                  : 'bg-slate-200/80 text-slate-600'
              }`}
            >
              {totalAllLeads}
            </span>
          </button>

          {/* Apni Vidya Tab */}
          <button
            type="button"
            role="tab"
            aria-selected={selectedBrand === 'APNI_VIDYA'}
            aria-label={`Apni Vidya EdTech filter with ${vidyaLeadsCount} leads`}
            onClick={() => handleSelectBrand('APNI_VIDYA')}
            className={`min-h-[44px] px-3.5 py-2 sm:py-1.5 rounded-xl text-xs sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1 ${
              selectedBrand === 'APNI_VIDYA'
                ? 'bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-600'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 shrink-0 text-amber-300 sm:text-inherit" />
            <span>Apni Vidya</span>
            <span
              className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded-md ${
                selectedBrand === 'APNI_VIDYA'
                  ? 'bg-indigo-700 text-indigo-100'
                  : 'bg-indigo-100/80 text-indigo-700'
              }`}
            >
              {vidyaLeadsCount}
            </span>
          </button>

          {/* Apni Estate Tab */}
          <button
            type="button"
            role="tab"
            aria-selected={selectedBrand === 'APNI_ESTATE'}
            aria-label={`Apni Estate Real Estate filter with ${estateLeadsCount} leads`}
            onClick={() => handleSelectBrand('APNI_ESTATE')}
            className={`min-h-[44px] px-3.5 py-2 sm:py-1.5 rounded-xl text-xs sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 ${
              selectedBrand === 'APNI_ESTATE'
                ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-600'
                : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/80'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 shrink-0 text-emerald-300 sm:text-inherit" />
            <span>Apni Estate</span>
            <span
              className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded-md ${
                selectedBrand === 'APNI_ESTATE'
                  ? 'bg-emerald-700 text-emerald-100'
                  : 'bg-emerald-100/80 text-emerald-700'
              }`}
            >
              {estateLeadsCount}
            </span>
          </button>
        </div>
      </div>

      {/* Urgent Action Banner (If unassigned or overdue followups exist in current filter) */}
      {(unassigned > 0 || overdueFollowUps.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {unassigned > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">
                    {unassigned} Unassigned {unassigned === 1 ? 'Lead' : 'Leads'} Waiting
                  </h4>
                  <p className="text-xs text-amber-700">
                    {selectedBrand === 'ALL'
                      ? 'Assign leads across telecallers to begin outreach.'
                      : `Assign ${selectedBrand === 'APNI_VIDYA' ? 'Apni Vidya' : 'Apni Estate'} leads to begin outreach.`}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={onNavigateToAllLeads}>
                Assign Now
              </Button>
            </div>
          )}

          {overdueFollowUps.length > 0 && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-rose-900">
                    {overdueFollowUps.length} Overdue Follow-up Calls
                  </h4>
                  <p className="text-xs text-rose-700">Client follow-up scheduled dates have passed.</p>
                </div>
              </div>
              <Button size="sm" variant="danger" onClick={() => setShowFollowUpsModal(true)}>
                View Follow-ups
              </Button>
            </div>
          )}
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={
            selectedBrand === 'ALL'
              ? 'Total Pipeline Leads'
              : selectedBrand === 'APNI_VIDYA'
              ? 'Apni Vidya Leads'
              : 'Apni Estate Leads'
          }
          value={totalLeads}
          subtitle={`${assigned} Assigned • ${unassigned} Unassigned`}
          icon={<Users className="w-5 h-5" />}
          iconBgColor="bg-blue-50 text-blue-600 border border-blue-200"
          badge={{
            text: selectedBrand === 'ALL' ? 'Live DB' : selectedBrand === 'APNI_VIDYA' ? 'EdTech' : 'Realty',
            variant: 'info',
          }}
          onClick={onNavigateToAllLeads}
        />

        <StatCard
          title="Active Telecallers"
          value={filteredTelecallers.length}
          subtitle={`${filteredTelecallers.filter((t) => t.isActive).length} Available Online`}
          icon={<Award className="w-5 h-5" />}
          iconBgColor="bg-indigo-50 text-indigo-600 border border-indigo-200"
          badge={{ text: 'Team', variant: 'neutral' }}
          onClick={onNavigateToTelecallers}
        />

        <StatCard
          title="Scheduled Follow-ups"
          value={totalFollowUps}
          subtitle={`${todayFollowUps.length} Due Today • ${overdueFollowUps.length} Overdue`}
          icon={<Calendar className="w-5 h-5" />}
          iconBgColor="bg-amber-50 text-amber-600 border border-amber-200"
          badge={{
            text: overdueFollowUps.length > 0 ? 'Urgent' : 'On Track',
            variant: overdueFollowUps.length > 0 ? 'danger' : 'positive',
          }}
          onClick={() => setShowFollowUpsModal(true)}
        />

        <StatCard
          title="Total Won Deals"
          value={wonDealsCount}
          subtitle={
            selectedBrand === 'APNI_VIDYA'
              ? `${vidyaEnrolled} Enrollments • ${vidyaDemos} Demos`
              : selectedBrand === 'APNI_ESTATE'
              ? `${estateClosed} Estate Sales • ${estateVisits} Visits`
              : `${vidyaEnrolled} Enrollments • ${estateClosed} Estate Sales`
          }
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600 border border-emerald-200"
          badge={{ text: 'High Conversion', variant: 'positive' }}
          onClick={onNavigateToAllLeads}
        />
      </div>

      {/* Brand Comparison Section */}
      <div
        className={`grid grid-cols-1 ${
          selectedBrand === 'ALL' ? 'lg:grid-cols-2' : 'grid-cols-1'
        } gap-6`}
      >
        {/* Apni Vidya EdTech Card */}
        {(selectedBrand === 'ALL' || selectedBrand === 'APNI_VIDYA') && (
          <Card
            className={`transition-all ${
              selectedBrand === 'APNI_VIDYA'
                ? 'ring-2 ring-indigo-500 shadow-md'
                : 'hover:shadow-md'
            }`}
          >
            <CardHeader className="bg-gradient-to-r from-indigo-50/70 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Apni Vidya (EdTech Division)
                  </h3>
                  <p className="text-xs text-slate-500">
                    {vidyaLeadsCount} Student Course Inquiries
                  </p>
                </div>
              </div>
              <BrandBadge brand="APNI_VIDYA" size="xs" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                  <p className="text-[11px] font-semibold text-slate-500">Interested</p>
                  <p className="text-lg font-extrabold text-slate-900">{vidyaInterested}</p>
                </div>
                <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-2.5">
                  <p className="text-[11px] font-semibold text-indigo-700">Demos Scheduled</p>
                  <p className="text-lg font-extrabold text-indigo-700">{vidyaDemos}</p>
                </div>
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5">
                  <p className="text-[11px] font-semibold text-emerald-700">Enrolled Won</p>
                  <p className="text-lg font-extrabold text-emerald-700">{vidyaEnrolled}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Conversion Rate</span>
                <span className="font-bold text-slate-900">
                  {vidyaLeadsCount > 0
                    ? Math.round((vidyaEnrolled / vidyaLeadsCount) * 100)
                    : 0}
                  %
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Apni Estate Realty Card */}
        {(selectedBrand === 'ALL' || selectedBrand === 'APNI_ESTATE') && (
          <Card
            className={`transition-all ${
              selectedBrand === 'APNI_ESTATE'
                ? 'ring-2 ring-emerald-500 shadow-md'
                : 'hover:shadow-md'
            }`}
          >
            <CardHeader className="bg-gradient-to-r from-emerald-50/70 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Apni Estate (Real Estate Division)
                  </h3>
                  <p className="text-xs text-slate-500">
                    {estateLeadsCount} Property Buyer Leads
                  </p>
                </div>
              </div>
              <BrandBadge brand="APNI_ESTATE" size="xs" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                  <p className="text-[11px] font-semibold text-slate-500">Interested</p>
                  <p className="text-lg font-extrabold text-slate-900">{estateInterested}</p>
                </div>
                <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-2.5">
                  <p className="text-[11px] font-semibold text-sky-700">Site Visits</p>
                  <p className="text-lg font-extrabold text-sky-700">{estateVisits}</p>
                </div>
                <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-2.5">
                  <p className="text-[11px] font-semibold text-teal-700">Deals Closed</p>
                  <p className="text-lg font-extrabold text-teal-700">{estateClosed}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Conversion Rate</span>
                <span className="font-bold text-slate-900">
                  {estateLeadsCount > 0
                    ? Math.round((estateClosed / estateLeadsCount) * 100)
                    : 0}
                  %
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Telecaller Performance Leaderboard */}
      <Card>
        <CardHeader>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                Telecaller Team Productivity
              </h3>
              {selectedBrand !== 'ALL' && (
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                  {selectedBrand === 'APNI_VIDYA' ? 'Apni Vidya Team' : 'Apni Estate Team'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Live call target completion & lead conversion tracking for active brand filter
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onNavigateToTelecallers}>
              Manage Team
            </Button>
            <Button size="sm" variant="indigo" onClick={onNavigateToUpload}>
              <Upload className="w-3.5 h-3.5" />
              <span>Import Leads</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredTelecallers.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Filter className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-semibold">No telecallers assigned to this division.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTelecallers.map((tc) => {
                const tcLeads = activeLeads.filter((l) => l.assignedTo === tc.id);
                const callsMade = tcLeads.filter(
                  (l) => (l.totalCallsCount && l.totalCallsCount > 0) || l.status !== 'NEW'
                ).length;
                const target = tc.dailyTarget || 50;
                const progress =
                  target > 0 ? Math.min(100, Math.round((callsMade / target) * 100)) : 0;
                const conversions = tcLeads.filter(
                  (l) =>
                    l.status === 'ENROLLED' ||
                    l.status === 'CLOSED' ||
                    l.status === 'SALE'
                ).length;

                return (
                  <div
                    key={tc.id}
                    onClick={() => {
                      soundManager.playTap();
                      onSelectTelecaller(tc);
                    }}
                    className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-black flex items-center justify-center text-xs shrink-0">
                        {tc.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm truncate">
                            {tc.name}
                          </h4>
                          <BrandBadge brand={tc.brandAccess} size="xs" />
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {tc.loginId} • {tcLeads.length} leads in view
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 self-end sm:self-auto w-full sm:w-auto justify-between sm:justify-end">
                      {/* Progress Bar */}
                      <div className="w-36 sm:w-48 space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold">
                          <span className="text-slate-500">Daily Calls</span>
                          <span className="text-slate-900 font-bold">
                            {callsMade}/{target} ({progress}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              progress >= 100
                                ? 'bg-emerald-500'
                                : progress >= 60
                                ? 'bg-blue-600'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Won Deals Badge */}
                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {conversions} Won
                        </span>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Daily Follow-ups Monitor Modal */}
      <AdminDailyFollowUpsModal
        isOpen={showFollowUpsModal}
        onClose={() => setShowFollowUpsModal(false)}
        leads={activeLeads}
        telecallers={filteredTelecallers}
        onSelectLeadForDetail={(lead) => {
          setShowFollowUpsModal(false);
          if (onSelectLeadForDetail) onSelectLeadForDetail(lead);
        }}
        onLeadsUpdated={() => {
          if (onLeadsUpdated) onLeadsUpdated();
        }}
      />
    </div>
  );
};
