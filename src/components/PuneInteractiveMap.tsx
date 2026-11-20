import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  BoundaryLayerMode,
  JurisdictionFilterScope,
  MapAreaDominantStatus,
  MapMunicipalProject,
  MapPublicAsset,
  SelectedMapArea
} from '../types/puneMap';
import {
  LONI_KALBHOR_GEO_KEY,
  LONI_KALBHOR_OSM_CENTER,
  LONI_KALBHOR_REFERENCE_RADIUS_METERS,
  buildLoniKalbhorSelectedArea,
  buildSelectedAreaFromFeature,
  getAdminWardMeta,
  getDominantAreaStatus,
  getProjectsForArea
} from '../data/puneMapData';
import { formatCroresPrecise } from '../utils/formatters';
import {
  Maximize2,
  Minus,
  Plus,
  Lock,
  RotateCcw,
  AlertCircle,
  MapPin,
  Landmark,
  Compass
} from 'lucide-react';

interface PuneInteractiveMapProps {
  layerMode: BoundaryLayerMode;
  jurisdictionScope: JurisdictionFilterScope;
  geoData: GeoJSON.FeatureCollection | null;
  loading: boolean;
  error: string | null;
  onRetryLoad: () => void;
  filteredProjects: MapMunicipalProject[];
  publicAssets: MapPublicAsset[];
  hoveredKey: string | null;
  lockedKey: string | null;
  activeAreaTitle: string | null;
  matchingKeys: Set<string> | null;
  focusKey: string | null;
  onHoverArea: (area: SelectedMapArea | null, featureKey: string | null) => void;
  onLockArea: (area: SelectedMapArea, featureKey: string) => void;
  onSelectProject: (project: MapMunicipalProject) => void;
  onSelectAsset: (asset: MapPublicAsset) => void;
  onJumpToLoni: () => void;
  onResetSelection: () => void;
}

