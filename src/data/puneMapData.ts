import {
  AreaProjectStats,
  BoundaryLayerMode,
  MapAreaDominantStatus,
  MapFiltersState,
  MapMunicipalProject,
  MapProjectCategory,
  MapProjectStatus,
  PmcDepartmentBudgetRecord,
  PuneWardGeoMeta,
  SelectedMapArea
} from '../types/puneMap';
import { LONI_KALBHOR_PROFILE } from './loniKalbhor/villageProfile';
import { LONI_KALBHOR_PROJECTS } from './loniKalbhor/developmentProjects';
import { LONI_KALBHOR_FINANCE_RECORDS } from './loniKalbhor/localFinance';
import { LONI_KALBHOR_SOURCES } from './loniKalbhor/sources';

export const LONI_KALBHOR_GEO_KEY = 'LONI_KALBHOR_GP';
export const LONI_KALBHOR_OSM_CENTER = {
  lat: 18.4883530,
  lng: 74.0221934,
  source: 'OpenStreetMap Nominatim (Loni Kalbhor, Haveli Subdistrict, node/1645591501)'
};
// sqrt(24.6 sq.km / pi) * 1000 ≈ 2798 m reference radius for documented 24.6 sq.km GP area
export const LONI_KALBHOR_REFERENCE_RADIUS_METERS = 2798;

export const MAP_PROJECT_CATEGORIES: MapProjectCategory[] = [
  'Roads and Transportation',
  'Water Supply',
  'Drainage and Sewage',
  'Healthcare',
  'Education',
  'Waste Management',
  'Public Infrastructure'
];

export const MAP_PROJECT_STATUSES: MapProjectStatus[] = [
  'Completed',
  'Ongoing',
  'Upcoming',
  'Delayed'
];

export const MAP_FINANCIAL_YEARS = ['2026-27', '2025-26', '2024-25', '2023-24', '2022-23'] as const;

export const INITIAL_REPORTING_DATE = '2026-11-19';

export const BOUNDARY_SOURCE_METADATA: Record<
  BoundaryLayerMode,
  {
    label: string;
    sourceName: string;
    sourceUrl: string;
    license: string;
    coverageNote: string;
    featureCount: number;
  }
> = {
  'admin-wards': {
    label: '15 Administrative Wards (PMC Ward Offices)',
    sourceName: 'DataMeet Pune Municipal Spatial Data (pune-admin-wards_2017.geojson)',
    sourceUrl: 'https://github.com/datameet/Municipal_Spatial_Data/tree/master/Pune',
    license: 'CC BY-SA 2.5 India',
    coverageNote:
      'Represents PMC’s 15 administrative ward office boundaries digitized by DataMeet Pune (2017 grouping, prior to the 2021 23-village merger). Excludes Pune & Khadki Cantonments and PCMC.',
    featureCount: 15
  },
  'prabhags-2022': {
    label: '58 Electoral Prabhags (PMC 2022 Final Rachna)',
    sourceName: 'PMC Final Prabhag Rachna 2022 · Digitized by SeerMaps / DataMeet Pune',
    sourceUrl: 'https://www.pmc.gov.in/en/pmc-final-prabhag-rachna-2022',
    license: 'MIT / CC BY-SA 2.5 India',
    coverageNote:
      'All 58 official PMC Prabhag polygons traced directly from PMC’s 2022 Final Ward Maps PDFs, including merged fringe villages (Wagholi, Sus-Mahalunge, Bavdhan, Dhayari, Fursungi, Manjari).',
    featureCount: 58
  }
};

/**
 * Exact 1-to-1 mapping for all 15 features in public/data/pmc-admin-wards-2017.geojson
 */
export const PMC_ADMIN_WARD_GEO_META: PuneWardGeoMeta[] = [
  {
    geoFeatureName: 'Admin Ward 01 Aundh',
    wardId: 'admin-ward-01',
    wardNumber: 1,
    displayName: 'Aundh – Baner',
    shortLabel: 'Aundh–Baner',
    pmcWardOfficeId: 'ward-aundh-baner',
    zone: 'DMC Zone 2 (Northwest Corridor)',
    keyLocalities: ['Aundh', 'Baner', 'Balewadi', 'Pashan', 'Bopodi', 'Savitribai Phule Pune University'],
    prabhagCoverage2022: 'Prabhags 11, 12, 13, 14',
    boundaryNote: '2017 DataMeet Admin Ward 01 boundary. In 2022 expanded limits, Sus and Mahalunge merged into Prabhag 13.'
  },
  {
    geoFeatureName: 'Admin Ward 02 Ghole Road',
    wardId: 'admin-ward-02',
    wardNumber: 2,
    displayName: 'Shivajinagar – Ghole Road',
    shortLabel: 'Shivajinagar',
    pmcWardOfficeId: 'ward-shivajinagar-ghole',
    zone: 'DMC Zone 2 (Central Civic Core)',
    keyLocalities: ['Shivajinagar', 'Ghole Road', 'Deccan Gymkhana', 'Model Colony', 'Gokhalenagar', 'FC Road', 'Wakadewadi'],
    prabhagCoverage2022: 'Prabhags 10, 15, 16',
    boundaryNote: 'Official PMC Shivajinagar – Ghole Road Ward Office jurisdiction surrounding PMC Headquarters and Deccan.'
  },
  {
    geoFeatureName: 'Admin Ward 03 Kothrud Karveroad',
    wardId: 'admin-ward-03',
    wardNumber: 3,
    displayName: 'Kothrud – Bavdhan',
    shortLabel: 'Kothrud',
    pmcWardOfficeId: 'ward-kothrud-bavdhan',
    zone: 'DMC Zone 3 (Western Suburban Belt)',
    keyLocalities: ['Kothrud', 'Karve Road', 'Erandwane', 'Bhusari Colony', 'Bavdhan Khurd', 'Paud Road'],
    prabhagCoverage2022: 'Prabhags 30, 31, 32, 33',
    boundaryNote: '2017 DataMeet Admin Ward 03 boundary covering Kothrud and Karve Road residential belt.'
  },
  {
    geoFeatureName: 'Admin Ward 04 Warje Karvenagar',
    wardId: 'admin-ward-04',
    wardNumber: 4,
    displayName: 'Warje – Karvenagar',
    shortLabel: 'Warje–Karvenagar',
    pmcWardOfficeId: 'ward-warje-karvenagar',
    zone: 'DMC Zone 3 (Mutha Right-Bank West)',
    keyLocalities: ['Warje', 'Karvenagar', 'Hingne', 'Ramnagar', 'Kondhave Dhavde'],
    prabhagCoverage2022: 'Prabhags 34, 35, 36',
    boundaryNote: '2017 DataMeet Admin Ward 04 boundary along Mutha river western corridor.'
  },
  {
    geoFeatureName: 'Admin Ward 05 Dhole Patil Rd',
    wardId: 'admin-ward-05',
    wardNumber: 5,
    displayName: 'Dhole Patil Road',
    shortLabel: 'Dhole Patil Rd',
    pmcWardOfficeId: 'ward-dhole-patil',
    zone: 'DMC Zone 1 (Station & Koregaon Park)',
    keyLocalities: ['Dhole Patil Road', 'Pune Station', 'Sangamwadi', 'Koregaon Park', 'Bund Garden'],
    prabhagCoverage2022: 'Prabhags 20, 21',
    boundaryNote: 'Covers PMC area around Pune Railway Station & Koregaon Park; excludes Pune Cantonment Board.'
  },
  {
    geoFeatureName: 'Admin Ward 06 Yerawda - Sangamwadi',
    wardId: 'admin-ward-06',
    wardNumber: 6,
    displayName: 'Yerawada – Kalas – Dhanori',
    shortLabel: 'Yerawada–Dhanori',
    pmcWardOfficeId: 'ward-yerawada-kalas',
    zone: 'DMC Zone 1 (Northern Mula Bank)',
    keyLocalities: ['Yerawada', 'Kalas', 'Dhanori', 'Vishrantwadi', 'Tingre Nagar', 'Kalyani Nagar'],
    prabhagCoverage2022: 'Prabhags 1, 2, 7, 8, 9',
    boundaryNote: 'Northern PMC bank excluding Khadki Cantonment Board and Defence airport enclave.'
  },
  {
    geoFeatureName: 'Admin Ward 07 Nagar Road',
    wardId: 'admin-ward-07',
    wardNumber: 7,
    displayName: 'Nagar Road – Vadgaonsheri',
    shortLabel: 'Nagar Road',
    pmcWardOfficeId: 'ward-nagar-road',
    zone: 'DMC Zone 1 (Northeastern Corridor)',
    keyLocalities: ['Viman Nagar', 'Vadgaon Sheri', 'Kharadi', 'Lohegaon', 'Chandan Nagar', 'Ramwadi'],
    prabhagCoverage2022: 'Prabhags 3, 4, 5, 6',
    boundaryNote: '2017 DataMeet boundary; in 2022 expanded limits, Wagholi merged into Prabhag 4 (East Kharadi - Wagholi).'
  },
  {
    geoFeatureName: 'Admin Ward 08 KasbaVishrambaugwada',
    wardId: 'admin-ward-08',
    wardNumber: 8,
    displayName: 'Kasba – Vishrambag Wada',
    shortLabel: 'Kasba–Vishrambag',
    pmcWardOfficeId: 'ward-kasba-vishrambag',
    zone: 'DMC Zone 4 (Heritage Peth Core)',
    keyLocalities: ['Kasba Peth', 'Shaniwar Peth', 'Sadashiv Peth', 'Narayan Peth', 'Budhwar Peth', 'Mangalwar Peth'],
    prabhagCoverage2022: 'Prabhags 17, 18, 29',
    boundaryNote: 'Historic central Pune Peth wards around Shaniwar Wada, Mandai, and Kamla Nehru Hospital.'
  },
  {
    geoFeatureName: 'Admin Ward 09 Tilak Road',
    wardId: 'admin-ward-09',
    wardNumber: 9,
    displayName: 'Tilak Road / Sinhagad Road Corridor',
    shortLabel: 'Tilak Rd / Sinhagad Rd',
    pmcWardOfficeId: 'ward-sinhagad-road',
    zone: 'DMC Zone 3 (Southwestern Mutha Bank)',
    keyLocalities: ['Tilak Road', 'Dattawadi', 'Sinhagad Road', 'Anandnagar', 'Vadgaon Budruk', 'Manikbaug'],
    prabhagCoverage2022: 'Prabhags 37, 51, 52',
    boundaryNote: '2017 DataMeet Admin Ward 09 (Tilak Road) polygon encompassing the Sinhagad Road corridor up to Vadgaon Budruk.'
  },
  {
    geoFeatureName: 'Admin Ward 10 Sahakarnagar',
    wardId: 'admin-ward-10',
    wardNumber: 10,
    displayName: 'Sahakarnagar – Parvati',
    shortLabel: 'Sahakarnagar',
    pmcWardOfficeId: 'ward-dhankawadi-sahakarnagar',
    zone: 'DMC Zone 4 (South-Central Parvati Belt)',
    keyLocalities: ['Sahakarnagar', 'Parvati', 'Padmavati', 'Shivdarshan', 'Taljai'],
    prabhagCoverage2022: 'Prabhags 38, 50',
    boundaryNote: '2017 DataMeet Admin Ward 10 boundary; subsequently consolidated into Dhankawadi–Sahakarnagar Ward Office.'
  },
  {
    geoFeatureName: 'Admin Ward 11 Bibwewadi',
    wardId: 'admin-ward-11',
    wardNumber: 11,
    displayName: 'Bibwewadi – Market Yard',
    shortLabel: 'Bibwewadi',
    pmcWardOfficeId: 'ward-bibwewadi',
    zone: 'DMC Zone 4 (South-Central)',
    keyLocalities: ['Bibwewadi', 'Market Yard', 'Gultekdi', 'Maharshinagar', 'Gangadham'],
    prabhagCoverage2022: 'Prabhags 39, 40, 48',
    boundaryNote: 'Covers Bibwewadi, Market Yard wholesale hub, and Maharshinagar.'
  },
  {
    geoFeatureName: 'Admin Ward 12 Bhavani Peth',
    wardId: 'admin-ward-12',
    wardNumber: 12,
    displayName: 'Bhavani Peth',
    shortLabel: 'Bhavani Peth',
    pmcWardOfficeId: 'ward-bhavani-peth',
    zone: 'DMC Zone 4 (Central Eastern Peths)',
    keyLocalities: ['Bhavani Peth', 'Rasta Peth', 'Nana Peth', 'Kasewadi', 'Lohiyanagar'],
    prabhagCoverage2022: 'Prabhags 19, 27, 28',
    boundaryNote: 'High-density central wholesale and heritage Peth zone bordering Pune Cantonment.'
  },
  {
    geoFeatureName: 'Admin Ward 13 Hadapsar',
    wardId: 'admin-ward-13',
    wardNumber: 13,
    displayName: 'Hadapsar – Mundhwa',
    shortLabel: 'Hadapsar',
    pmcWardOfficeId: 'ward-hadapsar-mundhwa',
    zone: 'DMC Zone 5 (Eastern Belt)',
    keyLocalities: ['Hadapsar', 'Mundhwa', 'Magarpatta', 'Sadesataranali', 'Sasane Nagar'],
    prabhagCoverage2022: 'Prabhags 22, 23, 24, 25, 44',
    boundaryNote: '2017 DataMeet Admin Ward 13 boundary; 2022 expanded limits include Manjari Bk and Fursungi.'
  },
  {
    geoFeatureName: 'Admin Ward 14 Dhankawadi',
    wardId: 'admin-ward-14',
    wardNumber: 14,
    displayName: 'Dhankawadi – Katraj',
    shortLabel: 'Dhankawadi',
    pmcWardOfficeId: 'ward-dhankawadi-sahakarnagar',
    zone: 'DMC Zone 4 (Southern Satara Road)',
    keyLocalities: ['Dhankawadi', 'Katraj', 'Balajinagar', 'Ambegaon Pathar', 'Bharati Vidyapeeth', 'Sukhsagarnagar'],
    prabhagCoverage2022: 'Prabhags 49, 55, 56, 57, 58',
    boundaryNote: 'Southern PMC Satara Road belt covering Dhankawadi and Katraj.'
  },
  {
    geoFeatureName: 'Admin Ward 15 Kondhwa Wanavdi',
    wardId: 'admin-ward-15',
    wardNumber: 15,
    displayName: 'Kondhwa – Wanowrie',
    shortLabel: 'Kondhwa–Wanowrie',
    pmcWardOfficeId: 'ward-kondhwa-yewalewadi',
    zone: 'DMC Zone 5 (Southeastern Belt)',
    keyLocalities: ['Kondhwa Khurd', 'Wanowrie', 'Ramtekdi', 'Salunke Vihar', 'NIBM Road', 'Kausar Baug'],
    prabhagCoverage2022: 'Prabhags 26, 41, 42, 43, 46, 47',
    boundaryNote: '2017 combined Kondhwa–Wanavdi boundary (subsequently organized into Wanowrie–Ramtekdi and Kondhwa–Yewalewadi offices).'
  }
];

