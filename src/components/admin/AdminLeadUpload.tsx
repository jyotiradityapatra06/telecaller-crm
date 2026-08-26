import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Check,
  UserCheck,
  Sparkles,
  CheckSquare,
  Square,
  GraduationCap,
  Building2,
  Zap,
  ArrowRight,
  Download,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AuthUser, BusinessBrand, ParsedLeadRow } from '../../types';
import { api } from '../../lib/api';
import { soundManager } from '../../lib/sound';
import { parseExcelOrCsv, downloadSampleTemplate } from '../../lib/excelParser';
import { BrandBadge } from '../common/BrandBadge';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardContent } from '../ui/Card';

interface AdminLeadUploadProps {
  telecallers: AuthUser[];
  onLeadsImported: () => void;
  onNavigateToDashboard: () => void;
}

interface RawImportLead extends ParsedLeadRow {
  id: string;
}

const SAMPLE_BATCHES: {
  name: string;
  brand: BusinessBrand;
  leads: RawImportLead[];
}[] = [
  {
    name: '🎓 Apni Vidya Student Inquiries (6 Leads)',
    brand: 'APNI_VIDYA',
    leads: [
      {
        id: 'imp-v1',
        name: 'Kunal Singhania',
        phone: '+91 98112 33445',
        city: 'Delhi NCR',
        brand: 'APNI_VIDYA',
        courseInterest: 'Full Stack Web Development',
        qualification: 'Graduate (BCA)',
        preferredBatch: 'Weekday Morning (8-10 AM)',
        source: 'Instagram Ad',
      },
      {
        id: 'imp-v2',
        name: 'Ritu Sen',
        phone: '+91 98205 66778',
        city: 'Pune',
        brand: 'APNI_VIDYA',
        courseInterest: 'Data Science & Generative AI',
        qualification: 'Working Professional (IT)',
        preferredBatch: 'Weekend Intensive (Sat-Sun)',
        source: 'Google Search Ads',
      },
      {
        id: 'imp-v3',
        name: 'Manoj Hegde',
        phone: '+91 97410 99001',
        city: 'Bengaluru',
        brand: 'APNI_VIDYA',
        courseInterest: 'UI/UX & Product Design',
        qualification: 'Final Year Student (B.Des)',
        preferredBatch: 'Weekday Evening (7-9 PM)',
        source: 'Website Inquiry',
      },
      {
        id: 'imp-v4',
        name: 'Ananya Roy',
        phone: '+91 98901 22334',
        city: 'Kolkata',
        brand: 'APNI_VIDYA',
        courseInterest: 'Python & Cloud DevOps',
        qualification: 'Graduate (B.Tech ECE)',
        preferredBatch: 'Fast-track Bootcamp',
        source: 'YouTube Masterclass',
      },
      {
        id: 'imp-v5',
        name: 'Saurabh Joshi',
        phone: '+91 94140 55667',
        city: 'Jaipur',
        brand: 'APNI_VIDYA',
        courseInterest: 'Banking & Financial Analysis',
        qualification: 'Graduate (B.Com)',
        preferredBatch: 'Weekday Morning (8-10 AM)',
        source: 'Meta Lead Form',
      },
      {
        id: 'imp-v6',
        name: 'Harini Sundaram',
        phone: '+91 98402 77889',
        city: 'Chennai',
        brand: 'APNI_VIDYA',
        courseInterest: 'Digital Marketing & Growth',
        qualification: 'Final Year (BBA)',
        preferredBatch: 'Weekend Intensive (Sat-Sun)',
        source: 'Campus Webinar',
      },
    ],
  },
  {
    name: '🏢 Apni Estate Luxury Inquiries (5 Leads)',
    brand: 'APNI_ESTATE',
    leads: [
      {
        id: 'imp-e1',
        name: 'Vikramaditya Singhal',
        phone: '+91 99887 76655',
        city: 'Gurugram',
        brand: 'APNI_ESTATE',
        propertyType: '4 BHK Luxury Penthouse',
        budget: '₹3.5 Cr - ₹4.5 Cr',
        preferredLocation: 'Golf Course Extension Road',
        source: 'Property Portal',
      },
      {
        id: 'imp-e2',
        name: 'Dr. Meenakshi Iyer',
        phone: '+91 98334 11223',
        city: 'Mumbai',
        brand: 'APNI_ESTATE',
        propertyType: '3 BHK Sea Facing Residence',
        budget: '₹4.0 Cr - ₹6.0 Cr',
        preferredLocation: 'Worli / Prabhadevi',
        source: 'Direct Walk-in',
      },
      {
        id: 'imp-e3',
        name: 'Gautam Nambiar',
        phone: '+91 99450 88990',
        city: 'Bengaluru',
        brand: 'APNI_ESTATE',
        propertyType: '4 BHK Gated Villa',
        budget: '₹2.8 Cr - ₹3.6 Cr',
        preferredLocation: 'Sarjapur / Whitefield',
        source: 'Facebook Ad',
      },
      {
        id: 'imp-e4',
        name: 'Sanjay Deshmukh',
        phone: '+91 98220 44556',
        city: 'Pune',
        brand: 'APNI_ESTATE',
        propertyType: '3 BHK High-rise Garden Unit',
        budget: '₹1.5 Cr - ₹2.2 Cr',
        preferredLocation: 'Baner / Balewadi',
        source: 'Real Estate Expo',
      },
      {
        id: 'imp-e5',
        name: 'Kavita Reddy',
        phone: '+91 98490 33221',
        city: 'Hyderabad',
        brand: 'APNI_ESTATE',
        propertyType: 'Commercial Office Space',
        budget: '₹1.8 Cr - ₹2.5 Cr',
        preferredLocation: 'HITEC City / Gachibowli',
        source: 'Google Search Ads',
      },
    ],
  },
];

