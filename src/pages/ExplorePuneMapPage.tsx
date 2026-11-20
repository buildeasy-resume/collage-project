import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BoundaryLayerMode,
  ImportHistoryRecord,
  MapFiltersState,
  MapMunicipalProject,
  PmcDepartmentBudgetRecord,
  SelectedMapArea
} from '../types/puneMap';
import {
  BOUNDARY_SOURCE_METADATA,
  INITIAL_REPORTING_DATE,
  MAP_FINANCIAL_YEARS,
  MAP_PROJECT_CATEGORIES,
  MAP_PROJECT_STATUSES,
  PMC_ADMIN_WARD_GEO_META,
  PMC_INITIAL_DEPARTMENT_BUDGETS,
  PMC_MAP_PROJECTS,
  buildSelectedAreaFromFeature,
  computeAreaStats,
  filterMapProjects,
  getProjectsForArea
} from '../data/puneMapData';
import { dataProvider } from '../services/dataProvider';
import { formatCroresPrecise } from '../utils/formatters';
import { PuneInteractiveMap } from '../components/PuneInteractiveMap';
import { WardProjectDetailModal } from '../components/WardProjectDetailModal';
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
  RefreshCw
} from 'lucide-react';

interface SearchableGeoItem {
  featureKey: string;
  title: string;
  subtitle: string;
  searchText: string;
  area: SelectedMapArea;
}

const DEFAULT_FILTERS: MapFiltersState = {
  financialYear: 'All',
  department: 'All',
  category: 'All',
  status: 'All',
  searchQuery: '',
  projectQuery: ''
};

