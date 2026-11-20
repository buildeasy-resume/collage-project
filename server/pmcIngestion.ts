import * as XLSX from 'xlsx';
import { PDFParse } from 'pdf-parse';
import {
  MapMunicipalProject,
  MapProjectCategory,
  MapProjectStatus,
  PmcDepartmentBudgetRecord,
  VerificationCategory
} from '../src/types/puneMap.ts';
import {
  MAP_PROJECT_CATEGORIES,
  MAP_PROJECT_STATUSES,
  PMC_ADMIN_WARD_GEO_META
} from '../src/data/puneMapData.ts';
import {
  insertImportLog,
  listDepartmentBudgetsFromDb,
  listProjectsFromDb,
  upsertImportedBudgets,
  upsertImportedProjects
} from './pmcDatabase.ts';

export type IngestionDatasetType = 'projects' | 'budgets';

export interface ParsedPreviewResult {
  datasetType: IngestionDatasetType;
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

export interface PortalSyncEndpointResult {
  portalName: string;
  url: string;
  reachable: boolean;
  httpStatus: number | null;
  statusLabel: 'Accessible' | 'Blocked (Cloudflare/WAF)' | 'Timeout / Unreachable';
  discoveredLinksCount: number;
  discoveredLinks: Array<{ title: string; url: string }>;
  note: string;
}

function parseNullableNumber(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  if (!str) return null;
  const lower = str.toLowerCase();
  if (
    lower === 'n/a' ||
    lower === 'na' ||
    lower === 'null' ||
    lower === '-' ||
    lower === '—' ||
    lower.includes('unavailable') ||
    lower.includes('not available') ||
    lower.includes('pending')
  ) {
    return null;
  }
  const cleaned = str.replace(/[₹,\s]/g, '').replace(/(crores?|cr\.?)/gi, '');
  const num = Number(cleaned);
  return Number.isFinite(num) && num >= 0 ? Number(num.toFixed(2)) : null;
}

function parseNullableCoord(val: unknown, min: number, max: number): number | null {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  if (!str) return null;
  const num = Number(str);
  if (!Number.isFinite(num) || num < min || num > max) return null;
  return Number(num.toFixed(7));
}

function cleanString(val: unknown): string {
  return val === null || val === undefined ? '' : String(val).trim();
}

function normalizeCategory(raw: string): MapProjectCategory {
  const lower = raw.toLowerCase();
  for (const cat of MAP_PROJECT_CATEGORIES) {
    if (cat.toLowerCase() === lower) return cat;
  }
  if (lower.includes('road') || lower.includes('flyover') || lower.includes('bridge') || lower.includes('transport') || lower.includes('metro')) {
    return 'Roads and Transportation';
  }
  if (lower.includes('water') || lower.includes('wtp')) {
    return 'Water Supply';
  }
  if (lower.includes('drain') || lower.includes('sew') || lower.includes('stp') || lower.includes('nalla')) {
    return 'Drainage and Sewage';
  }
  if (lower.includes('health') || lower.includes('hospital') || lower.includes('clinic')) {
    return 'Healthcare';
  }
  if (lower.includes('edu') || lower.includes('school')) {
    return 'Education';
  }
  if (lower.includes('waste') || lower.includes('swm') || lower.includes('garbage')) {
    return 'Waste Management';
  }
  return 'Public Infrastructure';
}

function normalizeStatus(raw: string): MapProjectStatus {
  const lower = raw.toLowerCase();
  for (const s of MAP_PROJECT_STATUSES) {
    if (s.toLowerCase() === lower) return s;
  }
  if (lower.includes('complete') || lower.includes('finish') || lower.includes('inaugurat')) {
    return 'Completed';
  }
  if (lower.includes('delay') || lower.includes('stall') || lower.includes('overdue')) {
    return 'Delayed';
  }
  if (lower.includes('upcom') || lower.includes('plan') || lower.includes('propos') || lower.includes('tender')) {
    return 'Upcoming';
  }
  return 'Ongoing';
}

function normalizeVerification(raw: string, fallback: VerificationCategory): VerificationCategory {
  const lower = raw.toLowerCase();
  if (lower.includes('official')) return 'Official source verified';
  if (lower.includes('government') || lower.includes('document')) return 'Government document available';
  if (lower.includes('secondary')) return 'Secondary source';
  if (lower.includes('await')) return 'Awaiting verification';
  if (lower.includes('unavail')) return 'Data unavailable';
  return fallback;
}

function resolveWardMapping(wardHint: string): {
  wardId: string | null;
  adminWardGeoNames: string[];
  wardScope: MapMunicipalProject['wardScope'];
} {
  const clean = wardHint.trim().toLowerCase();
  if (!clean || clean === 'city-wide' || clean === 'citywide' || clean === 'all') {
    return { wardId: null, adminWardGeoNames: [], wardScope: 'City-Wide' };
  }

  const matched = PMC_ADMIN_WARD_GEO_META.filter((w) => {
    return (
      w.wardId.toLowerCase() === clean ||
      w.geoFeatureName.toLowerCase() === clean ||
      w.displayName.toLowerCase().includes(clean) ||
      clean.includes(w.shortLabel.toLowerCase()) ||
      w.keyLocalities.some((loc) => clean.includes(loc.toLowerCase()))
    );
  });

  if (matched.length === 1) {
    return {
      wardId: matched[0].wardId,
      adminWardGeoNames: [matched[0].geoFeatureName],
      wardScope: 'Ward-Specific'
    };
  }
  if (matched.length > 1) {
    return {
      wardId: null,
      adminWardGeoNames: matched.map((m) => m.geoFeatureName),
      wardScope: 'Multi-Ward Corridor'
    };
  }
  return { wardId: null, adminWardGeoNames: [], wardScope: 'City-Wide' };
}

function pickField(row: Record<string, unknown>, aliases: string[]): unknown {
  const entries = Object.entries(row);
  for (const alias of aliases) {
    const target = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [k, v] of entries) {
      const normalizedKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normalizedKey === target) return v;
    }
  }
  return undefined;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 42);
}