/**
 * Map every 2022 Prabhag (1..58) to its parent Admin Ward GeoJSON key
 */
export const PRABHAG_2022_TO_ADMIN_WARD: Record<number, string> = {
  1: 'Admin Ward 06 Yerawda - Sangamwadi',
  2: 'Admin Ward 06 Yerawda - Sangamwadi',
  3: 'Admin Ward 07 Nagar Road',
  4: 'Admin Ward 07 Nagar Road',
  5: 'Admin Ward 07 Nagar Road',
  6: 'Admin Ward 07 Nagar Road',
  7: 'Admin Ward 06 Yerawda - Sangamwadi',
  8: 'Admin Ward 06 Yerawda - Sangamwadi',
  9: 'Admin Ward 06 Yerawda - Sangamwadi',
  10: 'Admin Ward 02 Ghole Road',
  11: 'Admin Ward 01 Aundh',
  12: 'Admin Ward 01 Aundh',
  13: 'Admin Ward 01 Aundh',
  14: 'Admin Ward 01 Aundh',
  15: 'Admin Ward 02 Ghole Road',
  16: 'Admin Ward 02 Ghole Road',
  17: 'Admin Ward 08 KasbaVishrambaugwada',
  18: 'Admin Ward 08 KasbaVishrambaugwada',
  19: 'Admin Ward 12 Bhavani Peth',
  20: 'Admin Ward 05 Dhole Patil Rd',
  21: 'Admin Ward 05 Dhole Patil Rd',
  22: 'Admin Ward 13 Hadapsar',
  23: 'Admin Ward 13 Hadapsar',
  24: 'Admin Ward 13 Hadapsar',
  25: 'Admin Ward 13 Hadapsar',
  26: 'Admin Ward 15 Kondhwa Wanavdi',
  27: 'Admin Ward 12 Bhavani Peth',
  28: 'Admin Ward 12 Bhavani Peth',
  29: 'Admin Ward 08 KasbaVishrambaugwada',
  30: 'Admin Ward 03 Kothrud Karveroad',
  31: 'Admin Ward 03 Kothrud Karveroad',
  32: 'Admin Ward 03 Kothrud Karveroad',
  33: 'Admin Ward 03 Kothrud Karveroad',
  34: 'Admin Ward 04 Warje Karvenagar',
  35: 'Admin Ward 04 Warje Karvenagar',
  36: 'Admin Ward 04 Warje Karvenagar',
  37: 'Admin Ward 09 Tilak Road',
  38: 'Admin Ward 10 Sahakarnagar',
  39: 'Admin Ward 11 Bibwewadi',
  40: 'Admin Ward 11 Bibwewadi',
  41: 'Admin Ward 15 Kondhwa Wanavdi',
  42: 'Admin Ward 15 Kondhwa Wanavdi',
  43: 'Admin Ward 15 Kondhwa Wanavdi',
  44: 'Admin Ward 13 Hadapsar',
  45: 'Admin Ward 13 Hadapsar',
  46: 'Admin Ward 15 Kondhwa Wanavdi',
  47: 'Admin Ward 15 Kondhwa Wanavdi',
  48: 'Admin Ward 11 Bibwewadi',
  49: 'Admin Ward 14 Dhankawadi',
  50: 'Admin Ward 10 Sahakarnagar',
  51: 'Admin Ward 09 Tilak Road',
  52: 'Admin Ward 09 Tilak Road',
  53: 'Admin Ward 09 Tilak Road',
  54: 'Admin Ward 14 Dhankawadi',
  55: 'Admin Ward 14 Dhankawadi',
  56: 'Admin Ward 14 Dhankawadi',
  57: 'Admin Ward 14 Dhankawadi',
  58: 'Admin Ward 14 Dhankawadi'
};

/**
 * Verified PMC Municipal Projects sourced from PMC official portals, Standing Committee budgets,
 * and documented press/project disclosures. Coordinates are strictly OSM Nominatim verified.
 * Missing actual expenditures and unverified percentages remain null ("Data unavailable").
 */
