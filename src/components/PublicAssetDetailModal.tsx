import React from 'react';
import { MapPublicAsset } from '../types/puneMap';
import { X, ExternalLink, MapPin, Building2, Landmark, ShieldCheck } from 'lucide-react';

interface PublicAssetDetailModalProps {
  asset: MapPublicAsset | null;
  onClose: () => void;
}

export const PublicAssetDetailModal: React.FC<PublicAssetDetailModalProps> = ({
  asset,
  onClose
}) => {
  if (!asset) return null;

  const isLoni = asset.jurisdiction === 'Loni Kalbhor Gram Panchayat';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E2920]/70 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="public-asset-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[8px] shadow-2xl border border-[#E5E0D5] w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-[#E5E0D5] bg-[#FAF8F3] flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`font-semibold ${
                  isLoni ? 'text-[#B45309]' : 'text-[#0E7C74]'
                } inline-flex items-center gap-1`}
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>{asset.category}</span>
              </span>
              <span aria-hidden="true" className="text-[#D4CEC2]">·</span>
              <span className="font-medium text-[#133429]">{asset.jurisdiction}</span>
              <span aria-hidden="true" className="text-[#D4CEC2]">·</span>
              <span className="font-semibold text-[#15803D]">{asset.status}</span>
            </div>
            <h2
              id="public-asset-modal-title"
              className="font-serif text-lg sm:text-xl font-semibold text-[#133429] leading-snug"
            >
              {asset.name}
            </h2>
            <p className="text-xs text-[#5A6560]">{asset.capacityOrMetric}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close civic asset modal"
            className="w-9 h-9 rounded-[6px] border border-[#E5E0D5] bg-white hover:bg-[#FAF8F3] text-[#133429] inline-flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          <p className="text-[#1C2422] leading-relaxed">{asset.details}</p>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-4 border-t border-[#E5E0D5]">
            <div>
              <dt className="text-[#5A6560]">Managing Authority &amp; Agency</dt>
              <dd className="font-semibold text-[#133429] mt-0.5 inline-flex items-start gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#0E7C74] shrink-0 mt-0.5" />
                <span>
                  {asset.authority} · {asset.departmentOrAgency}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-[#5A6560]">Verification Status</dt>
              <dd className="font-semibold text-[#15803D] mt-0.5 inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>{asset.verificationLabel}</span>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[#5A6560]">Location &amp; Coordinates</dt>
              <dd className="font-medium text-[#1C2422] mt-0.5 inline-flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0E7C74] shrink-0 mt-0.5" />
                <span>
                  {asset.locationLabel}
                  {asset.latitude !== null && asset.longitude !== null
                    ? ` · ${asset.latitude.toFixed(5)}, ${asset.longitude.toFixed(5)} (${
                        asset.coordinateSource || 'OSM verified'
                      })`
                    : ' · Geo-pin coordinates Data unavailable'}
                </span>
              </dd>
            </div>
          </dl>

          <div className="pt-4 border-t border-[#E5E0D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[#5A6560] block">Official Public Source</span>
              <span className="font-semibold text-[#133429]">{asset.sourceTitle}</span>
            </div>
            <a
              href={asset.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-4 rounded-[6px] bg-[#133429] hover:bg-[#0E2920] text-[#FAF8F3] font-semibold inline-flex items-center justify-center gap-1.5 shrink-0"
            >
              <span>Open Official Source</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
