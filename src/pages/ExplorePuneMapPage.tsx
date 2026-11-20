import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BoundaryLayerMode,
  ImportHistoryRecord,
  JurisdictionFilterScope,
  MapFiltersState,
  MapMunicipalProject,
  MapPublicAsset,
  PmcDepartmentBudgetRecord,
  SelectedMapArea
} from '../types/puneMap';
import {
  ALL_INITIAL_DEPARTMENT_BUDGETS,
  ALL_MAP_PROJECTS,
  BOUNDARY_SOURCE_METADATA,
  INITIAL_REPORTING_DATE,
  LONI_KALBHOR_GEO_KEY,
  MAP_FINANCIAL_YEARS,
  MAP_PROJECT_CATEGORIES,
  MAP_PROJECT_STATUSES,
  PMC_ADMIN_WARD_GEO_META,
  buildLoniKalbhorSelectedArea,
  buildSelectedAreaFromFeature,
  computeAreaStats,
  filterMapProjects,
  getProjectsForArea
} from '../data/puneMapData';
import { ALL_PUBLIC_MAP_ASSETS, getPublicAssetsForArea } from '../data/punePublicMapAssets';
import { dataProvider } from '../services/dataProvider';
import { formatCroresPrecise } from '../utils/formatters';
import { PuneInteractiveMap } from '../components/PuneInteractiveMap';
import { WardProjectDetailModal } from '../components/WardProjectDetailModal';
import { PublicAssetDetailModal } from '../components/PublicAssetDetailModal';
import {
  BootstrapPayload,
  PmcDataIngestionDrawer
} from '../components/PmcDataIngestionDrawer';
import {
  Search,
  RotateCcw,
  Lock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  ArrowUpRight,
  Layers,
  X,
  Database,
  RefreshCw,
  Landmark,
  Droplets,
  Route,
  FileText,
  Compass
} from 'lucide-react';

interface SearchableGeoItem {
  featureKey: string;
  title: string;
  subtitle: string;
  searchText: string;
  area: SelectedMapArea;
}

type PublicDataExplorerTab = 'city-wide' | 'facilities' | 'roads-env' | 'budgets';

const DEFAULT_FILTERS: MapFiltersState = {
  jurisdiction: 'All',
  financialYear: 'All',
  department: 'All',
  category: 'All',
  status: 'All',
  searchQuery: '',
  projectQuery: ''
};