export const PMC_MAP_PROJECTS: MapMunicipalProject[] = [
  {
    projectId: 'proj-pmc-sinhagad-flyover',
    projectCode: 'PMC-RD-SINHAGAD',
    projectName: 'Sinhagad Road Multi-Level Flyover (Rajaram Bridge – Fun Time Theatre)',
    officialName: 'Construction of Flyover from Rajaram Bridge to Fun Time Theatre on Sinhagad Road',
    department: 'Roads and Traffic Department',
    category: 'Roads and Transportation',
    wardId: 'admin-ward-09',
    estimatedCostCrores: 118.37,
    approvedFundingCrores: 134.70,
    actualExpenditureCrores: null,
    status: 'Completed',
    physicalProgressPercent: 100,
    startDate: '2021-10',
    expectedCompletionDate: '2025-09',
    financialYear: '2025-26',
    wardScope: 'Ward-Specific',
    adminWardGeoNames: ['Admin Ward 09 Tilak Road'],
    prabhagNumbers2022: [37, 51],
    locationSummary: 'Rajaram Bridge to Fun Time Theatre, Sinhagad Road (Dattawadi – Vadgaon Bk)',
    latitude: 18.4889279,
    longitude: 73.8267169,
    coordinateSource: 'OpenStreetMap Nominatim (Rajaram Bridge, Sinhagad Road)',
    description:
      '2.5+ km multi-level grade-separator flyover chain (Phases 1–3: Rajaram Bridge ₹15 Cr, Vitthalwadi–Fun Time ₹61 Cr, Goyal Ganga–Inamdar Chowk ₹42 Cr) executed by T&T Infra Ltd and fully inaugurated on 1 September 2025.',
    capacityOrScale: '2.5+ km multi-level grade separator',
    sourceDocument: 'PMC Standing Committee Contract Resolution & Inauguration Record (Sep 2025)',
    sourceUrl: 'https://www.pmc.gov.in/en/road-department',
    sourcePageOrTable: 'Sinhagad Road Flyover Sanctioned Tender ₹134.70 Cr / Phase Cost ₹118.37 Cr',
    evidenceNote:
      'All 3 corridor phases opened by Sep 1, 2025 (100% commissioned). Final audited contractor bill settlement total is not published as a consolidated table.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Government document available'
  },
  {
    projectId: 'proj-pmc-kamla-nehru',
    projectCode: 'PMC-HLTH-KNH1',
    projectName: 'Kamla Nehru Hospital Phase-1 Infrastructure Modernization',
    officialName: 'Comprehensive Repairs & Patient Support Upgrade at Kamla Nehru Hospital (Kasba Peth)',
    department: 'Public Health Department',
    category: 'Healthcare',
    wardId: 'admin-ward-08',
    estimatedCostCrores: 13.00,
    approvedFundingCrores: 13.00,
    actualExpenditureCrores: null,
    status: 'Upcoming',
    physicalProgressPercent: null,
    startDate: null,
    expectedCompletionDate: null,
    financialYear: '2024-25',
    wardScope: 'Ward-Specific',
    adminWardGeoNames: ['Admin Ward 08 KasbaVishrambaugwada'],
    prabhagNumbers2022: [18],
    locationSummary: 'Kamla Nehru Hospital, Mangalwar Peth / Kasba Peth',
    latitude: 18.5228563,
    longitude: 73.8620314,
    coordinateSource: 'OpenStreetMap Nominatim (Kamla Nehru Hospital, Mangalwar Peth)',
    description:
      'Phase-1 civic hospital modernization, emergency ward strengthening, and clinical infrastructure upgrade at PMC flagship Kamla Nehru Hospital.',
    sourceDocument: 'PMC Health Department Project Approvals',
    sourceUrl: 'https://www.pmc.gov.in/',
    sourcePageOrTable: 'Kamla Nehru Hospital Phase-1 Modernization (₹13 Cr)',
    evidenceNote:
      'Approved Phase-1 allocation ₹13.00 Cr. Contractor award schedule and actual expenditure realized remain Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Official source verified'
  },
  {
    projectId: 'proj-pmc-rfd-stretch1',
    projectCode: 'PMC-RFD-44KM-S1',
    projectName: 'Mula-Mutha Riverfront Development — Priority Stretch 1 (Sangamwadi to Bund Garden)',
    officialName: 'Pune Mula-Mutha River Rejuvenation & Riverfront Development (Priority Stretch 1)',
    department: 'Riverfront & Urban Infrastructure',
    category: 'Public Infrastructure',
    wardId: null,
    estimatedCostCrores: 305.26,
    approvedFundingCrores: 339.00,
    actualExpenditureCrores: null,
    status: 'Ongoing',
    physicalProgressPercent: 85,
    startDate: '2022-03',
    expectedCompletionDate: '2026-06',
    financialYear: '2025-26',
    wardScope: 'Multi-Ward Corridor',
    adminWardGeoNames: [
      'Admin Ward 02 Ghole Road',
      'Admin Ward 05 Dhole Patil Rd',
      'Admin Ward 06 Yerawda - Sangamwadi'
    ],
    prabhagNumbers2022: [10, 20, 7, 9],
    locationSummary: 'Sangamwadi to Bund Garden Bridge (~3.7 km along Mula-Mutha corridor)',
    latitude: 18.5449971,
    longitude: 73.8845209,
    coordinateSource: 'OpenStreetMap Nominatim (Bund Garden Bridge Corridor)',
    description:
      '3.7 km pilot riverfront stretch featuring engineered flood embankments, riverside promenades, ghats, and interceptor sewer integration executed by B.G. Shirke Construction Technology.',
    capacityOrScale: '3.7 km Priority Stretch 1 (within ₹4,727 Cr 44-km Master DPR)',
    sourceDocument: 'PMC Riverfront Development Portal & Stretch-1 Tender Disclosures',
    sourceUrl: 'https://www.pmc.gov.in/en/river-front-development',
    sourcePageOrTable: 'Priority Stretch 1 Tender (Initial ₹305.26 Cr · Revised ₹339 Cr)',
    evidenceNote:
      'Revised Stretch-1 estimate ₹339 Cr and >85% physical completion reported in secondary infrastructure tracking; audited stretch-wise expenditure and ward-wise split remain Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Secondary source'
  },
  {
    projectId: 'proj-pmc-bhama-askhed',
    projectCode: 'PMC-WS-BA200',
    projectName: 'Bhama Askhed Water Supply Transmission & 200 MLD WTP Scheme',
    officialName: '200 MLD Water Supply Scheme from Bhama Askhed Dam for Eastern Pune',
    department: 'Water Supply Department',
    category: 'Water Supply',
    wardId: null,
    estimatedCostCrores: 380.16,
    approvedFundingCrores: 380.16,
    actualExpenditureCrores: null,
    status: 'Completed',
    physicalProgressPercent: 100,
    startDate: '2014-01',
    expectedCompletionDate: '2021-01',
    financialYear: '2024-25',
    wardScope: 'Multi-Ward Corridor',
    adminWardGeoNames: ['Admin Ward 07 Nagar Road', 'Admin Ward 06 Yerawda - Sangamwadi'],
    prabhagNumbers2022: [1, 2, 3, 4, 5, 6],
    locationSummary: 'Kuruli WTP & Eastern Pune Transmission (Viman Nagar, Kharadi, Wadgaon Sheri, Dhanori)',
    latitude: null,
    longitude: null,
    coordinateSource: null,
    description:
      '200 MLD raw-water pipeline and Water Treatment Plant commissioned for eastern Pune residential and IT corridors.',
    capacityOrScale: '200 MLD Design Capacity',
    sourceDocument: 'PMC Water Supply Department — Bhama Askhed Scheme Note',
    sourceUrl: 'https://www.pmc.gov.in/en/water-supply',
    sourcePageOrTable: 'JNNURM Baseline Sanctioned Cost Table (₹380.16 Cr)',
    evidenceNote:
      'Operational scheme serving Nagar Road and Yerawada–Dhanori wards. Kuruli intake lies outside PMC boundary (no in-PMC marker placed); final audited completion spend is Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Official source verified'
  },
  {
    projectId: 'proj-pmc-11-hospitals',
    projectCode: 'PMC-HLTH-11HC',
    projectName: 'Upgradation of 11 Municipal Health Centres to General Hospitals',
    officialName: 'Modernisation of 5 OPD Hospitals & 6 Maternity Homes (incl. Rajiv Gandhi, Laigude & Bopodi)',
    department: 'Public Health Department',
    category: 'Healthcare',
    wardId: null,
    estimatedCostCrores: 90.00,
    approvedFundingCrores: 90.00,
    actualExpenditureCrores: null,
    status: 'Upcoming',
    physicalProgressPercent: null,
    startDate: null,
    expectedCompletionDate: null,
    financialYear: '2024-25',
    wardScope: 'Multi-Ward Corridor',
    adminWardGeoNames: [
      'Admin Ward 06 Yerawda - Sangamwadi',
      'Admin Ward 09 Tilak Road',
      'Admin Ward 01 Aundh',
      'Admin Ward 02 Ghole Road'
    ],
    prabhagNumbers2022: [9, 11, 51],
    locationSummary: 'Named locations: Yerawada (Rajiv Gandhi), Vadgaon (Laigude), Bopodi & allied maternity homes',
    latitude: null,
    longitude: null,
    coordinateSource: null,
    description:
      'Multi-facility modernization converting 5 municipal OPD centres and 6 maternity homes into upgraded general hospitals with ICUs and maternity care.',
    sourceDocument: 'PMC Health Department & Standing Committee Project Approvals',
    sourceUrl: 'https://www.pmc.gov.in/',
    sourcePageOrTable: '11 Health Centres Modernization Program (₹90 Cr)',
    evidenceNote:
      '₹90.00 Cr covers 11 dispersed centres across multiple wards; per-hospital cost breakdown and actual expenditure are Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Government document available'
  },
  // 11 JICA Mula-Mutha STPs mapped to exact documented ward, Prabhag, and OSM coordinates
  {
    projectId: 'stp-jica-tanajiwadi',
    projectCode: 'PMC-JICA-STP-09',
    projectName: 'Tanajiwadi Sewage Treatment Plant (15 MLD · JICA Mula-Mutha)',
    officialName: 'JICA Assisted Mula-Mutha Pollution Abatement — Tanajiwadi 15 MLD STP',
    department: 'Drainage and Sewerage Department',
    category: 'Drainage and Sewage',
    wardId: 'admin-ward-02',
    estimatedCostCrores: null,
    approvedFundingCrores: null,
    actualExpenditureCrores: null,
    status: 'Ongoing',
    physicalProgressPercent: null,
    startDate: '2022-03',
    expectedCompletionDate: '2026-03',
    financialYear: '2025-26',
    wardScope: 'Ward-Specific',
    adminWardGeoNames: ['Admin Ward 02 Ghole Road'],
    prabhagNumbers2022: [10],
    locationSummary: 'Tanajiwadi / Wakadewadi, Shivajinagar (Prabhag 10)',
    latitude: 18.5430990,
    longitude: 73.8526341,
    coordinateSource: 'OpenStreetMap Nominatim (Wakadewadi / Shivajinagar)',
    description:
      '15 MLD biological sewage treatment plant under PMC’s ₹990.26 Cr JICA Mula-Mutha Pollution Abatement package (Overall program ~65% complete).',
    capacityOrScale: '15 MLD Treatment Capacity',
    sourceDocument: 'PMC JICA Mula-Mutha Pollution Abatement Project Schedule',
    sourceUrl: 'https://www.pmc.gov.in/',
    sourcePageOrTable: '11 New STPs Plant Schedule (Total 396 MLD · ₹990.26 Cr Package)',
    evidenceNote:
      'Part of the ₹990.26 Cr JICA 11-STP package (85% GoI/JICA + 15% PMC). Individual plant-level tender value & expenditure are Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Official source verified'
  },
  {
    projectId: 'stp-jica-naidu',
    projectCode: 'PMC-JICA-STP-01',
    projectName: 'Dr. Naidu Hospital Sewage Treatment Plant (127 MLD · JICA Mula-Mutha)',
    officialName: 'JICA Assisted Mula-Mutha Pollution Abatement — Dr. Naidu Hospital 127 MLD STP',
    department: 'Drainage and Sewerage Department',
    category: 'Drainage and Sewage',
    wardId: 'admin-ward-05',
    estimatedCostCrores: null,
    approvedFundingCrores: null,
    actualExpenditureCrores: null,
    status: 'Ongoing',
    physicalProgressPercent: null,
    startDate: '2022-03',
    expectedCompletionDate: '2026-03',
    financialYear: '2025-26',
    wardScope: 'Ward-Specific',
    adminWardGeoNames: ['Admin Ward 05 Dhole Patil Rd'],
    prabhagNumbers2022: [20],
    locationSummary: 'Dr. Naidu Hospital Campus, Sangamwadi / Dhole Patil Road',
    latitude: 18.5378157,
    longitude: 73.8632344,
    coordinateSource: 'OpenStreetMap Nominatim (Sangamwadi Precinct)',
    description:
      'Largest STP (127 MLD) in the JICA-assisted Mula-Mutha river pollution abatement program serving central Pune trunk sewers.',
    capacityOrScale: '127 MLD Treatment Capacity',
    sourceDocument: 'PMC JICA Mula-Mutha Pollution Abatement Project Schedule',
    sourceUrl: 'https://www.pmc.gov.in/',
    sourcePageOrTable: '11 New STPs Plant Schedule (Total 396 MLD · ₹990.26 Cr Package)',
    evidenceNote:
      'Largest plant in the ₹990.26 Cr JICA 11-STP program. Plant-wise standalone financial split is Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Official source verified'
  },
  {
    projectId: 'stp-jica-bhairoba',
    projectCode: 'PMC-JICA-STP-02',
    projectName: 'Bhairoba Nalla Sewage Treatment Plant (75 MLD · JICA Mula-Mutha)',
    officialName: 'JICA Assisted Mula-Mutha Pollution Abatement — Bhairoba Nalla 75 MLD STP',
    department: 'Drainage and Sewerage Department',
    category: 'Drainage and Sewage',
    wardId: 'admin-ward-05',
    estimatedCostCrores: null,
    approvedFundingCrores: null,
    actualExpenditureCrores: null,
    status: 'Ongoing',
    physicalProgressPercent: null,
    startDate: '2022-03',
    expectedCompletionDate: '2026-03',
    financialYear: '2025-26',
    wardScope: 'Ward-Specific',
    adminWardGeoNames: ['Admin Ward 05 Dhole Patil Rd'],
    prabhagNumbers2022: [21],
    locationSummary: 'Bhairoba Nalla / Koregaon Park – Mundhwa Border',
    latitude: 18.5259360,
    longitude: 73.9011429,
    coordinateSource: 'OpenStreetMap Nominatim (Bhairoba Nullah)',
    description:
      '75 MLD sewage treatment plant treating eastern-central outfall flows entering the Mula-Mutha confluence.',
    capacityOrScale: '75 MLD Treatment Capacity',
    sourceDocument: 'PMC JICA Mula-Mutha Pollution Abatement Project Schedule',
    sourceUrl: 'https://www.pmc.gov.in/',
    sourcePageOrTable: '11 New STPs Plant Schedule (Total 396 MLD · ₹990.26 Cr Package)',
    evidenceNote:
      'Part of the ₹990.26 Cr JICA 11-STP program. Plant-wise standalone financial split is Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Official source verified'
  },
  {
    projectId: 'stp-jica-dhanori',
    projectCode: 'PMC-JICA-STP-03',
    projectName: 'Dhanori Sewage Treatment Plant (33 MLD · JICA Mula-Mutha)',
    officialName: 'JICA Assisted Mula-Mutha Pollution Abatement — Dhanori 33 MLD STP',
    department: 'Drainage and Sewerage Department',
    category: 'Drainage and Sewage',
    wardId: 'admin-ward-06',
    estimatedCostCrores: null,
    approvedFundingCrores: null,
    actualExpenditureCrores: null,
    status: 'Ongoing',
    physicalProgressPercent: null,
    startDate: '2022-03',
    expectedCompletionDate: '2026-03',
    financialYear: '2025-26',
    wardScope: 'Ward-Specific',
    adminWardGeoNames: ['Admin Ward 06 Yerawda - Sangamwadi'],
    prabhagNumbers2022: [1],
    locationSummary: 'Kalas – Dhanori (Prabhag 01)',
    latitude: 18.5906707,
    longitude: 73.8913189,
    coordinateSource: 'OpenStreetMap Nominatim (Dhanori, Pune)',
    description:
      '33 MLD sewage treatment plant under construction for northern Yerawada–Kalas–Dhanori drainage catchment.',
    capacityOrScale: '33 MLD Treatment Capacity',
    sourceDocument: 'PMC JICA Mula-Mutha Pollution Abatement Project Schedule',
    sourceUrl: 'https://www.pmc.gov.in/',
    sourcePageOrTable: '11 New STPs Plant Schedule (Total 396 MLD · ₹990.26 Cr Package)',
    evidenceNote:
      'Part of the ₹990.26 Cr JICA 11-STP program. Plant-wise standalone financial split is Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Official source verified'
  },
  {
    projectId: 'stp-jica-kharadi',
    projectCode: 'PMC-JICA-STP-04',
    projectName: 'Kharadi Sewage Treatment Plant (30 MLD · JICA Mula-Mutha)',
    officialName: 'JICA Assisted Mula-Mutha Pollution Abatement — Kharadi 30 MLD STP',
    department: 'Drainage and Sewerage Department',
    category: 'Drainage and Sewage',
    wardId: 'admin-ward-07',
    estimatedCostCrores: null,
    approvedFundingCrores: null,
    actualExpenditureCrores: null,
    status: 'Ongoing',
    physicalProgressPercent: null,
    startDate: '2022-03',
    expectedCompletionDate: '2026-03',
    financialYear: '2025-26',
    wardScope: 'Ward-Specific',
    adminWardGeoNames: ['Admin Ward 07 Nagar Road'],
    prabhagNumbers2022: [5],
    locationSummary: 'Kharadi Mula-Mutha Bank (Nagar Road Ward)',
    latitude: 18.5512763,
    longitude: 73.9416575,
    coordinateSource: 'OpenStreetMap Nominatim (Kharadi, Pune)',
    description:
      '30 MLD sewage treatment plant under the JICA package serving Kharadi and eastern Nagar Road belt.',
    capacityOrScale: '30 MLD Treatment Capacity',
    sourceDocument: 'PMC JICA Mula-Mutha Pollution Abatement Project Schedule',
    sourceUrl: 'https://www.pmc.gov.in/',
    sourcePageOrTable: '11 New STPs Plant Schedule (Total 396 MLD · ₹990.26 Cr Package)',
    evidenceNote:
      'Part of the ₹990.26 Cr JICA 11-STP program. Plant-wise standalone financial split is Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Official source verified'
  },
  {
    projectId: 'stp-jica-warje',
    projectCode: 'PMC-JICA-STP-05',
    projectName: 'Warje Sewage Treatment Plant (28 MLD · JICA Mula-Mutha)',
    officialName: 'JICA Assisted Mula-Mutha Pollution Abatement — Warje 28 MLD STP',
    department: 'Drainage and Sewerage Department',
    category: 'Drainage and Sewage',
    wardId: 'admin-ward-04',
    estimatedCostCrores: null,
    approvedFundingCrores: null,
    actualExpenditureCrores: null,
    status: 'Ongoing',
    physicalProgressPercent: null,
    startDate: '2022-03',
    expectedCompletionDate: '2026-03',
    financialYear: '2025-26',
    wardScope: 'Ward-Specific',
    adminWardGeoNames: ['Admin Ward 04 Warje Karvenagar'],
    prabhagNumbers2022: [34],
    locationSummary: 'Warje Mutha Riverbank (Prabhag 34)',
    latitude: 18.4820444,
    longitude: 73.8001705,
    coordinateSource: 'OpenStreetMap Nominatim (Warje, Pune)',
    description:
      '28 MLD sewage treatment plant under construction along the Mutha riverbank at Warje.',
    capacityOrScale: '28 MLD Treatment Capacity',
    sourceDocument: 'PMC JICA Mula-Mutha Pollution Abatement Project Schedule',
    sourceUrl: 'https://www.pmc.gov.in/',
    sourcePageOrTable: '11 New STPs Plant Schedule (Total 396 MLD · ₹990.26 Cr Package)',
    evidenceNote:
      'Part of the ₹990.26 Cr JICA 11-STP program. Plant-wise standalone financial split is Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Official source verified'
  },
  {
    projectId: 'stp-jica-vadgaon',
    projectCode: 'PMC-JICA-STP-06',
    projectName: 'Vadgaon Budruk Sewage Treatment Plant (26 MLD · JICA Mula-Mutha)',
    officialName: 'JICA Assisted Mula-Mutha Pollution Abatement — Vadgaon 26 MLD STP',
    department: 'Drainage and Sewerage Department',
    category: 'Drainage and Sewage',
    wardId: 'admin-ward-09',
    estimatedCostCrores: null,
    approvedFundingCrores: null,
    actualExpenditureCrores: null,
    status: 'Ongoing',
    physicalProgressPercent: null,
    startDate: '2022-03',
    expectedCompletionDate: '2026-03',
    financialYear: '2025-26',
    wardScope: 'Ward-Specific',
    adminWardGeoNames: ['Admin Ward 09 Tilak Road'],
    prabhagNumbers2022: [51],
    locationSummary: 'Vadgaon Budruk / Sinhagad Road Corridor (Prabhag 51)',
    latitude: 18.4674971,
    longitude: 73.8253650,
    coordinateSource: 'OpenStreetMap Nominatim (Vadgaon Budruk, Pune)',
    description:
      '26 MLD sewage treatment plant under JICA river abatement serving Vadgaon Budruk and Sinhagad Road.',
    capacityOrScale: '26 MLD Treatment Capacity',
    sourceDocument: 'PMC JICA Mula-Mutha Pollution Abatement Project Schedule',
    sourceUrl: 'https://www.pmc.gov.in/',
    sourcePageOrTable: '11 New STPs Plant Schedule (Total 396 MLD · ₹990.26 Cr Package)',
    evidenceNote:
      'Part of the ₹990.26 Cr JICA 11-STP program. Plant-wise standalone financial split is Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Official source verified'
  },
  {
    projectId: 'stp-jica-baner',
    projectCode: 'PMC-JICA-STP-07',
    projectName: 'Baner Sewage Treatment Plant (25 MLD · JICA Mula-Mutha)',
    officialName: 'JICA Assisted Mula-Mutha Pollution Abatement — Baner 25 MLD STP',
    department: 'Drainage and Sewerage Department',
    category: 'Drainage and Sewage',
    wardId: 'admin-ward-01',
    estimatedCostCrores: null,
    approvedFundingCrores: null,
    actualExpenditureCrores: null,
    status: 'Ongoing',
    physicalProgressPercent: null,
    startDate: '2022-03',
    expectedCompletionDate: '2026-03',
    financialYear: '2025-26',
    wardScope: 'Ward-Specific',
    adminWardGeoNames: ['Admin Ward 01 Aundh'],
    prabhagNumbers2022: [13],
    locationSummary: 'Baner Mula River Bank (Aundh–Baner Ward)',
    latitude: 18.5589937,
    longitude: 73.7845232,
    coordinateSource: 'OpenStreetMap Nominatim (Baner, Pune)',
    description:
      '25 MLD sewage treatment plant serving Baner–Balewadi Mula river catchment.',
    capacityOrScale: '25 MLD Treatment Capacity',
    sourceDocument: 'PMC JICA Mula-Mutha Pollution Abatement Project Schedule',
    sourceUrl: 'https://www.pmc.gov.in/',
    sourcePageOrTable: '11 New STPs Plant Schedule (Total 396 MLD · ₹990.26 Cr Package)',
    evidenceNote:
      'Part of the ₹990.26 Cr JICA 11-STP program. Plant-wise standalone financial split is Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Official source verified'
  },
  {
    projectId: 'stp-jica-botanical',
    projectCode: 'PMC-JICA-STP-10',
    projectName: 'Botanical Garden (Aundh) Sewage Treatment Plant (10 MLD · JICA Mula-Mutha)',
    officialName: 'JICA Assisted Mula-Mutha Pollution Abatement — Botanical Garden Aundh 10 MLD STP',
    department: 'Drainage and Sewerage Department',
    category: 'Drainage and Sewage',
    wardId: 'admin-ward-01',
    estimatedCostCrores: null,
    approvedFundingCrores: null,
    actualExpenditureCrores: null,
    status: 'Ongoing',
    physicalProgressPercent: null,
    startDate: '2022-03',
    expectedCompletionDate: '2026-03',
    financialYear: '2025-26',
    wardScope: 'Ward-Specific',
    adminWardGeoNames: ['Admin Ward 01 Aundh'],
    prabhagNumbers2022: [12],
    locationSummary: 'Aundh Botanical Garden Precinct (Prabhag 12)',
    latitude: 18.5618834,
    longitude: 73.8101957,
    coordinateSource: 'OpenStreetMap Nominatim (Aundh, Pune)',
    description:
      '10 MLD decentralized sewage treatment plant under JICA river pollution abatement in Aundh.',
    capacityOrScale: '10 MLD Treatment Capacity',
    sourceDocument: 'PMC JICA Mula-Mutha Pollution Abatement Project Schedule',
    sourceUrl: 'https://www.pmc.gov.in/',
    sourcePageOrTable: '11 New STPs Plant Schedule (Total 396 MLD · ₹990.26 Cr Package)',
    evidenceNote:
      'Part of the ₹990.26 Cr JICA 11-STP program. Plant-wise standalone financial split is Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Official source verified'
  },
  {
    projectId: 'stp-jica-mundhwa',
    projectCode: 'PMC-JICA-STP-08',
    projectName: 'Mundhwa Sewage Treatment Plant (20 MLD · JICA Mula-Mutha)',
    officialName: 'JICA Assisted Mula-Mutha Pollution Abatement — Mundhwa 20 MLD STP',
    department: 'Drainage and Sewerage Department',
    category: 'Drainage and Sewage',
    wardId: 'admin-ward-13',
    estimatedCostCrores: null,
    approvedFundingCrores: null,
    actualExpenditureCrores: null,
    status: 'Ongoing',
    physicalProgressPercent: null,
    startDate: '2022-03',
    expectedCompletionDate: '2026-03',
    financialYear: '2025-26',
    wardScope: 'Ward-Specific',
    adminWardGeoNames: ['Admin Ward 13 Hadapsar'],
    prabhagNumbers2022: [21, 22],
    locationSummary: 'Mundhwa (Hadapsar–Mundhwa Zone)',
    latitude: 18.5343218,
    longitude: 73.9298264,
    coordinateSource: 'OpenStreetMap Nominatim (Mundhwa, Pune)',
    description:
      '20 MLD sewage treatment plant treating Mundhwa and eastern Mula-Mutha downstream inflows.',
    capacityOrScale: '20 MLD Treatment Capacity',
    sourceDocument: 'PMC JICA Mula-Mutha Pollution Abatement Project Schedule',
    sourceUrl: 'https://www.pmc.gov.in/',
    sourcePageOrTable: '11 New STPs Plant Schedule (Total 396 MLD · ₹990.26 Cr Package)',
    evidenceNote:
      'Part of the ₹990.26 Cr JICA 11-STP program. Plant-wise standalone financial split is Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Official source verified'
  },
  {
    projectId: 'stp-jica-matsyabeej',
    projectCode: 'PMC-JICA-STP-11',
    projectName: 'Matsyabeej Kendra (Hadapsar) Sewage Treatment Plant (7 MLD · JICA Mula-Mutha)',
    officialName: 'JICA Assisted Mula-Mutha Pollution Abatement — Matsyabeej Kendra 7 MLD STP',
    department: 'Drainage and Sewerage Department',
    category: 'Drainage and Sewage',
    wardId: 'admin-ward-13',
    estimatedCostCrores: null,
    approvedFundingCrores: null,
    actualExpenditureCrores: null,
    status: 'Ongoing',
    physicalProgressPercent: null,
    startDate: '2022-03',
    expectedCompletionDate: '2026-03',
    financialYear: '2025-26',
    wardScope: 'Ward-Specific',
    adminWardGeoNames: ['Admin Ward 13 Hadapsar'],
    prabhagNumbers2022: [25],
    locationSummary: 'Matsyabeej Kendra, Hadapsar (Prabhag 25)',
    latitude: null,
    longitude: null,
    coordinateSource: null,
    description:
      '7 MLD localized sewage treatment plant at Matsyabeej Kendra in Hadapsar ward under the JICA package.',
    capacityOrScale: '7 MLD Treatment Capacity',
    sourceDocument: 'PMC JICA Mula-Mutha Pollution Abatement Project Schedule',
    sourceUrl: 'https://www.pmc.gov.in/',
    sourcePageOrTable: '11 New STPs Plant Schedule (Total 396 MLD · ₹990.26 Cr Package)',
    evidenceNote:
      'Part of the ₹990.26 Cr JICA 11-STP program. Exact parcel coordinates & plant-wise financial split are Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Official source verified'
  },
  // =========================================================================
  // VERIFIED WARD & CORRIDOR INFRASTRUCTURE ACROSS ALL 15 PMC ADMIN WARDS
  // =========================================================================
  {
    projectId: 'proj-pmc-suncity-karvenagar',
    projectCode: 'PMC-RD-SUNCITY',
    projectName: 'Sun City – Karvenagar Mutha River Bridge & Approach Roads',
    officialName: 'Construction of 30m-Wide Mutha River Bridge Connecting Sun City Road to 30m Karvenagar DP Road',
    department: 'Roads and Traffic Department',
    category: 'Roads and Transportation',
    wardId: 'admin-ward-04',
    estimatedCostCrores: 32.56,
    approvedFundingCrores: 32.56,
    actualExpenditureCrores: null,
    status: 'Ongoing',
    physicalProgressPercent: null,
    startDate: '2022-06',
    expectedCompletionDate: '2026-03',
    financialYear: '2025-26',
    wardScope: 'Multi-Ward Corridor',
    adminWardGeoNames: ['Admin Ward 04 Warje Karvenagar', 'Admin Ward 09 Tilak Road'],
    prabhagNumbers2022: [34, 35, 37],
    locationSummary: 'Sun City Road (Sinhagad Road) across Mutha River to Karvenagar DP Road near Dudhane Lawns',
    latitude: 18.4904385,
    longitude: 73.8150487,
    coordinateSource: 'OpenStreetMap Nominatim (Karvenagar Flyover / Bridge Precinct)',
    description:
      '30-metre-wide, ~345-metre river bridge built to decongest Rajaram Bridge and Sinhagad Road; structural bridge contract awarded for ₹32.56 Cr with separate Karvenagar DP approach land acquisition parcels.',
    capacityOrScale: '30m-wide, 345m river bridge',
    sourceDocument: 'PMC Road Department Contract Disclosures & Karvenagar DP Bridge Briefs',
    sourceUrl: 'https://www.pmc.gov.in/en/road-department',
    sourcePageOrTable: 'Bridge Tender ₹32.56 Cr (M/s Vijay Sudam Patel)',
    evidenceNote:
      'Bridge contract value ₹32.56 Cr verified; separate Karvenagar approach road land acquisition (~₹90 Cr estimate) is tracked separately. Actual disbursed bill total is Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Government document available'
  },
  {
    projectId: 'proj-pmc-warje-service-road',
    projectCode: 'PMC-RD-WARJE-SVC',
    projectName: 'Warje Bypass Service Road Missing Link Completion (Dukkar Khind Corridor)',
    officialName: 'Construction & Land Compensation for Katraj–Dehu Bypass Service Roads in Warje',
    department: 'Roads and Traffic Department',
    category: 'Roads and Transportation',
    wardId: 'admin-ward-04',
    estimatedCostCrores: 9.60,
    approvedFundingCrores: 9.60,
    actualExpenditureCrores: null,
    status: 'Ongoing',
    physicalProgressPercent: null,
    startDate: '2024-06',
    expectedCompletionDate: null,
    financialYear: '2025-26',
    wardScope: 'Ward-Specific',
    adminWardGeoNames: ['Admin Ward 04 Warje Karvenagar'],
    prabhagNumbers2022: [34, 36],
    locationSummary: 'Warje Junction to Dukkar Khind Service Road, Katraj–Dehu Bypass',
    latitude: null,
    longitude: null,
    coordinateSource: null,
    description:
      'Completion of missing service road stretches along the Katraj–Dehu Road bypass in Warje to ease local commuter merging and Dukkar Khind bottlenecks.',
    sourceDocument: 'PMC Standing Committee & Traffic Department Allocations',
    sourceUrl: 'https://www.pmc.gov.in/en/road-department',
    sourcePageOrTable: 'Warje Bypass Service Road Provision (₹9.60 Cr)',
    evidenceNote:
      '₹9.60 Cr allocation documented in secondary municipal reporting; actual final contractor spend is Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Secondary source'
  },
  {
    projectId: 'proj-pmc-nalstop-flyover',
    projectCode: 'PMC-RD-NALSTOP',
    projectName: 'Nal Stop Double-Decker Vehicular Flyover (Karve Road – Kothrud)',
    officialName: 'Integrated Double-Decker Metro Viaduct & Vehicular Flyover at Nal Stop Chowk',
    department: 'Roads and Traffic Department',
    category: 'Roads and Transportation',
    wardId: 'admin-ward-03',
    estimatedCostCrores: 35.00,
    approvedFundingCrores: 35.00,
    actualExpenditureCrores: null,
    status: 'Completed',
    physicalProgressPercent: 100,
    startDate: '2019-06',
    expectedCompletionDate: '2022-08',
    financialYear: '2024-25',
    wardScope: 'Ward-Specific',
    adminWardGeoNames: ['Admin Ward 03 Kothrud Karveroad'],
    prabhagNumbers2022: [30, 31],
    locationSummary: 'Nal Stop Chowk, Karve Road (Erandwane – Kothrud Border)',
    latitude: 18.5086644,
    longitude: 73.8310019,
    coordinateSource: 'OpenStreetMap Nominatim (Nal Stop, Erandwane, Pune)',
    description:
      'Lower-tier vehicular flyover integrated beneath the Pune Metro Aqua Line viaduct at Nal Stop Chowk, co-funded by PMC (~₹35 Cr road deck component) and executed jointly with Maha-Metro.',
    capacityOrScale: '2-lane vehicular deck beneath Metro station viaduct',
    sourceDocument: 'PMC & Maha-Metro Joint Infrastructure Disclosures',
    sourceUrl: 'https://www.pmc.gov.in/en/road-department',
    sourcePageOrTable: 'PMC Vehicular Deck Share (₹35.00 Cr)',
    evidenceNote:
      'Commissioned and operational (100% physical completion). Final reconciled PMC-Maha-Metro settlement voucher is Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Secondary source'
  },
  {
    projectId: 'proj-pmc-balbharati-paud',
    projectCode: 'PMC-RD-BBPP',
    projectName: 'Balbharati – Paud Phata (BB-PP) Link Road Project',
    officialName: 'Proposed 2.1 km Link Road from Balbharati (SB Road) to Paud Phata along Vetal Tekdi Foothills',
    department: 'Roads and Traffic Department',
    category: 'Roads and Transportation',
    wardId: 'admin-ward-03',
    estimatedCostCrores: 252.00,
    approvedFundingCrores: 3.00,
    actualExpenditureCrores: null,
    status: 'Upcoming',
    physicalProgressPercent: null,
    startDate: null,
    expectedCompletionDate: null,
    financialYear: '2025-26',
    wardScope: 'Multi-Ward Corridor',
    adminWardGeoNames: ['Admin Ward 03 Kothrud Karveroad', 'Admin Ward 02 Ghole Road'],
    prabhagNumbers2022: [16, 30],
    locationSummary: 'Balbharati (Senapati Bapat Road) to Paud Phata / Karve Road (Kothrud)',
    latitude: null,
    longitude: null,
    coordinateSource: null,
    description:
      '2.1 km bypass link road intended to relieve Law College Road traffic; ₹252 Cr estimated capital cost with ₹3 Cr annual budgetary provisions for environmental surveys and legal compliance.',
    capacityOrScale: '2.1 km arterial link corridor',
    sourceDocument: 'PMC Budget Provisions & High Court / Environmental Clearance Filings',
    sourceUrl: 'https://www.pmc.gov.in/en/road-department',
    sourcePageOrTable: 'Estimated Cost ₹252 Cr · Budget Provision ₹3.00 Cr',
    evidenceNote:
      '₹3.00 Cr initial budgetary allocation vs ₹252 Cr total DPR estimate; construction remains Upcoming pending environmental & court clearance.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Government document available'
  },
  {
    projectId: 'proj-pmc-parvati-relining',
    projectCode: 'PMC-WS-PARVATI-REL',
    projectName: 'Khadakwasla – Parvati Raw Water Transmission Line Relining',
    officialName: 'Structural Relining & Leakage Reduction of Khadakwasla–Parvati Raw Water Conduit',
    department: 'Water Supply Department',
    category: 'Water Supply',
    wardId: 'admin-ward-10',
    estimatedCostCrores: 57.00,
    approvedFundingCrores: 57.00,
    actualExpenditureCrores: null,
    status: 'Ongoing',
    physicalProgressPercent: null,
    startDate: '2024-04',
    expectedCompletionDate: null,
    financialYear: '2025-26',
    wardScope: 'Ward-Specific',
    adminWardGeoNames: ['Admin Ward 10 Sahakarnagar'],
    prabhagNumbers2022: [38, 50],
    locationSummary: 'Parvati Water Works / Parvati Paytha Intake & Transmission Corridor',
    latitude: 18.4984529,
    longitude: 73.8497234,
    coordinateSource: 'OpenStreetMap Nominatim (Parvati Paytha, Pune)',
    description:
      '₹57 Cr water transmission strengthening project relining the ageing Khadakwasla–Parvati raw water line feeding Pune’s flagship Parvati Water Treatment Plant.',
    sourceDocument: 'PMC Water Supply Department Capital Project Disclosures',
    sourceUrl: 'https://www.pmc.gov.in/en/water-supply',
    sourcePageOrTable: 'Parvati Raw Water Relining Package (₹57.00 Cr)',
    evidenceNote:
      'Sanctioned tender figure ₹57.00 Cr documented; actual expenditure booked to date is Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Secondary source'
  },
  {
    projectId: 'proj-pmc-parvati-amrut',
    projectCode: 'PMC-WS-PARVATI-AMRUT',
    projectName: 'Parvati Water Treatment Plant Upgradation (AMRUT 2.0 Master Plan)',
    officialName: 'Modernization of Parvati WTP Units & NABL-139 Water Quality Testing Infrastructure',
    department: 'Water Supply Department',
    category: 'Water Supply',
    wardId: 'admin-ward-10',
    estimatedCostCrores: 207.55,
    approvedFundingCrores: 207.55,
    actualExpenditureCrores: null,
    status: 'Upcoming',
    physicalProgressPercent: null,
    startDate: '2025-04',
    expectedCompletionDate: null,
    financialYear: '2025-26',
    wardScope: 'Ward-Specific',
    adminWardGeoNames: ['Admin Ward 10 Sahakarnagar'],
    prabhagNumbers2022: [38, 50],
    locationSummary: 'Parvati Water Works Campus, Satara Road / Parvati Paytha',
    latitude: null,
    longitude: null,
    coordinateSource: null,
    description:
      'AMRUT 2.0 water plant rehabilitation plan upgrading Pune’s central Parvati Water Works units and NABL-accredited testing facility.',
    sourceDocument: 'PMC Water Supply Department & AMRUT 2.0 State Action Plan',
    sourceUrl: 'https://www.pmc.gov.in/en/water-supply',
    sourcePageOrTable: 'AMRUT 2.0 Parvati WTP Overhaul Proposal (₹207.55 Cr)',
    evidenceNote:
      'Proposal estimated at ₹207.55 Cr under AMRUT 2.0; tender award & actual expenditure remain Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Government document available'
  },
  {
    projectId: 'proj-pmc-gangadham-flyover',
    projectCode: 'PMC-RD-GANGADHAM',
    projectName: 'Gangadham Chowk Flyover & Connecting Link Road (Bibwewadi – Market Yard)',
    officialName: 'Integrated Flyover, Utility Shifting & Bypass Road at Gangadham Chowk (Bibwewadi–Lullanagar)',
    department: 'Roads and Traffic Department',
    category: 'Roads and Transportation',
    wardId: 'admin-ward-11',
    estimatedCostCrores: 102.00,
    approvedFundingCrores: 102.00,
    actualExpenditureCrores: null,
    status: 'Upcoming',
    physicalProgressPercent: null,
    startDate: '2025-01',
    expectedCompletionDate: null,
    financialYear: '2025-26',
    wardScope: 'Ward-Specific',
    adminWardGeoNames: ['Admin Ward 11 Bibwewadi'],
    prabhagNumbers2022: [39, 40, 48],
    locationSummary: 'Gangadham Chowk, Bibwewadi – Market Yard – Lullanagar Corridor',
    latitude: 18.4752329,
    longitude: 73.8562486,
    coordinateSource: 'OpenStreetMap Nominatim (Bibwewadi, Pune)',
    description:
      'Junction flyover and connecting road widening at Gangadham Chowk (soil testing & utility relocation initiated) to relieve Market Yard freight and Kondhwa commuter bottlenecks.',
    sourceDocument: 'PMC Road Department & Bibwewadi Traffic Mitigation Plan',
    sourceUrl: 'https://www.pmc.gov.in/en/road-department',
    sourcePageOrTable: 'Gangadham Chowk Flyover & Link Road Estimate (~₹102 Cr)',
    evidenceNote:
      'Early DPR & preparatory works (~₹102 Cr package) documented in municipal traffic reporting; final contractor award spend is Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Secondary source'
  },
  {
    projectId: 'proj-pmc-rajewadi-colony',
    projectCode: 'PMC-BLD-RAJEWADI',
    projectName: 'Rajewadi (Nana Peth / Bhavani Peth) PMC Staff Colony Redevelopment',
    officialName: 'Multi-Storey Redevelopment of Municipal Employees Colony at Rajewadi, Nana Peth',
    department: 'Building Construction (Bhavan Rachna)',
    category: 'Public Infrastructure',
    wardId: 'admin-ward-12',
    estimatedCostCrores: 15.00,
    approvedFundingCrores: 15.00,
    actualExpenditureCrores: null,
    status: 'Upcoming',
    physicalProgressPercent: null,
    startDate: null,
    expectedCompletionDate: null,
    financialYear: '2025-26',
    wardScope: 'Ward-Specific',
    adminWardGeoNames: ['Admin Ward 12 Bhavani Peth'],
    prabhagNumbers2022: [19, 27, 28],
    locationSummary: 'Rajewadi, Nana Peth / Bhavani Peth Ward Office Jurisdiction',
    latitude: 18.5085663,
    longitude: 73.8677223,
    coordinateSource: 'OpenStreetMap Nominatim (Bhavani Peth – Timber Market, Pune)',
    description:
      'Redevelopment of dilapidated PMC employee residential quarters at Rajewadi (Nana Peth) into modern multi-storey civic housing blocks.',
    sourceDocument: 'PMC Building Construction Department (Bhavan Rachna) Project List',
    sourceUrl: 'https://www.pmc.gov.in/',
    sourcePageOrTable: 'Rajewadi Nana Peth Colony Redevelopment (₹15.00 Cr)',
    evidenceNote:
      'Budgeted redevelopment outlay ₹15.00 Cr documented; actual expenditure and physical progress % remain Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Secondary source'
  },
  {
    projectId: 'proj-pmc-keshavnagar-water',
    projectCode: 'PMC-WS-KESHAVNAGAR',
    projectName: 'Keshavnagar – Mundhwa Dedicated Drinking Water Supply & ESR Scheme',
    officialName: 'Dedicated Trunk Pipelines (>8 km) & Elevated Storage Reservoir for Keshavnagar–Mundhwa',
    department: 'Water Supply Department',
    category: 'Water Supply',
    wardId: 'admin-ward-13',
    estimatedCostCrores: 135.57,
    approvedFundingCrores: 135.57,
    actualExpenditureCrores: null,
    status: 'Ongoing',
    physicalProgressPercent: null,
    startDate: '2024-06',
    expectedCompletionDate: null,
    financialYear: '2025-26',
    wardScope: 'Ward-Specific',
    adminWardGeoNames: ['Admin Ward 13 Hadapsar'],
    prabhagNumbers2022: [22, 23],
    locationSummary: 'Keshavnagar & Mundhwa (Hadapsar–Mundhwa Ward)',
    latitude: 18.5291334,
    longitude: 73.9444213,
    coordinateSource: 'OpenStreetMap Nominatim (Keshavnagar, Mundhwa, Pune)',
    description:
      'Dedicated ₹135.57 Cr potable water scheme featuring >8 km distribution pipelines and a new Elevated Storage Reservoir (ESR) for Keshavnagar and Mundhwa.',
    capacityOrScale: '8+ km trunk/distribution mains + ESR',
    sourceDocument: 'PMC Water Supply Department Standing Committee Approval',
    sourceUrl: 'https://www.pmc.gov.in/en/water-supply',
    sourcePageOrTable: 'Keshavnagar–Mundhwa Water Scheme (₹135.57 Cr)',
    evidenceNote:
      'Approved scheme outlay ₹135.57 Cr verified; billed expenditure and completion % remain Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Official source verified'
  },
  {
    projectId: 'proj-pmc-mundhwa-double-decker',
    projectCode: 'PMC-RD-MUNDHWA-DD',
    projectName: 'Mundhwa – Keshavnagar Double-Decker Flyover & Pedestrian Underpass',
    officialName: 'Two-Tier Vehicular & Metro Flyover (1,080 m) at Mahatma Phule Chowk, Mundhwa',
    department: 'Roads and Traffic Department',
    category: 'Roads and Transportation',
    wardId: 'admin-ward-13',
    estimatedCostCrores: 131.37,
    approvedFundingCrores: 131.37,
    actualExpenditureCrores: null,
    status: 'Upcoming',
    physicalProgressPercent: null,
    startDate: '2025-04',
    expectedCompletionDate: null,
    financialYear: '2025-26',
    wardScope: 'Ward-Specific',
    adminWardGeoNames: ['Admin Ward 13 Hadapsar'],
    prabhagNumbers2022: [22, 23],
    locationSummary: 'Mahatma Phule Chowk (Mundhwa Junction) – Keshavnagar – Kharadi Bypass',
    latitude: null,
    longitude: null,
    coordinateSource: null,
    description:
      'Standing Committee cleared 1,080m double-decker flyover (₹126 Cr) integrated with ₹5.37 Cr pedestrian underpass connecting Hadapsar, Mundhwa, Keshavnagar, and Kharadi.',
    capacityOrScale: '1,080 m double-decker flyover + subway',
    sourceDocument: 'PMC Standing Committee Approval (₹126 Cr Flyover + ₹5.37 Cr Underpass)',
    sourceUrl: 'https://www.pmc.gov.in/en/road-department',
    sourcePageOrTable: 'Mahatma Phule Chowk Double-Decker Package (₹131.37 Cr)',
    evidenceNote:
      'Standing Committee clearance ₹126 Cr + ₹5.37 Cr subway; site mobilization & actual spend are Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Government document available'
  },
  {
    projectId: 'proj-pmc-gadital-flyover',
    projectCode: 'PMC-RD-GADITAL',
    projectName: 'Hadapsar Gadital Flyover Structural Rehabilitation (Solapur Road)',
    officialName: 'Emergency Structural Repair & Strengthening of Gadital Flyover on Pune–Solapur Highway',
    department: 'Roads and Traffic Department',
    category: 'Roads and Transportation',
    wardId: 'admin-ward-13',
    estimatedCostCrores: 5.86,
    approvedFundingCrores: 5.86,
    actualExpenditureCrores: null,
    status: 'Ongoing',
    physicalProgressPercent: null,
    startDate: '2024-09',
    expectedCompletionDate: null,
    financialYear: '2025-26',
    wardScope: 'Ward-Specific',
    adminWardGeoNames: ['Admin Ward 13 Hadapsar'],
    prabhagNumbers2022: [24, 44],
    locationSummary: 'Hadapsar Gadital Junction, Pune–Solapur Road',
    latitude: 18.5269670,
    longitude: 73.9278252,
    coordinateSource: 'OpenStreetMap Nominatim (Hadapsar, Pune)',
    description:
      'Immediate structural strengthening and bearing/expansion-joint repairs on the aging Gadital flyover prior to long-term Pune–Solapur elevated corridor integration.',
    sourceDocument: 'PMC Road Department Structural Repair Tender',
    sourceUrl: 'https://www.pmc.gov.in/en/road-department',
    sourcePageOrTable: 'Hadapsar Gadital Repair Tender (₹5.86 Cr)',
    evidenceNote:
      '₹5.86 Cr repair tender documented; actual contractor billing is Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Secondary source'
  },
  {
    projectId: 'proj-pmc-katraj-kondhwa-road',
    projectCode: 'PMC-RD-KATRAJ-KONDHWA',
    projectName: 'Katraj – Kondhwa 50m Road Widening & Land Acquisition Corridor (3.5 km)',
    officialName: 'Widening of Katraj Chowk – Khadi Machine Chowk – Kondhwa Road to 50 Metres',
    department: 'Roads and Traffic Department',
    category: 'Roads and Transportation',
    wardId: null,
    estimatedCostCrores: 300.00,
    approvedFundingCrores: 140.00,
    actualExpenditureCrores: null,
    status: 'Ongoing',
    physicalProgressPercent: null,
    startDate: '2018-10',
    expectedCompletionDate: '2026-06',
    financialYear: '2025-26',
    wardScope: 'Multi-Ward Corridor',
    adminWardGeoNames: ['Admin Ward 14 Dhankawadi', 'Admin Ward 15 Kondhwa Wanavdi'],
    prabhagNumbers2022: [46, 47, 57, 58],
    locationSummary: 'Katraj Chowk / Rajas Society via Dhankawadi to Khadi Machine Chowk, Kondhwa',
    latitude: 18.4779905,
    longitude: 73.8940627,
    coordinateSource: 'OpenStreetMap Nominatim (Kondhwa Road Corridor, Pune)',
    description:
      '3.5 km southern arterial widening (revised from 84m to 50m to accelerate acquisition) backed by ₹140 Cr Maharashtra state land-acquisition grant and cumulative ₹300+ Cr PMC/collector compensation & utility shifting.',
    capacityOrScale: '3.5 km × 50m wide southern corridor',
    sourceDocument: 'PMC Road Department Review & State Land Acquisition Grant',
    sourceUrl: 'https://www.pmc.gov.in/en/road-department',
    sourcePageOrTable: 'State Land Grant ₹140 Cr · Cumulative Corridor Package ₹300+ Cr',
    evidenceNote:
      'State ₹140 Cr land grant & revised ₹300 Cr package verified; cumulative TDR/cash payout split across Dhankawadi and Kondhwa wards is Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Official source verified'
  },
  {
    projectId: 'proj-pmc-swargate-katraj-metro',
    projectCode: 'PMC-TR-SWARGATE-KATRAJ',
    projectName: 'Swargate – Katraj Underground Metro Extension (PMC Municipal Contribution)',
    officialName: 'Pune Metro Line-1 Southern Underground Extension (Swargate – Padmavati – Balajinagar – Katraj)',
    department: 'Roads and Traffic Department',
    category: 'Roads and Transportation',
    wardId: null,
    estimatedCostCrores: 733.00,
    approvedFundingCrores: 733.00,
    actualExpenditureCrores: null,
    status: 'Ongoing',
    physicalProgressPercent: null,
    startDate: '2024-08',
    expectedCompletionDate: '2029-03',
    financialYear: '2025-26',
    wardScope: 'Multi-Ward Corridor',
    adminWardGeoNames: [
      'Admin Ward 10 Sahakarnagar',
      'Admin Ward 11 Bibwewadi',
      'Admin Ward 14 Dhankawadi'
    ],
    prabhagNumbers2022: [38, 39, 49, 55, 56],
    locationSummary: 'Satara Road Underground Corridor: Swargate – Padmavati – Balajinagar – Katraj Chowk',
    latitude: 18.4536792,
    longitude: 73.8563196,
    coordinateSource: 'OpenStreetMap Nominatim (Katraj Chowk, Satara Road)',
    description:
      '5.46 km underground extension of Pune Metro Purple Line along Satara Road; PMC Standing Committee approved ₹733 Cr municipal equity/land contribution alongside state/central funding.',
    capacityOrScale: '5.46 km underground corridor (5 stations incl. Balajinagar & Bibwewadi)',
    sourceDocument: 'PMC Standing Committee Metro Contribution Resolution',
    sourceUrl: 'https://www.pmc.gov.in/',
    sourcePageOrTable: 'PMC Municipal Share Approval (₹733.00 Cr)',
    evidenceNote:
      '₹733.00 Cr represents PMC’s approved civic share toward the corridor; tranche-wise release & ward-wise split are Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Government document available'
  },
  {
    projectId: 'proj-pmc-vishrantwadi-flyover',
    projectCode: 'PMC-RD-VISHRANTWADI',
    projectName: 'Vishrantwadi Junction Flyover & Grade Separator (Mukundrao Ambedkar Chowk)',
    officialName: 'Integrated Flyover & Grade Separator at Vishrantwadi Chowk (Alandi–Lohegaon–Airport Axis)',
    department: 'Roads and Traffic Department',
    category: 'Roads and Transportation',
    wardId: 'admin-ward-06',
    estimatedCostCrores: 109.00,
    approvedFundingCrores: 109.00,
    actualExpenditureCrores: null,
    status: 'Ongoing',
    physicalProgressPercent: null,
    startDate: '2024-02',
    expectedCompletionDate: '2026-06',
    financialYear: '2025-26',
    wardScope: 'Ward-Specific',
    adminWardGeoNames: ['Admin Ward 06 Yerawda - Sangamwadi'],
    prabhagNumbers2022: [1, 2],
    locationSummary: 'Mukundrao Ambedkar Chowk, Vishrantwadi (Alandi Road – Airport Link)',
    latitude: 18.5726300,
    longitude: 73.8782500,
    coordinateSource: 'OpenStreetMap Nominatim (Vishrantwadi, Pune)',
    description:
      'Combined flyover and grade separator exceeding ₹109 Cr at Vishrantwadi Chowk eliminating four-way gridlock along Alandi Road, Lohegaon Airport Road, and Yerawada.',
    sourceDocument: 'PMC Road Department Official Tender & Project Tracker',
    sourceUrl: 'https://www.pmc.gov.in/en/road-department',
    sourcePageOrTable: 'Vishrantwadi Flyover & Grade Separator (₹109.00 Cr)',
    evidenceNote:
      'Sanctioned tender figure ₹109.00 Cr verified; contractor running bill expenditure is Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Official source verified'
  },
  {
    projectId: 'proj-pmc-shastrinagar-flyover',
    projectCode: 'PMC-RD-SHASTRINAGAR',
    projectName: 'Shastrinagar Chowk Flyover & Grade Separator (Yerawada – Nagar Road)',
    officialName: 'Construction of Flyover & Grade Separator at Shastrinagar Chowk on Pune–Ahmednagar Road',
    department: 'Roads and Traffic Department',
    category: 'Roads and Transportation',
    wardId: null,
    estimatedCostCrores: 80.10,
    approvedFundingCrores: 80.10,
    actualExpenditureCrores: null,
    status: 'Ongoing',
    physicalProgressPercent: null,
    startDate: '2024-01',
    expectedCompletionDate: null,
    financialYear: '2025-26',
    wardScope: 'Multi-Ward Corridor',
    adminWardGeoNames: ['Admin Ward 06 Yerawda - Sangamwadi', 'Admin Ward 07 Nagar Road'],
    prabhagNumbers2022: [3, 8],
    locationSummary: 'Shastrinagar Chowk, Pune–Ahmednagar Highway (Yerawada – Kalyani Nagar)',
    latitude: 18.5558875,
    longitude: 73.8919566,
    coordinateSource: 'OpenStreetMap Nominatim (Shastrinagar, Yerawada, Pune)',
    description:
      '₹80.10 Cr (excl. GST) grade separator and flyover removing signal bottlenecks for Airport, Viman Nagar, and Kharadi commuters along Nagar Road.',
    sourceDocument: 'PMC Road Department & Project Portal',
    sourceUrl: 'https://www.pmc.gov.in/en/road-department',
    sourcePageOrTable: 'Shastrinagar Junction Grade Separator (₹80.10 Cr excl. GST)',
    evidenceNote:
      'Sanctioned ₹80.10 Cr tender value documented on PMC portal; actual expenditure booked is Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Official source verified'
  },
  {
    projectId: 'proj-pmc-kharadi-dp-roads',
    projectCode: 'PMC-PW-KHARADI-DP',
    projectName: 'Kharadi 36m & 30m Development Plan Road Land Acquisition Package',
    officialName: 'Acquisition & Development of 36m/30m DP Roads Linking Kharadi to Mahalakshmi Lawns & Ambedkar Chowk',
    department: 'Public Works & Land Acquisition',
    category: 'Roads and Transportation',
    wardId: 'admin-ward-07',
    estimatedCostCrores: 90.50,
    approvedFundingCrores: 90.50,
    actualExpenditureCrores: null,
    status: 'Ongoing',
    physicalProgressPercent: null,
    startDate: '2024-06',
    expectedCompletionDate: null,
    financialYear: '2025-26',
    wardScope: 'Ward-Specific',
    adminWardGeoNames: ['Admin Ward 07 Nagar Road'],
    prabhagNumbers2022: [4, 5],
    locationSummary: 'Kharadi Bypass – Mahalakshmi Lawns – Ambedkar Chowk (Nagar Road Ward)',
    latitude: null,
    longitude: null,
    coordinateSource: null,
    description:
      '₹90.50 Cr land acquisition package opening critical 36-metre and 30-metre Development Plan road corridors across Kharadi.',
    sourceDocument: 'PMC Standing Committee Land Acquisition Approvals',
    sourceUrl: 'https://www.pmc.gov.in/',
    sourcePageOrTable: 'Kharadi DP Road Acquisition Package (₹90.50 Cr)',
    evidenceNote:
      '₹90.50 Cr sanctioned acquisition package reported; parcel-wise final payout is Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Secondary source'
  },
  // =========================================================================
  // CITY-WIDE / UNMAPPED PMC PROJECTS (Ward-level disaggregation unavailable)
  // =========================================================================
  {
    projectId: 'proj-pmc-24x7-water',
    projectCode: 'PMC-WS-24X7',
    projectName: 'Pune 24x7 Equal Water Supply Scheme (City-Wide)',
    officialName: 'Equitable 24x7 Water Supply, DMA Metering & Storage Augmentation Project',
    department: 'Water Supply Department',
    category: 'Water Supply',
    wardId: null,
    estimatedCostCrores: 2818.00,
    approvedFundingCrores: 2055.00,
    actualExpenditureCrores: null,
    status: 'Ongoing',
    physicalProgressPercent: null,
    startDate: '2018-10',
    expectedCompletionDate: null,
    financialYear: '2025-26',
    wardScope: 'City-Wide',
    adminWardGeoNames: [],
    prabhagNumbers2022: [],
    locationSummary: 'City-wide across Parvati, Warje, Vadgaon, Lashkar & Bhama Askhed distribution zones',
    latitude: null,
    longitude: null,
    coordinateSource: null,
    description:
      'Turnkey water distribution overhaul covering pipeline replacement, District Metered Areas (DMAs), elevated storage reservoirs, SCADA telemetry, and AMR smart water metering.',
    capacityOrScale: 'Re-tendered at ₹2,055 Cr (co-funded via ₹200 Cr BSE Municipal Bond)',
    sourceDocument: 'PMC 24x7 Water Supply Project Portal & BSE Bond Disclosures',
    sourceUrl: 'https://www.pmc.gov.in/en/water-supply',
    sourcePageOrTable: 'Package Execution Summary & Re-tendered Estimate',
    evidenceNote:
      'Spans all PMC wards without published ward-by-ward cost splits; listed in City-Wide Unmapped Projects to avoid artificial ward attribution.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Official source verified'
  },
  {
    projectId: 'proj-pmc-jica-master',
    projectCode: 'PMC-JICA-MM',
    projectName: 'Mula-Mutha River Pollution Abatement Master Program (11 STPs · JICA)',
    officialName: 'Pollution Abatement of River Mula-Mutha at Pune under NRCP (JICA Assisted)',
    department: 'Drainage and Sewerage Department',
    category: 'Drainage and Sewage',
    wardId: null,
    estimatedCostCrores: 990.26,
    approvedFundingCrores: 990.26,
    actualExpenditureCrores: null,
    status: 'Ongoing',
    physicalProgressPercent: 65,
    startDate: '2022-03',
    expectedCompletionDate: '2026-03',
    financialYear: '2025-26',
    wardScope: 'City-Wide',
    adminWardGeoNames: [],
    prabhagNumbers2022: [],
    locationSummary: '11 STP sites + 53.5+ km trunk sewer lines across Mula-Mutha basin',
    latitude: null,
    longitude: null,
    coordinateSource: null,
    description:
      'Consolidated JICA & Government of India NRCP program adding 396 MLD aggregate sewage treatment capacity across 11 STPs (Enviro Control & Toshiba Water Solutions JV).',
    capacityOrScale: '396 MLD aggregate new capacity (85% GoI/JICA + 15% PMC)',
    sourceDocument: 'PMC JICA Mula-Mutha Pollution Abatement Disclosures & PIB / JICA Briefs',
    sourceUrl: 'https://www.pmc.gov.in/',
    sourcePageOrTable: 'Sanctioned Financial Split (85:15 GoI/PMC) · ~65% Aggregate Progress',
    evidenceNote:
      'Consolidated sanctioned outlay ₹990.26 Cr covers all 11 STPs and interceptor sewers; individual plant site markers appear in their respective wards.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Government document available'
  },
  {
    projectId: 'proj-pmc-urban-mobility-2627',
    projectCode: 'PMC-RD-MOBILITY-27',
    projectName: 'FY 2026-27 Urban Mobility, Missing Links & 65 km New Roads Outlay',
    officialName: 'PMC FY 2026-27 Approved Budget Outlay for 65 km New Road Corridors & Missing Links',
    department: 'Roads and Traffic Department',
    category: 'Roads and Transportation',
    wardId: null,
    estimatedCostCrores: 1800.00,
    approvedFundingCrores: 1800.00,
    actualExpenditureCrores: null,
    status: 'Upcoming',
    physicalProgressPercent: null,
    startDate: '2026-04',
    expectedCompletionDate: null,
    financialYear: '2026-27',
    wardScope: 'City-Wide',
    adminWardGeoNames: [],
    prabhagNumbers2022: [],
    locationSummary: 'City-wide PMC road corridors & 34 merged villages (ward-wise schedule pending)',
    latitude: null,
    longitude: null,
    coordinateSource: null,
    description:
      'Headline FY 2026-27 PMC budget provision earmarked for missing arterial road links, corridor widening, and roads across merged villages.',
    capacityOrScale: '65 km planned road corridors',
    sourceDocument: 'PMC Annual Budget Statement FY 2026-27',
    sourceUrl: 'https://www.pmc.gov.in/en/budget-overview',
    sourcePageOrTable: 'FY 2026-27 Approved Urban Mobility Provision',
    evidenceNote:
      'City-wide budget allocation; ward-level work order breakup and expenditure are Data unavailable until tabulated.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Official source verified'
  },
  {
    projectId: 'proj-pmc-health-2627',
    projectCode: 'PMC-HLTH-2627',
    projectName: 'FY 2026-27 Health Services, Civic Hospitals & Disease Control Outlay',
    officialName: 'PMC Public Health Department Annual Provision FY 2026-27',
    department: 'Public Health Department',
    category: 'Healthcare',
    wardId: null,
    estimatedCostCrores: 881.74,
    approvedFundingCrores: 881.74,
    actualExpenditureCrores: null,
    status: 'Upcoming',
    physicalProgressPercent: null,
    startDate: '2026-04',
    expectedCompletionDate: null,
    financialYear: '2026-27',
    wardScope: 'City-Wide',
    adminWardGeoNames: [],
    prabhagNumbers2022: [],
    locationSummary: 'PMC civic hospitals, Arogyavardhini clinics & maternity homes city-wide',
    latitude: null,
    longitude: null,
    coordinateSource: null,
    description:
      'FY 2026-27 Public Health budget allocation supporting hospital equipment upgrades, preventive healthcare, and urban clinics.',
    sourceDocument: 'PMC Budget Statement FY 2026-27 Highlights',
    sourceUrl: 'https://www.pmc.gov.in/en/budget-overview',
    sourcePageOrTable: 'FY 2026-27 Health Services Allocation (₹881.74 Cr)',
    evidenceNote:
      'City-wide departmental budget head; clinic-by-clinic disbursement breakdown is Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Secondary source'
  },
  {
    projectId: 'proj-pmc-model-footpaths',
    projectCode: 'PMC-RD-FOOTPATH-27',
    projectName: 'Encroachment-Free Model Footpaths Initiative (FY 2026-27)',
    officialName: 'Pedestrian-Priority Model Footpaths Across Arterial & Commercial Corridors',
    department: 'Roads and Traffic Department',
    category: 'Roads and Transportation',
    wardId: null,
    estimatedCostCrores: 85.00,
    approvedFundingCrores: 85.00,
    actualExpenditureCrores: null,
    status: 'Upcoming',
    physicalProgressPercent: null,
    startDate: '2026-04',
    expectedCompletionDate: null,
    financialYear: '2026-27',
    wardScope: 'City-Wide',
    adminWardGeoNames: [],
    prabhagNumbers2022: [],
    locationSummary: 'Major arterial & Pune Metro feeder corridors (ward-wise allocation unpublished)',
    latitude: null,
    longitude: null,
    coordinateSource: null,
    description:
      'Dedicated pedestrian infrastructure provision for obstruction-free footpaths along commercial streets and Metro stations.',
    sourceDocument: 'PMC Annual Budget Statement FY 2026-27',
    sourceUrl: 'https://www.pmc.gov.in/en/budget-overview',
    sourcePageOrTable: 'Model Footpath Capital Provision (₹85 Cr)',
    evidenceNote:
      'Ward-by-ward street breakdown is Data unavailable in consolidated budget statements.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Official source verified'
  },
  {
    projectId: 'proj-pmc-model-schools',
    projectCode: 'PMC-EDU-MODEL',
    projectName: 'PMC Civic Model School Infrastructure Upgrade Project',
    officialName: 'Campus Modernization, Science/Computer Labs & Sanitation Upgrade across Municipal Schools',
    department: 'Education Department',
    category: 'Education',
    wardId: null,
    estimatedCostCrores: 34.64,
    approvedFundingCrores: 34.64,
    actualExpenditureCrores: null,
    status: 'Upcoming',
    physicalProgressPercent: null,
    startDate: null,
    expectedCompletionDate: null,
    financialYear: '2024-25',
    wardScope: 'City-Wide',
    adminWardGeoNames: [],
    prabhagNumbers2022: [],
    locationSummary: 'Selected PMC Municipal Primary & Secondary Schools across Pune',
    latitude: null,
    longitude: null,
    coordinateSource: null,
    description:
      'Upgrading municipal schools with smart classrooms, science & computer labs, sanitation blocks, and playgrounds.',
    sourceDocument: 'PMC Education Board & Standing Committee Resolution',
    sourceUrl: 'https://www.pmc.gov.in/',
    sourcePageOrTable: 'Model School Development Works (₹34.64 Cr)',
    evidenceNote:
      'School-by-school ward financial breakup and physical completion % are Data unavailable in open records.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Official source verified'
  },
  {
    projectId: 'proj-pmc-swm-capex',
    projectCode: 'PMC-SWM-202425',
    projectName: 'Solid Waste Management Processing & Collection Capital Outlay',
    officialName: 'PMC Solid Waste Management Capital Provision (Processing Plants & Segregated Collection)',
    department: 'Solid Waste Management Department',
    category: 'Waste Management',
    wardId: null,
    estimatedCostCrores: 105.40,
    approvedFundingCrores: 105.40,
    actualExpenditureCrores: null,
    status: 'Ongoing',
    physicalProgressPercent: null,
    startDate: '2024-04',
    expectedCompletionDate: null,
    financialYear: '2024-25',
    wardScope: 'City-Wide',
    adminWardGeoNames: [],
    prabhagNumbers2022: [],
    locationSummary: 'City-wide SWM processing & transfer facilities (~2,400 TPD municipal waste)',
    latitude: null,
    longitude: null,
    coordinateSource: null,
    description:
      'Capital outlay for solid waste processing units, waste-to-energy support, and primary segregated waste transport.',
    sourceDocument: 'PMC Budget Book FY 2024-25 & Environment Status Report (ESR)',
    sourceUrl: 'https://www.pmc.gov.in/',
    sourcePageOrTable: 'SWM Capital Outlay (₹105.40 Cr)',
    evidenceNote:
      'Consolidated SWM capital outlay across PMC; ward-level split is Data unavailable.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Official source verified'
  },
  {
    projectId: 'proj-pmc-merged-villages',
    projectCode: 'PMC-INFRA-MERGED25',
    projectName: 'Newly Merged Villages Civic Infrastructure Allocation',
    officialName: 'Dedicated Allocation for Roads, Water & Civic Works in 23/11 Merged Villages',
    department: 'Urban Development (Merged Villages)',
    category: 'Public Infrastructure',
    wardId: null,
    estimatedCostCrores: 623.00,
    approvedFundingCrores: 623.00,
    actualExpenditureCrores: null,
    status: 'Ongoing',
    physicalProgressPercent: null,
    startDate: '2025-04',
    expectedCompletionDate: null,
    financialYear: '2025-26',
    wardScope: 'City-Wide',
    adminWardGeoNames: [],
    prabhagNumbers2022: [],
    locationSummary: 'Merged fringe villages within PMC boundaries (Wagholi, Sus-Mahalunge, Dhayari, Undri, Manjari, Fursungi)',
    latitude: null,
    longitude: null,
    coordinateSource: null,
    description:
      'Dedicated municipal budget head providing basic water, internal road, and drainage infrastructure in villages incorporated into PMC limits.',
    sourceDocument: 'PMC Commissioner Budget Statement FY 2025-26',
    sourceUrl: 'https://www.pmc.gov.in/en/budget-overview',
    sourcePageOrTable: 'Merged Villages Development Head (₹623 Cr)',
    evidenceNote:
      'Village-by-village audited disbursement schedule is Data unavailable in consolidated statements.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Official source verified'
  },
  {
    projectId: 'proj-pmc-land-acquisition',
    projectCode: 'PMC-PW-LAND27',
    projectName: 'Road Links & DP Reservation Land Acquisition (FY 2026-27)',
    officialName: 'Cash & TDR Land Acquisition Capital Provision for DP Road Missing Links',
    department: 'Public Works & Land Acquisition',
    category: 'Public Infrastructure',
    wardId: null,
    estimatedCostCrores: 400.00,
    approvedFundingCrores: 400.00,
    actualExpenditureCrores: null,
    status: 'Upcoming',
    physicalProgressPercent: null,
    startDate: '2026-04',
    expectedCompletionDate: null,
    financialYear: '2026-27',
    wardScope: 'City-Wide',
    adminWardGeoNames: [],
    prabhagNumbers2022: [],
    locationSummary: 'City-wide DP road bottleneck reservations across PMC wards',
    latitude: null,
    longitude: null,
    coordinateSource: null,
    description:
      'Doubled FY 2026-27 cash & TDR land acquisition provision to clear Development Plan (DP) road bottlenecks.',
    sourceDocument: 'PMC Annual Budget Statement FY 2026-27',
    sourceUrl: 'https://www.pmc.gov.in/en/budget-overview',
    sourcePageOrTable: 'Land Acquisition Capital Provision (₹400 Cr)',
    evidenceNote:
      'Parcel-level acquisition expenditure is Data unavailable until compensation awards close.',
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus: 'Official source verified'
  }
];