function buildProjectFromRow(
  row: Record<string, unknown>,
  idx: number,
  sourceName: string,
  defaultVerification: VerificationCategory,
  warnings: string[]
): MapMunicipalProject | null {
  const projectName = cleanString(
    pickField(row, ['project_name', 'projectName', 'name', 'work_name', 'title', 'scheme_name'])
  );
  if (!projectName) {
    warnings.push(`Row ${idx + 1}: Skipped because project_name is missing.`);
    return null;
  }

  const financialYear =
    cleanString(pickField(row, ['financial_year', 'financialYear', 'fy', 'year'])) || '2025-26';
  const department =
    cleanString(pickField(row, ['department', 'dept', 'department_name', 'executing_dept'])) ||
    'Public Works Department';
  const categoryRaw = cleanString(pickField(row, ['category', 'sector', 'project_category']));
  const statusRaw = cleanString(pickField(row, ['status', 'project_status', 'current_status']));
  const wardRaw = cleanString(
    pickField(row, ['ward_name', 'ward', 'ward_id', 'admin_ward', 'prabhag'])
  );
  const wardMap = resolveWardMapping(wardRaw);

  const locationSummary =
    cleanString(pickField(row, ['location', 'location_summary', 'area', 'site'])) ||
    (wardRaw || 'Pune Municipal Corporation Area');

  const projectCode =
    cleanString(pickField(row, ['project_code', 'projectCode', 'code', 'work_code'])) ||
    `PMC-IMP-${financialYear.replace(/[^0-9]/g, '')}-${slugify(projectName).slice(0, 12).toUpperCase()}-${idx + 1}`;

  const projectId =
    cleanString(pickField(row, ['project_id', 'projectId', 'id'])) ||
    `imp-${slugify(projectCode)}-${slugify(financialYear)}`;

  const estimatedCostCrores = parseNullableNumber(
    pickField(row, ['estimated_cost', 'estimatedCostCrores', 'estimated_cost_cr', 'cost_cr', 'estimated_cost_crores'])
  );
  const approvedFundingCrores = parseNullableNumber(
    pickField(row, ['approved_funding', 'approvedFundingCrores', 'budget_estimate', 'sanctioned_cost', 'approved_funding_crores'])
  );
  const actualExpenditureCrores = parseNullableNumber(
    pickField(row, ['actual_expenditure', 'actualExpenditureCrores', 'actuals', 'expenditure_cr', 'actual_expenditure_crores'])
  );

  const progressRaw = parseNullableNumber(
    pickField(row, ['physical_progress', 'physicalProgressPercent', 'progress_pct', 'completion_pct'])
  );
  const physicalProgressPercent =
    progressRaw !== null ? Math.min(100, Math.max(0, progressRaw)) : null;

  const latitude = parseNullableCoord(pickField(row, ['latitude', 'lat']), 18.35, 18.72);
  const longitude = parseNullableCoord(pickField(row, ['longitude', 'lng', 'lon']), 73.68, 74.08);

  const sourceUrl =
    cleanString(pickField(row, ['source_url', 'sourceUrl', 'url', 'document_url'])) ||
    'https://www.pmc.gov.in/';

  const sourceDocument =
    cleanString(pickField(row, ['source_document', 'sourceDocument', 'document', 'document_title'])) ||
    sourceName;

  const verificationRaw = cleanString(
    pickField(row, ['verification_status', 'verificationStatus', 'verification'])
  );

  return {
    projectId,
    projectCode,
    projectName,
    officialName:
      cleanString(pickField(row, ['official_name', 'officialName'])) || projectName,
    department,
    category: normalizeCategory(categoryRaw || department),
    wardId: wardMap.wardId,
    estimatedCostCrores,
    approvedFundingCrores,
    actualExpenditureCrores,
    status: normalizeStatus(statusRaw),
    physicalProgressPercent,
    startDate: cleanString(pickField(row, ['start_date', 'startDate'])) || null,
    expectedCompletionDate:
      cleanString(pickField(row, ['expected_completion_date', 'expectedCompletionDate', 'completion_date'])) ||
      null,
    financialYear,
    wardScope: wardMap.wardScope,
    adminWardGeoNames: wardMap.adminWardGeoNames,
    prabhagNumbers2022: [],
    locationSummary,
    latitude,
    longitude,
    coordinateSource:
      latitude !== null && longitude !== null ? `Provided in ${sourceName}` : null,
    description:
      cleanString(pickField(row, ['description', 'details', 'remarks', 'notes'])) ||
      `${projectName} (${department}) imported from ${sourceName}.`,
    capacityOrScale: cleanString(pickField(row, ['capacity', 'capacity_or_scale', 'scale'])) || undefined,
    sourceDocument,
    sourceUrl,
    sourcePageOrTable:
      cleanString(pickField(row, ['source_page_or_table', 'page_ref', 'table_ref'])) ||
      `Imported row ${idx + 1} (${sourceName})`,
    evidenceNote:
      cleanString(pickField(row, ['evidence_note', 'notes'])) ||
      `Imported from ${sourceName}. Missing financial or progress cells remain null (Data unavailable).`,
    lastUpdated: new Date().toISOString().slice(0, 10),
    verificationStatus: normalizeVerification(verificationRaw, defaultVerification)
  };
}

