import React, { useEffect, useState } from 'react';
import { MapMunicipalProject, ProjectRevisionRecord } from '../types/puneMap';
import { formatCroresPrecise } from '../utils/formatters';
import { X, ExternalLink, MapPin, Building2, AlertCircle, Calendar, History } from 'lucide-react';

interface WardProjectDetailModalProps {
  project: MapMunicipalProject | null;
  areaTitle?: string | null;
  onClose: () => void;
}

export const WardProjectDetailModal: React.FC<WardProjectDetailModalProps> = ({
  project,
  areaTitle,
  onClose
}) => {
  const [revisions, setRevisions] = useState<ProjectRevisionRecord[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState<boolean>(false);

  useEffect(() => {
    if (!project) {
      setRevisions([]);
      return;
    }
    let cancelled = false;
    setLoadingRevisions(true);
    fetch(`/api/pmc/projects/${encodeURIComponent(project.projectId)}/history`)
      .then((res) => (res.ok ? res.json() : { revisions: [] }))
      .then((data: { revisions?: ProjectRevisionRecord[] }) => {
        if (!cancelled) {
          setRevisions(Array.isArray(data.revisions) ? data.revisions : []);
          setLoadingRevisions(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRevisions([]);
          setLoadingRevisions(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [project]);

  if (!project) return null;

  const statusTone =
    project.status === 'Completed'
      ? 'text-[#15803D]'
      : project.status === 'Ongoing'
      ? 'text-[#0E7C74]'
      : project.status === 'Upcoming'
      ? 'text-[#B45309]'
      : 'text-[#DC2626]';

  const verificationTone =
    project.verificationStatus === 'Official source verified' ||
    project.verificationStatus === 'Government document available'
      ? 'text-[#15803D]'
      : project.verificationStatus === 'Secondary source'
      ? 'text-[#0E7C74]'
      : 'text-[#B45309]';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E2920]/70 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ward-project-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[8px] shadow-2xl border border-[#E5E0D5] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-[#E5E0D5] bg-[#FAF8F3] flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono font-semibold text-[#0E7C74]">{project.projectCode}</span>
              <span aria-hidden="true" className="text-[#D4CEC2]">·</span>
              <span className="font-medium text-[#5A6560]">{project.category}</span>
              <span aria-hidden="true" className="text-[#D4CEC2]">·</span>
              <span className={`font-semibold ${statusTone}`}>{project.status}</span>
              <span aria-hidden="true" className="text-[#D4CEC2]">·</span>
              <span className={`font-semibold ${verificationTone}`}>
                {project.verificationStatus}
              </span>
            </div>
            <h2
              id="ward-project-modal-title"
              className="font-serif text-lg sm:text-xl font-semibold text-[#133429] leading-snug"
            >
              {project.projectName}
            </h2>
            <p className="text-xs text-[#5A6560]">{project.officialName}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close project detail modal"
            className="w-9 h-9 rounded-[6px] border border-[#E5E0D5] bg-white hover:bg-[#FAF8F3] text-[#133429] inline-flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Financial Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-5 border-b border-[#E5E0D5]">
            <div className="p-3.5 rounded-[6px] bg-[#FAF8F3] border border-[#E5E0D5] space-y-1">
              <span className="text-[#5A6560] block">Estimated Cost</span>
              <span className="font-mono tabular-nums text-base font-bold text-[#133429] block">
                {project.estimatedCostCrores !== null
                  ? formatCroresPrecise(project.estimatedCostCrores)
                  : 'Data unavailable'}
              </span>
            </div>
            <div className="p-3.5 rounded-[6px] bg-[#FAF8F3] border border-[#E5E0D5] space-y-1">
              <span className="text-[#5A6560] block">Approved Funding</span>
              <span className="font-mono tabular-nums text-base font-bold text-[#0E7C74] block">
                {project.approvedFundingCrores !== null
                  ? formatCroresPrecise(project.approvedFundingCrores)
                  : 'Data unavailable'}
              </span>
            </div>
            <div className="p-3.5 rounded-[6px] bg-[#FAF8F3] border border-[#E5E0D5] space-y-1">
              <span className="text-[#5A6560] block">Actual Expenditure</span>
              <span className="font-mono tabular-nums text-sm font-semibold text-[#B45309] block">
                {project.actualExpenditureCrores !== null
                  ? formatCroresPrecise(project.actualExpenditureCrores)
                  : 'Data unavailable'}
              </span>
            </div>
          </div>

          <p className="text-[#1C2422] leading-relaxed">{project.description}</p>

          {/* Metadata Table */}
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <dt className="text-[#5A6560]">Executing Authority &amp; Department</dt>
              <dd className="font-semibold text-[#133429] mt-0.5 inline-flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#0E7C74] shrink-0" />
                <span>
                  {project.jurisdiction === 'Loni Kalbhor Gram Panchayat'
                    ? 'Loni Kalbhor GP (Outside PMC)'
                    : 'PMC'}{' '}
                  · {project.department}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-[#5A6560]">Financial Year &amp; Scope</dt>
              <dd className="font-medium text-[#1C2422] mt-0.5 font-mono tabular-nums">
                FY {project.financialYear} · {project.wardScope}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[#5A6560]">Documented Location &amp; Coordinates</dt>
              <dd className="font-medium text-[#1C2422] mt-0.5 inline-flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0E7C74] shrink-0 mt-0.5" />
                <span>
                  {project.locationSummary}
                  {areaTitle ? ` (Inspected via ${areaTitle})` : ''}
                  {project.latitude !== null && project.longitude !== null
                    ? ` · ${project.latitude.toFixed(5)}, ${project.longitude.toFixed(5)} (${
                        project.coordinateSource || 'OSM verified'
                      })`
                    : ' · Pin coordinates Data unavailable'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-[#5A6560]">Timeline (Start → Target / Completion)</dt>
              <dd className="font-mono tabular-nums font-medium text-[#1C2422] mt-0.5 inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#0E7C74] shrink-0" />
                <span>
                  {project.startDate || 'Data unavailable'} →{' '}
                  {project.expectedCompletionDate || 'Data unavailable'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-[#5A6560]">Physical Progress (Verified)</dt>
              <dd className="font-mono tabular-nums font-semibold text-[#133429] mt-0.5">
                {project.physicalProgressPercent !== null
                  ? `${project.physicalProgressPercent}%`
                  : 'Data unavailable'}
              </dd>
            </div>
            {project.capacityOrScale && (
              <div>
                <dt className="text-[#5A6560]">Design Scale / Output</dt>
                <dd className="font-mono font-medium text-[#1C2422] mt-0.5">
                  {project.capacityOrScale}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-[#5A6560]">Last Verified / Updated</dt>
              <dd className="font-mono tabular-nums text-[#5A6560] mt-0.5">
                {project.lastUpdated}
              </dd>
            </div>
          </dl>

          {/* Evidence & Limitations */}
          <div className="p-4 rounded-[6px] bg-[#FAF8F3] border border-[#E5E0D5] space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-[#133429]">
              <AlertCircle className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
              <span>Evidence &amp; Data Limitations</span>
            </div>
            <p className="text-[#5A6560] leading-relaxed">{project.evidenceNote}</p>
          </div>

          {/* Update / Revision History (when present in SQLite) */}
          {(loadingRevisions || revisions.length > 0) && (
            <div className="p-4 rounded-[6px] bg-[#FAF8F3] border border-[#E5E0D5] space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-[#133429]">
                <History className="w-3.5 h-3.5 text-[#0E7C74] shrink-0" />
                <span>Record Revision History ({revisions.length})</span>
              </div>
              {loadingRevisions ? (
                <p className="text-[#5A6560]">Checking database revision log...</p>
              ) : (
                <ul className="space-y-1.5">
                  {revisions.map((rev) => (
                    <li
                      key={rev.revisionId}
                      className="text-[11px] text-[#5A6560] flex items-center justify-between gap-2 border-t border-[#E5E0D5]/70 pt-1.5"
                    >
                      <span>{rev.changeSummary}</span>
                      <span className="font-mono tabular-nums shrink-0">
                        {rev.changedAt.slice(0, 10)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Official Source Citation */}
          <div className="pt-3 border-t border-[#E5E0D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[#5A6560] block">Official Source Document</span>
              <span className="font-semibold text-[#133429]">{project.sourceDocument}</span>
              <span className="text-[#5A6560] block">{project.sourcePageOrTable}</span>
            </div>
            <a
              href={project.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-4 rounded-[6px] bg-[#133429] hover:bg-[#0E2920] text-[#FAF8F3] font-semibold inline-flex items-center justify-center gap-1.5 shrink-0"
            >
              <span>
                {project.jurisdiction === 'Loni Kalbhor Gram Panchayat'
                  ? 'Open Official Govt Source'
                  : 'Open Official PMC Source'}
              </span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
