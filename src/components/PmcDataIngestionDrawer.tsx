import React, { useState } from 'react';
import {
  ImportHistoryRecord,
  MapMunicipalProject,
  PmcDepartmentBudgetRecord
} from '../types/puneMap';
import { formatCroresPrecise } from '../utils/formatters';
import {
  X,
  RefreshCw,
  Upload,
  Globe,
  History,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Database
} from 'lucide-react';

export interface BootstrapPayload {
  projects: MapMunicipalProject[];
  departmentBudgets: PmcDepartmentBudgetRecord[];
  importHistory: ImportHistoryRecord[];
  lastUpdated: string;
  dbStats: {
    wardsCount: number;
    projectsCount: number;
    markersCount: number;
    departmentBudgetsCount: number;
  };
}

interface ParsedPreview {
  datasetType: 'projects' | 'budgets';
  fileFormat: string;
  sourceName: string;
  rowsParsed: number;
  newCount: number;
  updateCount: number;
  duplicateCount: number;
  warnings: string[];
  projects: MapMunicipalProject[];
  budgets: PmcDepartmentBudgetRecord[];
}

interface PortalSyncEndpoint {
  portalName: string;
  url: string;
  reachable: boolean;
  httpStatus: number | null;
  statusLabel: string;
  discoveredLinksCount: number;
  discoveredLinks: Array<{ title: string; url: string }>;
  note: string;
}

interface PmcDataIngestionDrawerProps {
  open: boolean;
  onClose: () => void;
  importHistory: ImportHistoryRecord[];
  lastUpdated: string;
  dbStats: BootstrapPayload['dbStats'];
  onBootstrapUpdate: (payload: BootstrapPayload) => void;
}

