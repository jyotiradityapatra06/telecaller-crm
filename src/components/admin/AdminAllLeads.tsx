import React, { useState } from 'react';
import {
  Users,
  Search,
  Check,
  Trash2,
  UserPlus,
  Phone,
  UserCheck,
  GraduationCap,
  Building2,
  Layers,
  Zap,
  Filter,
  ArrowRight,
  Clock,
  Plus,
  CheckSquare,
  Square,
  MessageSquare,
} from 'lucide-react';
import { Lead, AuthUser, LeadStatus, BusinessBrand } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { BrandBadge } from '../common/BrandBadge';
import { api } from '../../lib/api';
import { soundManager } from '../../lib/sound';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Modal } from '../ui/Modal';

interface AdminAllLeadsProps {
  leads: Lead[];
  telecallers: AuthUser[];
  onLeadsUpdated: () => void;
  onSelectLeadForDetail: (lead: Lead) => void;
  onInitiateCall?: (lead: Lead) => void;
  onInitiateWhatsApp?: (lead: Lead) => void;
  selectedBrand?: 'ALL' | BusinessBrand;
  onSelectBrand?: (brand: 'ALL' | BusinessBrand) => void;
}

export const AdminAllLeads: React.FC<AdminAllLeadsProps> = ({
  leads,
  telecallers,
  onLeadsUpdated,
  onSelectLeadForDetail,
  onInitiateCall,
  onInitiateWhatsApp,
  selectedBrand: propBrand = 'ALL',
  onSelectBrand,
}) => {
  const [brandFilter, setBrandFilter] = useState<'ALL' | BusinessBrand>(propBrand);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [telecallerFilter, setTelecallerFilter] = useState('ALL');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [bulkTargetTcId, setBulkTargetTcId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isAutoDistributing, setIsAutoDistributing] = useState(false);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);

  // Single Lead Create Form
  const [newLeadBrand, setNewLeadBrand] = useState<BusinessBrand>('APNI_VIDYA');
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadCity, setNewLeadCity] = useState('');
  const [newLeadCourse, setNewLeadCourse] = useState('Full Stack Web Development');
  const [newLeadQual, setNewLeadQual] = useState('Graduate (B.Tech)');
  const [newLeadBatch, setNewLeadBatch] = useState('Weekday Morning (8-10 AM)');
  const [newLeadPropType, setNewLeadPropType] = useState('3 BHK Luxury High-rise');
  const [newLeadBudget, setNewLeadBudget] = useState('₹1.2 Cr - ₹1.8 Cr');
  const [newLeadLoc, setNewLeadLoc] = useState('');
  const [newLeadSource, setNewLeadSource] = useState('Manual Entry');
  const [newLeadTc, setNewLeadTc] = useState('');
  const [newLeadNotes, setNewLeadNotes] = useState('');

  const currentBrand = onSelectBrand ? propBrand : brandFilter;

  const handleBrandChange = (brand: 'ALL' | BusinessBrand) => {
    soundManager.playTap();
    setBrandFilter(brand);
    if (onSelectBrand) onSelectBrand(brand);
  };

  const filteredLeads = leads.filter((lead) => {
    // Brand filter
    if (currentBrand !== 'ALL' && lead.brand !== currentBrand) {
      return false;
    }

    // Search query match
    const q = search.toLowerCase().trim();
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

    // Telecaller filter
    if (telecallerFilter === 'UNASSIGNED') {
      if (lead.assignedTo) return false;
    } else if (telecallerFilter !== 'ALL') {
      if (lead.assignedTo !== telecallerFilter) return false;
    }

    // Status filter
    if (statusFilter !== 'ALL' && lead.status !== statusFilter) {
      return false;
    }

    return true;
  });

  const unassignedFilteredCount = filteredLeads.filter((l) => !l.assignedTo).length;

  const handleToggleSelectLead = (id: string) => {
    soundManager.playTap();
    if (selectedLeadIds.includes(id)) {
      setSelectedLeadIds(selectedLeadIds.filter((item) => item !== id));
    } else {
      setSelectedLeadIds([...selectedLeadIds, id]);
    }
  };

  const handleSelectAll = () => {
    soundManager.playTap();
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    }
  };

  const handleSelectAllUnassigned = () => {
    soundManager.playTap();
    const unassigned = filteredLeads.filter((l) => !l.assignedTo).map((l) => l.id);
    setSelectedLeadIds(unassigned);
  };

  const handleBulkAssign = async () => {
    if (selectedLeadIds.length === 0 || !bulkTargetTcId) return;
    setIsAssigning(true);
    try {
      await api.assignLeads(
        selectedLeadIds,
        bulkTargetTcId === 'UNASSIGN' ? null : bulkTargetTcId
      );
      soundManager.playSuccess();
      setSelectedLeadIds([]);
      setBulkTargetTcId('');
      onLeadsUpdated();
    } catch (err: any) {
      soundManager.playError();
      alert(err.message || 'Failed to assign leads');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAutoDistribute = async () => {
    setIsAutoDistributing(true);
    try {
      const res = await api.autoDistributeLeads(currentBrand === 'ALL' ? undefined : currentBrand);
      soundManager.playSuccess();
      alert(res.message || 'Leads distributed across telecallers!');
      onLeadsUpdated();
    } catch (err: any) {
      soundManager.playError();
      alert(err.message || 'Auto-distribution failed');
    } finally {
      setIsAutoDistributing(false);
    }
  };

  const handleCreateSingleLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim() || !newLeadPhone.trim()) {
      alert('Name and Phone number are required.');
      return;
    }

    try {
      await api.createLead({
        brand: newLeadBrand,
        name: newLeadName.trim(),
        phone: newLeadPhone.trim(),
        email: newLeadEmail.trim() || undefined,
        city: newLeadCity.trim() || undefined,
        courseInterest: newLeadBrand === 'APNI_VIDYA' ? newLeadCourse : undefined,
        qualification: newLeadBrand === 'APNI_VIDYA' ? newLeadQual : undefined,
        preferredBatch: newLeadBrand === 'APNI_VIDYA' ? newLeadBatch : undefined,
        propertyType: newLeadBrand === 'APNI_ESTATE' ? newLeadPropType : undefined,
        budget: newLeadBrand === 'APNI_ESTATE' ? newLeadBudget : undefined,
        preferredLocation: newLeadBrand === 'APNI_ESTATE' ? newLeadLoc : undefined,
        source: newLeadSource || 'Manual Entry',
        notes: newLeadNotes ? newLeadNotes.trim() : undefined,
        assignedTo: newLeadTc || undefined,
      });

      soundManager.playSuccess();
      setShowAddLeadModal(false);
      // Reset form
      setNewLeadName('');
      setNewLeadPhone('');
      setNewLeadEmail('');
      setNewLeadCity('');
      setNewLeadNotes('');
      setNewLeadLoc('');
      onLeadsUpdated();
    } catch (err: any) {
      soundManager.playError();
      alert(err.message || 'Failed to create lead');
    }
  };

  const getTelecallerName = (tcId?: string) => {
    if (!tcId) return 'Unassigned';
    const found = telecallers.find((t) => t.id === tcId);
    return found ? found.name : 'Unknown';
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Master Database</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            All Organization Leads
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage, filter, and assign {leads.length} total leads across Apni Vidya & Apni Estate.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoDistribute}
            isLoading={isAutoDistributing}
            leftIcon={<Zap className="w-4 h-4 text-amber-500" />}
          >
            Auto Distribute
          </Button>

          <Button
            variant="indigo"
            size="sm"
            onClick={() => setShowAddLeadModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New Lead
          </Button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Top Bar: Search + Brand Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, phone, course, property, city..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all min-h-[42px]"
              />
            </div>

            {/* Brand Filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => handleBrandChange('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentBrand === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Brands
              </button>
              <button
                type="button"
                onClick={() => handleBrandChange('APNI_VIDYA')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentBrand === 'APNI_VIDYA' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                Apni Vidya
              </button>
              <button
                type="button"
                onClick={() => handleBrandChange('APNI_ESTATE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentBrand === 'APNI_ESTATE' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-600'
                }`}
              >
                Apni Estate
              </button>
            </div>
          </div>

          {/* Secondary Dropdown Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
            {/* Status Filter */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-h-[40px]"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">New Leads</option>
                <option value="INTERESTED">Interested</option>
                <option value="CALLBACK">Callback</option>
                <option value="FOLLOW_UP">Follow-up</option>
                <option value="DEMO">Demo Class 🎓</option>
                <option value="ENROLLED">Enrolled 🏆</option>
                <option value="SITE_VISIT_SCHEDULED">Site Visit 📍</option>
                <option value="NEGOTIATING">Negotiating 🤝</option>
                <option value="CLOSED">Closed Deal 🏆</option>
                <option value="NO_ANSWER">No Answer</option>
                <option value="BUSY">Busy</option>
                <option value="NOT_INTERESTED">Not Interested</option>
              </select>
            </div>

            {/* Telecaller Filter */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Filter by Telecaller
              </label>
              <select
                value={telecallerFilter}
                onChange={(e) => setTelecallerFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-h-[40px]"
              >
                <option value="ALL">All Telecallers</option>
                <option value="UNASSIGNED">⚠️ Unassigned Leads ({unassignedFilteredCount})</option>
                {telecallers.map((tc) => (
                  <option key={tc.id} value={tc.id}>
                    {tc.name} ({tc.loginId})
                  </option>
                ))}
              </select>
            </div>

            {/* Selection Shortcuts */}
            <div className="flex items-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSelectAll}
                className="flex-1"
              >
                {selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0
                  ? 'Deselect All'
                  : `Select All (${filteredLeads.length})`}
              </Button>
              {unassignedFilteredCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSelectAllUnassigned}
                  className="flex-1 text-amber-700 border-amber-300 bg-amber-50/50 hover:bg-amber-50"
                >
                  Unassigned ({unassignedFilteredCount})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Bar (Appears when leads are checked) */}
      {selectedLeadIds.length > 0 && (
        <div className="sticky top-2 z-20 bg-slate-900 text-white rounded-2xl p-3.5 sm:p-4 shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
              {selectedLeadIds.length}
            </span>
            <span className="text-sm font-bold text-slate-100">
              {selectedLeadIds.length} {selectedLeadIds.length === 1 ? 'lead' : 'leads'} selected
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={bulkTargetTcId}
              onChange={(e) => setBulkTargetTcId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-h-[38px]"
            >
              <option value="">Choose Telecaller to Assign...</option>
              <option value="UNASSIGN">⚠️ Unassign Leads</option>
              {telecallers.map((tc) => (
                <option key={tc.id} value={tc.id}>
                  {tc.name} ({tc.loginId} - {tc.brandAccess})
                </option>
              ))}
            </select>

            <Button
              size="sm"
              variant="primary"
              disabled={!bulkTargetTcId}
              onClick={handleBulkAssign}
              isLoading={isAssigning}
            >
              Apply Assignment
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedLeadIds([])}
              className="text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Main Leads Data View (Desktop Table + Mobile Cards) */}
      <Card>
        <CardHeader>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">
              Showing {filteredLeads.length} of {leads.length} Leads
            </h3>
            <p className="text-xs text-slate-500">Click any row or card to inspect call history and edit details</p>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <Users className="w-12 h-12 mx-auto text-slate-300" />
              <h4 className="text-base font-bold text-slate-700">No leads match your active filters</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try clearing your search query or switching your brand / status filter dropdown.
              </p>
            </div>
          ) : (
            <>
              {/* 1. Desktop / Tablet Responsive Table View (Hidden on mobile) */}
              <div className="hidden md:block overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/80 sticky top-0">
                    <tr>
                      <th className="p-4 w-10">
                        <input
                          type="checkbox"
                          checked={selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </th>
                      <th className="py-4 px-3">Client Details</th>
                      <th className="py-4 px-3">Brand</th>
                      <th className="py-4 px-3">Inquiry Details</th>
                      <th className="py-4 px-3">Assigned Telecaller</th>
                      <th className="py-4 px-3">Status</th>
                      <th className="py-4 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                    {filteredLeads.map((lead) => {
                      const isSelected = selectedLeadIds.includes(lead.id);
                      return (
                        <tr
                          key={lead.id}
                          onClick={() => {
                            soundManager.playTap();
                            onSelectLeadForDetail(lead);
                          }}
                          className={`hover:bg-blue-50/40 transition-colors cursor-pointer ${
                            isSelected ? 'bg-blue-50/70' : ''
                          }`}
                        >
                          <td
                            className="p-4"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSelectLead(lead.id);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>

                          <td className="py-3.5 px-3 min-w-[180px]">
                            <div className="font-bold text-slate-900 text-sm">{lead.name}</div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">{lead.phone}</div>
                            {lead.city && <div className="text-[11px] text-slate-400 mt-0.5">{lead.city}</div>}
                          </td>

                          <td className="py-3.5 px-3">
                            <BrandBadge brand={lead.brand} size="xs" />
                          </td>

                          <td className="py-3.5 px-3 max-w-[220px]">
                            {lead.brand === 'APNI_VIDYA' ? (
                              <div>
                                <div className="text-xs font-semibold text-slate-900 truncate">
                                  {lead.courseInterest || 'General Course'}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate">
                                  {lead.qualification || lead.preferredBatch || 'No batch specified'}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="text-xs font-semibold text-slate-900 truncate">
                                  {lead.propertyType || 'Residential Unit'}
                                </div>
                                <div className="text-[11px] text-emerald-700 font-medium truncate">
                                  {lead.budget || lead.preferredLocation || 'Budget open'}
                                </div>
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-3">
                            {lead.assignedTo ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                                <span>{getTelecallerName(lead.assignedTo)}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                                Unassigned
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-3">
                            <StatusBadge status={lead.status} size="sm" />
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {onInitiateWhatsApp && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    soundManager.playTap();
                                    onInitiateWhatsApp(lead);
                                  }}
                                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                                  title="Send WhatsApp"
                                  aria-label="Send WhatsApp"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </button>
                              )}

                              {onInitiateCall && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    soundManager.playTap();
                                    onInitiateCall(lead);
                                  }}
                                  className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                  title="Call Client"
                                  aria-label="Call Client"
                                >
                                  <Phone className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  soundManager.playTap();
                                  onSelectLeadForDetail(lead);
                                }}
                                className="text-xs font-bold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                <span>View</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 2. Mobile Lead Cards View (Shown on small screens) */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredLeads.map((lead) => {
                  const isSelected = selectedLeadIds.includes(lead.id);
                  return (
                    <div
                      key={lead.id}
                      onClick={() => {
                        soundManager.playTap();
                        onSelectLeadForDetail(lead);
                      }}
                      className={`p-4 hover:bg-slate-50 transition-colors space-y-3 cursor-pointer ${
                        isSelected ? 'bg-blue-50/70' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => handleToggleSelectLead(lead.id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm truncate">{lead.name}</h4>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">{lead.phone}</p>
                          </div>
                        </div>

                        <StatusBadge status={lead.status} size="xs" />
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                        <BrandBadge brand={lead.brand} size="xs" />
                        <span className="text-slate-500 font-medium">
                          Assigned: <strong className="text-slate-800">{getTelecallerName(lead.assignedTo)}</strong>
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                        {onInitiateWhatsApp && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={(e) => {
                              e.stopPropagation();
                              soundManager.playTap();
                              onInitiateWhatsApp(lead);
                            }}
                            leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                            className="flex-1"
                          >
                            WhatsApp
                          </Button>
                        )}
                        {onInitiateCall && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              soundManager.playTap();
                              onInitiateCall(lead);
                            }}
                            leftIcon={<Phone className="w-3.5 h-3.5" />}
                            className="flex-1"
                          >
                            Call
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Single Lead Modal */}
      <Modal
        isOpen={showAddLeadModal}
        onClose={() => setShowAddLeadModal(false)}
        title="Add Single Lead to Database"
        subtitle="Direct manual lead registration with auto brand tagging"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateSingleLead} className="space-y-4">
          {/* Brand Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Business Brand</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  setNewLeadBrand('APNI_VIDYA');
                }}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  newLeadBrand === 'APNI_VIDYA'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Apni Vidya (EdTech)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  setNewLeadBrand('APNI_ESTATE');
                }}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  newLeadBrand === 'APNI_ESTATE'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Apni Estate (Real Estate)</span>
              </button>
            </div>
          </div>

          {/* Core Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={newLeadName}
                onChange={(e) => setNewLeadName(e.target.value)}
                placeholder="e.g. Ramesh Verma"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[42px]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={newLeadPhone}
                onChange={(e) => setNewLeadPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[42px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                value={newLeadEmail}
                onChange={(e) => setNewLeadEmail(e.target.value)}
                placeholder="ramesh@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[42px]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">City / Region</label>
              <input
                type="text"
                value={newLeadCity}
                onChange={(e) => setNewLeadCity(e.target.value)}
                placeholder="e.g. Mumbai, Bangalore..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[42px]"
              />
            </div>
          </div>

          {/* Brand-Specific Fields */}
          {newLeadBrand === 'APNI_VIDYA' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100">
              <div>
                <label className="text-[11px] font-bold text-indigo-900 block mb-1">Course Interest</label>
                <input
                  type="text"
                  value={newLeadCourse}
                  onChange={(e) => setNewLeadCourse(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-indigo-200 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-indigo-900 block mb-1">Qualification</label>
                <input
                  type="text"
                  value={newLeadQual}
                  onChange={(e) => setNewLeadQual(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-indigo-200 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-indigo-900 block mb-1">Preferred Batch</label>
                <input
                  type="text"
                  value={newLeadBatch}
                  onChange={(e) => setNewLeadBatch(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-indigo-200 text-xs font-medium"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100">
              <div>
                <label className="text-[11px] font-bold text-emerald-900 block mb-1">Property Type</label>
                <input
                  type="text"
                  value={newLeadPropType}
                  onChange={(e) => setNewLeadPropType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-emerald-200 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-emerald-900 block mb-1">Budget Range</label>
                <input
                  type="text"
                  value={newLeadBudget}
                  onChange={(e) => setNewLeadBudget(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-emerald-200 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-emerald-900 block mb-1">Location Preference</label>
                <input
                  type="text"
                  value={newLeadLoc}
                  onChange={(e) => setNewLeadLoc(e.target.value)}
                  placeholder="e.g. Whitefield, Sector 62"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-emerald-200 text-xs font-medium"
                />
              </div>
            </div>
          )}

          {/* Telecaller Assignment */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Assign to Telecaller</label>
            <select
              value={newLeadTc}
              onChange={(e) => setNewLeadTc(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[42px] cursor-pointer"
            >
              <option value="">Leave Unassigned (Pool)</option>
              {telecallers.map((tc) => (
                <option key={tc.id} value={tc.id}>
                  {tc.name} ({tc.loginId} - {tc.brandAccess})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setShowAddLeadModal(false)}>
              Cancel
            </Button>
            <Button variant="indigo" type="submit">
              Save & Register Lead
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