export const ExplorePuneMapPage: React.FC = () => {
  const [layerMode, setLayerMode] = useState<BoundaryLayerMode>('admin-wards');
  const [filters, setFilters] = useState<MapFiltersState>(DEFAULT_FILTERS);

  // Live SQLite database-backed collections
  const [projects, setProjects] = useState<MapMunicipalProject[]>(PMC_MAP_PROJECTS);
  const [departmentBudgets, setDepartmentBudgets] = useState<PmcDepartmentBudgetRecord[]>(
    PMC_INITIAL_DEPARTMENT_BUDGETS
  );
  const [importHistory, setImportHistory] = useState<ImportHistoryRecord[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>(INITIAL_REPORTING_DATE);
  const [dbStats, setDbStats] = useState<BootstrapPayload['dbStats']>({
    wardsCount: PMC_ADMIN_WARD_GEO_META.length,
    projectsCount: PMC_MAP_PROJECTS.length,
    markersCount: PMC_MAP_PROJECTS.filter((p) => p.latitude !== null && p.longitude !== null).length,
    departmentBudgetsCount: PMC_INITIAL_DEPARTMENT_BUDGETS.length
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
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState<boolean>(false);

  const hoverClearTimerRef = useRef<number | null>(null);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  const currentGeoData = geoCache[layerMode] ?? null;

  const applyBootstrapPayload = useCallback((payload: BootstrapPayload) => {
    if (Array.isArray(payload.projects)) setProjects(payload.projects);
    if (Array.isArray(payload.departmentBudgets)) setDepartmentBudgets(payload.departmentBudgets);
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
        throw new Error(`HTTP ${res.status} while reading PMC database`);
      }
      const data = (await res.json()) as BootstrapPayload;
      applyBootstrapPayload(data);
    } catch (err) {
      setDbError(
        err instanceof Error
          ? err.message
          : 'Live database endpoint unavailable; showing built-in verified PMC dataset.'
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

  // Reset selected area when switching between 15 Admin Wards and 58 Prabhags
  const handleChangeLayerMode = (nextMode: BoundaryLayerMode) => {
    if (nextMode === layerMode) return;
    if (hoverClearTimerRef.current) {
      window.clearTimeout(hoverClearTimerRef.current);
      hoverClearTimerRef.current = null;
    }
    setLayerMode(nextMode);
    setHoveredKey(null);
    setHoveredArea(null);
    setLockedKey(null);
    setLockedArea(null);
    setFocusKey(null);
    setShowAllAreaProjects(false);
  };

  // Distinct departments derived strictly from DB-loaded PMC map projects
  const departments = useMemo(() => {
    return Array.from(new Set(projects.map((p) => p.department))).sort();
  }, [projects]);

  // Filtered project set (drives map status, pins, and right-side statistics)
  const filteredProjects = useMemo(() => {
    return filterMapProjects(projects, filters);
  }, [projects, filters]);

  // Filtered departmental budgets aligned with active FY & Department filter
  const filteredBudgets = useMemo(() => {
    return departmentBudgets.filter((b) => {
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
  }, [departmentBudgets, filters.financialYear, filters.department]);

  // City-wide / unmapped projects matching active filters
  const cityWideProjects = useMemo(() => {
    return filteredProjects.filter((p) => p.wardScope === 'City-Wide');
  }, [filteredProjects]);

  // Build searchable directory from loaded GeoJSON features + metadata
  const searchableAreas = useMemo<SearchableGeoItem[]>(() => {
    if (!currentGeoData?.features?.length) {
      if (layerMode === 'admin-wards') {
        return PMC_ADMIN_WARD_GEO_META.map((m) => {
          const area = buildSelectedAreaFromFeature('admin-wards', { name: m.geoFeatureName });
          return {
            featureKey: m.geoFeatureName,
            title: area.title,
            subtitle: `${area.officialIdLabel} · ${m.keyLocalities.slice(0, 3).join(', ')}`,
            searchText: `${area.title} ${m.geoFeatureName} ${m.zone} ${m.keyLocalities.join(' ')} ${m.prabhagCoverage2022}`.toLowerCase(),
            area
          };
        });
      }
      return [];
    }

    return currentGeoData.features.map((feat) => {
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
  }, [currentGeoData, layerMode]);

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
    setFilters(DEFAULT_FILTERS);
    setIsSearchDropdownOpen(false);
  };

  const activeArea = lockedArea ?? hoveredArea;
  const activeKey = lockedKey ?? activeArea?.featureKey ?? null;

  const activeAreaProjects = useMemo(() => {
    if (!activeKey) return [];
    return getProjectsForArea(filteredProjects, layerMode, activeKey);
  }, [filteredProjects, layerMode, activeKey]);

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
    if (status === 'Official source verified' || status === 'Government document available') {
      return 'text-[#15803D]';
    }
    if (status === 'Secondary source') return 'text-[#0E7C74]';
    return 'text-[#B45309]';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Title, DB Status & Boundary Layer Toggle */}
      <div className="bg-white rounded-[8px] border border-[#E5E0D5] p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-[#E5E0D5] pb-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0E7C74]">
              <span>GIS Civic Explorer · Pune Municipal Corporation Only</span>
              <span aria-hidden="true" className="text-[#D4CEC2]">·</span>
              <span className="font-mono text-[#5A6560] tracking-normal normal-case">
                Last Updated: {lastUpdated.slice(0, 10)}
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#133429] tracking-tight">
              Explore Pune – Interactive Municipal Project Map
            </h2>
            <p className="text-xs sm:text-sm text-[#5A6560] leading-relaxed">
              Move your cursor over any PMC ward or Prabhag to inspect verified projects and sanctioned allocations immediately. Click a ward to lock or click an OpenStreetMap project pin to view full records.
            </p>
            <p className="text-[11px] font-mono tabular-nums text-[#5A6560] pt-0.5">
              SQLite DB: {dbStats.wardsCount} Wards · {dbStats.projectsCount} Projects ({dbStats.markersCount} OSM Pins) · {dbStats.departmentBudgetsCount} Dept Budgets
              {dbLoading ? ' · Syncing...' : ''}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2.5 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsIngestionOpen(true)}
                className="h-9 px-3.5 rounded-[6px] border border-[#133429] bg-white hover:bg-[#FAF8F3] text-[#133429] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-[#0E7C74]" />
                <span>Sync &amp; Import PMC Data</span>
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

        {/* Filter & Dual Search Controls (Ward Name + Project Name + 4 Dropdowns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          {/* Ward / Area Search */}
          <div ref={searchBoxRef} className="sm:col-span-1 lg:col-span-3 relative">
            <label
              htmlFor="map-ward-search"
              className="block text-[11px] font-semibold text-[#5A6560] mb-1"
            >
              Search Ward or Area
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
                placeholder="e.g., Shivajinagar, Kharadi..."
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
                    No PMC ward or locality matched &ldquo;{filters.searchQuery}&rdquo;.
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
                placeholder="e.g., Sinhagad Flyover, JICA STP..."
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
              Department
            </label>
            <select
              id="map-filter-dept"
              value={filters.department}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, department: e.target.value }))
              }
              className="w-full h-9 px-2.5 rounded-[6px] border border-[#E5E0D5] bg-[#FAF8F3] text-xs text-[#1C2422] focus:outline-hidden focus:border-[#0E7C74]"
            >
              <option value="All">All Departments</option>
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
        {/* LEFT: Interactive Pune Map + Boundary Provenance */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          <PuneInteractiveMap
            layerMode={layerMode}
            geoData={currentGeoData}
            loading={loadingGeo}
            error={geoError}
            onRetryLoad={() => setReloadNonce((n) => n + 1)}
            filteredProjects={filteredProjects}
            hoveredKey={hoveredKey}
            lockedKey={lockedKey}
            activeAreaTitle={activeArea?.title ?? null}
            matchingKeys={matchingKeys}
            focusKey={focusKey}
            onHoverArea={handleHoverArea}
            onLockArea={handleLockArea}
            onSelectProject={(proj) => setSelectedModalProject(proj)}
            onResetSelection={handleResetSelection}
          />

          {/* Boundary Source & Data Limitations Bar */}
          <div className="bg-white rounded-[8px] border border-[#E5E0D5] p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 font-semibold text-[#133429]">
                <Info className="w-3.5 h-3.5 text-[#0E7C74] shrink-0" />
                <span>{boundaryMeta.sourceName}</span>
                <span aria-hidden="true" className="text-[#D4CEC2]">·</span>
                <span className="font-mono text-[11px] text-[#5A6560]">
                  {boundaryMeta.featureCount} Polygons · {boundaryMeta.license}
                </span>
              </div>
              <p className="text-[#5A6560] leading-relaxed">{boundaryMeta.coverageNote}</p>
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

        {/* RIGHT: Fixed/Sticky Ward Information & Project Panel */}
        <aside
          aria-label="Selected Ward Information Panel"
          className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-[84px] bg-white rounded-[8px] border border-[#E5E0D5] overflow-hidden"
        >
          {/* 1. SELECTED AREA */}
          <div className="p-5 border-b border-[#E5E0D5] bg-[#FAF8F3] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0E7C74]">
                Selected Area
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
                      Live Hover · Click ward to lock
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
                  Move your cursor over any PMC polygon on the map—or tap on mobile—to inspect ward-level project and financial figures immediately.
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
                  {activeStats.wardSpecificCount} Ward · {activeStats.multiWardCount} Corridor
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
                <dt className="text-[#5A6560]">Total Estimated Cost</dt>
                <dd className="font-mono tabular-nums font-bold text-[#133429]">
                  {!activeArea
                    ? '—'
                    : activeStats.totalEstimatedCostCrores !== null
                    ? formatCroresPrecise(activeStats.totalEstimatedCostCrores)
                    : 'Data unavailable'}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-[#5A6560]">Total Approved Funding</dt>
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
                  style={{ width: `${Math.min(100, Math.max(0, activeStats.physicalCompletionPercent))}%` }}
                />
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#5A6560] font-mono tabular-nums">
              <span>
                Completed: {activeArea ? activeStats.completedCount : '—'}
              </span>
              <span>
                Ongoing: {activeArea ? activeStats.ongoingCount : '—'}
              </span>
            </div>
          </div>

          {/* 5. AREA PROJECT LIST */}
          <div className="p-5 space-y-3">
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
              <p className="text-xs text-[#5A6560] py-3">
                Hover over or select any PMC ward on the map to list its mapped projects and source references.
              </p>
            ) : activeAreaProjects.length === 0 ? (
              <div className="p-3.5 rounded-[6px] bg-[#FAF8F3] border border-[#E5E0D5] space-y-1.5 text-xs">
                <p className="font-semibold text-[#133429]">
                  No ward-mapped projects under current filters
                </p>
                <p className="text-[#5A6560] leading-relaxed">
                  PMC has not published standalone ward-exclusive project budgets for {activeArea.title} in open tabular disclosures. City-wide PMC schemes covering this area appear in the section below.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-0.5">
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
        </aside>
      </div>

      {/* CITY-WIDE / UNMAPPED PMC PROJECTS SECTION */}
      <section className="bg-white rounded-[8px] border border-[#E5E0D5] p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5E0D5] pb-4">
          <div className="space-y-1 max-w-3xl">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0E7C74] block">
              Unmapped City-Wide Municipal Outlays
            </span>
            <h3 className="font-serif text-lg sm:text-xl font-semibold text-[#133429]">
              City-Wide PMC Projects Without Ward-Level Financial Disaggregation ({cityWideProjects.length})
            </h3>
            <p className="text-xs text-[#5A6560] leading-relaxed">
              Where official PMC budget books and project portals report consolidated city-wide figures without ward-wise expenditure tables, projects are shown below instead of assigning arbitrary ward percentages.
            </p>
          </div>
        </div>

        {cityWideProjects.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#5A6560] bg-[#FAF8F3] rounded-[6px] border border-[#E5E0D5]">
            No city-wide PMC projects match the active filter combination.
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
      </section>

      {/* PMC DEPARTMENTAL & CONSOLIDATED BUDGET LEDGER (BE vs RE vs Actuals) */}
      <section className="bg-white rounded-[8px] border border-[#E5E0D5] p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5E0D5] pb-4">
          <div className="space-y-1 max-w-3xl">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0E7C74] block">
              Structured SQLite Financial Ledger (PMC_DEPARTMENT_BUDGETS)
            </span>
            <h3 className="font-serif text-lg sm:text-xl font-semibold text-[#133429]">
              PMC Budget Estimates, Revised Estimates &amp; Audited Actuals ({filteredBudgets.length})
            </h3>
            <p className="text-xs text-[#5A6560] leading-relaxed">
              Budget Estimates (BE), Revised Estimates (RE), and Audited Actual Expenditures are strictly separated. Pending or unpublished figures display &ldquo;Data unavailable&rdquo;.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-[#E5E0D5] rounded-[6px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#FAF8F3] border-b border-[#E5E0D5] text-[11px] text-[#5A6560]">
              <tr>
                <th className="py-2.5 px-3.5 font-semibold">Department &amp; Budget Head</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">FY</th>
                <th className="py-2.5 px-3 font-semibold text-right whitespace-nowrap">
                  Budget Estimate (BE)
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
              {filteredBudgets.map((row) => (
                <tr key={row.id} className="hover:bg-[#FAF8F3]/60">
                  <td className="py-3 px-3.5">
                    <span className="font-semibold text-[#133429] block">
                      {row.departmentName}
                    </span>
                    <span className="text-[11px] text-[#5A6560] block">{row.budgetHead}</span>
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
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <WardProjectDetailModal
        project={selectedModalProject}
        areaTitle={activeArea?.title}
        onClose={() => setSelectedModalProject(null)}
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