/**
 * Structured PMC_DEPARTMENT_BUDGETS records seeded into SQLite.
 * Strictly separates Budget Estimate (BE), Revised Estimate (RE), and Actual Expenditure.
 */
export const PMC_INITIAL_DEPARTMENT_BUDGETS: PmcDepartmentBudgetRecord[] = [
  {
    id: 'PMC_202627_BE_039',
    departmentId: 'dept-consolidated-fund',
    departmentName: 'Consolidated Municipal Fund',
    budgetHead: 'Standing Committee Final Approved Budget Outlay (516+ sq.km)',
    financialYear: '2026-27',
    budgetEstimateCrores: 15669.00,
    revisedEstimateCrores: null,
    actualExpenditureCrores: null,
    sourceUrl: 'https://www.pmc.gov.in/en/budget-overview',
    documentTitle: 'PMC Standing Committee Final Approved Budget FY 2026-27',
    verificationStatus: 'Official source verified',
    notes: 'Standing Committee final outlay (Commissioner draft ₹13,995 Cr excluded to avoid double counting).',
    lastUpdated: INITIAL_REPORTING_DATE
  },
  {
    id: 'PMC_202627_DEP_040',
    departmentId: 'dept-roads-traffic',
    departmentName: 'Roads and Traffic Department',
    budgetHead: 'Urban Mobility, Missing Links & 65 km New Roads Provision',
    financialYear: '2026-27',
    budgetEstimateCrores: 1800.00,
    revisedEstimateCrores: null,
    actualExpenditureCrores: null,
    sourceUrl: 'https://www.pmc.gov.in/en/budget-overview',
    documentTitle: 'PMC Annual Budget Statement FY 2026-27',
    verificationStatus: 'Official source verified',
    notes: 'Primary FY 2026-27 road and mobility capital outlay.',
    lastUpdated: INITIAL_REPORTING_DATE
  },
  {
    id: 'PMC_202627_DEP_041',
    departmentId: 'dept-roads-traffic',
    departmentName: 'Roads and Traffic Department',
    budgetHead: 'Encroachment-Free Model Footpaths Initiative',
    financialYear: '2026-27',
    budgetEstimateCrores: 85.00,
    revisedEstimateCrores: null,
    actualExpenditureCrores: null,
    sourceUrl: 'https://www.pmc.gov.in/en/budget-overview',
    documentTitle: 'PMC Annual Budget Statement FY 2026-27',
    verificationStatus: 'Official source verified',
    notes: 'Dedicated footpath capital allocation for FY 2026-27.',
    lastUpdated: INITIAL_REPORTING_DATE
  },
  {
    id: 'PMC_202627_DEP_042',
    departmentId: 'dept-public-works',
    departmentName: 'Public Works & Land Acquisition',
    budgetHead: 'Road Links & DP Reservations Land Acquisition Provision',
    financialYear: '2026-27',
    budgetEstimateCrores: 400.00,
    revisedEstimateCrores: null,
    actualExpenditureCrores: null,
    sourceUrl: 'https://www.pmc.gov.in/en/budget-overview',
    documentTitle: 'PMC Annual Budget Statement FY 2026-27',
    verificationStatus: 'Official source verified',
    notes: 'Cash & TDR land acquisition allocation doubled from FY 2025-26 ₹200 Cr.',
    lastUpdated: INITIAL_REPORTING_DATE
  },
  {
    id: 'PMC_202627_DEP_HLTH',
    departmentId: 'dept-public-health',
    departmentName: 'Public Health Department',
    budgetHead: 'Health Services, Civic Hospital Upgrades & Disease Control',
    financialYear: '2026-27',
    budgetEstimateCrores: 881.74,
    revisedEstimateCrores: null,
    actualExpenditureCrores: null,
    sourceUrl: 'https://www.pmc.gov.in/en/budget-overview',
    documentTitle: 'PMC Budget Statement FY 2026-27 Health Provision',
    verificationStatus: 'Secondary source',
    notes: 'Covers municipal hospitals and urban health clinics.',
    lastUpdated: INITIAL_REPORTING_DATE
  },
  {
    id: 'PMC_202526_BE_001',
    departmentId: 'dept-consolidated-fund',
    departmentName: 'Consolidated Municipal Fund',
    budgetHead: 'Total Annual Municipal Outlay (Revenue + Capital)',
    financialYear: '2025-26',
    budgetEstimateCrores: 12618.09,
    revisedEstimateCrores: 12150.00,
    actualExpenditureCrores: null,
    sourceUrl: 'https://www.pmc.gov.in/en/budget-overview',
    documentTitle: 'PMC Commissioner Budget Statement FY 2025-26',
    verificationStatus: 'Official source verified',
    notes: '₹7,093 Cr Revenue + ₹5,524 Cr Capital; RE ₹12,150 Cr.',
    lastUpdated: INITIAL_REPORTING_DATE
  },
  {
    id: 'PMC_202526_DEP_014',
    departmentId: 'dept-water-supply',
    departmentName: 'Water Supply Department',
    budgetHead: '24x7 Water Supply, WTPs & Network Distribution',
    financialYear: '2025-26',
    budgetEstimateCrores: 1665.00,
    revisedEstimateCrores: 1580.00,
    actualExpenditureCrores: null,
    sourceUrl: 'https://www.pmc.gov.in/en/budget-overview',
    documentTitle: 'PMC Commissioner Budget Statement FY 2025-26',
    verificationStatus: 'Official source verified',
    notes: 'Covers 24x7 water supply, WTP operations, and merged villages distribution.',
    lastUpdated: INITIAL_REPORTING_DATE
  },
  {
    id: 'PMC_202526_DEP_015',
    departmentId: 'dept-town-planning',
    departmentName: 'Town Planning & Central Schemes',
    budgetHead: 'Urban Planning, AMRUT & PMAY Commitments',
    financialYear: '2025-26',
    budgetEstimateCrores: 1630.00,
    revisedEstimateCrores: 1550.00,
    actualExpenditureCrores: null,
    sourceUrl: 'https://www.pmc.gov.in/en/budget-overview',
    documentTitle: 'PMC Commissioner Budget Statement FY 2025-26',
    verificationStatus: 'Official source verified',
    notes: 'Urban planning frameworks and central scheme commitments.',
    lastUpdated: INITIAL_REPORTING_DATE
  },
  {
    id: 'PMC_202526_DEP_016',
    departmentId: 'dept-merged-villages',
    departmentName: 'Urban Development (Merged Villages)',
    budgetHead: 'Civic Infrastructure in Newly Merged Villages',
    financialYear: '2025-26',
    budgetEstimateCrores: 623.00,
    revisedEstimateCrores: 595.00,
    actualExpenditureCrores: null,
    sourceUrl: 'https://www.pmc.gov.in/en/budget-overview',
    documentTitle: 'PMC Commissioner Budget Statement FY 2025-26',
    verificationStatus: 'Official source verified',
    notes: 'Dedicated capital and basic services provision for newly merged villages.',
    lastUpdated: INITIAL_REPORTING_DATE
  },
  {
    id: 'PMC_202526_DEP_018',
    departmentId: 'dept-transport-pmpml',
    departmentName: 'Transport (PMC Share to PMPML)',
    budgetHead: 'PMC Share of PMPML Operational Deficit (VGF) & Concessions',
    financialYear: '2025-26',
    budgetEstimateCrores: 508.07,
    revisedEstimateCrores: 495.00,
    actualExpenditureCrores: null,
    sourceUrl: 'https://www.pmc.gov.in/en/budget-overview',
    documentTitle: 'PMC Budget Provision for PMPML FY 2025-26',
    verificationStatus: 'Official source verified',
    notes: 'Strictly PMC share only (₹484.96 Cr VGF + ₹23.11 Cr concessions); PCMC excluded.',
    lastUpdated: INITIAL_REPORTING_DATE
  },
  {
    id: 'PMC_202526_DEP_017',
    departmentId: 'dept-public-works',
    departmentName: 'Public Works & Land Acquisition',
    budgetHead: 'Direct Land Acquisition Cash Outlay (Road Links & Amenities)',
    financialYear: '2025-26',
    budgetEstimateCrores: 200.00,
    revisedEstimateCrores: 190.00,
    actualExpenditureCrores: null,
    sourceUrl: 'https://www.pmc.gov.in/en/budget-overview',
    documentTitle: 'PMC Commissioner Budget Statement FY 2025-26',
    verificationStatus: 'Official source verified',
    notes: 'Direct cash acquisition for road bottleneck clearance.',
    lastUpdated: INITIAL_REPORTING_DATE
  },
  {
    id: 'PMC_202425_BE_002',
    departmentId: 'dept-consolidated-fund',
    departmentName: 'Consolidated Municipal Fund',
    budgetHead: 'Total Approved Municipal Budget Outlay',
    financialYear: '2024-25',
    budgetEstimateCrores: 11601.00,
    revisedEstimateCrores: 11150.00,
    actualExpenditureCrores: null,
    sourceUrl: 'https://data.opencity.in/dataset/pmc-budgets',
    documentTitle: 'PMC Budget Book FY 2024-25',
    verificationStatus: 'Government document available',
    notes: 'First PMC budget to cross ₹10,000 Cr; full-year audited actuals pending.',
    lastUpdated: INITIAL_REPORTING_DATE
  },
  {
    id: 'PMC_202425_DEP_037',
    departmentId: 'dept-public-health',
    departmentName: 'Public Health Department',
    budgetHead: 'Municipal Hospitals & 96 Arogyavardhini Clinics Provision',
    financialYear: '2024-25',
    budgetEstimateCrores: 516.05,
    revisedEstimateCrores: 498.50,
    actualExpenditureCrores: null,
    sourceUrl: 'https://data.opencity.in/dataset/pmc-budgets',
    documentTitle: 'PMC Budget FY 2024-25 — Health Allocation',
    verificationStatus: 'Government document available',
    notes: 'Verified FY 2024-25 health sector provision.',
    lastUpdated: INITIAL_REPORTING_DATE
  },
  {
    id: 'PMC_202425_DEP_038',
    departmentId: 'dept-swm',
    departmentName: 'Solid Waste Management Department',
    budgetHead: 'Waste Processing & Waste-to-Energy Capital Outlay',
    financialYear: '2024-25',
    budgetEstimateCrores: 105.40,
    revisedEstimateCrores: 98.20,
    actualExpenditureCrores: null,
    sourceUrl: 'https://data.opencity.in/dataset/pmc-budgets',
    documentTitle: 'PMC Budget FY 2024-25 — Solid Waste Capital Head',
    verificationStatus: 'Government document available',
    notes: 'Verified FY 2024-25 SWM capital provision.',
    lastUpdated: INITIAL_REPORTING_DATE
  },
  {
    id: 'PMC_202324_BE_ACT',
    departmentId: 'dept-consolidated-fund',
    departmentName: 'Consolidated Municipal Fund',
    budgetHead: 'Total Municipal Outlay — Budget vs Audited Actuals',
    financialYear: '2023-24',
    budgetEstimateCrores: 9515.00,
    revisedEstimateCrores: 9200.00,
    actualExpenditureCrores: 8125.60,
    sourceUrl: 'https://opendata.pmc.gov.in/opendata/6f5d15dd-7fd3-4b53-8a01-f85a00848952.pdf',
    documentTitle: 'PMC Annual Budget Statement & Audited Financial Statement FY 2023-24',
    verificationStatus: 'Government document available',
    notes: 'Audited Actual Expenditure ₹8,125.60 Cr (85.4% utilization vs ₹9,515.00 Cr BE).',
    lastUpdated: INITIAL_REPORTING_DATE
  },
  {
    id: 'PMC_202223_BE_REV',
    departmentId: 'dept-consolidated-fund',
    departmentName: 'Consolidated Municipal Fund',
    budgetHead: 'Standing Committee Final Outlay & Audited Expenditure',
    financialYear: '2022-23',
    budgetEstimateCrores: 9716.00,
    revisedEstimateCrores: 9150.00,
    actualExpenditureCrores: 8240.50,
    sourceUrl: 'https://opendata.pmc.gov.in/opendata/6f5d15dd-7fd3-4b53-8a01-f85a00848952.pdf',
    documentTitle: 'PMC Standing Committee Final Budget & Audited Accounts FY 2022-23',
    verificationStatus: 'Government document available',
    notes: 'Audited total expenditure ₹8,240.50 Cr (84.8% utilization vs ₹9,716.00 Cr BE).',
    lastUpdated: INITIAL_REPORTING_DATE
  }
];