function buildBudgetFromRow(
  row: Record<string, unknown>,
  idx: number,
  sourceName: string,
  defaultVerification: VerificationCategory,
  warnings: string[]
): PmcDepartmentBudgetRecord | null {
  const departmentName = cleanString(
    pickField(row, ['department_name', 'departmentName', 'department', 'dept'])
  );
  const budgetHead =
    cleanString(pickField(row, ['budget_head', 'budgetHead', 'head', 'scheme', 'account_head'])) ||
    'Capital & Revenue Municipal Allocation';
  const financialYear =
    cleanString(pickField(row, ['financial_year', 'financialYear', 'fy', 'year'])) || '2025-26';

  if (!departmentName) {
    warnings.push(`Budget row ${idx + 1}: Skipped because department_name is missing.`);
    return null;
  }

  const budgetEstimateCrores = parseNullableNumber(
    pickField(row, ['budget_estimate', 'budgetEstimateCrores', 'be', 'budget_be', 'allocated_budget'])
  );
  const revisedEstimateCrores = parseNullableNumber(
    pickField(row, ['revised_estimate', 'revisedEstimateCrores', 're', 'budget_re'])
  );
  const actualExpenditureCrores = parseNullableNumber(
    pickField(row, ['actual_expenditure', 'actualExpenditureCrores', 'actuals', 'actual_spend'])
  );

  if (
    budgetEstimateCrores === null &&
    revisedEstimateCrores === null &&
    actualExpenditureCrores === null
  ) {
    warnings.push(
      `Budget row ${idx + 1} (${departmentName}): All numeric BE/RE/Actual fields are empty or non-numeric.`
    );
  }

  const verificationRaw = cleanString(
    pickField(row, ['verification_status', 'verificationStatus'])
  );

  return {
    id: `imp-bgt-${slugify(departmentName)}-${slugify(budgetHead)}-${slugify(financialYear)}`,
    departmentId: `dept-${slugify(departmentName)}`,
    departmentName,
    budgetHead,
    financialYear,
    budgetEstimateCrores,
    revisedEstimateCrores,
    actualExpenditureCrores,
    sourceUrl:
      cleanString(pickField(row, ['source_url', 'sourceUrl', 'url'])) || 'https://www.pmc.gov.in/',
    documentTitle:
      cleanString(pickField(row, ['document_title', 'documentTitle', 'source_document'])) ||
      sourceName,
    verificationStatus: normalizeVerification(verificationRaw, defaultVerification),
    notes:
      cleanString(pickField(row, ['notes', 'remarks'])) ||
      `Imported from ${sourceName}. Separate BE/RE/Actual columns preserved without conflation.`,
    lastUpdated: new Date().toISOString().slice(0, 10)
  };
}