export const AdminLeadUpload: React.FC<AdminLeadUploadProps> = ({
  telecallers,
  onLeadsImported,
  onNavigateToDashboard,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedBrand, setSelectedBrand] = useState<BusinessBrand>('APNI_VIDYA');
  const [importedLeads, setImportedLeads] = useState<RawImportLead[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [targetTelecallerId, setTargetTelecallerId] = useState<string>('ROUND_ROBIN');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    try {
      const parsed = await parseExcelOrCsv(file, selectedBrand);
      if (parsed.validRows.length === 0) {
        setErrorMsg('No valid rows found in file.');
        soundManager.playError();
        return;
      }

      const leadsWithId = parsed.validRows.map((l, i) => ({
        ...l,
        id: `upl-${Date.now()}-${i}`,
      }));

      setImportedLeads(leadsWithId);
      setSelectedLeadIds(leadsWithId.map((l) => l.id));
      soundManager.playSuccess();
    } catch (err: any) {
      soundManager.playError();
      setErrorMsg(err.message || 'Failed to read file');
    }
  };

  const handleLoadSampleBatch = (batch: (typeof SAMPLE_BATCHES)[0]) => {
    soundManager.playTap();
    setSelectedBrand(batch.brand);
    setImportedLeads(batch.leads);
    setSelectedLeadIds(batch.leads.map((l) => l.id));
    setUploadSuccessMessage('');
  };

  const handleToggleSelectAll = () => {
    if (selectedLeadIds.length === importedLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(importedLeads.map((l) => l.id));
    }
  };

  const handleToggleLead = (id: string) => {
    if (selectedLeadIds.includes(id)) {
      setSelectedLeadIds(selectedLeadIds.filter((item) => item !== id));
    } else {
      setSelectedLeadIds([...selectedLeadIds, id]);
    }
  };

  const handleConfirmImport = async () => {
    const leadsToImport = importedLeads.filter((l) => selectedLeadIds.includes(l.id));
    if (leadsToImport.length === 0) {
      alert('Please select at least 1 lead to import.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');

    try {
      const payloadLeads = leadsToImport.map((l) => {
        const { id: _, ...rest } = l;
        return rest;
      });

      const response = await api.importLeads(
        payloadLeads,
        targetTelecallerId === 'ROUND_ROBIN' ? undefined : targetTelecallerId === 'UNASSIGNED' ? null : targetTelecallerId
      );

      soundManager.playSuccess();
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });

      if (response.importedCount > 0) {
        setUploadSuccessMessage(
          `Successfully imported and assigned ${response.importedCount} leads into CRM database!`
        );
      } else {
        setUploadSuccessMessage(
          `No new leads were imported. All ${leadsToImport.length} rows were duplicates (${response.duplicateCount || 0}) or invalid (${response.invalidCount || 0}).`
        );
      }
      setImportedLeads([]);
      setSelectedLeadIds([]);
      onLeadsImported();
    } catch (err: any) {
      soundManager.playError();
      setErrorMsg(err.message || 'Import failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const eligibleTelecallers = telecallers.filter(
    (tc) => tc.brandAccess === selectedBrand || tc.brandAccess === 'BOTH'
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
            <Upload className="w-3.5 h-3.5" />
            <span>Lead Ingestion Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Import Leads from Excel & CSV
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Bulk upload client spreadsheets or test with one-click multi-brand sample batches.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadSampleTemplate(selectedBrand)}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Download Excel Template
        </Button>
      </div>

      {/* Success Notification */}
      {uploadSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-bold">{uploadSuccessMessage}</span>
          </div>
          <Button size="sm" variant="success" onClick={onNavigateToDashboard}>
            Go to Dashboard
          </Button>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="text-sm font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Upload Setup Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Brand Selector & Dropzone */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Select Target Brand */}
          <Card>
            <CardHeader>
              <h3 className="text-base font-extrabold text-slate-900">Step 1: Select Brand Queue</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setSelectedBrand('APNI_VIDYA');
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedBrand === 'APNI_VIDYA'
                      ? 'bg-indigo-50/80 border-indigo-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    {selectedBrand === 'APNI_VIDYA' && (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Apni Vidya (EdTech)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Course inquiries, academic background, preferred batch timings.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    setSelectedBrand('APNI_ESTATE');
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedBrand === 'APNI_ESTATE'
                      ? 'bg-emerald-50/80 border-emerald-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <Building2 className="w-5 h-5" />
                    </div>
                    {selectedBrand === 'APNI_ESTATE' && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Apni Estate (Real Estate)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Property configurations, budget brackets, micro-market locations.
                  </p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Upload File / Drag & Drop */}
          <Card>
            <CardHeader>
              <h3 className="text-base font-extrabold text-slate-900">Step 2: Choose File or Drag & Drop</h3>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer space-y-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm sm:text-base font-bold text-slate-900">
                    Click to browse or drop file here
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports Microsoft Excel (.xlsx, .xls) and CSV format
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Instant Demo Batches & Distribution Options */}
        <div className="space-y-6">
          {/* Demo Batches */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-extrabold text-slate-900">Instant Demo Batches</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-slate-500">
                Populate sample records instantly without needing your own spreadsheet:
              </p>

              {SAMPLE_BATCHES.map((batch, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleLoadSampleBatch(batch)}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer group space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                      {batch.name}
                    </span>
                    <BrandBadge brand={batch.brand} size="xs" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {batch.leads.length} curated leads with realistic fields
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Auto Distribution Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Distribution Rules</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Assign Leads Upon Ingestion
                </label>
                <select
                  value={targetTelecallerId}
                  onChange={(e) => setTargetTelecallerId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-h-[42px]"
                >
                  <option value="ROUND_ROBIN">
                    ⚡ Auto Round-Robin ({eligibleTelecallers.length} {selectedBrand} Callers)
                  </option>
                  <option value="UNASSIGNED">⚠️ Keep Unassigned in Pool</option>
                  <optgroup label="Direct Telecaller Assignment">
                    {eligibleTelecallers.map((tc) => (
                      <option key={tc.id} value={tc.id}>
                        {tc.name} ({tc.loginId})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 space-y-1">
                <p>
                  <strong>Round-Robin:</strong> Evenly distributes leads across active telecallers eligible for{' '}
                  <strong className="text-slate-800">{selectedBrand}</strong>.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Data Preview Table (If leads are parsed) */}
      {importedLeads.length > 0 && (
        <Card className="animate-in fade-in">
          <CardHeader className="bg-slate-50">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Staged Leads Preview ({selectedLeadIds.length} of {importedLeads.length} Selected)
              </h3>
              <p className="text-xs text-slate-500">Review column parsing before final database ingestion</p>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleToggleSelectAll}>
                {selectedLeadIds.length === importedLeads.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                size="sm"
                variant="indigo"
                onClick={handleConfirmImport}
                isLoading={isProcessing}
                leftIcon={<Upload className="w-4 h-4" />}
              >
                Import {selectedLeadIds.length} Leads
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="p-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.length === importedLeads.length}
                        onChange={handleToggleSelectAll}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-3">Lead Name</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">City</th>
                    <th className="py-3 px-3">
                      {selectedBrand === 'APNI_VIDYA' ? 'Course Interest' : 'Property Type'}
                    </th>
                    <th className="py-3 px-3">
                      {selectedBrand === 'APNI_VIDYA' ? 'Qualification / Batch' : 'Budget / Location'}
                    </th>
                    <th className="py-3 px-3">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {importedLeads.map((lead) => {
                    const isSelected = selectedLeadIds.includes(lead.id);
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => handleToggleLead(lead.id)}
                        className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                          isSelected ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">{lead.name}</td>
                        <td className="py-3 px-3 text-slate-600 font-mono">{lead.phone}</td>
                        <td className="py-3 px-3 text-slate-500">{lead.city || '—'}</td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {lead.courseInterest || lead.propertyType || '—'}
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {lead.qualification || lead.budget || lead.preferredLocation || '—'}
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-xs">{lead.source || 'File Import'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