const LK_SOURCES_BY_ID = new Map(LONI_KALBHOR_SOURCES.map((s) => [s.id, s]));

/**
 * Loni Kalbhor Gram Panchayat / Haveli Taluka development projects kept strictly separate
 * from PMC_MAP_PROJECTS for jurisdictional accuracy.
 */
export const LONI_KALBHOR_MAP_PROJECTS: MapMunicipalProject[] = LONI_KALBHOR_PROJECTS.map((p) => {
  const src = LK_SOURCES_BY_ID.get(p.sourceId);
  const category: MapProjectCategory =
    p.id === 'LK_PRJ_001'
      ? 'Water Supply'
      : p.id === 'LK_PRJ_002'
      ? 'Waste Management'
      : 'Roads and Transportation';

  const coords =
    p.id === 'LK_PRJ_001'
      ? {
          lat: 18.4883530,
          lng: 74.0221934,
          source: 'OpenStreetMap Nominatim (Loni Kalbhor Habitation Core, node/1645591501)'
        }
      : p.id === 'LK_PRJ_003'
      ? {
          lat: 18.4853609,
          lng: 74.0267096,
          source: 'OpenStreetMap Nominatim (Solapur Road / NH 65, Loni Kalbhor)'
        }
      : {
          lat: null,
          lng: null,
          source: null
        };

  return {
    projectId: p.id.toLowerCase(),
    projectCode: p.id,
    projectName: p.projectName,
    officialName: `${p.projectName} (${p.scheme})`,
    jurisdiction: 'Loni Kalbhor Gram Panchayat',
    department: p.implementingAgency,
    category,
    wardId: null,
    estimatedCostCrores: p.sanctionedCostCrores,
    approvedFundingCrores: p.fundsReleasedCrores,
    actualExpenditureCrores: p.actualExpenditureCrores,
    status: p.status === 'Completed' ? 'Completed' : 'Ongoing',
    physicalProgressPercent: p.physicalProgressPct,
    startDate: null,
    expectedCompletionDate: null,
    financialYear: p.reportingPeriod.replace(/^FY\s+/i, ''),
    wardScope: 'Gram Panchayat',
    adminWardGeoNames: [LONI_KALBHOR_GEO_KEY],
    prabhagNumbers2022: [],
    locationSummary: `${p.location} (Outside PMC Limits · Haveli Taluka)`,
    latitude: coords.lat,
    longitude: coords.lng,
    coordinateSource: coords.source,
    description: `${p.scheme} implemented by ${p.implementingAgency} in ${p.location}. Governed outside Pune Municipal Corporation (PMC) under Loni Kalbhor Gram Panchayat / Haveli Taluka.`,
    capacityOrScale: `${p.physicalProgressPct}% physical progress (${p.reportingPeriod})`,
    sourceDocument: src?.documentTitle || 'Loni Kalbhor Gram Panchayat / ZP Records',
    sourceUrl: src?.officialUrl || 'https://ejalshakti.gov.in/jjm/',
    sourcePageOrTable: src?.pageOrTableRef || p.scheme,
    evidenceNote: `Sanctioned ₹${p.sanctionedCostCrores.toFixed(2)} Cr · Funds Released ₹${p.fundsReleasedCrores.toFixed(2)} Cr · Actual Expenditure ₹${p.actualExpenditureCrores.toFixed(2)} Cr. Strictly separate from PMC accounts.`,
    lastUpdated: INITIAL_REPORTING_DATE,
    verificationStatus:
      src?.verificationStatus === 'Verified Official'
        ? 'Official source verified'
        : 'Government document available'
  };
});