function summarizeAgainstDb(
  datasetType: IngestionDatasetType,
  fileFormat: string,
  sourceName: string,
  projects: MapMunicipalProject[],
  budgets: PmcDepartmentBudgetRecord[],
  warnings: string[]
): ParsedPreviewResult {
  if (datasetType === 'projects') {
    const existing = listProjectsFromDb();
    const byCode = new Map<string, MapMunicipalProject>();
    const byNameFy = new Map<string, MapMunicipalProject>();
    for (const p of existing) {
      byCode.set(p.projectCode.trim().toLowerCase(), p);
      byNameFy.set(`${p.projectName.trim().toLowerCase()}::${p.financialYear}`, p);
    }

    let newCount = 0;
    let updateCount = 0;
    let duplicateCount = 0;

    for (const p of projects) {
      const match =
        byCode.get(p.projectCode.trim().toLowerCase()) ||
        byNameFy.get(`${p.projectName.trim().toLowerCase()}::${p.financialYear}`);
      if (!match) {
        newCount++;
      } else {
        const unchanged =
          match.estimatedCostCrores === p.estimatedCostCrores &&
          match.approvedFundingCrores === p.approvedFundingCrores &&
          match.actualExpenditureCrores === p.actualExpenditureCrores &&
          match.status === p.status &&
          match.physicalProgressPercent === p.physicalProgressPercent &&
          match.locationSummary === p.locationSummary;
        if (unchanged) duplicateCount++;
        else updateCount++;
      }
    }

    return {
      datasetType,
      fileFormat,
      sourceName,
      rowsParsed: projects.length,
      newCount,
      updateCount,
      duplicateCount,
      warnings,
      projects,
      budgets: []
    };
  }

  const existingBudgets = listDepartmentBudgetsFromDb();
  const keyMap = new Map<string, PmcDepartmentBudgetRecord>();
  for (const b of existingBudgets) {
    keyMap.set(
      `${b.departmentName.trim().toLowerCase()}::${b.budgetHead.trim().toLowerCase()}::${b.financialYear}`,
      b
    );
  }

  let newCount = 0;
  let updateCount = 0;
  let duplicateCount = 0;

  for (const b of budgets) {
    const match = keyMap.get(
      `${b.departmentName.trim().toLowerCase()}::${b.budgetHead.trim().toLowerCase()}::${b.financialYear}`
    );
    if (!match) {
      newCount++;
    } else {
      const unchanged =
        match.budgetEstimateCrores === b.budgetEstimateCrores &&
        match.revisedEstimateCrores === b.revisedEstimateCrores &&
        match.actualExpenditureCrores === b.actualExpenditureCrores;
      if (unchanged) duplicateCount++;
      else updateCount++;
    }
  }

  return {
    datasetType,
    fileFormat,
    sourceName,
    rowsParsed: budgets.length,
    newCount,
    updateCount,
    duplicateCount,
    warnings,
    projects: [],
    budgets
  };
}

