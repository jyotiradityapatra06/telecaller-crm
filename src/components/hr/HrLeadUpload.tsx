import React, { useRef, useState, useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Upload,
  UserCheck,
  Users,
} from 'lucide-react';
import { AuthUser, ParsedLeadRow, ImportLeadsResult, DuplicateLeadConflict } from '../../types';
import { api } from '../../lib/api';
import { downloadSampleTemplate, parseExcelOrCsv } from '../../lib/excelParser';
import { companyName } from './HrDashboard';

interface HrLeadUploadProps {
  user: AuthUser;
  telecallers: AuthUser[];
  onComplete: () => Promise<boolean>;
  onViewTelecaller: (id: string) => void;
}

export const HrLeadUpload: React.FC<HrLeadUploadProps> = ({
  user,
  telecallers,
  onComplete,
  onViewTelecaller,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [telecallerId, setTelecallerId] = useState('');
  const [rows, setRows] = useState<ParsedLeadRow[]>([]);
  const [invalidCount, setInvalidCount] = useState(0);
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [importResult, setImportResult] = useState<ImportLeadsResult | null>(null);

  // Selected lead IDs for manual reassignment from duplicate table
  const [selectedConflictIds, setSelectedConflictIds] = useState<string[]>([]);
  const [reassignBusy, setReassignBusy] = useState(false);
  const [reassignSuccessMsg, setReassignSuccessMsg] = useState('');

  const selectedTelecaller = useMemo(
    () => telecallers.find((tc) => tc.id === telecallerId),
    [telecallers, telecallerId]
  );

  const brand = user.brandAccess === 'APNI_ESTATE' ? 'APNI_ESTATE' : 'APNI_VIDYA';

  // Compute unique phone numbers in current parsed batch
  const uniquePhonesCount = useMemo(() => {
    const phones = new Set(
      rows.map((r) => r.phone.replace(/\D/g, '').slice(-10)).filter(Boolean)
    );
    return phones.size;
  }, [rows]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setImportResult(null);
    setReassignSuccessMsg('');
    setSelectedConflictIds([]);

    try {
      const parsed = await parseExcelOrCsv(file, brand);
      setRows(parsed.validRows);
      setInvalidCount(parsed.invalidRows.length);
      setFileName(parsed.fileName);
    } catch (err: any) {
      setError(err.message || 'Failed to parse file. Please verify format.');
    }
  };

  const handleUpload = async () => {
    if (!selectedTelecaller || !rows.length) return;
    setBusy(true);
    setError('');
    setImportResult(null);
    setReassignSuccessMsg('');
    setSelectedConflictIds([]);

    try {
      const res = await api.importLeads(rows, selectedTelecaller.id, brand);
      setImportResult(res);
      setRows([]);
      await onComplete();
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please check the file and try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleConflict = (leadId: string) => {
    if (!leadId || leadId.startsWith('batch_dup_')) return;
    setSelectedConflictIds((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    );
  };

  const handleSelectAllConflicts = () => {
    if (!importResult?.duplicateLeads) return;
    const reassignable = importResult.duplicateLeads
      .filter((d) => d.leadId && !d.leadId.startsWith('batch_dup_'))
      .map((d) => d.leadId);

    if (selectedConflictIds.length === reassignable.length) {
      setSelectedConflictIds([]);
    } else {
      setSelectedConflictIds(reassignable);
    }
  };

  const handleReassignConflicts = async () => {
    if (!selectedTelecaller || selectedConflictIds.length === 0) return;
    setReassignBusy(true);
    setError('');
    setReassignSuccessMsg('');

    try {
      const res = await api.assignLeads(selectedConflictIds, selectedTelecaller.id);
      setReassignSuccessMsg(
        `Successfully reassigned ${res.assignedCount} leads to ${selectedTelecaller.name}.`
      );
      // Remove reassigned leads from the displayed conflict list
      if (importResult) {
        const reassignedSet = new Set(selectedConflictIds);
        setImportResult({
          ...importResult,
          assignedCount: (importResult.assignedCount || 0) + res.assignedCount,
          duplicateLeads: (importResult.duplicateLeads || []).filter(
            (d) => !reassignedSet.has(d.leadId)
          ),
        });
      }
      setSelectedConflictIds([]);
      await onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to reassign leads.');
    } finally {
      setReassignBusy(false);
    }
  };

  const resetUpload = () => {
    setImportResult(null);
    setRows([]);
    setFileName('');
    setInvalidCount(0);
    setError('');
    setReassignSuccessMsg('');
    setSelectedConflictIds([]);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto p-5 sm:p-8 space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase">
          {companyName(user.brandAccess)} HR Operations
        </p>
        <h1 className="text-3xl font-bold text-slate-900 mt-1">Lead Sheet Ingestion</h1>
        <p className="text-slate-500 mt-1">
          Select target telecaller, upload Excel/CSV, verify duplicate protections, and assign safely.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Upload Notice</p>
            <p className="text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {reassignSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{reassignSuccessMsg}</p>
        </div>
      )}

      {/* IMPORT RESULT VIEW */}
      {importResult ? (
        <div className="space-y-6">
          <div
            className={`border rounded-3xl p-6 sm:p-8 ${
              importResult.assignedCount > 0
                ? 'bg-white border-slate-200'
                : 'bg-amber-50/70 border-amber-200'
            }`}
          >
            <div className="flex items-center gap-4">
              {importResult.assignedCount > 0 ? (
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-7 h-7 text-emerald-600" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-7 h-7 text-amber-600" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {importResult.assignedCount > 0
                    ? 'Upload Processed'
                    : 'Zero Leads Assigned'}
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  Target Telecaller:{' '}
                  <span className="font-semibold text-slate-900">
                    {selectedTelecaller?.name || 'Selected Telecaller'} ({selectedTelecaller?.loginId})
                  </span>
                </p>
              </div>
            </div>

            {importResult.assignedCount === 0 && (
              <div className="mt-5 p-4 bg-amber-100/70 border border-amber-300 rounded-2xl text-amber-900 text-sm">
                <strong>Important Notice:</strong> No leads were assigned to{' '}
                {selectedTelecaller?.name}. All {importResult.totalRows || 'uploaded'} rows were
                duplicates of existing leads or invalid numbers. See the duplicate report below if you
                wish to deliberately reassign any existing leads.
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Total in Sheet
                </span>
                <b className="text-2xl font-bold text-slate-800 mt-1 block">
                  {importResult.totalRows}
                </b>
              </div>

              <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 text-center">
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">
                  Imported & Assigned
                </span>
                <b className="text-2xl font-bold text-emerald-700 mt-1 block">
                  {importResult.assignedCount}
                </b>
              </div>

              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-center">
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">
                  Duplicates Skipped
                </span>
                <b className="text-2xl font-bold text-amber-700 mt-1 block">
                  {importResult.duplicateCount}
                </b>
              </div>

              <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 text-center">
                <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider block">
                  Invalid Format
                </span>
                <b className="text-2xl font-bold text-rose-700 mt-1 block">
                  {importResult.invalidCount}
                </b>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 mt-7">
              {importResult.assignedCount > 0 && selectedTelecaller && (
                <button
                  onClick={() => onViewTelecaller(selectedTelecaller.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 font-semibold text-sm flex items-center gap-2 transition"
                >
                  <UserCheck className="w-4 h-4" />
                  View {selectedTelecaller.name}&apos;s Leads
                </button>
              )}

              <button
                onClick={resetUpload}
                className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl px-5 py-2.5 font-semibold text-sm flex items-center gap-2 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Upload Another Sheet
              </button>
            </div>
          </div>

          {/* DUPLICATE REPORT & EXPLICIT REASSIGNMENT */}
          {importResult.duplicateLeads && importResult.duplicateLeads.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Duplicate Numbers Detected ({importResult.duplicateLeads.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    These phone numbers already exist in the organization. They were skipped to protect existing assignments.
                  </p>
                </div>

                {selectedTelecaller && (
                  <button
                    disabled={reassignBusy || selectedConflictIds.length === 0}
                    onClick={handleReassignConflicts}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm px-4 py-2 rounded-xl flex items-center gap-2 disabled:opacity-50 transition"
                  >
                    <ArrowRight className="w-4 h-4" />
                    {reassignBusy
                      ? 'Reassigning...'
                      : `Reassign Selected (${selectedConflictIds.length}) to ${selectedTelecaller.name}`}
                  </button>
                )}
              </div>

              {/* Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 border-b text-xs uppercase font-semibold sticky top-0">
                      <tr>
                        <th className="p-3 w-10">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300"
                            checked={
                              selectedConflictIds.length > 0 &&
                              selectedConflictIds.length ===
                                importResult.duplicateLeads.filter(
                                  (d) => d.leadId && !d.leadId.startsWith('batch_dup_')
                                ).length
                            }
                            onChange={handleSelectAllConflicts}
                          />
                        </th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Currently Assigned To</th>
                        <th className="p-3">Conflict Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importResult.duplicateLeads.map((dup: DuplicateLeadConflict, idx: number) => {
                        const isBatchDup = dup.leadId.startsWith('batch_dup_');
                        const isSelected = selectedConflictIds.includes(dup.leadId);

                        return (
                          <tr
                            key={`${dup.leadId}-${idx}`}
                            className={`hover:bg-slate-50/80 transition ${
                              isSelected ? 'bg-amber-50/60' : ''
                            }`}
                          >
                            <td className="p-3">
                              {!isBatchDup ? (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleConflict(dup.leadId)}
                                  className="rounded border-slate-300 text-blue-600"
                                />
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                            <td className="p-3 font-semibold text-slate-800">{dup.name}</td>
                            <td className="p-3 font-mono text-slate-700">{dup.phone}</td>
                            <td className="p-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                                {dup.status || 'NEW'}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="font-medium text-slate-900">
                                {dup.currentlyAssignedName || 'Unassigned'}
                              </span>
                            </td>
                            <td className="p-3 text-xs text-amber-700 font-medium">
                              {dup.reason === 'DUPLICATE_IN_BATCH'
                                ? 'Repeated in same file'
                                : 'Already exists in DB'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* STEP-BY-STEP UPLOAD WORKFLOW */
        <div className="space-y-6">
          {/* STEP 1: Select Telecaller */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="upload-telecaller" className="font-bold text-slate-900 text-base">
                1. Select Target Telecaller
              </label>
              <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-full">
                Required
              </span>
            </div>

            <select
              id="upload-telecaller"
              value={telecallerId}
              onChange={(e) => setTelecallerId(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="">-- Choose telecaller to receive these leads --</option>
              {telecallers
                .filter((t) => t.isActive)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.loginId}) — {t.brandAccess}
                  </option>
                ))}
            </select>

            {telecallers.length === 0 && (
              <p className="text-sm text-amber-700 mt-2">
                No active telecallers found for your brand. Please create a telecaller first.
              </p>
            )}
          </div>

          {/* STEP 2: Choose File */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 text-base">
                2. Choose Excel or CSV Lead File
              </label>
              <button
                type="button"
                onClick={() => downloadSampleTemplate(brand)}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Download Sample Template
              </button>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              disabled={!telecallerId}
              onClick={() => inputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-8 text-center transition disabled:opacity-40 disabled:cursor-not-allowed bg-slate-50/50 hover:bg-blue-50/30"
            >
              <FileSpreadsheet className="w-12 h-12 text-blue-600 mx-auto" />
              <p className="font-bold text-slate-800 mt-3 text-base">
                {fileName || 'Click to select .xlsx, .xls or .csv'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Required columns: <b>Name</b> and <b>Phone</b>. Optional: Email, City, Source, Notes.
              </p>
            </button>
          </div>

          {/* PRE-UPLOAD VALIDATION BADGE & PREVIEW */}
          {rows.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden space-y-0">
              {/* Pre-upload summary banner */}
              <div className="p-6 bg-slate-50 border-b border-slate-200">
                <h2 className="font-bold text-slate-900 text-base">
                  3. Ingestion Summary & Pre-Upload Validation
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="bg-white border rounded-xl p-3">
                    <span className="text-xs text-slate-500 font-semibold uppercase block">
                      Target Telecaller
                    </span>
                    <b className="text-slate-900 text-sm mt-0.5 block truncate">
                      {selectedTelecaller?.name}
                    </b>
                  </div>
                  <div className="bg-white border rounded-xl p-3">
                    <span className="text-xs text-slate-500 font-semibold uppercase block">
                      Brand Scope
                    </span>
                    <b className="text-slate-900 text-sm mt-0.5 block">
                      {brand === 'APNI_VIDYA' ? 'Apni Vidya' : 'Apni Estate'}
                    </b>
                  </div>
                  <div className="bg-white border rounded-xl p-3">
                    <span className="text-xs text-slate-500 font-semibold uppercase block">
                      Valid Rows
                    </span>
                    <b className="text-emerald-700 text-sm mt-0.5 block">
                      {rows.length} rows
                    </b>
                  </div>
                  <div className="bg-white border rounded-xl p-3">
                    <span className="text-xs text-slate-500 font-semibold uppercase block">
                      Unique Phone Numbers
                    </span>
                    <b className="text-blue-700 text-sm mt-0.5 block">
                      {uniquePhonesCount} unique
                    </b>
                  </div>
                </div>

                {invalidCount > 0 && (
                  <p className="text-xs text-amber-700 font-medium mt-3 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                    Notice: {invalidCount} rows had missing or unparseable name/phone numbers and will be excluded automatically.
                  </p>
                )}
              </div>

              {/* Data Table Preview */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    First {Math.min(rows.length, 50)} Rows Preview
                  </span>
                  <span className="text-xs text-slate-400">
                    Total {rows.length} leads ready
                  </span>
                </div>

                <div className="border rounded-2xl overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 border-b uppercase sticky top-0">
                        <tr>
                          <th className="p-2.5">#</th>
                          <th className="p-2.5">Name</th>
                          <th className="p-2.5">Phone</th>
                          <th className="p-2.5">City</th>
                          <th className="p-2.5">Course / Property</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rows.slice(0, 50).map((r, i) => (
                          <tr key={`${r.phone}-${i}`} className="hover:bg-slate-50/60">
                            <td className="p-2.5 text-slate-400 font-mono">{i + 1}</td>
                            <td className="p-2.5 font-semibold text-slate-800">{r.name}</td>
                            <td className="p-2.5 font-mono text-slate-700">{r.phone}</td>
                            <td className="p-2.5 text-slate-600">{r.city || '—'}</td>
                            <td className="p-2.5 text-slate-600">
                              {r.courseInterest || r.propertyType || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* STEP 4: Confirm & Upload */}
              <div className="p-6 bg-slate-50 border-t border-slate-200">
                <button
                  disabled={busy || !selectedTelecaller}
                  onClick={handleUpload}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-4 px-6 font-bold text-base flex items-center justify-center gap-2.5 transition shadow-sm disabled:opacity-50"
                >
                  <Upload className="w-5 h-5" />
                  {busy
                    ? 'Processing & Assigning Leads...'
                    : `Upload ${rows.length} Leads & Assign to ${selectedTelecaller?.name}`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
