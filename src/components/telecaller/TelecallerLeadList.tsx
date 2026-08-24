import React, { useState } from 'react';
import {
  Phone,
  MessageSquare,
  Search,
  Filter,
  ChevronRight,
  Clock,
  AlertCircle,
  GraduationCap,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Lead, AuthUser } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { BrandBadge } from '../common/BrandBadge';
import { soundManager } from '../../lib/sound';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardContent } from '../ui/Card';

interface TelecallerLeadListProps {
  leads: Lead[];
  currentUser?: AuthUser;
  currentTelecaller?: AuthUser;
  onSelectLead: (lead: Lead) => void;
  onInitiateCall: (lead: Lead) => void;
  onInitiateWhatsApp: (lead: Lead) => void;
}

export const TelecallerLeadList: React.FC<TelecallerLeadListProps> = ({
  leads = [],
  currentUser: propCurrentUser,
  currentTelecaller,
  onSelectLead,
  onInitiateCall,
  onInitiateWhatsApp,
}) => {
  const currentUser = propCurrentUser || currentTelecaller;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  const todayStr = new Date().toISOString().split('T')[0];
  const isVidya = currentUser?.brandAccess === 'APNI_VIDYA';
  const isEstate = currentUser?.brandAccess === 'APNI_ESTATE';

  const filterTabs = React.useMemo(() => {
    const baseTabs = [
      { label: 'All Leads', value: 'ALL' },
      { label: 'Today Due ⏰', value: 'TODAY' },
      { label: 'Overdue 🔴', value: 'OVERDUE' },
      { label: 'New', value: 'NEW' },
      { label: 'Interested', value: 'INTERESTED' },
      { label: 'Follow-up', value: 'FOLLOW_UP' },
      { label: 'Callback', value: 'CALLBACK' },
    ];

    if (isVidya) {
      baseTabs.push(
        { label: 'Demo Class 🎓', value: 'DEMO' },
        { label: 'Enrolled Won 🏆', value: 'ENROLLED' }
      );
    } else if (isEstate) {
      baseTabs.push(
        { label: 'Site Visit 📍', value: 'SITE_VISIT_SCHEDULED' },
        { label: 'Negotiating 🤝', value: 'NEGOTIATING' },
        { label: 'Closed Deal 🏆', value: 'CLOSED' }
      );
    } else {
      baseTabs.push(
        { label: 'Demo / Visit', value: 'DEMO' },
        { label: 'Site Visit', value: 'SITE_VISIT_SCHEDULED' },
        { label: 'Won Deals', value: 'ENROLLED' }
      );
    }

    baseTabs.push(
      { label: 'Ringing / No Ans', value: 'NO_ANSWER' },
      { label: 'Busy', value: 'BUSY' },
      { label: 'Not Interested', value: 'NOT_INTERESTED' }
    );

    return baseTabs;
  }, [isVidya, isEstate]);

  const filteredLeads = leads.filter((lead) => {
    // Search match
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchName = lead.name.toLowerCase().includes(q);
      const matchPhone = lead.phone.replace(/[\s+-]/g, '').includes(q.replace(/[\s+-]/g, ''));
      const matchCity = lead.city?.toLowerCase().includes(q);
      const matchCourse = lead.courseInterest?.toLowerCase().includes(q);
      const matchProp = lead.propertyType?.toLowerCase().includes(q);
      const matchLoc = lead.preferredLocation?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchCity && !matchCourse && !matchProp && !matchLoc) {
        return false;
      }
    }

    if (activeFilter === 'ALL') return true;

    if (activeFilter === 'TODAY') {
      return lead.activeFollowUp && lead.activeFollowUp.dueDate === todayStr;
    }

    if (activeFilter === 'OVERDUE') {
      return lead.activeFollowUp && lead.activeFollowUp.dueDate < todayStr;
    }

    if (activeFilter === 'ENROLLED' && (lead.status === 'ENROLLED' || lead.status === 'SALE')) {
      return true;
    }

    if (activeFilter === 'CLOSED' && (lead.status === 'CLOSED' || lead.status === 'SALE' || lead.status === 'BOOKING')) {
      return true;
    }

    return lead.status === activeFilter;
  });

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
            <Phone className="w-3.5 h-3.5" />
            <span>Calling Queue</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            My Assigned Leads ({leads.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Filter through your leads and start calling with 1-tap outcome logging.
          </p>
        </div>

        <BrandBadge brand={currentUser?.brandAccess || 'APNI_VIDYA'} size="sm" />
      </div>

      {/* Search & Horizontal Filter Bar */}
      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads by name, phone, course interest, city..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all min-h-[44px]"
            />
          </div>

          {/* Horizontal Scrollable Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setActiveFilter(tab.value);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer select-none min-h-[38px] ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Showing {filteredLeads.length} of {leads.length} Leads
          </span>
        </div>

        {filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-slate-400 space-y-2">
              <Search className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No leads found for this filter.</p>
              <p className="text-xs text-slate-400">Try switching your category filter or clearing search.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLeads.map((lead) => {
              const isOverdue = lead.activeFollowUp && lead.activeFollowUp.dueDate < todayStr;
              const isToday = lead.activeFollowUp && lead.activeFollowUp.dueDate === todayStr;

              return (
                <Card
                  key={lead.id}
                  onClick={() => {
                    soundManager.playTap();
                    onSelectLead(lead);
                  }}
                  className={`hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between ${
                    isOverdue ? 'border-rose-300 bg-rose-50/20' : ''
                  }`}
                >
                  <CardContent className="p-4 sm:p-5 space-y-3">
                    {/* Top Row: Name, Phone, Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-slate-900 text-base truncate">{lead.name}</h3>
                          <BrandBadge brand={lead.brand} size="xs" />
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{lead.phone}</p>
                      </div>

                      <StatusBadge status={lead.status} size="xs" />
                    </div>

                    {/* Inquiry Details */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="font-semibold text-slate-800">
                        {lead.brand === 'APNI_VIDYA'
                          ? lead.courseInterest || 'Course Inquiry'
                          : lead.propertyType || 'Property Inquiry'}
                      </div>
                      <div className="text-slate-500 text-[11px] flex items-center justify-between">
                        <span>{lead.city || 'Location open'}</span>
                        {lead.budget && <span className="font-semibold text-emerald-700">{lead.budget}</span>}
                      </div>
                    </div>

                    {/* Active Follow-up Badge (if any) */}
                    {lead.activeFollowUp && (
                      <div
                        className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                          isOverdue
                            ? 'bg-rose-100 text-rose-800'
                            : isToday
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {isOverdue ? 'Overdue: ' : isToday ? 'Due Today: ' : 'Follow-up: '}
                          {lead.activeFollowUp.dueDate} {lead.activeFollowUp.dueTime || ''}
                        </span>
                      </div>
                    )}
                  </CardContent>

                  {/* Actions Footer */}
                  <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/70 rounded-b-2xl flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {lead.totalCallsCount ? `${lead.totalCallsCount} calls logged` : 'Uncalled lead'}
                    </span>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="success"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundManager.playTap();
                          onInitiateWhatsApp(lead);
                        }}
                        leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                      >
                        WhatsApp
                      </Button>

                      <Button
                        size="sm"
                        variant="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundManager.playTap();
                          onInitiateCall(lead);
                        }}
                        leftIcon={<Phone className="w-3.5 h-3.5" />}
                      >
                        Call
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