export async function parseUploadedBuffer(
  buffer: Buffer,
  filename: string,
  datasetType: IngestionDatasetType
): Promise<ParsedPreviewResult> {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const warnings: string[] = [];

  if (ext === 'pdf') {
    const parser = new PDFParse({ data: buffer });
    try {
      const textResult = await parser.getText();
      const rawText = textResult.text || '';
      const lines = rawText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 8);

      const projects: MapMunicipalProject[] = [];
      const budgets: PmcDepartmentBudgetRecord[] = [];
      const fyMatch = rawText.match(/20\d{2}\s*[-–]\s*\d{2}/);
      const docFy = fyMatch ? fyMatch[0].replace(/\s+/g, '').replace('–', '-') : '2025-26';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Match lines containing an explicit ₹/Rs/Crore/Cr monetary figure
        const amtMatch = line.match(
          /(?:₹|rs\.?|inr)?\s*(\d[\d,]*\.?\d*)\s*(?:crore|crores|cr\.?)/i
        );
        if (!amtMatch) continue;

        const amount = parseNullableNumber(amtMatch[1]);
        if (amount === null) continue;

        const cleanTitle = line
          .replace(amtMatch[0], '')
          .replace(/[|:–-]+$/g, '')
          .trim()
          .slice(0, 140);
        if (cleanTitle.length < 5) continue;

        if (datasetType === 'budgets') {
          budgets.push({
            id: `pdf-bgt-${slugify(cleanTitle)}-${docFy}`,
            departmentId: `dept-${slugify(cleanTitle)}`,
            departmentName: cleanTitle,
            budgetHead: `Extracted PDF Line (FY ${docFy})`,
            financialYear: docFy,
            budgetEstimateCrores: amount,
            revisedEstimateCrores: null,
            actualExpenditureCrores: null,
            sourceUrl: 'https://www.pmc.gov.in/',
            documentTitle: filename,
            verificationStatus: 'Awaiting verification',
            notes: `Extracted from PDF text line: "${line.slice(0, 180)}". Requires officer/citizen verification against official tables.`,
            lastUpdated: new Date().toISOString().slice(0, 10)
          });
        } else {
          projects.push({
            projectId: `pdf-proj-${slugify(cleanTitle)}-${i + 1}`,
            projectCode: `PMC-PDF-${docFy.replace(/[^0-9]/g, '')}-${i + 1}`,
            projectName: cleanTitle,
            officialName: cleanTitle,
            department: 'Public Infrastructure & Civic Works',
            category: normalizeCategory(cleanTitle),
            wardId: null,
            estimatedCostCrores: amount,
            approvedFundingCrores: null,
            actualExpenditureCrores: null,
            status: normalizeStatus(line),
            physicalProgressPercent: null,
            startDate: null,
            expectedCompletionDate: null,
            financialYear: docFy,
            wardScope: 'City-Wide',
            adminWardGeoNames: [],
            prabhagNumbers2022: [],
            locationSummary: 'Extracted from PDF document (ward unmapped)',
            latitude: null,
            longitude: null,
            coordinateSource: null,
            description: `Extracted from PDF line: "${line.slice(0, 220)}".`,
            sourceDocument: filename,
            sourceUrl: 'https://www.pmc.gov.in/',
            sourcePageOrTable: `PDF text extraction (${textResult.total ?? 1} pages)`,
            evidenceNote:
              'Automatically extracted from uploaded PDF text; tagged Awaiting verification until cross-checked.',
            lastUpdated: new Date().toISOString().slice(0, 10),
            verificationStatus: 'Awaiting verification'
          });
        }
      }

      if (projects.length === 0 && budgets.length === 0) {
        warnings.push(
          'No structured Crore/Cr financial line items were detected in the PDF text. Scanned image-only PDFs require OCR or CSV/Excel transcription.'
        );
      } else {
        warnings.push(
          'PDF-extracted items are tagged "Awaiting verification" so reviewers can confirm exact table columns (BE vs RE vs Actuals).'
        );
      }

      return summarizeAgainstDb(datasetType, 'PDF', filename, projects, budgets, warnings);
    } finally {
      await parser.destroy();
    }
  }

  // CSV, XLSX, XLS via SheetJS
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) {
    throw new Error('The uploaded spreadsheet contains no readable sheets.');
  }
  const sheet = workbook.Sheets[firstSheet];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  if (rawRows.length === 0) {
    warnings.push('Spreadsheet sheet is empty or missing header columns.');
  }

  const fileFormat = ext === 'csv' ? 'CSV' : ext === 'xls' ? 'XLS' : 'XLSX';
  const projects: MapMunicipalProject[] = [];
  const budgets: PmcDepartmentBudgetRecord[] = [];

  rawRows.forEach((row, idx) => {
    if (datasetType === 'projects') {
      const p = buildProjectFromRow(row, idx, filename, 'Government document available', warnings);
      if (p) projects.push(p);
    } else {
      const b = buildBudgetFromRow(row, idx, filename, 'Government document available', warnings);
      if (b) budgets.push(b);
    }
  });

  return summarizeAgainstDb(datasetType, fileFormat, filename, projects, budgets, warnings);
}

