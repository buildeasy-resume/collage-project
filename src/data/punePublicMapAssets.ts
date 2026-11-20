import { BoundaryLayerMode, MapPublicAsset } from '../types/puneMap';
import { LONI_KALBHOR_FACILITIES } from './loniKalbhor/publicFacilities';
import { LONI_KALBHOR_WATER_FACILITIES } from './loniKalbhor/waterSanitation';
import { LONI_KALBHOR_SOURCES } from './loniKalbhor/sources';

const LK_SOURCE_MAP = new Map(LONI_KALBHOR_SOURCES.map((s) => [s.id, s]));

/**
 * Verified OSM Nominatim civic assets & facilities across Pune Municipal Corporation (PMC)
 * derived directly from PMC_WATER_TREATMENT_PLANTS, PMC_PUBLIC_FACILITY_CATEGORIES,
 * PMC_CIVIC_ASSETS, and PUNE_LANDMARK_SLIDES, plus Loni Kalbhor GP public facilities.
 */
export const PMC_PUBLIC_MAP_ASSETS: MapPublicAsset[] = [
  {
    assetId: 'asset-wtp-parvati',
    name: 'Parvati Water Works (Old & New WTP)',
    category: 'Water Supply & WTP',
    jurisdiction: 'Pune Municipal Corporation',
    authority: 'Pune Municipal Corporation',
    departmentOrAgency: 'Water Supply Department',
    adminWardGeoNames: ['Admin Ward 10 Sahakarnagar'],
    prabhagNumbers2022: [38, 50],
    locationLabel: 'Parvati Paytha / Dattawadi, Pune',
    latitude: 18.4972821,
    longitude: 73.8469173,
    coordinateSource: 'OpenStreetMap Nominatim (Parvati, Dattawadi, Pune)',
    capacityOrMetric: '~500 MLD (New) + Legacy Units',
    status: 'Operational',
    details: 'Flagship Khadakwasla-fed Water Treatment Plant serving Central Pune Peths, Shivajinagar, Swargate, Bibwewadi, and Western Core.',
    sourceTitle: 'PMC Water Supply Department Directory',
    sourceUrl: 'https://www.pmc.gov.in/en/water-supply',
    verificationLabel: 'Official source verified'
  },
  {
    assetId: 'asset-wtp-wadgaon',
    name: 'Wadgaon Water Works (250 MLD WTP)',
    category: 'Water Supply & WTP',
    jurisdiction: 'Pune Municipal Corporation',
    authority: 'Pune Municipal Corporation',
    departmentOrAgency: 'Water Supply Department',
    adminWardGeoNames: ['Admin Ward 09 Tilak Road'],
    prabhagNumbers2022: [51, 52],
    locationLabel: 'Vadgaon Budruk, Sinhagad Road Corridor',
    latitude: 18.4674971,
    longitude: 73.8253650,
    coordinateSource: 'OpenStreetMap Nominatim (Vadgaon Budruk, Pune)',
    capacityOrMetric: '~250 MLD (125 Old + 125 New MLD)',
    status: 'Operational',
    details: 'Draws raw water from Khadakwasla Dam chain to supply Sinhagad Road, Dhayari, Narhe, Ambegaon, Katraj, and Southern PMC zones.',
    sourceTitle: 'PMC Water Supply Department Directory',
    sourceUrl: 'https://www.pmc.gov.in/en/water-supply',
    verificationLabel: 'Official source verified'
  },
  {
    assetId: 'asset-wtp-warje',
    name: 'Warje Water Works (~200 MLD WTP)',
    category: 'Water Supply & WTP',
    jurisdiction: 'Pune Municipal Corporation',
    authority: 'Pune Municipal Corporation',
    departmentOrAgency: 'Water Supply Department',
    adminWardGeoNames: ['Admin Ward 04 Warje Karvenagar'],
    prabhagNumbers2022: [34, 35],
    locationLabel: 'Warje, Mutha Right Bank',
    latitude: 18.4820444,
    longitude: 73.8001705,
    coordinateSource: 'OpenStreetMap Nominatim (Warje, Pune)',
    capacityOrMetric: '~200 MLD (New) + Legacy Unit',
    status: 'Operational',
    details: 'Serves Warje, Karvenagar, Kothrud, Bavdhan, Baner, and Pashan distribution zones from Khadakwasla reservoir chain.',
    sourceTitle: 'PMC Water Supply Department Directory',
    sourceUrl: 'https://www.pmc.gov.in/en/water-supply',
    verificationLabel: 'Official source verified'
  },
  {
    assetId: 'asset-wtp-bhama-askhed',
    name: 'Bhama Askhed / Kuruli 200 MLD Water Supply Scheme',
    category: 'Water Supply & WTP',
    jurisdiction: 'Pune Municipal Corporation',
    authority: 'Pune Municipal Corporation',
    departmentOrAgency: 'Water Supply Department',
    adminWardGeoNames: ['Admin Ward 07 Nagar Road', 'Admin Ward 06 Yerawda - Sangamwadi'],
    prabhagNumbers2022: [1, 3, 4, 5, 6],
    locationLabel: 'Nagar Road, Viman Nagar, Kharadi, Vadgaon Sheri & Dhanori',
    latitude: null,
    longitude: null,
    coordinateSource: null,
    capacityOrMetric: '200 MLD Design Capacity',
    status: 'Operational',
    details: 'Raw water drawn from Bhama Askhed Dam (intake lies outside PMC limits at Kuruli) feeding Eastern Pune residential & IT corridors.',
    sourceTitle: 'PMC Bhama Askhed Scheme Note',
    sourceUrl: 'https://www.pmc.gov.in/en/bhama-askhed-water-supply',
    verificationLabel: 'Official source verified'
  },
  {
    assetId: 'asset-wtp-cantonment',
    name: 'Cantonment (Lashkar) Water Works',
    category: 'Water Supply & WTP',
    jurisdiction: 'Pune Municipal Corporation',
    authority: 'Pune Municipal Corporation',
    departmentOrAgency: 'Water Supply Department',
    adminWardGeoNames: ['Admin Ward 13 Hadapsar', 'Admin Ward 15 Kondhwa Wanavdi'],
    prabhagNumbers2022: [22, 24, 41],
    locationLabel: 'Hadapsar, Wanowrie, Kondhwa & Dhole Patil Rd',
    latitude: null,
    longitude: null,
    coordinateSource: null,
    capacityOrMetric: 'Major Legacy Supply (Current split: Data unavailable)',
    status: 'Operational',
    details: 'Supplies eastern & southeastern PMC zones alongside Khadakwasla/Mula-Mutha canal distribution.',
    sourceTitle: 'PMC Water Supply Department Directory',
    sourceUrl: 'https://www.pmc.gov.in/en/water-supply',
    verificationLabel: 'Official Report Estimate'
  },
  {
    assetId: 'asset-wtp-holkar',
    name: 'Holkar & Chikhali Localized Water Supply Unit',
    category: 'Water Supply & WTP',
    jurisdiction: 'Pune Municipal Corporation',
    authority: 'Pune Municipal Corporation',
    departmentOrAgency: 'Water Supply Department',
    adminWardGeoNames: ['Admin Ward 01 Aundh', 'Admin Ward 06 Yerawda - Sangamwadi'],
    prabhagNumbers2022: [1, 11],
    locationLabel: 'Holkar Bridge / Bopodi & Kalas Northern Pockets',
    latitude: 18.5583623,
    longitude: 73.8550250,
    coordinateSource: 'OpenStreetMap Nominatim (Holkar Bridge, Khadki/Bopodi)',
    capacityOrMetric: 'Localized Northern Supply (Exact MLD: Data unavailable)',
    status: 'Operational',
    details: 'Localized pumping and treatment support for Bopodi, Kalas, and northern PMC fringe pockets.',
    sourceTitle: 'PMC Water Supply Department Directory',
    sourceUrl: 'https://www.pmc.gov.in/en/water-supply',
    verificationLabel: 'Data unavailable'
  },
  {
    assetId: 'asset-hlth-kamla-nehru',
    name: 'Kamla Nehru General Hospital (PMC Health Flagship)',
    category: 'Healthcare & Clinics',
    jurisdiction: 'Pune Municipal Corporation',
    authority: 'Pune Municipal Corporation',
    departmentOrAgency: 'Public Health Department',
    adminWardGeoNames: ['Admin Ward 08 KasbaVishrambaugwada'],
    prabhagNumbers2022: [18],
    locationLabel: 'Mangalwar Peth / Kasba Peth, Pune',
    latitude: 18.5228563,
    longitude: 73.8620314,
    coordinateSource: 'OpenStreetMap Nominatim (Kamla Nehru Hospital)',
    capacityOrMetric: 'Flagship PMC Hospital · ₹13 Cr Phase-1 Upgrade',
    status: 'Operational',
    details: 'Anchored within PMC’s ₹516.05 Cr FY 2024-25 Health Budget and 96 urban Arogyavardhini clinic network.',
    sourceTitle: 'PMC Public Health Department Directory',
    sourceUrl: 'https://www.pmc.gov.in/en/health',
    verificationLabel: 'Official source verified'
  },
  {
    assetId: 'asset-hlth-rajiv-gandhi',
    name: 'Bharat Ratna Rajiv Gandhi Hospital (Yerawada)',
    category: 'Healthcare & Clinics',
    jurisdiction: 'Pune Municipal Corporation',
    authority: 'Pune Municipal Corporation',
    departmentOrAgency: 'Public Health Department',
    adminWardGeoNames: ['Admin Ward 06 Yerawda - Sangamwadi'],
    prabhagNumbers2022: [8, 9],
    locationLabel: 'Deccan College Road, Yerawada, Pune',
    latitude: 18.5455763,
    longitude: 73.8837641,
    coordinateSource: 'OpenStreetMap Nominatim (Rajiv Gandhi Hospital, Yerawada)',
    capacityOrMetric: 'Multi-Specialty Municipal Hospital (11-Centre Upgrade)',
    status: 'Operational',
    details: 'Major eastern Pune municipal general hospital included in PMC’s ₹90 Cr 11-hospital/maternity home upgrade program.',
    sourceTitle: 'PMC Public Health Department Directory',
    sourceUrl: 'https://www.pmc.gov.in/en/health',
    verificationLabel: 'Official source verified'
  },
  {
    assetId: 'asset-fire-kothrud',
    name: 'Kothrud Fire Station (Pune Fire Brigade)',
    category: 'Fire & Emergency',
    jurisdiction: 'Pune Municipal Corporation',
    authority: 'Pune Municipal Corporation',
    departmentOrAgency: 'Fire Department',
    adminWardGeoNames: ['Admin Ward 03 Kothrud Karveroad'],
    prabhagNumbers2022: [31, 32],
    locationLabel: 'Karve Road, Kothrud, Pune',
    latitude: 18.4989054,
    longitude: 73.8134448,
    coordinateSource: 'OpenStreetMap Nominatim (Kothrud Fire Station, Pune)',
    capacityOrMetric: 'Part of 20 Operational PMC Fire Stations (+5 Planned)',
    status: 'Operational',
    details: 'Western Pune emergency fire-fighting & rescue station equipped with water tenders and disaster response units.',
    sourceTitle: 'PMC Fire Brigade Official Directory',
    sourceUrl: 'https://www.pmc.gov.in/en/fire-brigade',
    verificationLabel: 'Official source verified'
  },
  {
    assetId: 'asset-park-sarasbaug',
    name: 'Sarasbaug Civic Garden & Talyatla Ganpati Precinct',
    category: 'Parks, Markets & Culture',
    jurisdiction: 'Pune Municipal Corporation',
    authority: 'Pune Municipal Corporation',
    departmentOrAgency: 'Gardens & Parks Department',
    adminWardGeoNames: ['Admin Ward 10 Sahakarnagar', 'Admin Ward 08 KasbaVishrambaugwada'],
    prabhagNumbers2022: [29, 38],
    locationLabel: 'Swargate / Parvati Foothills, Pune',
    latitude: 18.5004949,
    longitude: 73.8529037,
    coordinateSource: 'OpenStreetMap Nominatim (Sarasbaug, Swargate, Pune)',
    capacityOrMetric: '25-Acre Flagship Park (200+ PMC Parks Network)',
    status: 'Operational',
    details: 'Historic municipal public garden maintained under PMC’s Gardens Department alongside 5.78 lakh surveyed city trees.',
    sourceTitle: 'PMC Garden Department & ESR',
    sourceUrl: 'https://www.pmc.gov.in/en/garden',
    verificationLabel: 'Official source verified'
  },
  {
    assetId: 'asset-park-okayama',
    name: 'Pu. La. Deshpande Udyan (Okayama Friendship Garden)',
    category: 'Parks, Markets & Culture',
    jurisdiction: 'Pune Municipal Corporation',
    authority: 'Pune Municipal Corporation',
    departmentOrAgency: 'Gardens & Parks Department',
    adminWardGeoNames: ['Admin Ward 10 Sahakarnagar', 'Admin Ward 09 Tilak Road'],
    prabhagNumbers2022: [37, 38],
    locationLabel: 'Sinhagad Road / Sahakarnagar, Pune',
    latitude: 18.4910844,
    longitude: 73.8381503,
    coordinateSource: 'OpenStreetMap Nominatim (Okayama Friendship Garden, Pune)',
    capacityOrMetric: '10-Acre Japanese-Style Civic Theme Garden',
    status: 'Operational',
    details: 'Flagship southern Pune civic theme park maintained by PMC Garden Department.',
    sourceTitle: 'PMC Garden Department & ESR',
    sourceUrl: 'https://www.pmc.gov.in/en/garden',
    verificationLabel: 'Official source verified'
  },
  {
    assetId: 'asset-park-kamala-nehru',
    name: 'Kamala Nehru Municipal Park',
    category: 'Parks, Markets & Culture',
    jurisdiction: 'Pune Municipal Corporation',
    authority: 'Pune Municipal Corporation',
    departmentOrAgency: 'Gardens & Parks Department',
    adminWardGeoNames: ['Admin Ward 02 Ghole Road', 'Admin Ward 03 Kothrud Karveroad'],
    prabhagNumbers2022: [16, 30],
    locationLabel: 'Erandwane / Deccan Gymkhana, Pune',
    latitude: 18.5171960,
    longitude: 73.8348458,
    coordinateSource: 'OpenStreetMap Nominatim (Kamala Nehru Park, Deccan Gymkhana)',
    capacityOrMetric: 'Core Deccan Neighborhood Civic Park',
    status: 'Operational',
    details: 'Public garden and walking park managed under PMC’s 200+ civic parks portfolio.',
    sourceTitle: 'PMC Garden Department & ESR',
    sourceUrl: 'https://www.pmc.gov.in/en/garden',
    verificationLabel: 'Official source verified'
  },
  {
    assetId: 'asset-market-mandai',
    name: 'Mahatma Phule Mandai (Central Municipal Market)',
    category: 'Parks, Markets & Culture',
    jurisdiction: 'Pune Municipal Corporation',
    authority: 'Pune Municipal Corporation',
    departmentOrAgency: 'Public Works & Solid Waste Management',
    adminWardGeoNames: ['Admin Ward 08 KasbaVishrambaugwada', 'Admin Ward 12 Bhavani Peth'],
    prabhagNumbers2022: [27, 29],
    locationLabel: 'Shukrawar Peth / Guruwar Peth, Pune',
    latitude: 18.5129178,
    longitude: 73.8562952,
    coordinateSource: 'OpenStreetMap Nominatim (Mahatma Phule Mandai, Pune)',
    capacityOrMetric: 'Historic Municipal Market & Smart Parking Zone',
    status: 'Operational',
    details: 'Central Pune wholesale/retail vegetable market precinct supported by PMC pay-and-park and sanitation infrastructure.',
    sourceTitle: 'PMC Civic Asset & Heritage Disclosures',
    sourceUrl: 'https://www.pmc.gov.in/',
    verificationLabel: 'Official source verified'
  },
  {
    assetId: 'asset-culture-yc-natyagruha',
    name: 'Yashwantrao Chavan Natyagruha (Municipal Auditorium)',
    category: 'Education & Civic Admin',
    jurisdiction: 'Pune Municipal Corporation',
    authority: 'Pune Municipal Corporation',
    departmentOrAgency: 'Public Works & Cultural Centres',
    adminWardGeoNames: ['Admin Ward 03 Kothrud Karveroad'],
    prabhagNumbers2022: [31, 32],
    locationLabel: 'Kothrud, Karve Nagar, Pune',
    latitude: 18.5026825,
    longitude: 73.8123457,
    coordinateSource: 'OpenStreetMap Nominatim (Yashwantrao Chavan Natyagruha, Kothrud)',
    capacityOrMetric: 'PMC Civic Cultural Auditorium',
    status: 'Operational',
    details: 'Municipal performing arts auditorium and community cultural venue operated by PMC.',
    sourceTitle: 'PMC Official Civic Portal',
    sourceUrl: 'https://www.pmc.gov.in/',
    verificationLabel: 'Official source verified'
  },
  {
    assetId: 'asset-swm-citywide',
    name: 'PMC Solid Waste Management Processing Network (SWaCH & WtE)',
    category: 'Sewage & Sanitation',
    jurisdiction: 'Pune Municipal Corporation',
    authority: 'Pune Municipal Corporation',
    departmentOrAgency: 'Solid Waste Management Department',
    adminWardGeoNames: ['Admin Ward 13 Hadapsar'],
    prabhagNumbers2022: [23, 24, 25],
    locationLabel: 'Hadapsar Transfer/Processing Belt & City-Wide SWM',
    latitude: null,
    longitude: null,
    coordinateSource: null,
    capacityOrMetric: '2,200–2,400 TPD · ~95% Segregation · ₹105.40 Cr CapEx',
    status: 'Operational',
    details: 'Segregated wet/dry waste processing via composting, bio-CNG, waste-to-energy, and SWaCH cooperative door-to-door collection.',
    sourceTitle: 'PMC Environment Status Report (ESR)',
    sourceUrl: 'https://www.pmc.gov.in/en/solid-waste-management',
    verificationLabel: 'Official source verified'
  }
];