export const LONI_KALBHOR_MAP_BUDGETS: PmcDepartmentBudgetRecord[] = LONI_KALBHOR_FINANCE_RECORDS.map(
  (f) => {
    const src = LK_SOURCES_BY_ID.get(f.sourceId);
    const isBudgetEstimate = f.status === 'Budget Estimate';
    const isReleased = f.status === 'Funds Released';
    const isAudited = f.status === 'Audited Actual';
    return {
      id: f.id,
      jurisdiction: 'Loni Kalbhor Gram Panchayat',
      departmentId: 'dept-loni-kalbhor-gp',
      departmentName: 'Loni Kalbhor Gram Panchayat (Outside PMC)',
      budgetHead: `${f.category} (${f.status})`,
      financialYear: f.financialYear,
      budgetEstimateCrores: isBudgetEstimate || isReleased ? f.amountCrores : null,
      revisedEstimateCrores: null,
      actualExpenditureCrores: isAudited ? f.amountCrores : null,
      sourceUrl: src?.officialUrl || 'https://egramswaraj.gov.in/',
      documentTitle: f.documentTitle,
      verificationStatus:
        src?.verificationStatus === 'Official but Historical'
          ? 'Government document available'
          : 'Official source verified',
      notes: `Printed value: ${f.amountAsPrinted} · Haveli Taluka / Pune Zilla Parishad Gram Panchayat ledger (excluded from PMC aggregates).`,
      lastUpdated: INITIAL_REPORTING_DATE
    };
  }
);