export function publishPreviewResult(
  preview: ParsedPreviewResult,
  sourceType: 'manual-upload' | 'url-fetch'
) {
  if (preview.datasetType === 'projects') {
    return upsertImportedProjects(
      preview.projects,
      sourceType,
      preview.sourceName,
      preview.fileFormat,
      preview.warnings.length
    );
  }
  return upsertImportedBudgets(
    preview.budgets,
    sourceType,
    preview.sourceName,
    preview.fileFormat,
    preview.warnings.length
  );
}

export async function fetchAndParseUrl(
  rawUrl: string,
  datasetType: IngestionDatasetType
): Promise<ParsedPreviewResult> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new Error('Please enter a valid http:// or https:// URL.');
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Only HTTP/HTTPS public document URLs are supported.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'JanDhanInsights-CivicMonitor/1.0 (+https://www.pmc.gov.in)',
        Accept: 'text/csv,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*'
      }
    });

    if (!res.ok) {
      throw new Error(`Remote source returned HTTP ${res.status} (${res.statusText}).`);
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const arrayBuf = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    if (contentType.includes('text/html')) {
      const snippet = buffer.toString('utf8', 0, 500);
      if (/just a moment|cloudflare|attention required/i.test(snippet)) {
        throw new Error(
          'Remote portal returned a Cloudflare browser challenge instead of the dataset. Download the CSV/PDF manually in your browser and upload it using the File Upload tab.'
        );
      }
      throw new Error(
        'URL returned an HTML webpage instead of a CSV, Excel (.xlsx), or PDF document.'
      );
    }

    const pathnameLower = parsedUrl.pathname.toLowerCase();
    let filename = parsedUrl.pathname.split('/').pop() || 'remote-pmc-document';
    if (contentType.includes('pdf') && !pathnameLower.endsWith('.pdf')) {
      filename += '.pdf';
    } else if (
      (contentType.includes('spreadsheetml') || contentType.includes('excel')) &&
      !pathnameLower.endsWith('.xlsx')
    ) {
      filename += '.xlsx';
    } else if (!/\.(csv|xlsx|xls|pdf)$/i.test(filename)) {
      filename += '.csv';
    }

    return parseUploadedBuffer(buffer, filename, datasetType);
  } finally {
    clearTimeout(timeout);
  }
}