function mapLkCategory(cat: string): MapPublicAsset['category'] {
  if (cat === 'Healthcare') return 'Healthcare & Clinics';
  if (cat === 'Education' || cat === 'Administration') return 'Education & Civic Admin';
  if (cat === 'Public Utility') return 'Transport & Railway';
  return 'Education & Civic Admin';
}

export const LONI_KALBHOR_MAP_ASSETS: MapPublicAsset[] = [
  ...LONI_KALBHOR_FACILITIES.map((fac) => {
    const src = LK_SOURCE_MAP.get(fac.sourceId);
    const isRailway = fac.id === 'LK_FAC_005';
    // Use verified OSM Nominatim coordinates for Railway Station when available alongside documented GP coordinates
    const lat = isRailway ? 18.4908467 : fac.coordinates.lat;
    const lng = isRailway ? 74.0208082 : fac.coordinates.lng;
    const coordSrc = isRailway
      ? 'OpenStreetMap Nominatim (Loni Railway Station, node/2539975321)'
      : 'Loni Kalbhor Village Directory & Local Public Facility Coordinates';

    return {
      assetId: `lk-${fac.id.toLowerCase()}`,
      name: fac.name,
      category: isRailway ? ('Transport & Railway' as const) : mapLkCategory(fac.category),
      jurisdiction: 'Loni Kalbhor Gram Panchayat' as const,
      authority: fac.authority,
      departmentOrAgency: `${fac.category} · ${fac.subCategory}`,
      adminWardGeoNames: ['LONI_KALBHOR_GP'],
      prabhagNumbers2022: [],
      locationLabel: fac.address,
      latitude: lat,
      longitude: lng,
      coordinateSource: coordSrc,
      capacityOrMetric: fac.subCategory,
      status: fac.status,
      details: `${fac.subCategory} located at ${fac.address} (Managed by ${fac.authority}). Outside PMC municipal limits.`,
      sourceTitle: src?.documentTitle || 'Loni Kalbhor Civic Directory',
      sourceUrl: src?.officialUrl || 'https://lgdirectory.gov.in/',
      verificationLabel: src?.verificationStatus || 'Verified Official'
    };
  }),
  ...LONI_KALBHOR_WATER_FACILITIES.map((wat) => {
    const src = LK_SOURCE_MAP.get(wat.sourceId);
    return {
      assetId: `lk-${wat.id.toLowerCase()}`,
      name: wat.facilityName,
      category: 'Water Supply & WTP' as const,
      jurisdiction: 'Loni Kalbhor Gram Panchayat' as const,
      authority: wat.managingAuthority,
      departmentOrAgency: wat.infrastructureType,
      adminWardGeoNames: ['LONI_KALBHOR_GP'],
      prabhagNumbers2022: [],
      locationLabel: 'Loni Kalbhor Gram Panchayat, Haveli Taluka',
      latitude: null,
      longitude: null,
      coordinateSource: null,
      capacityOrMetric: `${wat.capacityMLD} MLD Cap. · ${wat.actualSupplyMLD} MLD Supply`,
      status: wat.status,
      details: `${wat.infrastructureType} managed by ${wat.managingAuthority}. Installed capacity ${wat.capacityMLD} MLD with ${wat.actualSupplyMLD} MLD actual daily supply.`,
      sourceTitle: src?.documentTitle || 'Jal Jeevan Mission Status Report',
      sourceUrl: src?.officialUrl || 'https://ejalshakti.gov.in/jjm/',
      verificationLabel: src?.verificationStatus || 'Verified Official'
    };
  })
];

export const ALL_PUBLIC_MAP_ASSETS: MapPublicAsset[] = [
  ...PMC_PUBLIC_MAP_ASSETS,
  ...LONI_KALBHOR_MAP_ASSETS
];

export function getPublicAssetsForArea(
  assets: MapPublicAsset[],
  layerMode: BoundaryLayerMode | 'gram-panchayat',
  featureKey: string
): MapPublicAsset[] {
  if (featureKey === 'LONI_KALBHOR_GP' || layerMode === 'gram-panchayat') {
    return assets.filter((a) => a.adminWardGeoNames.includes('LONI_KALBHOR_GP'));
  }
  if (layerMode === 'admin-wards') {
    return assets.filter((a) => a.adminWardGeoNames.includes(featureKey));
  }
  const prabhagNum = Number(featureKey);
  if (Number.isNaN(prabhagNum)) return [];
  return assets.filter((a) => a.prabhagNumbers2022.includes(prabhagNum));
}