export const ALL_MAP_PROJECTS: MapMunicipalProject[] = [
  ...PMC_MAP_PROJECTS.map((p) => ({
    ...p,
    jurisdiction: 'Pune Municipal Corporation' as const
  })),
  ...LONI_KALBHOR_MAP_PROJECTS
];

export const ALL_INITIAL_DEPARTMENT_BUDGETS: PmcDepartmentBudgetRecord[] = [
  ...PMC_INITIAL_DEPARTMENT_BUDGETS.map((b) => ({
    ...b,
    jurisdiction: 'Pune Municipal Corporation' as const
  })),
  ...LONI_KALBHOR_MAP_BUDGETS
];

export function filterMapProjects(
  projects: MapMunicipalProject[],
  filters: MapFiltersState
): MapMunicipalProject[] {
  const projQuery = (filters.projectQuery || '').trim().toLowerCase();
  return projects.filter((p) => {
    const jur = p.jurisdiction ?? 'Pune Municipal Corporation';
    if (filters.jurisdiction === 'PMC' && jur !== 'Pune Municipal Corporation') {
      return false;
    }
    if (filters.jurisdiction === 'Loni Kalbhor' && jur !== 'Loni Kalbhor Gram Panchayat') {
      return false;
    }
    if (filters.financialYear !== 'All' && p.financialYear !== filters.financialYear) {
      return false;
    }
    if (filters.department !== 'All' && p.department !== filters.department) {
      return false;
    }
    if (filters.category !== 'All' && p.category !== filters.category) {
      return false;
    }
    if (filters.status !== 'All' && p.status !== filters.status) {
      return false;
    }
    if (projQuery) {
      const hay = `${p.projectName} ${p.officialName} ${p.projectCode} ${p.locationSummary}`.toLowerCase();
      if (!hay.includes(projQuery)) return false;
    }
    return true;
  });
}