export const PmcDataIngestionDrawer: React.FC<PmcDataIngestionDrawerProps> = ({
  open,
  onClose,
  importHistory,
  lastUpdated,
  dbStats,
  onBootstrapUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'upload' | 'history'>('sync');

  // Automated sync state
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncEndpoints, setSyncEndpoints] = useState<PortalSyncEndpoint[] | null>(null);
  const [syncSummary, setSyncSummary] = useState<string | null>(null);

  // Upload & URL state
  const [datasetType, setDatasetType] = useState<'projects' | 'budgets'>('projects');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [processing, setProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParsedPreview | null>(null);
  const [publishNotice, setPublishNotice] = useState<string | null>(null);

  if (!open) return null;

  const handleRunPortalSync = async () => {
    setSyncLoading(true);
    setSyncError(null);
    try {
      const res = await fetch('/api/pmc/import/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync official PMC portals.');
      }
      setSyncEndpoints(data.sync.endpoints);
      setSyncSummary(data.sync.summaryNote);
      if (data.bootstrap) {
        onBootstrapUpdate(data.bootstrap);
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Portal sync failed.');
    } finally {
      setSyncLoading(false);
    }
  };

  const handlePreviewOrPublish = async (action: 'preview' | 'publish') => {
    setProcessing(true);
    setUploadError(null);
    setPublishNotice(null);

    try {
      let res: Response;
      if (uploadMode === 'file') {
        if (!selectedFile) {
          throw new Error('Select a CSV, Excel (.xlsx/.xls), or PDF file first.');
        }
        const form = new FormData();
        form.append('file', selectedFile);
        form.append('datasetType', datasetType);
        form.append('action', action);
        res = await fetch('/api/pmc/import/upload', { method: 'POST', body: form });
      } else {
        if (!remoteUrl.trim()) {
          throw new Error('Enter a valid public CSV, Excel, or PDF document URL.');
        }
        res = await fetch('/api/pmc/import/url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: remoteUrl.trim(), datasetType, action })
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process dataset.');
      }

      setPreview(data.preview);
      if (action === 'publish' && data.result) {
        setPublishNotice(
          `Database updated: ${data.result.rowsInserted} inserted, ${data.result.rowsUpdated} updated, ${data.result.duplicatesSkipped} duplicate rows skipped.`
        );
        if (data.bootstrap) {
          onBootstrapUpdate(data.bootstrap);
        }
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Import operation failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E2920]/70 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pmc-ingestion-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[8px] shadow-2xl border border-[#E5E0D5] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E0D5] bg-[#FAF8F3] flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#0E7C74] uppercase tracking-wider">
              <Database className="w-3.5 h-3.5" />
              <span>PMC SQLite Data Engine &amp; Ingestion</span>
              <span aria-hidden="true" className="text-[#D4CEC2]">·</span>
              <span className="font-mono text-[#5A6560] normal-case">
                Last Synced: {lastUpdated.slice(0, 10)}
              </span>
            </div>
            <h2
              id="pmc-ingestion-title"
              className="font-serif text-lg sm:text-xl font-semibold text-[#133429]"
            >
              Manage Official PMC Sync &amp; Data Imports
            </h2>
            <p className="text-xs text-[#5A6560]">
              Active DB: {dbStats.wardsCount} Wards · {dbStats.projectsCount} Projects ({dbStats.markersCount} OSM pins) · {dbStats.departmentBudgetsCount} Departmental Budgets
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close data ingestion panel"
            className="w-9 h-9 rounded-[6px] border border-[#E5E0D5] bg-white hover:bg-[#FAF8F3] text-[#133429] inline-flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-[#E5E0D5] bg-white flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 inline-flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'sync'
                ? 'border-[#0E7C74] text-[#133429]'
                : 'border-transparent text-[#5A6560] hover:text-[#133429]'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Automated Official Portal Check</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 inline-flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'border-[#0E7C74] text-[#133429]'
                : 'border-transparent text-[#5A6560] hover:text-[#133429]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CSV / Excel / PDF or URL</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 inline-flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'border-[#0E7C74] text-[#133429]'
                : 'border-transparent text-[#5A6560] hover:text-[#133429]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Import History ({importHistory.length})</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {activeTab === 'sync' && (
            <div className="space-y-4">
              <div className="p-4 rounded-[6px] bg-[#FAF8F3] border border-[#E5E0D5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 max-w-xl">
                  <h3 className="font-semibold text-[#133429]">
                    Live PMC &amp; Open-Data Availability Probe
                  </h3>
                  <p className="text-[#5A6560] leading-relaxed">
                    Probes official PMC pages (`www.pmc.gov.in`), OpenCity (`data.opencity.in`), and `opendata.pmc.gov.in`. Portals protected by Cloudflare bot challenges or network timeouts are reported honestly without fabricating records.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunPortalSync}
                  disabled={syncLoading}
                  className="h-9 px-4 rounded-[6px] bg-[#133429] hover:bg-[#0E2920] disabled:opacity-60 text-[#FAF8F3] font-semibold inline-flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? 'animate-spin' : ''}`} />
                  <span>{syncLoading ? 'Checking Portals...' : 'Run Portal Sync Check'}</span>
                </button>
              </div>

              {syncError && (
                <div className="p-3 rounded-[6px] bg-[#DC2626]/5 border border-[#DC2626]/30 text-[#DC2626]">
                  {syncError}
                </div>
              )}

              {syncSummary && (
                <div className="p-3 rounded-[6px] bg-[#0E7C74]/5 border border-[#0E7C74]/30 text-[#133429] font-medium">
                  {syncSummary}
                </div>
              )}

              {syncEndpoints && (
                <div className="space-y-3">
                  {syncEndpoints.map((ep) => (
                    <div
                      key={ep.url}
                      className="p-4 rounded-[6px] border border-[#E5E0D5] bg-white space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-[#133429]">{ep.portalName}</span>
                        <span
                          className={`font-mono font-semibold ${
                            ep.reachable ? 'text-[#15803D]' : 'text-[#B45309]'
                          }`}
                        >
                          {ep.statusLabel}
                          {ep.httpStatus ? ` (HTTP ${ep.httpStatus})` : ''}
                        </span>
                      </div>
                      <p className="text-[#5A6560]">{ep.note}</p>
                      {ep.discoveredLinks.length > 0 && (
                        <div className="pt-2 border-t border-[#E5E0D5]/70 space-y-1">
                          <span className="text-[11px] font-semibold text-[#133429] block">
                            Official PDFs Discovered ({ep.discoveredLinks.length}):
                          </span>
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {ep.discoveredLinks.slice(0, 5).map((link) => (
                              <a
                                key={link.url}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-[#0E7C74] hover:underline inline-flex items-center gap-1"
                              >
                                <span className="truncate max-w-[240px]">{link.title}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#5A6560] mb-1">
                    Target Database Table
                  </label>
                  <select
                    value={datasetType}
                    onChange={(e) => {
                      setDatasetType(e.target.value as 'projects' | 'budgets');
                      setPreview(null);
                      setPublishNotice(null);
                    }}
                    className="w-full h-9 px-3 rounded-[6px] border border-[#E5E0D5] bg-[#FAF8F3] text-xs text-[#133429]"
                  >
                    <option value="projects">PMC_PROJECTS (Ward / City-Wide Works)</option>
                    <option value="budgets">PMC_DEPARTMENT_BUDGETS (BE / RE / Actuals)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#5A6560] mb-1">
                    Ingestion Input Method
                  </label>
                  <div className="inline-flex w-full p-0.5 rounded-[6px] bg-[#FAF8F3] border border-[#E5E0D5]">
                    <button
                      type="button"
                      onClick={() => setUploadMode('file')}
                      className={`flex-1 h-8 rounded-[4px] font-semibold cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                        uploadMode === 'file'
                          ? 'bg-[#133429] text-[#FAF8F3]'
                          : 'text-[#5A6560]'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload File</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMode('url')}
                      className={`flex-1 h-8 rounded-[4px] font-semibold cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                        uploadMode === 'url'
                          ? 'bg-[#133429] text-[#FAF8F3]'
                          : 'text-[#5A6560]'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Public URL</span>
                    </button>
                  </div>
                </div>
              </div>

              {uploadMode === 'file' ? (
                <div className="p-4 rounded-[6px] border border-dashed border-[#0E7C74]/50 bg-[#FAF8F3]/60 space-y-2">
                  <label className="block font-semibold text-[#133429]">
                    Select CSV, Excel (.xlsx / .xls), or PDF Document (Max 10 MB)
                  </label>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.pdf"
                    onChange={(e) => {
                      setSelectedFile(e.target.files?.[0] || null);
                      setPreview(null);
                      setPublishNotice(null);
                      setUploadError(null);
                    }}
                    className="block w-full text-xs text-[#5A6560] file:mr-3 file:py-1.5 file:px-3 file:rounded-[4px] file:border file:border-[#E5E0D5] file:bg-white file:text-xs file:font-semibold file:text-[#133429] hover:file:bg-[#FAF8F3] cursor-pointer"
                  />
                  <p className="text-[11px] text-[#5A6560]">
                    Expected columns for projects: `project_name`, `department`, `category`, `ward_name`, `estimated_cost`, `approved_funding`, `actual_expenditure`, `status`, `financial_year`, `source_url`.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-[6px] border border-[#E5E0D5] bg-[#FAF8F3]/60 space-y-2">
                  <label htmlFor="pmc-remote-url" className="block font-semibold text-[#133429]">
                    Direct Public Dataset URL (CSV, XLSX, or PDF)
                  </label>
                  <input
                    id="pmc-remote-url"
                    type="url"
                    value={remoteUrl}
                    onChange={(e) => {
                      setRemoteUrl(e.target.value);
                      setPreview(null);
                      setPublishNotice(null);
                    }}
                    placeholder="https://www.pmc.gov.in/.../budget-statement.pdf"
                    className="w-full h-9 px-3 rounded-[6px] border border-[#E5E0D5] bg-white text-xs text-[#133429]"
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handlePreviewOrPublish('preview')}
                  className="h-9 px-4 rounded-[6px] border border-[#133429] bg-white hover:bg-[#FAF8F3] text-[#133429] font-semibold cursor-pointer disabled:opacity-60"
                >
                  {processing ? 'Parsing...' : '1. Validate & Preview Rows'}
                </button>
                {preview && preview.rowsParsed > 0 && (
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => handlePreviewOrPublish('publish')}
                    className="h-9 px-4 rounded-[6px] bg-[#133429] hover:bg-[#0E2920] text-[#FAF8F3] font-semibold cursor-pointer disabled:opacity-60"
                  >
                    2. Publish {preview.newCount + preview.updateCount} Changes to SQLite DB
                  </button>
                )}
              </div>

              {uploadError && (
                <div className="p-3 rounded-[6px] bg-[#DC2626]/5 border border-[#DC2626]/30 text-[#DC2626] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {publishNotice && (
                <div className="p-3 rounded-[6px] bg-[#15803D]/10 border border-[#15803D]/30 text-[#15803D] font-medium flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{publishNotice}</span>
                </div>
              )}

              {preview && (
                <div className="border border-[#E5E0D5] rounded-[6px] overflow-hidden">
                  <div className="px-4 py-3 bg-[#FAF8F3] border-b border-[#E5E0D5] flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-[#133429]">
                      Validation Preview ({preview.fileFormat} · {preview.sourceName})
                    </span>
                    <span className="font-mono tabular-nums text-[11px] text-[#5A6560]">
                      Parsed: {preview.rowsParsed} · New: {preview.newCount} · Updates:{' '}
                      {preview.updateCount} · Duplicates Skipped: {preview.duplicateCount}
                    </span>
                  </div>

                  {preview.warnings.length > 0 && (
                    <div className="px-4 py-2.5 bg-[#D97706]/10 border-b border-[#E5E0D5] space-y-1 text-[11px] text-[#B45309]">
                      {preview.warnings.slice(0, 5).map((w, i) => (
                        <div key={i}>• {w}</div>
                      ))}
                    </div>
                  )}

                  <div className="max-h-56 overflow-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className="bg-white border-b border-[#E5E0D5] text-[#5A6560]">
                        {preview.datasetType === 'projects' ? (
                          <tr>
                            <th className="py-2 px-3">Project Name</th>
                            <th className="py-2 px-3">Department</th>
                            <th className="py-2 px-3">FY</th>
                            <th className="py-2 px-3 text-right">Est. Cost</th>
                            <th className="py-2 px-3">Status</th>
                          </tr>
                        ) : (
                          <tr>
                            <th className="py-2 px-3">Department</th>
                            <th className="py-2 px-3">Budget Head</th>
                            <th className="py-2 px-3">FY</th>
                            <th className="py-2 px-3 text-right">BE (₹ Cr)</th>
                            <th className="py-2 px-3 text-right">Actuals (₹ Cr)</th>
                          </tr>
                        )}
                      </thead>
                      <tbody className="divide-y divide-[#E5E0D5]/60">
                        {preview.datasetType === 'projects'
                          ? preview.projects.slice(0, 12).map((p) => (
                              <tr key={p.projectId}>
                                <td className="py-2 px-3 font-medium text-[#133429]">
                                  {p.projectName}
                                </td>
                                <td className="py-2 px-3 text-[#5A6560]">{p.department}</td>
                                <td className="py-2 px-3 font-mono">{p.financialYear}</td>
                                <td className="py-2 px-3 font-mono tabular-nums text-right">
                                  {p.estimatedCostCrores !== null
                                    ? formatCroresPrecise(p.estimatedCostCrores)
                                    : 'Data unavailable'}
                                </td>
                                <td className="py-2 px-3">{p.status}</td>
                              </tr>
                            ))
                          : preview.budgets.slice(0, 12).map((b) => (
                              <tr key={b.id}>
                                <td className="py-2 px-3 font-medium text-[#133429]">
                                  {b.departmentName}
                                </td>
                                <td className="py-2 px-3 text-[#5A6560]">{b.budgetHead}</td>
                                <td className="py-2 px-3 font-mono">{b.financialYear}</td>
                                <td className="py-2 px-3 font-mono tabular-nums text-right">
                                  {b.budgetEstimateCrores !== null
                                    ? formatCroresPrecise(b.budgetEstimateCrores)
                                    : 'Data unavailable'}
                                </td>
                                <td className="py-2 px-3 font-mono tabular-nums text-right">
                                  {b.actualExpenditureCrores !== null
                                    ? formatCroresPrecise(b.actualExpenditureCrores)
                                    : 'Data unavailable'}
                                </td>
                              </tr>
                            ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="border border-[#E5E0D5] rounded-[6px] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-[#FAF8F3] border-b border-[#E5E0D5] text-[#5A6560]">
                    <tr>
                      <th className="py-2.5 px-3">Imported At</th>
                      <th className="py-2.5 px-3">Source &amp; Format</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Parsed / New / Upd / Dup</th>
                      <th className="py-2.5 px-3">Audit Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D5]/70">
                    {importHistory.map((row) => (
                      <tr key={row.importId}>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-[#5A6560] whitespace-nowrap">
                          {row.importedAt.slice(0, 19).replace('T', ' ')}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-[#133429] block">
                            {row.sourceName}
                          </span>
                          <span className="text-[#5A6560]">
                            {row.sourceType} · {row.datasetType} · {row.fileFormat}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold">
                          <span
                            className={
                              row.status === 'Success'
                                ? 'text-[#15803D]'
                                : row.status === 'Partial'
                                ? 'text-[#B45309]'
                                : 'text-[#DC2626]'
                            }
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-right whitespace-nowrap">
                          {row.rowsParsed} / {row.rowsInserted} / {row.rowsUpdated} /{' '}
                          {row.duplicatesSkipped}
                        </td>
                        <td className="py-2.5 px-3 text-[#5A6560] max-w-xs">{row.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