export async function runAutomatedPortalSync(): Promise<{
  checkedAt: string;
  endpoints: PortalSyncEndpointResult[];
  summaryNote: string;
}> {
  const checkedAt = new Date().toISOString();
  const endpoints: PortalSyncEndpointResult[] = [];

  // 1. Check PMC Official Website (Budget Overview)
  const pmcTargets = [
    {
      portalName: 'PMC Official Website — Budget Overview',
      url: 'https://www.pmc.gov.in/en/budget-overview'
    },
    {
      portalName: 'PMC Official Website — Ward Offices Directory',
      url: 'https://www.pmc.gov.in/en/ward-offices'
    }
  ];

  for (const target of pmcTargets) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(target.url, {
        signal: ctrl.signal,
        headers: { 'User-Agent': 'JanDhanInsights-CivicMonitor/1.0' }
      });
      const html = await res.text();
      const linkMatches = Array.from(
        html.matchAll(/href=["']([^"']+\.pdf[^"']*)["'][^>]*>([^<]*)</gi)
      );
      const discoveredLinks = linkMatches
        .slice(0, 8)
        .map((m) => ({
          url: m[1].startsWith('http') ? m[1] : `https://www.pmc.gov.in${m[1]}`,
          title: m[2].replace(/\s+/g, ' ').trim() || 'PMC Official PDF Document'
        }));

      endpoints.push({
        portalName: target.portalName,
        url: target.url,
        reachable: res.ok,
        httpStatus: res.status,
        statusLabel: res.ok ? 'Accessible' : 'Blocked (Cloudflare/WAF)',
        discoveredLinksCount: discoveredLinks.length,
        discoveredLinks,
        note: res.ok
          ? `Live HTTP ${res.status} verified from www.pmc.gov.in. ${discoveredLinks.length} official PDF links detected on page.`
          : `Returned HTTP ${res.status}.`
      });
    } catch (err) {
      endpoints.push({
        portalName: target.portalName,
        url: target.url,
        reachable: false,
        httpStatus: null,
        statusLabel: 'Timeout / Unreachable',
        discoveredLinksCount: 0,
        discoveredLinks: [],
        note: err instanceof Error ? err.message : 'Request timed out.'
      });
    } finally {
      clearTimeout(timer);
    }
  }

  // 2. Check OpenCity CKAN API
  {
    const url = 'https://data.opencity.in/api/3/action/package_show?id=pmc-budgets';
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { 'User-Agent': 'JanDhanInsights-CivicMonitor/1.0' }
      });
      const body = await res.text();
      const isCloudflare =
        res.status === 403 || /just a moment|cloudflare|cf-browser-verification/i.test(body);

      if (res.ok && !isCloudflare) {
        let links: Array<{ title: string; url: string }> = [];
        try {
          const json = JSON.parse(body) as {
            result?: { resources?: Array<{ name?: string; url?: string }> };
          };
          links = (json.result?.resources || [])
            .filter((r) => r.url)
            .slice(0, 8)
            .map((r) => ({ title: r.name || 'OpenCity Resource', url: r.url! }));
        } catch {
          // Ignore malformed JSON
        }
        endpoints.push({
          portalName: 'OpenCity Urban Data Portal (CKAN API)',
          url,
          reachable: true,
          httpStatus: res.status,
          statusLabel: 'Accessible',
          discoveredLinksCount: links.length,
          discoveredLinks: links,
          note: `CKAN package responded HTTP ${res.status} with ${links.length} resources.`
        });
      } else {
        endpoints.push({
          portalName: 'OpenCity Urban Data Portal (CKAN API)',
          url,
          reachable: false,
          httpStatus: res.status,
          statusLabel: 'Blocked (Cloudflare/WAF)',
          discoveredLinksCount: 0,
          discoveredLinks: [],
          note:
            'Automated fetch blocked by Cloudflare bot challenge (HTTP 403/Challenge). Download CSV/PDF manually from data.opencity.in and upload here.'
        });
      }
    } catch (err) {
      endpoints.push({
        portalName: 'OpenCity Urban Data Portal (CKAN API)',
        url,
        reachable: false,
        httpStatus: null,
        statusLabel: 'Timeout / Unreachable',
        discoveredLinksCount: 0,
        discoveredLinks: [],
        note: err instanceof Error ? err.message : 'Connection failed.'
      });
    } finally {
      clearTimeout(timer);
    }
  }

  // 3. Check PMC Open Data Portal
  {
    const url = 'https://opendata.pmc.gov.in/';
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { 'User-Agent': 'JanDhanInsights-CivicMonitor/1.0' }
      });
      endpoints.push({
        portalName: 'PMC Open Data Portal',
        url,
        reachable: res.ok,
        httpStatus: res.status,
        statusLabel: res.ok ? 'Accessible' : 'Blocked (Cloudflare/WAF)',
        discoveredLinksCount: 0,
        discoveredLinks: [],
        note: `Responded HTTP ${res.status}.`
      });
    } catch {
      endpoints.push({
        portalName: 'PMC Open Data Portal',
        url,
        reachable: false,
        httpStatus: null,
        statusLabel: 'Timeout / Unreachable',
        discoveredLinksCount: 0,
        discoveredLinks: [],
        note:
          'Portal timed out from server network (opendata.pmc.gov.in). Use local CSV/Excel/PDF upload if portal is offline.'
      });
    } finally {
      clearTimeout(timer);
    }
  }

  const accessibleCount = endpoints.filter((e) => e.reachable).length;
  const blockedCount = endpoints.length - accessibleCount;
  const summaryNote = `Checked ${endpoints.length} official PMC/open-data endpoints: ${accessibleCount} accessible (HTTP 200), ${blockedCount} blocked or timed out (Cloudflare/network). Zero fabricated rows added.`;

  insertImportLog({
    sourceType: 'automated-sync',
    sourceName: 'PMC Portal & Open Data Availability Probe',
    datasetType: 'portal-check',
    fileFormat: 'HTTP/HTML/CKAN',
    status: accessibleCount > 0 && blockedCount > 0 ? 'Partial' : accessibleCount > 0 ? 'Success' : 'Blocked',
    rowsParsed: endpoints.reduce((s, e) => s + e.discoveredLinksCount, 0),
    rowsInserted: 0,
    rowsUpdated: 0,
    duplicatesSkipped: 0,
    warningsCount: blockedCount,
    notes: summaryNote,
    importedAt: checkedAt
  });

  return {
    checkedAt,
    endpoints,
    summaryNote
  };
}