export const ExplorePuneMapPage: React.FC = () => {
  const [layerMode, setLayerMode] = useState<BoundaryLayerMode>('admin-wards');
  const [jurisdictionScope, setJurisdictionScope] = useState<JurisdictionFilterScope>('All');
  const [filters, setFilters] = useState<MapFiltersState>(DEFAULT_FILTERS);
  const [activeExplorerTab, setActiveExplorerTab] = useState<PublicDataExplorerTab>('city-wide');

  // Live SQLite database-backed collections (PMC + Loni Kalbhor GP)
  const [projects, setProjects] = useState<MapMunicipalProject[]>(ALL_MAP_PROJECTS);
  const [departmentBudgets, setDepartmentBudgets] = useState<PmcDepartmentBudgetRecord[]>(
    ALL_INITIAL_DEPARTMENT_BUDGETS
  );
  const [publicAssets, setPublicAssets] = useState<MapPublicAsset[]>(ALL_PUBLIC_MAP_ASSETS);
  const [importHistory, setImportHistory] = useState<ImportHistoryRecord[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>(INITIAL_REPORTING_DATE);
  const [dbStats, setDbStats] = useState<BootstrapPayload['dbStats']>({
    wardsCount: PMC_ADMIN_WARD_GEO_META.length,
    projectsCount: ALL_MAP_PROJECTS.length,
    markersCount: ALL_MAP_PROJECTS.filter((p) => p.latitude !== null && p.longitude !== null).length,
    departmentBudgetsCount: ALL_INITIAL_DEPARTMENT_BUDGETS.length,
    publicAssetsCount: ALL_PUBLIC_MAP_ASSETS.length
  });
  const [dbLoading, setDbLoading] = useState<boolean>(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isIngestionOpen, setIsIngestionOpen] = useState<boolean>(false);

  const [geoCache, setGeoCache] = useState<
    Partial<Record<BoundaryLayerMode, GeoJSON.FeatureCollection>>
  >({});
  const [loadingGeo, setLoadingGeo] = useState<boolean>(true);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState<number>(0);

  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [hoveredArea, setHoveredArea] = useState<SelectedMapArea | null>(null);
  const [lockedKey, setLockedKey] = useState<string | null>(null);
  const [lockedArea, setLockedArea] = useState<SelectedMapArea | null>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);

  const [showAllAreaProjects, setShowAllAreaProjects] = useState<boolean>(false);
  const [selectedModalProject, setSelectedModalProject] = useState<MapMunicipalProject | null>(null);
  const [selectedModalAsset, setSelectedModalAsset] = useState<MapPublicAsset | null>(null);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState<boolean>(false);

  const hoverClearTimerRef = useRef<number | null>(null);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  const currentGeoData = geoCache[layerMode] ?? null;

  // Non-project Loni Kalbhor and PMC civic datasets for full transparency
  const loniDemographics = useMemo(() => dataProvider.getLoniKalbhorDemographics(), []);
  const loniWaterFacilities = useMemo(() => dataProvider.getLoniKalbhorWaterFacilities(), []);
  const loniRoads = useMemo(() => dataProvider.getLoniKalbhorRoads(), []);
  const loniFacilities = useMemo(() => dataProvider.getLoniKalbhorFacilities(), []);
  const pmcStps = useMemo(() => dataProvider.getSewageTreatmentPlants(), []);
  const pmcFacilityCategories = useMemo(() => dataProvider.getPublicFacilityCategories(), []);
  const pmcCivicAssets = useMemo(() => dataProvider.getCivicAssets(), []);
  const pmcRoads = useMemo(() => dataProvider.getRoadsDevelopmentItems(), []);
  const pmcTenders = useMemo(() => dataProvider.getTenders(), []);
  const pmcEnvironment = useMemo(() => dataProvider.getEnvironmentIndicators(), []);

  const applyBootstrapPayload = useCallback((payload: BootstrapPayload) => {
    if (Array.isArray(payload.projects) && payload.projects.length > 0) {
      setProjects(payload.projects);
    }
    if (Array.isArray(payload.departmentBudgets) && payload.departmentBudgets.length > 0) {
      setDepartmentBudgets(payload.departmentBudgets);
    }
    if (Array.isArray(payload.publicAssets) && payload.publicAssets.length > 0) {
      setPublicAssets(payload.publicAssets);
    }
    if (Array.isArray(payload.importHistory)) setImportHistory(payload.importHistory);
    if (payload.lastUpdated) setLastUpdated(payload.lastUpdated);
    if (payload.dbStats) setDbStats(payload.dbStats);
  }, []);

  const fetchBootstrapFromDb = useCallback(async () => {
    setDbLoading(true);
    setDbError(null);
    try {
      const res = await fetch('/api/pmc/map-bootstrap');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} while reading Pune civic database`);
      }
      const data = (await res.json()) as BootstrapPayload;
      applyBootstrapPayload(data);
    } catch (err) {
      setDbError(
        err instanceof Error
          ? err.message
          : 'Live database endpoint unavailable; showing built-in verified PMC + Loni Kalbhor datasets.'
      );
    } finally {
      setDbLoading(false);
    }
  }, [applyBootstrapPayload]);

  useEffect(() => {
    fetchBootstrapFromDb();
  }, [fetchBootstrapFromDb]);

  // Load real GeoJSON boundaries from /public/data/
  useEffect(() => {
    if (geoCache[layerMode]) {
      setLoadingGeo(false);
      setGeoError(null);
      return;
    }

    let cancelled = false;
    const url =
      layerMode === 'admin-wards'
        ? '/data/pmc-admin-wards-2017.geojson'
        : '/data/pmc-prabhags-2022.geojson';

    setLoadingGeo(true);
    setGeoError(null);

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} while loading PMC GeoJSON boundaries`);
        }
        return res.json() as Promise<GeoJSON.FeatureCollection>;
      })
      .then((json) => {
        if (cancelled) return;
        setGeoCache((prev) => ({ ...prev, [layerMode]: json }));
        setLoadingGeo(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to load verified Pune Municipal Corporation GeoJSON boundaries.';
        setGeoError(message);
        setLoadingGeo(false);
      });

    return () => {
      cancelled = true;
    };
  }, [layerMode, reloadNonce, geoCache]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Reset selected PMC area when switching between 15 Admin Wards and 58 Prabhags
  const handleChangeLayerMode = (nextMode: BoundaryLayerMode) => {
    if (nextMode === layerMode) return;
    if (hoverClearTimerRef.current) {
      window.clearTimeout(hoverClearTimerRef.current);
      hoverClearTimerRef.current = null;
    }
    setLayerMode(nextMode);
    if (lockedKey !== LONI_KALBHOR_GEO_KEY) {
      setHoveredKey(null);
      setHoveredArea(null);
      setLockedKey(null);
      setLockedArea(null);
      setFocusKey(null);
    }
    setShowAllAreaProjects(false);
  };

  // Switch Jurisdictional Scope (All Pune + Loni Kalbhor | PMC Only | Loni Kalbhor GP)
  const handleChangeJurisdictionScope = (nextScope: JurisdictionFilterScope) => {
    setJurisdictionScope(nextScope);
    setFilters((prev) => ({ ...prev, jurisdiction: nextScope }));
    if (nextScope === 'Loni Kalbhor') {
      const loniArea = buildLoniKalbhorSelectedArea();
      setLockedKey(LONI_KALBHOR_GEO_KEY);
      setLockedArea(loniArea);
      setHoveredKey(LONI_KALBHOR_GEO_KEY);
      setHoveredArea(loniArea);
      setFocusKey(LONI_KALBHOR_GEO_KEY);
    } else if (nextScope === 'PMC' && lockedKey === LONI_KALBHOR_GEO_KEY) {
      setLockedKey(null);
      setLockedArea(null);
      setHoveredKey(null);
      setHoveredArea(null);
      setFocusKey(null);
    }
  };

  const handleJumpToLoni = () => {
    const loniArea = buildLoniKalbhorSelectedArea();
    setLockedKey(LONI_KALBHOR_GEO_KEY);
    setLockedArea(loniArea);
    setHoveredKey(LONI_KALBHOR_GEO_KEY);
    setHoveredArea(loniArea);
    setFocusKey(LONI_KALBHOR_GEO_KEY);
  };

  // Distinct departments derived strictly from DB-loaded PMC + Loni Kalbhor map projects
  const departments = useMemo(() => {
    return Array.from(new Set(projects.map((p) => p.department))).sort();
  }, [projects]);

  // Filtered project set (drives map status, pins, and right-side statistics)
  const filteredProjects = useMemo(() => {
    return filterMapProjects(projects, {
      ...filters,
      jurisdiction: jurisdictionScope
    });
  }, [projects, filters, jurisdictionScope]);

  // Filtered public civic assets matching jurisdiction scope
  const scopedPublicAssets = useMemo(() => {
    if (jurisdictionScope === 'PMC') {
      return publicAssets.filter((a) => a.jurisdiction === 'Pune Municipal Corporation');
    }
    if (jurisdictionScope === 'Loni Kalbhor') {
      return publicAssets.filter((a) => a.jurisdiction === 'Loni Kalbhor Gram Panchayat');
    }
    return publicAssets;
  }, [publicAssets, jurisdictionScope]);

  // Filtered departmental budgets aligned with active FY, Department & Jurisdiction filter
  const filteredBudgets = useMemo(() => {
    return departmentBudgets.filter((b) => {
      const jur = b.jurisdiction ?? 'Pune Municipal Corporation';
      if (jurisdictionScope === 'PMC' && jur !== 'Pune Municipal Corporation') return false;
      if (jurisdictionScope === 'Loni Kalbhor' && jur !== 'Loni Kalbhor Gram Panchayat') {
        return false;
      }
      if (filters.financialYear !== 'All' && b.financialYear !== filters.financialYear) {
        return false;
      }
      if (
        filters.department !== 'All' &&
        !b.departmentName.toLowerCase().includes(filters.department.toLowerCase()) &&
        !filters.department.toLowerCase().includes(b.departmentName.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [departmentBudgets, jurisdictionScope, filters.financialYear, filters.department]);

  // City-wide / unmapped projects matching active filters
  const cityWideProjects = useMemo(() => {
    return filteredProjects.filter((p) => p.wardScope === 'City-Wide');
  }, [filteredProjects]);

  // Build searchable directory from loaded GeoJSON features + metadata + Loni Kalbhor GP
  const searchableAreas = useMemo<SearchableGeoItem[]>(() => {
    const loniArea = buildLoniKalbhorSelectedArea();
    const loniItem: SearchableGeoItem = {
      featureKey: LONI_KALBHOR_GEO_KEY,
      title: 'Loni Kalbhor (Gram Panchayat · Outside PMC)',
      subtitle: 'Census 556123 · Haveli Taluka · NH 65, Rajbaug, Kadamwak Wasti',
      searchText:
        'loni kalbhor gram panchayat haveli taluka nh 65 solapur highway mit adt rajbaug kadamwak wasti railway station 556123 outside pmc',
      area: loniArea
    };

    const pmcItems: SearchableGeoItem[] = !currentGeoData?.features?.length
      ? layerMode === 'admin-wards'
        ? PMC_ADMIN_WARD_GEO_META.map((m) => {
            const area = buildSelectedAreaFromFeature('admin-wards', { name: m.geoFeatureName });
            return {
              featureKey: m.geoFeatureName,
              title: area.title,
              subtitle: `${area.officialIdLabel} · ${m.keyLocalities.slice(0, 3).join(', ')}`,
              searchText: `${area.title} ${m.geoFeatureName} ${m.zone} ${m.keyLocalities.join(' ')} ${m.prabhagCoverage2022}`.toLowerCase(),
              area
            };
          })
        : []
      : currentGeoData.features.map((feat) => {
          const props = (feat.properties || {}) as Record<string, unknown>;
          const key =
            layerMode === 'admin-wards'
              ? String(props.name ?? '')
              : String(props.wardnum ?? '');
          const area = buildSelectedAreaFromFeature(layerMode, props);
          return {
            featureKey: key,
            title:
              layerMode === 'prabhags-2022'
                ? `Prabhag ${String(props.wardnum ?? '').padStart(2, '0')} · ${area.title}`
                : area.title,
            subtitle:
              layerMode === 'admin-wards'
                ? area.localities.slice(0, 4).join(', ')
                : area.subtitle,
            searchText: `${area.title} ${area.subtitle} ${area.officialIdLabel} ${area.zone} ${area.localities.join(' ')}`.toLowerCase(),
            area
          };
        });

    if (jurisdictionScope === 'Loni Kalbhor') return [loniItem];
    if (jurisdictionScope === 'PMC') return pmcItems;
    return [loniItem, ...pmcItems];
  }, [currentGeoData, layerMode, jurisdictionScope]);

  const searchMatches = useMemo(() => {
    const q = filters.searchQuery.trim().toLowerCase();
    if (!q) return [];
    return searchableAreas.filter((item) => item.searchText.includes(q));
  }, [searchableAreas, filters.searchQuery]);

  const matchingKeys = useMemo<Set<string> | null>(() => {
    if (!filters.searchQuery.trim()) return null;
    return new Set(searchMatches.map((m) => m.featureKey));
  }, [filters.searchQuery, searchMatches]);

  // Zero-flicker hover handling
  const handleHoverArea = (area: SelectedMapArea | null, featureKey: string | null) => {
    if (hoverClearTimerRef.current) {
      window.clearTimeout(hoverClearTimerRef.current);
      hoverClearTimerRef.current = null;
    }

    if (area && featureKey) {
      setHoveredKey(featureKey);
      setHoveredArea(area);
    } else {
      hoverClearTimerRef.current = window.setTimeout(() => {
        setHoveredKey(null);
      }, 45);
    }
  };

  const handleLockArea = (area: SelectedMapArea, featureKey: string) => {
    if (hoverClearTimerRef.current) {
      window.clearTimeout(hoverClearTimerRef.current);
      hoverClearTimerRef.current = null;
    }
    setLockedKey(featureKey);
    setLockedArea(area);
    setHoveredKey(featureKey);
    setHoveredArea(area);
    setShowAllAreaProjects(false);
  };

  const handleResetSelection = () => {
    setLockedKey(null);
    setLockedArea(null);
    setHoveredKey(null);
    setHoveredArea(null);
    setFocusKey(null);
    setShowAllAreaProjects(false);
  };

  const handleSelectSearchResult = (item: SearchableGeoItem) => {
    handleLockArea(item.area, item.featureKey);
    setFocusKey(item.featureKey);
    setIsSearchDropdownOpen(false);
  };

  const handleResetFilters = () => {
    setJurisdictionScope('All');
    setFilters(DEFAULT_FILTERS);
    setIsSearchDropdownOpen(false);
  };

  const activeArea = lockedArea ?? hoveredArea;
  const activeKey = lockedKey ?? activeArea?.featureKey ?? null;

  const activeAreaProjects = useMemo(() => {
    if (!activeKey) return [];
    return getProjectsForArea(
      filteredProjects,
      activeKey === LONI_KALBHOR_GEO_KEY ? 'gram-panchayat' : layerMode,
      activeKey
    );
  }, [filteredProjects, layerMode, activeKey]);

  const activeAreaAssets = useMemo(() => {
    if (!activeKey) return [];
    return getPublicAssetsForArea(
      publicAssets,
      activeKey === LONI_KALBHOR_GEO_KEY ? 'gram-panchayat' : layerMode,
      activeKey
    );
  }, [publicAssets, layerMode, activeKey]);

  const activeStats = useMemo(() => {
    return computeAreaStats(activeAreaProjects);
  }, [activeAreaProjects]);

  const activeWardBaseline = useMemo(() => {
    if (!activeArea?.pmcWardOfficeId) return undefined;
    return dataProvider.getWardIntelligenceById(activeArea.pmcWardOfficeId);
  }, [activeArea]);

  const visibleAreaProjects = showAllAreaProjects
    ? activeAreaProjects
    : activeAreaProjects.slice(0, 3);

  const hasActiveFilters =
    jurisdictionScope !== 'All' ||
    filters.financialYear !== 'All' ||
    filters.department !== 'All' ||
    filters.category !== 'All' ||
    filters.status !== 'All' ||
    filters.searchQuery.trim() !== '' ||
    filters.projectQuery.trim() !== '';

  const boundaryMeta = BOUNDARY_SOURCE_METADATA[layerMode];

  const getStatusTextClass = (status: MapMunicipalProject['status']) => {
    switch (status) {
      case 'Completed':
        return 'text-[#15803D]';
      case 'Ongoing':
        return 'text-[#0E7C74]';
      case 'Upcoming':
        return 'text-[#B45309]';
      case 'Delayed':
        return 'text-[#DC2626]';
    }
  };

  const getVerificationTextClass = (status: string) => {
    if (
      status === 'Official source verified' ||
      status === 'Government document available' ||
      status === 'Verified' ||
      status === 'Verified Official'
    ) {
      return 'text-[#15803D]';
    }
    if (status === 'Secondary source' || status === 'Estimated') return 'text-[#0E7C74]';
    return 'text-[#B45309]';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Title, DB Status, Jurisdiction Scope & Boundary Layer Switcher */}
      <div className="bg-white rounded-[8px] border border-[#E5E0D5] p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-[#E5E0D5] pb-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0E7C74]">
              <span>GIS Civic Explorer · Pune Municipal Corporation + Loni Kalbhor (GP)</span>
              <span aria-hidden="true" className="text-[#D4CEC2]">·</span>
              <span className="font-mono text-[#5A6560] tracking-normal normal-case">
                Last Updated: {lastUpdated.slice(0, 10)}
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#133429] tracking-tight">
              Explore Pune – Interactive Municipal &amp; Regional Project Map
            </h2>
            <p className="text-xs sm:text-sm text-[#5A6560] leading-relaxed">
              Move your cursor over any PMC ward, 2022 Prabhag, or Loni Kalbhor Gram Panchayat (outside PMC limits) to inspect projects, Water Treatment Plants, civic facilities, and official budgets. Click any pin for full details.
            </p>
            <p className="text-[11px] font-mono tabular-nums text-[#5A6560] pt-0.5">
              SQLite DB: {dbStats.wardsCount} PMC Wards + Loni GP · {dbStats.projectsCount} Projects ({dbStats.markersCount} Project Pins) · {dbStats.publicAssetsCount ?? publicAssets.length} Public Civic Assets · {dbStats.departmentBudgetsCount} Finance Rows
              {dbLoading ? ' · Syncing...' : ''}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2.5 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleJumpToLoni}
                className={`h-9 px-3 rounded-[6px] border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  lockedKey === LONI_KALBHOR_GEO_KEY
                    ? 'bg-[#B45309] border-[#92400E] text-white'
                    : 'border-[#B45309]/50 bg-[#D97706]/10 hover:bg-[#D97706]/20 text-[#92400E]'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Inspect Loni Kalbhor (GP)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsIngestionOpen(true)}
                className="h-9 px-3.5 rounded-[6px] border border-[#133429] bg-white hover:bg-[#FAF8F3] text-[#133429] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-[#0E7C74]" />
                <span>Sync &amp; Import Data</span>
              </button>
              {dbError && (
                <button
                  type="button"
                  onClick={fetchBootstrapFromDb}
                  className="h-9 px-3 rounded-[6px] border border-[#B45309]/40 bg-[#D97706]/10 text-[#B45309] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                  title={dbError}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry DB</span>
                </button>
              )}
            </div>

            {/* Jurisdiction Scope Switcher */}
            <div className="flex flex-col sm:items-end gap-1">
              <span className="text-[11px] font-semibold text-[#5A6560]">
                Jurisdiction Scope (Strictly Separated)
              </span>
              <div
                role="group"
                aria-label="Filter Jurisdiction Scope"
                className="inline-flex p-0.5 rounded-[6px] bg-[#FAF8F3] border border-[#E5E0D5]"
              >
                <button
                  type="button"
                  onClick={() => handleChangeJurisdictionScope('All')}
                  className={`h-7 px-2.5 rounded-[4px] text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    jurisdictionScope === 'All'
                      ? 'bg-[#133429] text-[#FAF8F3]'
                      : 'text-[#5A6560] hover:text-[#133429]'
                  }`}
                >
                  All Pune + Loni Kalbhor
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeJurisdictionScope('PMC')}
                  className={`h-7 px-2.5 rounded-[4px] text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    jurisdictionScope === 'PMC'
                      ? 'bg-[#133429] text-[#FAF8F3]'
                      : 'text-[#5A6560] hover:text-[#133429]'
                  }`}
                >
                  PMC Only
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeJurisdictionScope('Loni Kalbhor')}
                  className={`h-7 px-2.5 rounded-[4px] text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    jurisdictionScope === 'Loni Kalbhor'
                      ? 'bg-[#B45309] text-white'
                      : 'text-[#5A6560] hover:text-[#133429]'
                  }`}
                >
                  Loni Kalbhor (GP)
                </button>
              </div>
            </div>

            {/* Verified Boundary Layer Switcher */}
            <div className="flex flex-col sm:items-end gap-1">
              <span className="text-[11px] font-semibold text-[#5A6560] inline-flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#0E7C74]" />
                <span>PMC Boundary Layer</span>
              </span>
              <div
                role="group"
                aria-label="Select PMC Boundary Layer"
                className="inline-flex p-0.5 rounded-[6px] bg-[#FAF8F3] border border-[#E5E0D5]"
              >
                <button
                  type="button"
                  onClick={() => handleChangeLayerMode('admin-wards')}
                  className={`h-8 px-3 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    layerMode === 'admin-wards'
                      ? 'bg-[#133429] text-[#FAF8F3]'
                      : 'text-[#5A6560] hover:text-[#133429]'
                  }`}
                >
                  15 Administrative Wards
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeLayerMode('prabhags-2022')}
                  className={`h-8 px-3 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    layerMode === 'prabhags-2022'
                      ? 'bg-[#133429] text-[#FAF8F3]'
                      : 'text-[#5A6560] hover:text-[#133429]'
                  }`}
                >
                  58 Prabhags (PMC 2022)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Dual Search Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          {/* Ward / Area / Loni Kalbhor Search */}
          <div ref={searchBoxRef} className="sm:col-span-1 lg:col-span-3 relative">
            <label
              htmlFor="map-ward-search"
              className="block text-[11px] font-semibold text-[#5A6560] mb-1"
            >
              Search Ward, Locality or Loni Kalbhor
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#0E7C74] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="map-ward-search"
                type="text"
                value={filters.searchQuery}
                onFocus={() => setIsSearchDropdownOpen(true)}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, searchQuery: e.target.value }));
                  setIsSearchDropdownOpen(true);
                }}
                placeholder="e.g., Shivajinagar, Loni Kalbhor..."
                className="w-full h-9 pl-9 pr-8 rounded-[6px] border border-[#E5E0D5] bg-[#FAF8F3] focus:bg-white text-xs text-[#1C2422] placeholder-[#5A6560]/80 focus:outline-hidden focus:border-[#0E7C74]"
              />
              {filters.searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, searchQuery: '' }));
                    setIsSearchDropdownOpen(false);
                  }}
                  aria-label="Clear ward search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-[#5A6560] hover:text-[#133429] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {isSearchDropdownOpen && filters.searchQuery.trim() !== '' && (
              <div className="absolute left-0 right-0 top-full mt-1 z-[450] bg-white border border-[#E5E0D5] rounded-[6px] shadow-lg max-h-60 overflow-y-auto divide-y divide-[#E5E0D5]/60">
                {searchMatches.length === 0 ? (
                  <div className="px-3 py-2.5 text-xs text-[#5A6560]">
                    No PMC ward or Loni Kalbhor locality matched &ldquo;{filters.searchQuery}&rdquo;.
                  </div>
                ) : (
                  searchMatches.slice(0, 8).map((item) => (
                    <button
                      key={item.featureKey}
                      type="button"
                      onClick={() => handleSelectSearchResult(item)}
                      className="w-full text-left px-3 py-2 hover:bg-[#FAF8F3] transition-colors cursor-pointer"
                    >
                      <span className="block text-xs font-semibold text-[#133429]">
                        {item.title}
                      </span>
                      <span className="block text-[11px] text-[#5A6560] truncate">
                        {item.subtitle}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Project Name Search */}
          <div className="sm:col-span-1 lg:col-span-3 relative">
            <label
              htmlFor="map-project-search"
              className="block text-[11px] font-semibold text-[#5A6560] mb-1"
            >
              Filter by Project Name
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#5A6560] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="map-project-search"
                type="text"
                value={filters.projectQuery}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, projectQuery: e.target.value }))
                }
                placeholder="e.g., Sinhagad, Jal Jeevan, JICA..."
                className="w-full h-9 pl-9 pr-8 rounded-[6px] border border-[#E5E0D5] bg-[#FAF8F3] focus:bg-white text-xs text-[#1C2422] placeholder-[#5A6560]/80 focus:outline-hidden focus:border-[#0E7C74]"
              />
              {filters.projectQuery && (
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, projectQuery: '' }))}
                  aria-label="Clear project search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-[#5A6560] hover:text-[#133429] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Financial Year */}
          <div className="lg:col-span-1">
            <label
              htmlFor="map-filter-fy"
              className="block text-[11px] font-semibold text-[#5A6560] mb-1"
            >
              FY
            </label>
            <select
              id="map-filter-fy"
              value={filters.financialYear}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, financialYear: e.target.value }))
              }
              className="w-full h-9 px-2 rounded-[6px] border border-[#E5E0D5] bg-[#FAF8F3] text-xs text-[#1C2422] focus:outline-hidden focus:border-[#0E7C74]"
            >
              <option value="All">All FYs</option>
              {MAP_FINANCIAL_YEARS.map((fy) => (
                <option key={fy} value={fy}>
                  {fy}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div className="lg:col-span-2">
            <label
              htmlFor="map-filter-dept"
              className="block text-[11px] font-semibold text-[#5A6560] mb-1"
            >
              Department / Agency
            </label>
            <select
              id="map-filter-dept"
              value={filters.department}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, department: e.target.value }))
              }
              className="w-full h-9 px-2.5 rounded-[6px] border border-[#E5E0D5] bg-[#FAF8F3] text-xs text-[#1C2422] focus:outline-hidden focus:border-[#0E7C74]"
            >
              <option value="All">All Agencies</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Project Category */}
          <div className="lg:col-span-1">
            <label
              htmlFor="map-filter-category"
              className="block text-[11px] font-semibold text-[#5A6560] mb-1"
            >
              Category
            </label>
            <select
              id="map-filter-category"
              value={filters.category}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, category: e.target.value }))
              }
              className="w-full h-9 px-2 rounded-[6px] border border-[#E5E0D5] bg-[#FAF8F3] text-xs text-[#1C2422] focus:outline-hidden focus:border-[#0E7C74]"
            >
              <option value="All">All 7</option>
              {MAP_PROJECT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Project Status + Clear Filters */}
          <div className="lg:col-span-2 flex items-end gap-2">
            <div className="flex-1 min-w-0">
              <label
                htmlFor="map-filter-status"
                className="block text-[11px] font-semibold text-[#5A6560] mb-1"
              >
                Status
              </label>
              <select
                id="map-filter-status"
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full h-9 px-2 rounded-[6px] border border-[#E5E0D5] bg-[#FAF8F3] text-xs text-[#1C2422] focus:outline-hidden focus:border-[#0E7C74]"
              >
                <option value="All">All Statuses</option>
                {MAP_PROJECT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                title="Clear all filters"
                aria-label="Clear all filters"
                className="h-9 px-2.5 rounded-[6px] border border-[#E5E0D5] bg-white hover:bg-[#FAF8F3] text-xs font-semibold text-[#133429] inline-flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#0E7C74]" />
                <span className="hidden xl:inline">Clear</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Responsive Split: Left Interactive Map + Right Fixed/Sticky Info Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Interactive Map + Boundary Provenance */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          <PuneInteractiveMap
            layerMode={layerMode}
            jurisdictionScope={jurisdictionScope}
            geoData={currentGeoData}
            loading={loadingGeo}
            error={geoError}
            onRetryLoad={() => setReloadNonce((n) => n + 1)}
            filteredProjects={filteredProjects}
            publicAssets={scopedPublicAssets}
            hoveredKey={hoveredKey}
            lockedKey={lockedKey}
            activeAreaTitle={activeArea?.title ?? null}
            matchingKeys={matchingKeys}
            focusKey={focusKey}
            onHoverArea={handleHoverArea}
            onLockArea={handleLockArea}
            onSelectProject={(proj) => setSelectedModalProject(proj)}
            onSelectAsset={(asset) => setSelectedModalAsset(asset)}
            onJumpToLoni={handleJumpToLoni}
            onResetSelection={handleResetSelection}
          />

          {/* Boundary Source & Data Limitations Bar */}
          <div className="bg-white rounded-[8px] border border-[#E5E0D5] p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 font-semibold text-[#133429]">
                <Info className="w-3.5 h-3.5 text-[#0E7C74] shrink-0" />
                <span>{boundaryMeta.sourceName}</span>
                <span aria-hidden="true" className="text-[#D4CEC2]">·</span>
                <span className="font-mono text-[11px] text-[#5A6560]">
                  {boundaryMeta.featureCount} Polygons · {boundaryMeta.license}
                </span>
              </div>
              <p className="text-[#5A6560] leading-relaxed">{boundaryMeta.coverageNote}</p>
              <p className="text-[11px] text-[#B45309] leading-relaxed">
                <strong>Loni Kalbhor Zone Note:</strong> Loni Kalbhor Gram Panchayat (Census 556123 · LGD 189234 · 24.6 sq.km) lies strictly <strong>outside PMC limits</strong> under Haveli Taluka / Pune Zilla Parishad and is displayed via a dashed bronze reference circle centered on OpenStreetMap coordinates (18.4884°N, 74.0222°E) as official GP polygon shapefiles are unavailable.
              </p>
            </div>
            <a
              href={boundaryMeta.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0E7C74] hover:text-[#133429] shrink-0"
            >
              <span>Boundary Source</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* RIGHT: Fixed/Sticky Information Panel */}
        <aside
          aria-label="Selected Area Information Panel"
          className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-[84px] bg-white rounded-[8px] border border-[#E5E0D5] overflow-hidden"
        >
          {/* 1. SELECTED AREA */}
          <div className="p-5 border-b border-[#E5E0D5] bg-[#FAF8F3] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  activeArea?.isLoniKalbhor ? 'text-[#B45309]' : 'text-[#0E7C74]'
                }`}
              >
                {activeArea?.isLoniKalbhor
                  ? 'Outside PMC · Gram Panchayat'
                  : 'Selected Area'}
              </span>
              {activeArea && (
                <div className="flex items-center gap-2">
                  {lockedKey ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#133429]">
                      <Lock className="w-3 h-3 text-[#0E7C74]" />
                      <span>Selection Locked</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-[#5A6560]">
                      Live Hover · Click to lock
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleResetSelection}
                    className="text-[11px] font-semibold text-[#0E7C74] hover:text-[#133429] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>
              )}
            </div>

            {activeArea ? (
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-semibold text-[#133429] leading-snug">
                  {activeArea.title}
                </h3>
                <p className="text-xs font-mono text-[#5A6560]">
                  {activeArea.officialIdLabel}
                </p>
                <p className="text-xs text-[#5A6560]">
                  {activeArea.zone}
                  {activeArea.localities.length > 0 &&
                    ` · ${activeArea.localities.slice(0, 4).join(', ')}`}
                </p>
                {activeArea.isLoniKalbhor && (
                  <div className="mt-2 p-2.5 rounded-[6px] bg-white border border-[#B45309]/30 text-[11px] text-[#5A6560] font-mono tabular-nums space-y-1">
                    <div>
                      Census 2011: <strong className="text-[#133429]">{loniDemographics.totalPopulation.toLocaleString()}</strong> Pop ·{' '}
                      {loniDemographics.totalHouseholds.toLocaleString()} Households · {loniDemographics.literacyRatePct}% Literacy
                    </div>
                    <div>
                      Water Infrastructure: <strong className="text-[#133429]">24.0 MLD</strong> Cap ({loniWaterFacilities.length} schemes) · Roads:{' '}
                      <strong className="text-[#133429]">57.1 km</strong> ({loniRoads.length} corridors)
                    </div>
                  </div>
                )}
                {activeWardBaseline && (
                  <p className="text-[11px] text-[#5A6560] pt-1 font-mono tabular-nums">
                    Ward Office Baseline: {activeWardBaseline.schoolsCount} Schools ·{' '}
                    {activeWardBaseline.healthcareFacilitiesCount} Health Centres ·{' '}
                    {activeWardBaseline.drainageCoveragePct}% Drainage
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-semibold text-[#133429]">
                  No Area Selected
                </h3>
                <p className="text-xs text-[#5A6560] leading-relaxed">
                  Move your cursor over any PMC polygon or the Loni Kalbhor GP zone on the map—or tap on mobile—to inspect local projects, financial figures, and public assets immediately.
                </p>
              </div>
            )}
          </div>

          {/* 2. PROJECT SUMMARY */}
          <div className="p-5 border-b border-[#E5E0D5] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5A6560]">
                Project Summary
              </span>
              {activeArea && (
                <span className="text-[11px] font-mono tabular-nums text-[#5A6560]">
                  {activeArea.isLoniKalbhor
                    ? `${activeStats.wardSpecificCount} Gram Panchayat`
                    : `${activeStats.wardSpecificCount} Ward · ${activeStats.multiWardCount} Corridor`}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
              <div className="flex items-baseline justify-between border-b border-[#E5E0D5]/60 pb-1.5">
                <span className="text-[#5A6560]">Total Registered</span>
                <span className="font-mono tabular-nums font-bold text-[#133429]">
                  {activeArea ? activeStats.totalProjects : '—'}
                </span>
              </div>
              <div className="flex items-baseline justify-between border-b border-[#E5E0D5]/60 pb-1.5">
                <span className="text-[#5A6560]">Ongoing</span>
                <span className="font-mono tabular-nums font-semibold text-[#0E7C74]">
                  {activeArea ? activeStats.ongoingCount : '—'}
                </span>
              </div>
              <div className="flex items-baseline justify-between border-b border-[#E5E0D5]/60 pb-1.5">
                <span className="text-[#5A6560]">Completed</span>
                <span className="font-mono tabular-nums font-semibold text-[#15803D]">
                  {activeArea ? activeStats.completedCount : '—'}
                </span>
              </div>
              <div className="flex items-baseline justify-between border-b border-[#E5E0D5]/60 pb-1.5">
                <span className="text-[#5A6560]">Upcoming</span>
                <span className="font-mono tabular-nums font-semibold text-[#B45309]">
                  {activeArea ? activeStats.upcomingCount : '—'}
                </span>
              </div>
              <div className="col-span-2 flex items-baseline justify-between">
                <span className="text-[#5A6560]">Delayed (Documented)</span>
                <span className="font-mono tabular-nums font-medium text-[#5A6560]">
                  {!activeArea
                    ? '—'
                    : activeStats.delayedCount > 0
                    ? activeStats.delayedCount
                    : 'Not Documented'}
                </span>
              </div>
            </div>
          </div>

          {/* 3. FINANCIAL SUMMARY */}
          <div className="p-5 border-b border-[#E5E0D5] space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5A6560] block">
              Financial Summary
            </span>

            <dl className="space-y-2 text-xs">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-[#5A6560]">
                  {activeArea?.isLoniKalbhor ? 'Total Sanctioned Cost' : 'Total Estimated Cost'}
                </dt>
                <dd className="font-mono tabular-nums font-bold text-[#133429]">
                  {!activeArea
                    ? '—'
                    : activeStats.totalEstimatedCostCrores !== null
                    ? formatCroresPrecise(activeStats.totalEstimatedCostCrores)
                    : 'Data unavailable'}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-[#5A6560]">
                  {activeArea?.isLoniKalbhor ? 'Funds Released' : 'Total Approved Funding'}
                </dt>
                <dd className="font-mono tabular-nums font-bold text-[#0E7C74]">
                  {!activeArea
                    ? '—'
                    : activeStats.totalApprovedFundingCrores !== null
                    ? formatCroresPrecise(activeStats.totalApprovedFundingCrores)
                    : 'Data unavailable'}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-[#5A6560]">Actual Expenditure</dt>
                <dd className="font-mono tabular-nums font-medium text-[#B45309]">
                  {!activeArea
                    ? '—'
                    : activeStats.totalActualExpenditureCrores !== null
                    ? formatCroresPrecise(activeStats.totalActualExpenditureCrores)
                    : 'Data unavailable'}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-[#5A6560]">Remaining Allocation</dt>
                <dd className="font-mono tabular-nums font-medium text-[#5A6560]">
                  {!activeArea
                    ? '—'
                    : activeStats.remainingAllocationCrores !== null
                    ? formatCroresPrecise(activeStats.remainingAllocationCrores)
                    : 'Data unavailable'}
                </dd>
              </div>
            </dl>

            {activeArea && activeStats.hasMultiWardCostSharing && (
              <p className="text-[11px] text-[#5A6560] bg-[#FAF8F3] border border-[#E5E0D5] rounded-[6px] px-2.5 py-2 leading-snug">
                Includes multi-ward corridor totals shared across adjacent wards; ward-exclusive cost breakup is Data unavailable.
              </p>
            )}
          </div>

          {/* 4. PROJECT PROGRESS */}
          <div className="p-5 border-b border-[#E5E0D5] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5A6560]">
                Project Progress
              </span>
              <span className="text-xs font-mono tabular-nums font-semibold text-[#133429]">
                {!activeArea
                  ? '—'
                  : activeStats.physicalCompletionPercent !== null
                  ? `${activeStats.physicalCompletionPercent}% Verified`
                  : 'Data unavailable'}
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-[#FAF8F3] border border-[#E5E0D5] overflow-hidden">
              {activeArea && activeStats.physicalCompletionPercent !== null && (
                <div
                  className="h-full bg-[#0E7C74] transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(0, activeStats.physicalCompletionPercent))}%`
                  }}
                />
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#5A6560] font-mono tabular-nums">
              <span>Completed: {activeArea ? activeStats.completedCount : '—'}</span>
              <span>Ongoing: {activeArea ? activeStats.ongoingCount : '—'}</span>
            </div>
          </div>

          {/* 5. AREA PROJECT LIST */}
          <div className="p-5 border-b border-[#E5E0D5] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#133429]">
                Projects in Area {activeArea ? `(${activeAreaProjects.length})` : ''}
              </span>

              {activeArea && activeAreaProjects.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllAreaProjects((prev) => !prev)}
                  className="text-xs font-semibold text-[#0E7C74] hover:text-[#133429] inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>
                    {showAllAreaProjects
                      ? 'Show Fewer'
                      : `View All Projects (${activeAreaProjects.length})`}
                  </span>
                  {showAllAreaProjects ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>

            {!activeArea ? (
              <p className="text-xs text-[#5A6560] py-2">
                Hover over or select any PMC ward or Loni Kalbhor on the map to list its mapped projects and source references.
              </p>
            ) : activeAreaProjects.length === 0 ? (
              <div className="p-3.5 rounded-[6px] bg-[#FAF8F3] border border-[#E5E0D5] space-y-1.5 text-xs">
                <p className="font-semibold text-[#133429]">
                  No mapped projects under current filters
                </p>
                <p className="text-[#5A6560] leading-relaxed">
                  PMC has not published standalone ward-exclusive project budgets for {activeArea.title} under this filter. City-wide PMC schemes appear in the tabs below.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-0.5">
                {visibleAreaProjects.map((proj) => (
                  <button
                    key={proj.projectId}
                    type="button"
                    onClick={() => setSelectedModalProject(proj)}
                    className="w-full text-left p-3.5 rounded-[6px] border border-[#E5E0D5] bg-[#FAF8F3]/60 hover:bg-white hover:border-[#0E7C74] transition-colors space-y-2 cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold text-[#133429] group-hover:text-[#0E7C74] leading-snug">
                        {proj.projectName}
                      </h4>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#5A6560] group-hover:text-[#0E7C74] shrink-0 mt-0.5" />
                    </div>

                    <div className="text-[11px] text-[#5A6560] flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                      <span>{proj.department}</span>
                      <span aria-hidden="true">·</span>
                      <span>{proj.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className={`font-semibold ${getStatusTextClass(proj.status)}`}>
                        {proj.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#E5E0D5]/70 text-[11px]">
                      <div>
                        <span className="text-[#5A6560] block">Estimated / Approved</span>
                        <span className="font-mono tabular-nums font-semibold text-[#133429]">
                          {proj.estimatedCostCrores !== null
                            ? formatCroresPrecise(proj.estimatedCostCrores)
                            : 'Data unavailable'}
                          {proj.approvedFundingCrores !== null &&
                          proj.approvedFundingCrores !== proj.estimatedCostCrores
                            ? ` / ${formatCroresPrecise(proj.approvedFundingCrores)}`
                            : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#5A6560] block">Actual Spend · Progress</span>
                        <span className="font-mono tabular-nums text-[#5A6560]">
                          {proj.actualExpenditureCrores !== null
                            ? formatCroresPrecise(proj.actualExpenditureCrores)
                            : 'Data unavailable'}
                          {' · '}
                          {proj.physicalProgressPercent !== null
                            ? `${proj.physicalProgressPercent}%`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-[#5A6560] truncate">
                      {proj.verificationStatus} · {proj.sourceDocument}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 6. MAPPED CIVIC ASSETS & PUBLIC FACILITIES IN AREA */}
          <div className="p-5 space-y-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#133429] block">
              Civic Facilities &amp; Utilities in Area{' '}
              {activeArea ? `(${activeAreaAssets.length})` : ''}
            </span>

            {!activeArea ? (
              <p className="text-xs text-[#5A6560]">
                Select any ward or Loni Kalbhor to inspect mapped Water Treatment Plants, hospitals, schools, fire stations, and parks.
              </p>
            ) : activeAreaAssets.length === 0 ? (
              <p className="text-xs text-[#5A6560]">
                No standalone landmark pin geocoded inside {activeArea.title}; check the full facilities &amp; STP directory below.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-[210px] overflow-y-auto pr-0.5">
                {activeAreaAssets.map((asset) => (
                  <button
                    key={asset.assetId}
                    type="button"
                    onClick={() => setSelectedModalAsset(asset)}
                    className="w-full text-left px-3 py-2 rounded-[6px] border border-[#E5E0D5] bg-[#FAF8F3]/60 hover:bg-white hover:border-[#1E3A8A] transition-colors flex items-center justify-between gap-2 cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <span className="block text-xs font-semibold text-[#133429] group-hover:text-[#1E3A8A] truncate">
                        {asset.name}
                      </span>
                      <span className="block text-[11px] text-[#5A6560] truncate">
                        {asset.category} · {asset.capacityOrMetric}
                      </span>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#5A6560] shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ALL PUBLIC DATASETS LINKED TO THIS MAP (TABBED EXPLORER) */}
      <section className="bg-white rounded-[8px] border border-[#E5E0D5] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E0D5] bg-[#FAF8F3] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0E7C74] block">
              Complete Public Data Explorer · Linked with Interactive Map
            </span>
            <h3 className="font-serif text-lg sm:text-xl font-semibold text-[#133429]">
              All Public Projects, Facilities, WTPs/STPs, Roads &amp; Municipal/GP Finances
            </h3>
          </div>

          <div
            role="tablist"
            aria-label="Explore All Public Datasets"
            className="flex flex-wrap gap-1.5 bg-white p-1 rounded-[6px] border border-[#E5E0D5]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeExplorerTab === 'city-wide'}
              onClick={() => setActiveExplorerTab('city-wide')}
              className={`h-8 px-3 rounded-[4px] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                activeExplorerTab === 'city-wide'
                  ? 'bg-[#133429] text-[#FAF8F3]'
                  : 'text-[#5A6560] hover:text-[#133429]'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>City-Wide Outlays ({cityWideProjects.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeExplorerTab === 'facilities'}
              onClick={() => setActiveExplorerTab('facilities')}
              className={`h-8 px-3 rounded-[4px] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                activeExplorerTab === 'facilities'
                  ? 'bg-[#133429] text-[#FAF8F3]'
                  : 'text-[#5A6560] hover:text-[#133429]'
              }`}
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>Facilities, WTPs &amp; STPs ({scopedPublicAssets.length + pmcStps.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeExplorerTab === 'roads-env'}
              onClick={() => setActiveExplorerTab('roads-env')}
              className={`h-8 px-3 rounded-[4px] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                activeExplorerTab === 'roads-env'
                  ? 'bg-[#133429] text-[#FAF8F3]'
                  : 'text-[#5A6560] hover:text-[#133429]'
              }`}
            >
              <Route className="w-3.5 h-3.5" />
              <span>Roads, Tenders &amp; ESR</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeExplorerTab === 'budgets'}
              onClick={() => setActiveExplorerTab('budgets')}
              className={`h-8 px-3 rounded-[4px] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                activeExplorerTab === 'budgets'
                  ? 'bg-[#133429] text-[#FAF8F3]'
                  : 'text-[#5A6560] hover:text-[#133429]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Budgets &amp; GP Finances ({filteredBudgets.length})</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* TAB 1: City-Wide Unmapped Projects */}
          {activeExplorerTab === 'city-wide' && (
            <div className="space-y-4">
              <p className="text-xs text-[#5A6560] leading-relaxed">
                Where official PMC budget books and project portals report consolidated city-wide allocations without ward-wise expenditure tables, projects appear here instead of assigning arbitrary ward percentages. Click any card for full evidence details.
              </p>

              {cityWideProjects.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#5A6560] bg-[#FAF8F3] rounded-[6px] border border-[#E5E0D5]">
                  No city-wide PMC projects match the active jurisdiction or filter combination.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cityWideProjects.map((proj) => (
                    <button
                      key={proj.projectId}
                      type="button"
                      onClick={() => setSelectedModalProject(proj)}
                      className="text-left p-4 rounded-[6px] border border-[#E5E0D5] bg-[#FAF8F3]/60 hover:bg-white hover:border-[#0E7C74] transition-colors flex flex-col justify-between gap-3 cursor-pointer group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-mono font-semibold text-[#0E7C74]">
                            FY {proj.financialYear}
                          </span>
                          <span className={`font-semibold ${getStatusTextClass(proj.status)}`}>
                            {proj.status}
                          </span>
                        </div>
                        <h4 className="font-serif text-sm font-semibold text-[#133429] group-hover:text-[#0E7C74] leading-snug">
                          {proj.projectName}
                        </h4>
                        <p className="text-[11px] text-[#5A6560]">
                          {proj.department} · {proj.category}
                        </p>
                      </div>

                      <div className="pt-2.5 border-t border-[#E5E0D5] space-y-1 text-[11px]">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[#5A6560]">Approved Funding</span>
                          <span className="font-mono tabular-nums font-bold text-[#133429]">
                            {proj.approvedFundingCrores !== null
                              ? formatCroresPrecise(proj.approvedFundingCrores)
                              : 'Data unavailable'}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[#5A6560]">Actual Expenditure</span>
                          <span className="font-mono tabular-nums text-[#B45309]">
                            {proj.actualExpenditureCrores !== null
                              ? formatCroresPrecise(proj.actualExpenditureCrores)
                              : 'Data unavailable'}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#5A6560] truncate pt-0.5">
                          {proj.verificationStatus} · {proj.sourceDocument}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Geocoded Public Facilities, WTPs, 11 JICA STPs & Civic Asset Indicators */}
          {activeExplorerTab === 'facilities' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="font-serif text-base font-semibold text-[#133429]">
                  Mapped Public Facilities, Water Works &amp; Loni Kalbhor Utilities ({scopedPublicAssets.length})
                </h4>
                <div className="overflow-x-auto border border-[#E5E0D5] rounded-[6px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-[#FAF8F3] border-b border-[#E5E0D5] text-[11px] text-[#5A6560]">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Facility / Asset</th>
                        <th className="py-2.5 px-3 font-semibold">Jurisdiction &amp; Authority</th>
                        <th className="py-2.5 px-3 font-semibold">Capacity / Metric</th>
                        <th className="py-2.5 px-3 font-semibold">Map Pin &amp; Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E0D5]/70">
                      {scopedPublicAssets.map((asset) => {
                        const isLoni = asset.jurisdiction === 'Loni Kalbhor Gram Panchayat';
                        return (
                          <tr key={asset.assetId} className="hover:bg-[#FAF8F3]/60">
                            <td className="py-2.5 px-3">
                              <button
                                type="button"
                                onClick={() => setSelectedModalAsset(asset)}
                                className="text-left font-semibold text-[#133429] hover:text-[#0E7C74] cursor-pointer block"
                              >
                                {asset.name}
                              </button>
                              <span className="text-[11px] text-[#5A6560] block">
                                {asset.category} · {asset.locationLabel}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[11px]">
                              <span
                                className={`font-semibold block ${
                                  isLoni ? 'text-[#B45309]' : 'text-[#0E7C74]'
                                }`}
                              >
                                {asset.jurisdiction}
                              </span>
                              <span className="text-[#5A6560]">{asset.authority}</span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-[#133429]">
                              {asset.capacityOrMetric}
                            </td>
                            <td className="py-2.5 px-3 text-[11px] space-y-1">
                              {asset.latitude !== null ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const targetKey = asset.adminWardGeoNames[0];
                                    if (targetKey === LONI_KALBHOR_GEO_KEY) {
                                      handleJumpToLoni();
                                    } else if (targetKey && layerMode === 'admin-wards') {
                                      const area = buildSelectedAreaFromFeature('admin-wards', {
                                        name: targetKey
                                      });
                                      handleLockArea(area, targetKey);
                                      setFocusKey(targetKey);
                                    }
                                    setSelectedModalAsset(asset);
                                  }}
                                  className="text-[#1E3A8A] font-semibold hover:underline cursor-pointer block"
                                >
                                  Inspect OSM Pin ({asset.latitude.toFixed(3)}, {asset.longitude?.toFixed(3)})
                                </button>
                              ) : (
                                <span className="text-[#5A6560] block">Coordinates unavailable</span>
                              )}
                              <a
                                href={asset.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0E7C74] hover:underline inline-flex items-center gap-1"
                              >
                                <span>{asset.sourceTitle}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 11 Sewage Treatment Plants (396 MLD JICA + Existing) */}
              {jurisdictionScope !== 'Loni Kalbhor' && (
                <div className="space-y-3">
                  <h4 className="font-serif text-base font-semibold text-[#133429]">
                    PMC Sewage Treatment Plants &amp; 11 JICA Mula-Mutha STPs ({pmcStps.length} Plants)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {pmcStps.map((stp) => (
                      <div
                        key={stp.id}
                        className="p-3.5 rounded-[6px] border border-[#E5E0D5] bg-[#FAF8F3]/60 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-mono font-semibold text-[#0E7C74]">
                            {stp.capacityMLD} MLD
                          </span>
                          <span className="text-[#5A6560]">{stp.program}</span>
                        </div>
                        <div className="font-semibold text-[#133429]">{stp.name}</div>
                        <div className="text-[11px] text-[#5A6560]">
                          {stp.wardOrLocality} · {stp.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Loni Kalbhor Water & Facilities Detail */}
              {jurisdictionScope !== 'PMC' && (
                <div className="space-y-3">
                  <h4 className="font-serif text-base font-semibold text-[#92400E]">
                    Loni Kalbhor Gram Panchayat Water Supply &amp; Public Facilities ({loniWaterFacilities.length + loniFacilities.length} Records)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {loniWaterFacilities.map((wat) => (
                      <div
                        key={wat.id}
                        className="p-3.5 rounded-[6px] border border-[#B45309]/30 bg-[#FAF8F3]/60 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-mono font-semibold text-[#B45309]">
                            {wat.capacityMLD} MLD Cap · {wat.actualSupplyMLD} MLD Supply
                          </span>
                          <span className="text-[#15803D] font-semibold">{wat.status}</span>
                        </div>
                        <div className="font-semibold text-[#133429]">{wat.facilityName}</div>
                        <div className="text-[11px] text-[#5A6560]">
                          {wat.infrastructureType} · {wat.managingAuthority}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PMC Sectoral Totals */}
              {jurisdictionScope !== 'Loni Kalbhor' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pmcFacilityCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="p-3.5 rounded-[6px] border border-[#E5E0D5] bg-white space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-[#0E7C74]">{cat.category}</span>
                        <span className="font-mono font-semibold text-[#133429]">
                          {cat.documentedCountLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5A6560] leading-relaxed">{cat.summary}</p>
                    </div>
                  ))}
                  {pmcCivicAssets.slice(0, 6).map((ind) => (
                    <div
                      key={ind.id}
                      className="p-3.5 rounded-[6px] border border-[#E5E0D5] bg-white space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-[#133429]">{ind.sector}</span>
                        <span className="font-mono text-[#0E7C74]">{ind.reportingYear}</span>
                      </div>
                      <div className="font-mono font-bold text-[#133429] text-xs">
                        {ind.headlineMetric}
                      </div>
                      <p className="text-[11px] text-[#5A6560]">{ind.serviceCoverageNote}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Roads, Tenders & Environment ESR Indicators */}
          {activeExplorerTab === 'roads-env' && (
            <div className="space-y-6 text-xs">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-serif text-base font-semibold text-[#133429]">
                    Roads &amp; Mobility Programs (PMC + Loni Kalbhor NH 65)
                  </h4>
                  <div className="space-y-2.5">
                    {jurisdictionScope !== 'Loni Kalbhor' &&
                      pmcRoads.map((rd) => (
                        <div
                          key={rd.id}
                          className="p-3.5 rounded-[6px] border border-[#E5E0D5] bg-[#FAF8F3]/60 space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="font-semibold text-[#0E7C74]">{rd.type}</span>
                            <span className="font-mono font-semibold text-[#133429]">
                              {rd.sanctionedOrBudgetedCrores !== null
                                ? formatCroresPrecise(rd.sanctionedOrBudgetedCrores)
                                : 'Data unavailable'}
                            </span>
                          </div>
                          <div className="font-semibold text-[#133429]">{rd.title}</div>
                          <div className="text-[11px] text-[#5A6560]">
                            {rd.wardOrCorridor} · {rd.status} · FY {rd.financialYear}
                          </div>
                        </div>
                      ))}

                    {jurisdictionScope !== 'PMC' &&
                      loniRoads.map((rd) => (
                        <div
                          key={rd.id}
                          className="p-3.5 rounded-[6px] border border-[#B45309]/30 bg-[#FAF8F3]/60 space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="font-semibold text-[#B45309]">
                              Loni Kalbhor (Outside PMC) · {rd.classification}
                            </span>
                            <span className="font-mono font-semibold text-[#133429]">
                              {rd.lengthKm} km · {rd.condition}
                            </span>
                          </div>
                          <div className="font-semibold text-[#133429]">{rd.roadName}</div>
                          <div className="text-[11px] text-[#5A6560]">
                            {rd.surfaceType} · {rd.authority}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="space-y-6">
                  {jurisdictionScope !== 'Loni Kalbhor' && (
                    <div className="space-y-3">
                      <h4 className="font-serif text-base font-semibold text-[#133429]">
                        Verified PMC Public Tenders &amp; Work Orders ({pmcTenders.length})
                      </h4>
                      <div className="space-y-2">
                        {pmcTenders.map((t) => (
                          <div
                            key={t.id}
                            className="p-3 rounded-[6px] border border-[#E5E0D5] bg-white space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2 text-[11px]">
                              <span className="font-mono text-[#0E7C74]">{t.tenderRef}</span>
                              <span className="font-mono font-semibold text-[#133429]">
                                {t.awardedAmountCrores !== null
                                  ? formatCroresPrecise(t.awardedAmountCrores)
                                  : t.estimatedCostCrores !== null
                                  ? formatCroresPrecise(t.estimatedCostCrores)
                                  : 'Data unavailable'}
                              </span>
                            </div>
                            <div className="font-semibold text-[#133429]">{t.title}</div>
                            <div className="text-[11px] text-[#5A6560]">
                              {t.department} · {t.contractStatus}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {jurisdictionScope !== 'Loni Kalbhor' && (
                    <div className="space-y-3">
                      <h4 className="font-serif text-base font-semibold text-[#133429]">
                        PMC Environment Status Report (ESR) Indicators ({pmcEnvironment.length})
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {pmcEnvironment.map((env) => (
                          <div
                            key={env.id}
                            className="p-3 rounded-[6px] border border-[#E5E0D5] bg-[#FAF8F3]/60 space-y-1"
                          >
                            <div className="text-[11px] font-semibold text-[#0E7C74]">
                              {env.domain}
                            </div>
                            <div className="font-mono font-bold text-[#133429]">
                              {env.metricValue}
                            </div>
                            <div className="text-[11px] text-[#5A6560]">{env.title}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Consolidated Budgets & Loni Kalbhor GP Finances */}
          {activeExplorerTab === 'budgets' && (
            <div className="space-y-4">
              <p className="text-xs text-[#5A6560] leading-relaxed">
                PMC Municipal Corporation Budget Estimates (BE), Revised Estimates (RE), and Audited Actual Expenditures are strictly separated from Loni Kalbhor Gram Panchayat finances (shown clearly with their Haveli Taluka / ZP jurisdiction). Pending or unpublished figures display &ldquo;Data unavailable&rdquo;.
              </p>

              <div className="overflow-x-auto border border-[#E5E0D5] rounded-[6px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#FAF8F3] border-b border-[#E5E0D5] text-[11px] text-[#5A6560]">
                    <tr>
                      <th className="py-2.5 px-3.5 font-semibold">Authority, Dept &amp; Budget Head</th>
                      <th className="py-2.5 px-3 font-semibold whitespace-nowrap">FY</th>
                      <th className="py-2.5 px-3 font-semibold text-right whitespace-nowrap">
                        Budget Estimate / Grant
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-right whitespace-nowrap">
                        Revised Estimate (RE)
                      </th>
                      <th className="py-2.5 px-3 font-semibold text-right whitespace-nowrap">
                        Actual Expenditure
                      </th>
                      <th className="py-2.5 px-3.5 font-semibold">Verification &amp; Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D5]/70">
                    {filteredBudgets.map((row) => {
                      const isLoni = row.jurisdiction === 'Loni Kalbhor Gram Panchayat';
                      return (
                        <tr key={row.id} className="hover:bg-[#FAF8F3]/60">
                          <td className="py-3 px-3.5">
                            <span
                              className={`font-semibold block ${
                                isLoni ? 'text-[#92400E]' : 'text-[#133429]'
                              }`}
                            >
                              {row.departmentName}
                            </span>
                            <span className="text-[11px] text-[#5A6560] block">
                              {row.budgetHead}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono tabular-nums text-[#133429] whitespace-nowrap">
                            {row.financialYear}
                          </td>
                          <td className="py-3 px-3 font-mono tabular-nums text-right font-semibold text-[#133429] whitespace-nowrap">
                            {row.budgetEstimateCrores !== null
                              ? formatCroresPrecise(row.budgetEstimateCrores)
                              : 'Data unavailable'}
                          </td>
                          <td className="py-3 px-3 font-mono tabular-nums text-right text-[#5A6560] whitespace-nowrap">
                            {row.revisedEstimateCrores !== null
                              ? formatCroresPrecise(row.revisedEstimateCrores)
                              : 'Data unavailable'}
                          </td>
                          <td className="py-3 px-3 font-mono tabular-nums text-right font-semibold text-[#B45309] whitespace-nowrap">
                            {row.actualExpenditureCrores !== null
                              ? formatCroresPrecise(row.actualExpenditureCrores)
                              : 'Data unavailable'}
                          </td>
                          <td className="py-3 px-3.5 text-[11px]">
                            <span
                              className={`font-semibold block ${getVerificationTextClass(
                                row.verificationStatus
                              )}`}
                            >
                              {row.verificationStatus}
                            </span>
                            <a
                              href={row.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0E7C74] hover:underline inline-flex items-center gap-1"
                            >
                              <span className="truncate max-w-[200px]">{row.documentTitle}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      <WardProjectDetailModal
        project={selectedModalProject}
        areaTitle={activeArea?.title}
        onClose={() => setSelectedModalProject(null)}
      />

      <PublicAssetDetailModal
        asset={selectedModalAsset}
        onClose={() => setSelectedModalAsset(null)}
      />

      <PmcDataIngestionDrawer
        open={isIngestionOpen}
        onClose={() => setIsIngestionOpen(false)}
        importHistory={importHistory}
        lastUpdated={lastUpdated}
        dbStats={dbStats}
        onBootstrapUpdate={applyBootstrapPayload}
      />
    </div>
  );
};