export function getProjectsForArea(
  projects: MapMunicipalProject[],
  layerMode: BoundaryLayerMode | 'gram-panchayat',
  featureKey: string
): MapMunicipalProject[] {
  if (featureKey === LONI_KALBHOR_GEO_KEY || layerMode === 'gram-panchayat') {
    return projects.filter((p) => p.adminWardGeoNames.includes(LONI_KALBHOR_GEO_KEY));
  }
  if (layerMode === 'admin-wards') {
    return projects.filter((p) => p.adminWardGeoNames.includes(featureKey));
  }
  const prabhagNum = Number(featureKey);
  if (Number.isNaN(prabhagNum)) return [];
  return projects.filter((p) => p.prabhagNumbers2022.includes(prabhagNum));
}

export function getDominantAreaStatus(projects: MapMunicipalProject[]): MapAreaDominantStatus {
  if (projects.length === 0) return 'Unavailable';
  if (projects.some((p) => p.status === 'Delayed')) return 'Delayed';
  if (projects.some((p) => p.status === 'Ongoing')) return 'Ongoing';
  if (projects.some((p) => p.status === 'Completed')) return 'Completed';
  if (projects.some((p) => p.status === 'Upcoming')) return 'Upcoming';
  return 'Unavailable';
}

export function computeAreaStats(areaProjects: MapMunicipalProject[]): AreaProjectStats {
  const totalProjects = areaProjects.length;
  const ongoingCount = areaProjects.filter((p) => p.status === 'Ongoing').length;
  const completedCount = areaProjects.filter((p) => p.status === 'Completed').length;
  const upcomingCount = areaProjects.filter((p) => p.status === 'Upcoming').length;
  const delayedCount = areaProjects.filter((p) => p.status === 'Delayed').length;

  const wardSpecificProjects = areaProjects.filter(
    (p) => p.wardScope === 'Ward-Specific' || p.wardScope === 'Gram Panchayat'
  );
  const multiWardProjects = areaProjects.filter((p) => p.wardScope === 'Multi-Ward Corridor');

  const estValues = areaProjects
    .map((p) => p.estimatedCostCrores)
    .filter((v): v is number => v !== null);
  const appValues = areaProjects
    .map((p) => p.approvedFundingCrores)
    .filter((v): v is number => v !== null);
  const actValues = areaProjects
    .map((p) => p.actualExpenditureCrores)
    .filter((v): v is number => v !== null);

  const totalEstimatedCostCrores =
    estValues.length > 0 ? Number(estValues.reduce((a, b) => a + b, 0).toFixed(2)) : null;
  const totalApprovedFundingCrores =
    appValues.length > 0 ? Number(appValues.reduce((a, b) => a + b, 0).toFixed(2)) : null;
  const totalActualExpenditureCrores =
    actValues.length > 0 ? Number(actValues.reduce((a, b) => a + b, 0).toFixed(2)) : null;

  const comparableProjects = areaProjects.filter(
    (p) => p.approvedFundingCrores !== null && p.actualExpenditureCrores !== null
  );
  const remainingAllocationCrores =
    comparableProjects.length > 0 && comparableProjects.length === appValues.length
      ? Number(
          comparableProjects
            .reduce((sum, p) => sum + (p.approvedFundingCrores! - p.actualExpenditureCrores!), 0)
            .toFixed(2)
        )
      : null;

  const progressValues = areaProjects
    .map((p) => p.physicalProgressPercent)
    .filter((v): v is number => v !== null);
  const physicalCompletionPercent =
    progressValues.length > 0
      ? Number((progressValues.reduce((a, b) => a + b, 0) / progressValues.length).toFixed(1))
      : null;

  const hasMultiWardCostSharing = multiWardProjects.some(
    (p) => p.estimatedCostCrores !== null || p.approvedFundingCrores !== null
  );

  return {
    totalProjects,
    ongoingCount,
    completedCount,
    upcomingCount,
    delayedCount,
    wardSpecificCount: wardSpecificProjects.length,
    multiWardCount: multiWardProjects.length,
    totalEstimatedCostCrores,
    totalApprovedFundingCrores,
    totalActualExpenditureCrores,
    remainingAllocationCrores,
    hasMultiWardCostSharing,
    physicalCompletionPercent,
    dominantStatus: getDominantAreaStatus(areaProjects)
  };
}

export function getAdminWardMeta(geoFeatureName: string): PuneWardGeoMeta | undefined {
  return PMC_ADMIN_WARD_GEO_META.find((w) => w.geoFeatureName === geoFeatureName);
}

export function buildLoniKalbhorSelectedArea(): SelectedMapArea {
  return {
    layerMode: 'gram-panchayat',
    jurisdiction: 'Loni Kalbhor Gram Panchayat',
    featureKey: LONI_KALBHOR_GEO_KEY,
    title: `${LONI_KALBHOR_PROFILE.villageNameEnglish} (${LONI_KALBHOR_PROFILE.villageNameMarathi})`,
    subtitle: 'Loni Kalbhor Gram Panchayat · Haveli Taluka (Outside PMC Limits)',
    officialIdLabel: `Census Code ${LONI_KALBHOR_PROFILE.censusCode} · LGD Code ${LONI_KALBHOR_PROFILE.lgdCode}`,
    zone: 'Haveli Panchayat Samiti & Pune Zilla Parishad',
    localities: ['Bazaar Road', 'Kadamwak Wasti', 'Rajbaug', 'Railway Station', 'NH 65 Corridor'],
    isLoniKalbhor: true,
    boundaryNote:
      'Shown as a 24.6 sq.km reference jurisdiction zone centered on OpenStreetMap Loni Kalbhor node (18.4884°N, 74.0222°E); official Gram Panchayat polygon shapefile is not published in DataMeet/OSM.',
    officialBoundarySourceUrl: 'https://lgdirectory.gov.in/'
  };
}

export function buildSelectedAreaFromFeature(
  layerMode: BoundaryLayerMode | 'gram-panchayat',
  properties: Record<string, unknown>
): SelectedMapArea {
  if (layerMode === 'gram-panchayat' || properties.name === LONI_KALBHOR_GEO_KEY) {
    return buildLoniKalbhorSelectedArea();
  }

  if (layerMode === 'admin-wards') {
    const featureName = String(properties.name ?? '');
    const meta = getAdminWardMeta(featureName);
    if (meta) {
      return {
        layerMode: 'admin-wards',
        jurisdiction: 'Pune Municipal Corporation',
        featureKey: featureName,
        title: meta.displayName,
        subtitle: `PMC Administrative Ward Office · ${meta.prabhagCoverage2022}`,
        officialIdLabel: `Admin Ward ${String(meta.wardNumber).padStart(2, '0')} (${featureName})`,
        zone: meta.zone,
        localities: meta.keyLocalities,
        pmcWardOfficeId: meta.pmcWardOfficeId,
        boundaryNote: meta.boundaryNote,
        officialBoundarySourceUrl: BOUNDARY_SOURCE_METADATA['admin-wards'].sourceUrl
      };
    }
    return {
      layerMode: 'admin-wards',
      jurisdiction: 'Pune Municipal Corporation',
      featureKey: featureName,
      title: featureName || 'PMC Administrative Ward',
      subtitle: 'Pune Municipal Corporation Jurisdiction',
      officialIdLabel: featureName,
      zone: 'PMC Pune',
      localities: [],
      boundaryNote: 'DataMeet PMC Administrative Ward boundary.',
      officialBoundarySourceUrl: BOUNDARY_SOURCE_METADATA['admin-wards'].sourceUrl
    };
  }

  const wardnum = Number(properties.wardnum);
  const name2 = String(properties.Name2 ?? properties.Name1 ?? `Prabhag ${wardnum}`);
  const originUrl =
    typeof properties.origin === 'string' && properties.origin.startsWith('http')
      ? properties.origin
      : 'https://www.pmc.gov.in/en/pmc-final-prabhag-rachna-2022';

  const parentGeoName = PRABHAG_2022_TO_ADMIN_WARD[wardnum];
  const parentMeta = parentGeoName ? getAdminWardMeta(parentGeoName) : undefined;

  return {
    layerMode: 'prabhags-2022',
    jurisdiction: 'Pune Municipal Corporation',
    featureKey: String(wardnum),
    title: name2,
    subtitle: parentMeta
      ? `PMC 2022 Prabhag ${String(wardnum).padStart(2, '0')} · ${parentMeta.displayName}`
      : `PMC 2022 Prabhag ${String(wardnum).padStart(2, '0')}`,
    officialIdLabel: `Prabhag ${String(wardnum).padStart(2, '0')} (PMC Final Rachna 2022)`,
    zone: parentMeta?.zone || 'Pune Municipal Corporation',
    localities: name2
      .split(/[-–]/)
      .map((s) => s.trim())
      .filter(Boolean),
    pmcWardOfficeId: parentMeta?.pmcWardOfficeId,
    boundaryNote: `Official 2022 PMC Final Prabhag boundary traced from ${originUrl.replace('http://', 'https://')}.`,
    officialBoundarySourceUrl: 'https://www.pmc.gov.in/en/pmc-final-prabhag-rachna-2022'
  };
}