const STATUS_FILL_COLORS: Record<MapAreaDominantStatus, string> = {
  Completed: '#15803D', // Forest Green
  Ongoing: '#0E7C74', // Civic Teal
  Upcoming: '#D97706', // Warm Amber
  Delayed: '#DC2626', // Crimson (only when documented)
  Unavailable: '#CFC9BC' // Neutral Stone (no ward-level project status implied)
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const PuneInteractiveMap: React.FC<PuneInteractiveMapProps> = ({
  layerMode,
  jurisdictionScope,
  geoData,
  loading,
  error,
  onRetryLoad,
  filteredProjects,
  publicAssets,
  hoveredKey,
  lockedKey,
  activeAreaTitle,
  matchingKeys,
  focusKey,
  onHoverArea,
  onLockArea,
  onSelectProject,
  onSelectAsset,
  onJumpToLoni,
  onResetSelection
}) => {
  const [showMarkers, setShowMarkers] = useState<boolean>(true);
  const [showAssetMarkers, setShowAssetMarkers] = useState<boolean>(true);
  const [tileWarning, setTileWarning] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const geoLayerRef = useRef<L.GeoJSON | null>(null);
  const loniCircleRef = useRef<L.Circle | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const assetMarkerLayerRef = useRef<L.LayerGroup | null>(null);
  const featureLayersByKeyRef = useRef<Map<string, L.Layer>>(new Map());
  const tileErrorsCountRef = useRef<number>(0);

  // Stable refs for Leaflet event callbacks so layers never tear down on hover
  const onHoverRef = useRef(onHoverArea);
  const onLockRef = useRef(onLockArea);
  const onSelectProjectRef = useRef(onSelectProject);
  const onSelectAssetRef = useRef(onSelectAsset);
  const filteredProjectsRef = useRef(filteredProjects);
  const hoveredKeyRef = useRef(hoveredKey);
  const lockedKeyRef = useRef(lockedKey);
  const matchingKeysRef = useRef(matchingKeys);
  const layerModeRef = useRef(layerMode);
  const jurisdictionScopeRef = useRef(jurisdictionScope);

  onHoverRef.current = onHoverArea;
  onLockRef.current = onLockArea;
  onSelectProjectRef.current = onSelectProject;
  onSelectAssetRef.current = onSelectAsset;
  filteredProjectsRef.current = filteredProjects;
  hoveredKeyRef.current = hoveredKey;
  lockedKeyRef.current = lockedKey;
  matchingKeysRef.current = matchingKeys;
  layerModeRef.current = layerMode;
  jurisdictionScopeRef.current = jurisdictionScope;

  const getFeatureKey = (
    mode: BoundaryLayerMode,
    props: Record<string, unknown> | undefined
  ): string => {
    if (!props) return '';
    return mode === 'admin-wards'
      ? String(props.name ?? '')
      : String(props.wardnum ?? '');
  };

  const computeStyleForKey = (featureKey: string): L.PathOptions => {
    const mode = layerModeRef.current;
    const areaProjects = getProjectsForArea(filteredProjectsRef.current, mode, featureKey);
    const dominantStatus = getDominantAreaStatus(areaProjects);
    const baseColor = STATUS_FILL_COLORS[dominantStatus];

    const isLocked = lockedKeyRef.current === featureKey;
    const isHovered = hoveredKeyRef.current === featureKey;
    const searchActive = matchingKeysRef.current !== null;
    const isSearchMatch = searchActive ? matchingKeysRef.current!.has(featureKey) : true;
    const dimmedByJurisdiction = jurisdictionScopeRef.current === 'Loni Kalbhor';

    if (isLocked) {
      return {
        color: '#0E2920',
        weight: 3.2,
        opacity: 1,
        fillColor: baseColor,
        fillOpacity: dominantStatus === 'Unavailable' ? 0.45 : 0.54
      };
    }

    if (isHovered) {
      return {
        color: '#133429',
        weight: 2.6,
        opacity: 0.96,
        fillColor: baseColor,
        fillOpacity: dominantStatus === 'Unavailable' ? 0.36 : 0.46
      };
    }

    if (dimmedByJurisdiction || (searchActive && !isSearchMatch)) {
      return {
        color: '#9CA3AF',
        weight: 0.9,
        opacity: 0.38,
        fillColor: '#E5E0D5',
        fillOpacity: 0.14
      };
    }

    return {
      color: isSearchMatch && searchActive ? '#133429' : '#334B42',
      weight: isSearchMatch && searchActive ? 2.0 : mode === 'admin-wards' ? 1.35 : 1.0,
      opacity: isSearchMatch && searchActive ? 0.9 : 0.65,
      fillColor: baseColor,
      fillOpacity: dominantStatus === 'Unavailable' ? 0.2 : 0.3
    };
  };

  const computeLoniCircleStyle = (): L.CircleMarkerOptions => {
    const isLocked = lockedKeyRef.current === LONI_KALBHOR_GEO_KEY;
    const isHovered = hoveredKeyRef.current === LONI_KALBHOR_GEO_KEY;
    const searchActive = matchingKeysRef.current !== null;
    const isSearchMatch = searchActive
      ? matchingKeysRef.current!.has(LONI_KALBHOR_GEO_KEY)
      : true;
    const dimmedByJurisdiction = jurisdictionScopeRef.current === 'PMC';

    if (dimmedByJurisdiction) {
      return {
        color: '#B45309',
        weight: 1.2,
        opacity: 0.28,
        dashArray: '6 4',
        fillColor: '#D97706',
        fillOpacity: 0.05
      };
    }

    if (isLocked) {
      return {
        color: '#92400E',
        weight: 3.2,
        opacity: 1,
        dashArray: '6 4',
        fillColor: '#D97706',
        fillOpacity: 0.34
      };
    }

    if (isHovered || (searchActive && isSearchMatch)) {
      return {
        color: '#B45309',
        weight: 2.6,
        opacity: 0.95,
        dashArray: '6 4',
        fillColor: '#D97706',
        fillOpacity: 0.26
      };
    }

    if (searchActive && !isSearchMatch) {
      return {
        color: '#9CA3AF',
        weight: 1.0,
        opacity: 0.35,
        dashArray: '6 4',
        fillColor: '#E5E0D5',
        fillOpacity: 0.1
      };
    }

    return {
      color: '#B45309',
      weight: 2.0,
      opacity: 0.85,
      dashArray: '6 4',
      fillColor: '#D97706',
      fillOpacity: 0.16
    };
  };

  // Initialize Leaflet Map once with standard OpenStreetMap tiles (zero API keys)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [18.514, 73.895],
      zoom: 11,
      minZoom: 10,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: true
    });

    const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors | PMC: DataMeet Pune | Loni Kalbhor: OSM/Census',
      maxZoom: 19,
      opacity: 0.74
    });

    osmLayer.on('tileerror', () => {
      tileErrorsCountRef.current += 1;
      if (tileErrorsCountRef.current >= 4) {
        setTileWarning(true);
      }
    });

    osmLayer.on('tileload', () => {
      tileErrorsCountRef.current = 0;
      setTileWarning(false);
    });

    osmLayer.addTo(map);
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    // Loni Kalbhor Gram Panchayat reference circle zone (strictly outside PMC limits)
    const loniArea = buildLoniKalbhorSelectedArea();
    const loniCircle = L.circle([LONI_KALBHOR_OSM_CENTER.lat, LONI_KALBHOR_OSM_CENTER.lng], {
      radius: LONI_KALBHOR_REFERENCE_RADIUS_METERS,
      ...computeLoniCircleStyle()
    }).addTo(map);

    loniCircle.bindTooltip('Loni Kalbhor (GP · Outside PMC)', {
      permanent: true,
      direction: 'center',
      className: 'pmc-ward-label'
    });

    loniCircle.on({
      mouseover: () => {
        onHoverRef.current(loniArea, LONI_KALBHOR_GEO_KEY);
      },
      mouseout: () => {
        onHoverRef.current(null, null);
      },
      click: (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        onLockRef.current(loniArea, LONI_KALBHOR_GEO_KEY);
      }
    });

    loniCircleRef.current = loniCircle;

    const assetGroup = L.layerGroup().addTo(map);
    assetMarkerLayerRef.current = assetGroup;

    const markerGroup = L.layerGroup().addTo(map);
    markerLayerRef.current = markerGroup;

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      geoLayerRef.current = null;
      loniCircleRef.current = null;
      markerLayerRef.current = null;
      assetMarkerLayerRef.current = null;
      featureLayersByKeyRef.current.clear();
    };
  }, []);

  // Helper to compute collective bounds across PMC and (optionally) Loni Kalbhor
  const getCombinedBounds = (scope: JurisdictionFilterScope): L.LatLngBounds | null => {
    const geoBounds = geoLayerRef.current?.getBounds();
    const loniBounds = loniCircleRef.current?.getBounds();

    if (scope === 'Loni Kalbhor' && loniBounds?.isValid()) {
      return loniBounds;
    }
    if (scope === 'PMC' && geoBounds?.isValid()) {
      return geoBounds;
    }
    if (geoBounds?.isValid() && loniBounds?.isValid()) {
      return geoBounds.extend(loniBounds);
    }
    if (geoBounds?.isValid()) return geoBounds;
    if (loniBounds?.isValid()) return loniBounds;
    return null;
  };

  // Build / rebuild GeoJSON layer when geoData or layerMode changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (geoLayerRef.current) {
      map.removeLayer(geoLayerRef.current);
      geoLayerRef.current = null;
    }
    featureLayersByKeyRef.current.clear();

    if (!geoData || !geoData.features?.length) return;

    const geoLayer = L.geoJSON(geoData, {
      style: (feature) => {
        const key = getFeatureKey(
          layerMode,
          feature?.properties as Record<string, unknown> | undefined
        );
        return computeStyleForKey(key);
      },
      onEachFeature: (feature, layer) => {
        const props = (feature.properties || {}) as Record<string, unknown>;
        const featureKey = getFeatureKey(layerMode, props);
        const area = buildSelectedAreaFromFeature(layerMode, props);

        featureLayersByKeyRef.current.set(featureKey, layer);

        if (layerMode === 'admin-wards') {
          const meta = getAdminWardMeta(featureKey);
          const labelText = meta?.shortLabel || area.title;
          layer.bindTooltip(labelText, {
            permanent: true,
            direction: 'center',
            className: 'pmc-ward-label'
          });
        } else {
          const wardnum = Number(props.wardnum);
          layer.bindTooltip(`Prabhag ${String(wardnum).padStart(2, '0')} · ${area.title}`, {
            sticky: true,
            direction: 'top',
            offset: [0, -8],
            className: 'pmc-hover-tooltip'
          });
        }

        layer.on({
          mouseover: () => {
            onHoverRef.current(area, featureKey);
          },
          mouseout: () => {
            onHoverRef.current(null, null);
          },
          click: (e: L.LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(e);
            onLockRef.current(area, featureKey);
          }
        });
      }
    }).addTo(map);

    geoLayerRef.current = geoLayer;

    // Keep Loni circle and marker layers cleanly above polygon fills
    if (loniCircleRef.current) {
      loniCircleRef.current.bringToFront();
    }
    if (markerLayerRef.current) {
      markerLayerRef.current.eachLayer((m) => {
        if (typeof (m as L.CircleMarker).bringToFront === 'function') {
          (m as L.CircleMarker).bringToFront();
        }
      });
    }

    const bounds = getCombinedBounds(jurisdictionScopeRef.current);
    if (bounds?.isValid()) {
      map.fitBounds(bounds, { padding: [22, 22], animate: false });
    }
  }, [geoData, layerMode]);

  // Reframe map smoothly when jurisdictionScope changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = getCombinedBounds(jurisdictionScope);
    if (bounds?.isValid()) {
      map.fitBounds(bounds, {
        padding: jurisdictionScope === 'Loni Kalbhor' ? [70, 70] : [22, 22],
        maxZoom: jurisdictionScope === 'Loni Kalbhor' ? 13 : 15,
        animate: true
      });
    }
  }, [jurisdictionScope]);

  // Imperatively refresh polygon & Loni circle styles on hover / lock / filter / search / scope changes
  useEffect(() => {
    const geoLayer = geoLayerRef.current;
    if (geoLayer) {
      let hoveredPolygon: L.Path | null = null;
      let lockedPolygon: L.Path | null = null;

      geoLayer.eachLayer((layer) => {
        const pathLayer = layer as L.Path & { feature?: GeoJSON.Feature };
        const key = getFeatureKey(
          layerMode,
          pathLayer.feature?.properties as Record<string, unknown> | undefined
        );
        pathLayer.setStyle(computeStyleForKey(key));

        if (key === hoveredKey) hoveredPolygon = pathLayer;
        if (key === lockedKey) lockedPolygon = pathLayer;
      });

      if (hoveredPolygon && typeof (hoveredPolygon as L.Path).bringToFront === 'function') {
        (hoveredPolygon as L.Path).bringToFront();
      }
      if (lockedPolygon && typeof (lockedPolygon as L.Path).bringToFront === 'function') {
        (lockedPolygon as L.Path).bringToFront();
      }
    }

    if (loniCircleRef.current) {
      loniCircleRef.current.setStyle(computeLoniCircleStyle());
      if (hoveredKey === LONI_KALBHOR_GEO_KEY || lockedKey === LONI_KALBHOR_GEO_KEY) {
        loniCircleRef.current.bringToFront();
      }
    }

    if (markerLayerRef.current) {
      markerLayerRef.current.eachLayer((m) => {
        if (typeof (m as L.CircleMarker).bringToFront === 'function') {
          (m as L.CircleMarker).bringToFront();
        }
      });
    }
  }, [filteredProjects, hoveredKey, lockedKey, matchingKeys, layerMode, jurisdictionScope]);

  // Render verified OpenStreetMap-geocoded Project Markers (Circles)
  useEffect(() => {
    const markerGroup = markerLayerRef.current;
    if (!markerGroup) return;

    markerGroup.clearLayers();
    if (!showMarkers) return;

    for (const proj of filteredProjects) {
      if (proj.latitude === null || proj.longitude === null) continue;

      const isLoni = proj.jurisdiction === 'Loni Kalbhor Gram Panchayat';
      const fill = STATUS_FILL_COLORS[proj.status];
      const marker = L.circleMarker([proj.latitude, proj.longitude], {
        radius: 6.5,
        color: isLoni ? '#FEF3C7' : '#FFFFFF',
        weight: 2,
        opacity: 1,
        fillColor: fill,
        fillOpacity: 0.95
      });

      const costText =
        proj.estimatedCostCrores !== null
          ? formatCroresPrecise(proj.estimatedCostCrores)
          : 'Data unavailable';

      const tooltipHtml = `
        <div style="min-width:195px;max-width:255px;font-family:inherit;line-height:1.35;">
          <div style="font-size:10px;font-weight:700;color:${
            isLoni ? '#B45309' : '#0E7C74'
          };text-transform:uppercase;margin-bottom:2px;">
            ${isLoni ? 'Loni Kalbhor GP · Project' : 'PMC Project Pin'}
          </div>
          <div style="font-weight:700;color:#133429;font-size:12px;margin-bottom:3px;">${escapeHtml(
            proj.projectName
          )}</div>
          <div style="font-size:11px;color:#5A6560;">${escapeHtml(proj.department)}</div>
          <div style="font-size:11px;margin-top:4px;display:flex;justify-content:space-between;gap:8px;">
            <span style="color:#133429;font-weight:600;">${escapeHtml(costText)}</span>
            <span style="color:${fill};font-weight:700;">${escapeHtml(proj.status)}</span>
          </div>
          <div style="font-size:10px;color:#0E7C74;margin-top:3px;">Click pin for full record</div>
        </div>
      `;

      marker.bindTooltip(tooltipHtml, {
        direction: 'top',
        offset: [0, -6],
        className: 'pmc-hover-tooltip'
      });

      marker.on('click', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        onSelectProjectRef.current(proj);
      });

      marker.addTo(markerGroup);
    }
  }, [filteredProjects, showMarkers]);

  // Render Public Civic Asset / Facility Markers (Diamonds)
  useEffect(() => {
    const assetGroup = assetMarkerLayerRef.current;
    if (!assetGroup) return;

    assetGroup.clearLayers();
    if (!showAssetMarkers) return;

    for (const asset of publicAssets) {
      if (asset.latitude === null || asset.longitude === null) continue;
      if (
        jurisdictionScope === 'PMC' &&
        asset.jurisdiction !== 'Pune Municipal Corporation'
      ) {
        continue;
      }
      if (
        jurisdictionScope === 'Loni Kalbhor' &&
        asset.jurisdiction !== 'Loni Kalbhor Gram Panchayat'
      ) {
        continue;
      }

      const isLoni = asset.jurisdiction === 'Loni Kalbhor Gram Panchayat';
      const bg = isLoni ? '#B45309' : '#1E3A8A';
      const icon = L.divIcon({
        className: 'pmc-asset-diamond-wrapper',
        html: `<div style="width:11px;height:11px;background:${bg};border:1.8px solid #FFFFFF;border-radius:2px;transform:rotate(45deg);box-shadow:0 1px 3px rgba(0,0,0,0.35);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker([asset.latitude, asset.longitude], { icon });

      const tooltipHtml = `
        <div style="min-width:190px;max-width:250px;font-family:inherit;line-height:1.35;">
          <div style="font-size:10px;font-weight:700;color:${bg};text-transform:uppercase;margin-bottom:2px;">
            ${escapeHtml(asset.category)} · ${isLoni ? 'Loni Kalbhor' : 'PMC'}
          </div>
          <div style="font-weight:700;color:#133429;font-size:12px;margin-bottom:3px;">${escapeHtml(
            asset.name
          )}</div>
          <div style="font-size:11px;color:#5A6560;">${escapeHtml(asset.capacityOrMetric)}</div>
          <div style="font-size:10px;color:#0E7C74;margin-top:3px;">Click civic pin for details</div>
        </div>
      `;

      marker.bindTooltip(tooltipHtml, {
        direction: 'top',
        offset: [0, -6],
        className: 'pmc-hover-tooltip'
      });

      marker.on('click', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        onSelectAssetRef.current(asset);
      });

      marker.addTo(assetGroup);
    }
  }, [publicAssets, showAssetMarkers, jurisdictionScope]);

  // Smoothly focus/zoom when an area or Loni Kalbhor is selected via search or table locate
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusKey) return;

    if (focusKey === LONI_KALBHOR_GEO_KEY && loniCircleRef.current) {
      const bounds = loniCircleRef.current.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [70, 70], maxZoom: 13, animate: true });
      }
      return;
    }

    const targetLayer = featureLayersByKeyRef.current.get(focusKey) as L.Polygon | undefined;
    if (targetLayer && typeof targetLayer.getBounds === 'function') {
      const bounds = targetLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [70, 70], maxZoom: 14, animate: true });
      }
    }
  }, [focusKey]);

  const handleFitAll = () => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = getCombinedBounds(jurisdictionScope);
    if (bounds?.isValid()) {
      map.fitBounds(bounds, { padding: [22, 22], animate: true });
    }
  };

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

  const geocodedProjectPinsCount = filteredProjects.filter(
    (p) => p.latitude !== null && p.longitude !== null
  ).length;

  const geocodedAssetPinsCount = publicAssets.filter((a) => {
    if (a.latitude === null || a.longitude === null) return false;
    if (jurisdictionScope === 'PMC' && a.jurisdiction !== 'Pune Municipal Corporation') return false;
    if (jurisdictionScope === 'Loni Kalbhor' && a.jurisdiction !== 'Loni Kalbhor Gram Panchayat') {
      return false;
    }
    return true;
  }).length;

  return (
    <div className="relative w-full h-[460px] sm:h-[540px] lg:h-[640px] rounded-[8px] border border-[#E5E0D5] bg-[#F4F1EA] overflow-hidden">
      {/* Actual Leaflet Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full pmc-leaflet-container z-0"
        aria-label="Interactive Pune Municipal Corporation and Loni Kalbhor Map"
      />

      {/* Top-Left Live Hovered / Locked Status Indicator + Quick Loni Focus */}
      <div className="absolute top-3 left-3 z-[400] max-w-[calc(100%-115px)] pointer-events-none flex flex-wrap items-center gap-2">
        {activeAreaTitle ? (
          <div className="pointer-events-auto inline-flex items-center gap-2 bg-white/95 backdrop-blur-xs border border-[#E5E0D5] rounded-[6px] px-3 py-1.5 shadow-xs text-xs">
            {lockedKey ? (
              <Lock
                className={`w-3.5 h-3.5 shrink-0 ${
                  lockedKey === LONI_KALBHOR_GEO_KEY ? 'text-[#B45309]' : 'text-[#0E7C74]'
                }`}
              />
            ) : (
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  hoveredKey === LONI_KALBHOR_GEO_KEY ? 'bg-[#B45309]' : 'bg-[#0E7C74]'
                }`}
              />
            )}
            <span className="font-semibold text-[#133429] truncate max-w-[190px] sm:max-w-[280px]">
              {activeAreaTitle}
            </span>
            <span className="text-[11px] text-[#5A6560] hidden sm:inline">
              {lockedKey ? '· Locked' : '· Hovering'}
            </span>
            {lockedKey && (
              <button
                type="button"
                onClick={onResetSelection}
                className="ml-1 text-[11px] font-semibold text-[#0E7C74] hover:text-[#133429] inline-flex items-center gap-1 cursor-pointer"
                title="Clear locked area selection"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white/95 backdrop-blur-xs border border-[#E5E0D5] rounded-[6px] px-3 py-1.5 shadow-xs text-xs text-[#5A6560]">
            Hover over a PMC ward or Loni Kalbhor ({geocodedProjectPinsCount} project +{' '}
            {geocodedAssetPinsCount} civic pins)
          </div>
        )}
      </div>

      {/* Top-Right Map Zoom, Fit, Loni Jump & Layer Toggle Controls */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-1.5">
        <div className="bg-white/95 backdrop-blur-xs border border-[#E5E0D5] rounded-[6px] shadow-xs flex flex-col overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Zoom in map"
            className="w-9 h-9 flex items-center justify-center text-[#133429] hover:bg-[#FAF8F3] border-b border-[#E5E0D5] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Zoom out map"
            className="w-9 h-9 flex items-center justify-center text-[#133429] hover:bg-[#FAF8F3] cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={handleFitAll}
          aria-label="Reset map view to full scope"
          title="Fit Pune + Loni Kalbhor view"
          className="w-9 h-9 bg-white/95 backdrop-blur-xs border border-[#E5E0D5] rounded-[6px] shadow-xs flex items-center justify-center text-[#133429] hover:bg-[#FAF8F3] cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onJumpToLoni}
          aria-label="Focus Loni Kalbhor Gram Panchayat on map"
          title="Focus Loni Kalbhor (Gram Panchayat · Outside PMC)"
          className={`w-9 h-9 border rounded-[6px] shadow-xs flex items-center justify-center cursor-pointer transition-colors ${
            lockedKey === LONI_KALBHOR_GEO_KEY || jurisdictionScope === 'Loni Kalbhor'
              ? 'bg-[#B45309] border-[#92400E] text-white'
              : 'bg-white/95 border-[#E5E0D5] text-[#B45309] hover:bg-[#FAF8F3]'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setShowMarkers((prev) => !prev)}
          aria-pressed={showMarkers}
          aria-label={showMarkers ? 'Hide project location markers' : 'Show project location markers'}
          title={showMarkers ? 'Hide project pins' : 'Show project pins'}
          className={`w-9 h-9 border rounded-[6px] shadow-xs flex items-center justify-center cursor-pointer transition-colors ${
            showMarkers
              ? 'bg-[#133429] border-[#133429] text-[#FAF8F3]'
              : 'bg-white/95 border-[#E5E0D5] text-[#5A6560] hover:text-[#133429]'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setShowAssetMarkers((prev) => !prev)}
          aria-pressed={showAssetMarkers}
          aria-label={
            showAssetMarkers
              ? 'Hide public facilities & WTP pins'
              : 'Show public facilities & WTP pins'
          }
          title={
            showAssetMarkers
              ? 'Hide civic facilities & WTP pins'
              : 'Show civic facilities & WTP pins'
          }
          className={`w-9 h-9 border rounded-[6px] shadow-xs flex items-center justify-center cursor-pointer transition-colors ${
            showAssetMarkers
              ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white'
              : 'bg-white/95 border-[#E5E0D5] text-[#5A6560] hover:text-[#133429]'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tile Network Notice (only if OSM tiles encounter transient network block) */}
      {tileWarning && (
        <div className="absolute bottom-3 left-3 z-[410] max-w-xs bg-white/95 border border-[#D97706]/40 rounded-[6px] px-3 py-2 text-[11px] text-[#5A6560] shadow-xs">
          OpenStreetMap street tiles are temporarily slow; GeoJSON boundaries &amp; pins remain interactive.
        </div>
      )}

      {/* Bottom-Right Subtle Legend */}
      <div className="absolute bottom-3 right-3 z-[400] bg-white/95 backdrop-blur-xs border border-[#E5E0D5] rounded-[6px] px-3 py-2 shadow-xs text-[11px] space-y-1 max-w-[250px]">
        <div className="font-semibold text-[#133429]">Status &amp; Jurisdiction Key</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[#5A6560]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#15803D] inline-block shrink-0" />
            <span>Completed</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#0E7C74] inline-block shrink-0" />
            <span>Ongoing</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#D97706] inline-block shrink-0" />
            <span>Upcoming</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[#DC2626] inline-block shrink-0" />
            <span>Delayed</span>
          </span>
        </div>
        <div className="pt-1 border-t border-[#E5E0D5] flex flex-col gap-0.5 text-[#5A6560]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[2px] border border-dashed border-[#B45309] bg-[#D97706]/25 inline-block shrink-0" />
            <span>Loni Kalbhor (GP · Outside PMC)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0E7C74] border border-white ring-1 ring-[#133429]/30 inline-block shrink-0" />
            <span>Project Pin ({geocodedProjectPinsCount})</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#1E3A8A] border border-white rotate-45 inline-block shrink-0" />
            <span>Facility / WTP / Civic Pin ({geocodedAssetPinsCount})</span>
          </span>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-[500] bg-[#FAF8F3]/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2.5 p-6 text-center">
          <div className="w-7 h-7 rounded-full border-2 border-[#0E7C74] border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-[#133429]">
            Loading verified PMC GeoJSON boundaries &amp; Loni Kalbhor zone...
          </p>
        </div>
      )}

      {/* Error State Overlay */}
      {!loading && error && (
        <div className="absolute inset-0 z-[500] bg-[#FAF8F3]/95 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <AlertCircle className="w-7 h-7 text-[#B45309]" />
          <div className="space-y-1 max-w-md">
            <h3 className="font-serif text-base font-semibold text-[#133429]">
              Unable to Load PMC Ward Boundary GeoJSON
            </h3>
            <p className="text-xs text-[#5A6560] leading-relaxed">{error}</p>
          </div>
          <button
            type="button"
            onClick={onRetryLoad}
            className="h-9 px-4 rounded-[6px] bg-[#133429] hover:bg-[#0E2920] text-[#FAF8F3] text-xs font-semibold cursor-pointer"
          >
            Retry Loading Boundaries
          </button>
        </div>
      )}
    </div>
  );
};
