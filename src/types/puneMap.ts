export type BoundaryLayerMode = 'admin-wards' | 'prabhags-2022';

export type MapProjectCategory =
  | 'Roads and Transportation'
  | 'Water Supply'
  | 'Drainage and Sewage'
  | 'Healthcare'
  | 'Education'
  | 'Waste Management'
  | 'Public Infrastructure';

export type MapProjectStatus = 'Completed' | 'Ongoing' | 'Upcoming' | 'Delayed';

export type MapAreaDominantStatus = MapProjectStatus | 'Unavailable';

export type VerificationCategory =
  | 'Official source verified'
  | 'Government document available'
  | 'Secondary source'
  | 'Awaiting verification'
  | 'Data unavailable';

export interface PuneWardGeoMeta {
  geoFeatureName: string; // Exact properties.name in pmc-admin-wards-2017.geojson
  wardId: string; // Canonical map ID (e.g. admin-ward-01)
  wardNumber: number;
  displayName: string;
  shortLabel: string;
  pmcWardOfficeId: string; // Links to PMC_WARD_INTELLIGENCE
  zone: string;
  keyLocalities: string[];
  prabhagCoverage2022: string;
  boundaryNote: string;
}

export interface PmcWardDbRecord {
  wardId: string;
  wardNumber: number;
  wardName: string;
  geoFeatureName: string;
  zone: string;
  prabhagCoverage: string;
  keyLocalities: string[];
  boundarySource: string;
  verificationStatus: VerificationCategory;
  lastUpdated: string;
}

export interface MapMunicipalProject {
  projectId: string;
  projectCode: string;
  projectName: string;
  officialName: string;
  department: string;
  category: MapProjectCategory;
  wardId: string | null; // Primary PMC_WARDS.ward_id for ward-specific works; null for multi-ward/city-wide
  estimatedCostCrores: number | null;
  approvedFundingCrores: number | null;
  actualExpenditureCrores: number | null;
  status: MapProjectStatus;
  physicalProgressPercent: number | null;
  startDate: string | null;
  expectedCompletionDate: string | null;
  financialYear: string; // e.g. '2024-25' | '2025-26' | '2026-27'
  wardScope: 'Ward-Specific' | 'Multi-Ward Corridor' | 'City-Wide';
  adminWardGeoNames: string[]; // Matches properties.name in pmc-admin-wards-2017.geojson
  prabhagNumbers2022: number[]; // Matches properties.wardnum in pmc-prabhags-2022.geojson
  locationSummary: string;
  latitude: number | null; // Verified OSM coordinates only; null if unverified/dispersed
  longitude: number | null;
  coordinateSource?: string | null;
  description: string;
  capacityOrScale?: string;
  sourceDocument: string;
  sourceUrl: string;
  sourcePageOrTable: string;
  evidenceNote: string;
  lastUpdated: string;
  verificationStatus: VerificationCategory;
}

export interface PmcDepartmentBudgetRecord {
  id: string;
  departmentId: string;
  departmentName: string;
  budgetHead: string;
  financialYear: string;
  budgetEstimateCrores: number | null;
  revisedEstimateCrores: number | null;
  actualExpenditureCrores: number | null;
  sourceUrl: string;
  documentTitle: string;
  verificationStatus: VerificationCategory;
  notes: string;
  lastUpdated: string;
}

export interface ImportHistoryRecord {
  importId: number;
  sourceType: 'seed' | 'automated-sync' | 'url-fetch' | 'manual-upload';
  sourceName: string;
  datasetType: 'projects' | 'budgets' | 'wards' | 'portal-check';
  fileFormat: string;
  status: 'Success' | 'Partial' | 'Blocked' | 'Failed';
  rowsParsed: number;
  rowsInserted: number;
  rowsUpdated: number;
  duplicatesSkipped: number;
  warningsCount: number;
  notes: string;
  importedAt: string;
}

export interface ProjectRevisionRecord {
  revisionId: number;
  projectId: string;
  previousSnapshotJson: string;
  changeSummary: string;
  changedAt: string;
}

export interface MapFiltersState {
  financialYear: string;
  department: string;
  category: string;
  status: string;
  searchQuery: string;
  projectQuery: string;
}

export interface SelectedMapArea {
  layerMode: BoundaryLayerMode;
  featureKey: string; // properties.name for admin-wards, String(properties.wardnum) for prabhags-2022
  title: string;
  subtitle: string;
  officialIdLabel: string;
  zone: string;
  localities: string[];
  pmcWardOfficeId?: string;
  boundaryNote: string;
  officialBoundarySourceUrl: string;
}

export interface AreaProjectStats {
  totalProjects: number;
  ongoingCount: number;
  completedCount: number;
  upcomingCount: number;
  delayedCount: number;
  wardSpecificCount: number;
  multiWardCount: number;
  totalEstimatedCostCrores: number | null;
  totalApprovedFundingCrores: number | null;
  totalActualExpenditureCrores: number | null;
  remainingAllocationCrores: number | null;
  hasMultiWardCostSharing: boolean;
  physicalCompletionPercent: number | null;
  dominantStatus: MapAreaDominantStatus;
}
