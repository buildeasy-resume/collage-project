import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type {
  ImportHistoryRecord,
  MapMunicipalProject,
  PmcDepartmentBudgetRecord,
  PmcWardDbRecord,
  ProjectRevisionRecord
} from '../src/types/puneMap.ts';
import {
  ALL_INITIAL_DEPARTMENT_BUDGETS,
  ALL_MAP_PROJECTS,
  BOUNDARY_SOURCE_METADATA,
  INITIAL_REPORTING_DATE,
  PMC_ADMIN_WARD_GEO_META
} from '../src/data/puneMapData.ts';
import { ALL_PUBLIC_MAP_ASSETS } from '../src/data/punePublicMapAssets.ts';

let dbInstance: DatabaseSync | null = null;

function getDbPath(): string {
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'pmc_civic.db');
}

export function getDatabase(): DatabaseSync {
  if (dbInstance) return dbInstance;

  const db = new DatabaseSync(getDbPath());
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS PMC_WARDS (
      ward_id TEXT PRIMARY KEY,
      ward_number INTEGER UNIQUE NOT NULL,
      ward_name TEXT NOT NULL,
      geo_feature_name TEXT NOT NULL UNIQUE,
      zone TEXT NOT NULL,
      prabhag_coverage TEXT NOT NULL,
      key_localities_json TEXT NOT NULL,
      official_boundary_geojson TEXT NOT NULL,
      boundary_source TEXT NOT NULL,
      verification_status TEXT NOT NULL,
      last_updated TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS PMC_PROJECTS (
      project_id TEXT PRIMARY KEY,
      project_code TEXT UNIQUE NOT NULL,
      project_name TEXT NOT NULL,
      official_name TEXT NOT NULL,
      department TEXT NOT NULL,
      category TEXT NOT NULL,
      ward_id TEXT REFERENCES PMC_WARDS(ward_id) ON DELETE SET NULL,
      ward_scope TEXT NOT NULL,
      admin_ward_geo_names_json TEXT NOT NULL,
      prabhag_numbers_json TEXT NOT NULL,
      location TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      coordinate_source TEXT,
      description TEXT NOT NULL,
      capacity_or_scale TEXT,
      estimated_cost REAL,
      approved_funding REAL,
      actual_expenditure REAL,
      project_status TEXT NOT NULL,
      physical_progress REAL,
      start_date TEXT,
      expected_completion_date TEXT,
      financial_year TEXT NOT NULL,
      source_url TEXT NOT NULL,
      source_document TEXT NOT NULL,
      source_page_or_table TEXT NOT NULL,
      evidence_note TEXT NOT NULL,
      last_updated TEXT NOT NULL,
      verification_status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS PMC_DEPARTMENT_BUDGETS (
      id TEXT PRIMARY KEY,
      department_id TEXT NOT NULL,
      department_name TEXT NOT NULL,
      budget_head TEXT NOT NULL,
      financial_year TEXT NOT NULL,
      budget_estimate REAL,
      revised_estimate REAL,
      actual_expenditure REAL,
      source_url TEXT NOT NULL,
      document_title TEXT NOT NULL,
      verification_status TEXT NOT NULL,
      notes TEXT NOT NULL,
      last_updated TEXT NOT NULL,
      UNIQUE(department_name, budget_head, financial_year)
    );

    CREATE TABLE IF NOT EXISTS PMC_IMPORT_HISTORY (
      import_id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_type TEXT NOT NULL,
      source_name TEXT NOT NULL,
      dataset_type TEXT NOT NULL,
      file_format TEXT NOT NULL,
      status TEXT NOT NULL,
      rows_parsed INTEGER NOT NULL DEFAULT 0,
      rows_inserted INTEGER NOT NULL DEFAULT 0,
      rows_updated INTEGER NOT NULL DEFAULT 0,
      duplicates_skipped INTEGER NOT NULL DEFAULT 0,
      warnings_count INTEGER NOT NULL DEFAULT 0,
      notes TEXT NOT NULL,
      imported_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS PMC_PROJECT_REVISIONS (
      revision_id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      previous_snapshot_json TEXT NOT NULL,
      change_summary TEXT NOT NULL,
      changed_at TEXT NOT NULL
    );
  `);

  ensureColumn(db, 'PMC_PROJECTS', 'jurisdiction', "TEXT NOT NULL DEFAULT 'Pune Municipal Corporation'");
  ensureColumn(db, 'PMC_DEPARTMENT_BUDGETS', 'jurisdiction', "TEXT NOT NULL DEFAULT 'Pune Municipal Corporation'");

  seedInitialData(db);
  dbInstance = db;
  return db;
}

function ensureColumn(db: DatabaseSync, tableName: string, columnName: string, definition: string): void {
  const cols = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition};`);
  }
}

function seedInitialData(db: DatabaseSync): void {
  const wardCountRow = db.prepare('SELECT COUNT(*) AS cnt FROM PMC_WARDS').get() as { cnt: number };
  if (wardCountRow.cnt === 0) {
    const geoPath = path.resolve(process.cwd(), 'public/data/pmc-admin-wards-2017.geojson');
    let featureByGeoName = new Map<string, string>();
    if (fs.existsSync(geoPath)) {
      const geo = JSON.parse(fs.readFileSync(geoPath, 'utf8')) as GeoJSON.FeatureCollection;
      for (const f of geo.features) {
        const name = String((f.properties as Record<string, unknown>)?.name ?? '');
        if (name && f.geometry) {
          featureByGeoName.set(name, JSON.stringify(f.geometry));
        }
      }
    }

    const insertWard = db.prepare(`
      INSERT OR IGNORE INTO PMC_WARDS (
        ward_id, ward_number, ward_name, geo_feature_name, zone, prabhag_coverage,
        key_localities_json, official_boundary_geojson, boundary_source,
        verification_status, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const meta of PMC_ADMIN_WARD_GEO_META) {
      const geom = featureByGeoName.get(meta.geoFeatureName) ?? '{"type":"Polygon","coordinates":[]}';
      insertWard.run(
        meta.wardId,
        meta.wardNumber,
        meta.displayName,
        meta.geoFeatureName,
        meta.zone,
        meta.prabhagCoverage2022,
        JSON.stringify(meta.keyLocalities),
        geom,
        BOUNDARY_SOURCE_METADATA['admin-wards'].sourceName,
        'Official source verified',
        INITIAL_REPORTING_DATE
      );
    }
  }

  const insertProj = db.prepare(`
    INSERT OR IGNORE INTO PMC_PROJECTS (
      project_id, project_code, project_name, official_name, jurisdiction, department, category,
      ward_id, ward_scope, admin_ward_geo_names_json, prabhag_numbers_json,
      location, latitude, longitude, coordinate_source, description, capacity_or_scale,
      estimated_cost, approved_funding, actual_expenditure, project_status,
      physical_progress, start_date, expected_completion_date, financial_year,
      source_url, source_document, source_page_or_table, evidence_note,
      last_updated, verification_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let newlySeededProjects = 0;
  for (const p of ALL_MAP_PROJECTS) {
    const res = insertProj.run(
      p.projectId,
      p.projectCode,
      p.projectName,
      p.officialName,
      p.jurisdiction ?? 'Pune Municipal Corporation',
      p.department,
      p.category,
      p.wardId,
      p.wardScope,
      JSON.stringify(p.adminWardGeoNames),
      JSON.stringify(p.prabhagNumbers2022),
      p.locationSummary,
      p.latitude,
      p.longitude,
      p.coordinateSource ?? null,
      p.description,
      p.capacityOrScale ?? null,
      p.estimatedCostCrores,
      p.approvedFundingCrores,
      p.actualExpenditureCrores,
      p.status,
      p.physicalProgressPercent,
      p.startDate,
      p.expectedCompletionDate,
      p.financialYear,
      p.sourceUrl,
      p.sourceDocument,
      p.sourcePageOrTable,
      p.evidenceNote,
      p.lastUpdated,
      p.verificationStatus
    );
    newlySeededProjects += Number(res.changes ?? 0);
  }

  const insertBudget = db.prepare(`
    INSERT OR IGNORE INTO PMC_DEPARTMENT_BUDGETS (
      id, jurisdiction, department_id, department_name, budget_head, financial_year,
      budget_estimate, revised_estimate, actual_expenditure,
      source_url, document_title, verification_status, notes, last_updated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let newlySeededBudgets = 0;
  for (const b of ALL_INITIAL_DEPARTMENT_BUDGETS) {
    const res = insertBudget.run(
      b.id,
      b.jurisdiction ?? 'Pune Municipal Corporation',
      b.departmentId,
      b.departmentName,
      b.budgetHead,
      b.financialYear,
      b.budgetEstimateCrores,
      b.revisedEstimateCrores,
      b.actualExpenditureCrores,
      b.sourceUrl,
      b.documentTitle,
      b.verificationStatus,
      b.notes,
      b.lastUpdated
    );
    newlySeededBudgets += Number(res.changes ?? 0);
  }

  const historyCountRow = db
    .prepare('SELECT COUNT(*) AS cnt FROM PMC_IMPORT_HISTORY')
    .get() as { cnt: number };
  if (historyCountRow.cnt === 0 || newlySeededProjects > 0 || newlySeededBudgets > 0) {
    db.prepare(`
      INSERT INTO PMC_IMPORT_HISTORY (
        source_type, source_name, dataset_type, file_format, status,
        rows_parsed, rows_inserted, rows_updated, duplicates_skipped, warnings_count,
        notes, imported_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'seed',
      'PMC Official Records, DataMeet GeoJSON & OSM Verified Landmarks',
      'projects',
      'SQLite Seed',
      'Success',
      newlySeededProjects + newlySeededBudgets,
      newlySeededProjects + newlySeededBudgets,
      0,
      0,
      0,
      `Synchronized verified baseline dataset: ${newlySeededProjects} projects & ${newlySeededBudgets} budgets added.`,
      new Date().toISOString()
    );
  }
}

export function listWardsFromDb(): PmcWardDbRecord[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT ward_id, ward_number, ward_name, geo_feature_name, zone, prabhag_coverage,
              key_localities_json, boundary_source, verification_status, last_updated
       FROM PMC_WARDS
       ORDER BY ward_number ASC`
    )
    .all() as Array<Record<string, unknown>>;

  return rows.map((r) => ({
    wardId: String(r.ward_id),
    wardNumber: Number(r.ward_number),
    wardName: String(r.ward_name),
    geoFeatureName: String(r.geo_feature_name),
    zone: String(r.zone),
    prabhagCoverage: String(r.prabhag_coverage),
    keyLocalities: JSON.parse(String(r.key_localities_json)) as string[],
    boundarySource: String(r.boundary_source),
    verificationStatus: String(r.verification_status) as PmcWardDbRecord['verificationStatus'],
    lastUpdated: String(r.last_updated)
  }));
}

export function listProjectsFromDb(): MapMunicipalProject[] {
  const db = getDatabase();
  const rows = db
    .prepare('SELECT * FROM PMC_PROJECTS ORDER BY financial_year DESC, project_name ASC')
    .all() as Array<Record<string, unknown>>;

  return rows.map((r) => ({
    projectId: String(r.project_id),
    projectCode: String(r.project_code),
    projectName: String(r.project_name),
    officialName: String(r.official_name),
    jurisdiction: (r.jurisdiction ? String(r.jurisdiction) : 'Pune Municipal Corporation') as MapMunicipalProject['jurisdiction'],
    department: String(r.department),
    category: String(r.category) as MapMunicipalProject['category'],
    wardId: r.ward_id ? String(r.ward_id) : null,
    estimatedCostCrores: r.estimated_cost !== null && r.estimated_cost !== undefined ? Number(r.estimated_cost) : null,
    approvedFundingCrores: r.approved_funding !== null && r.approved_funding !== undefined ? Number(r.approved_funding) : null,
    actualExpenditureCrores: r.actual_expenditure !== null && r.actual_expenditure !== undefined ? Number(r.actual_expenditure) : null,
    status: String(r.project_status) as MapMunicipalProject['status'],
    physicalProgressPercent: r.physical_progress !== null && r.physical_progress !== undefined ? Number(r.physical_progress) : null,
    startDate: r.start_date ? String(r.start_date) : null,
    expectedCompletionDate: r.expected_completion_date ? String(r.expected_completion_date) : null,
    financialYear: String(r.financial_year),
    wardScope: String(r.ward_scope) as MapMunicipalProject['wardScope'],
    adminWardGeoNames: JSON.parse(String(r.admin_ward_geo_names_json)) as string[],
    prabhagNumbers2022: JSON.parse(String(r.prabhag_numbers_json)) as number[],
    locationSummary: String(r.location),
    latitude: r.latitude !== null && r.latitude !== undefined ? Number(r.latitude) : null,
    longitude: r.longitude !== null && r.longitude !== undefined ? Number(r.longitude) : null,
    coordinateSource: r.coordinate_source ? String(r.coordinate_source) : null,
    description: String(r.description),
    capacityOrScale: r.capacity_or_scale ? String(r.capacity_or_scale) : undefined,
    sourceDocument: String(r.source_document),
    sourceUrl: String(r.source_url),
    sourcePageOrTable: String(r.source_page_or_table),
    evidenceNote: String(r.evidence_note),
    lastUpdated: String(r.last_updated),
    verificationStatus: String(r.verification_status) as MapMunicipalProject['verificationStatus']
  }));
}

export function listDepartmentBudgetsFromDb(): PmcDepartmentBudgetRecord[] {
  const db = getDatabase();
  const rows = db
    .prepare('SELECT * FROM PMC_DEPARTMENT_BUDGETS ORDER BY financial_year DESC, department_name ASC')
    .all() as Array<Record<string, unknown>>;

  return rows.map((r) => ({
    id: String(r.id),
    jurisdiction: (r.jurisdiction ? String(r.jurisdiction) : 'Pune Municipal Corporation') as PmcDepartmentBudgetRecord['jurisdiction'],
    departmentId: String(r.department_id),
    departmentName: String(r.department_name),
    budgetHead: String(r.budget_head),
    financialYear: String(r.financial_year),
    budgetEstimateCrores: r.budget_estimate !== null && r.budget_estimate !== undefined ? Number(r.budget_estimate) : null,
    revisedEstimateCrores: r.revised_estimate !== null && r.revised_estimate !== undefined ? Number(r.revised_estimate) : null,
    actualExpenditureCrores: r.actual_expenditure !== null && r.actual_expenditure !== undefined ? Number(r.actual_expenditure) : null,
    sourceUrl: String(r.source_url),
    documentTitle: String(r.document_title),
    verificationStatus: String(r.verification_status) as PmcDepartmentBudgetRecord['verificationStatus'],
    notes: String(r.notes),
    lastUpdated: String(r.last_updated)
  }));
}

export function listImportHistoryFromDb(): ImportHistoryRecord[] {
  const db = getDatabase();
  const rows = db
    .prepare('SELECT * FROM PMC_IMPORT_HISTORY ORDER BY import_id DESC LIMIT 30')
    .all() as Array<Record<string, unknown>>;

  return rows.map((r) => ({
    importId: Number(r.import_id),
    sourceType: String(r.source_type) as ImportHistoryRecord['sourceType'],
    sourceName: String(r.source_name),
    datasetType: String(r.dataset_type) as ImportHistoryRecord['datasetType'],
    fileFormat: String(r.file_format),
    status: String(r.status) as ImportHistoryRecord['status'],
    rowsParsed: Number(r.rows_parsed),
    rowsInserted: Number(r.rows_inserted),
    rowsUpdated: Number(r.rows_updated),
    duplicatesSkipped: Number(r.duplicates_skipped),
    warningsCount: Number(r.warnings_count),
    notes: String(r.notes),
    importedAt: String(r.imported_at)
  }));
}

export function getProjectRevisionsFromDb(projectId: string): ProjectRevisionRecord[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      'SELECT * FROM PMC_PROJECT_REVISIONS WHERE project_id = ? ORDER BY revision_id DESC LIMIT 20'
    )
    .all(projectId) as Array<Record<string, unknown>>;

  return rows.map((r) => ({
    revisionId: Number(r.revision_id),
    projectId: String(r.project_id),
    previousSnapshotJson: String(r.previous_snapshot_json),
    changeSummary: String(r.change_summary),
    changedAt: String(r.changed_at)
  }));
}

export function insertImportLog(entry: Omit<ImportHistoryRecord, 'importId'>): number {
  const db = getDatabase();
  const res = db
    .prepare(`
      INSERT INTO PMC_IMPORT_HISTORY (
        source_type, source_name, dataset_type, file_format, status,
        rows_parsed, rows_inserted, rows_updated, duplicates_skipped, warnings_count,
        notes, imported_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      entry.sourceType,
      entry.sourceName,
      entry.datasetType,
      entry.fileFormat,
      entry.status,
      entry.rowsParsed,
      entry.rowsInserted,
      entry.rowsUpdated,
      entry.duplicatesSkipped,
      entry.warningsCount,
      entry.notes,
      entry.importedAt
    );
  return Number(res.lastInsertRowid);
}

export function upsertImportedProjects(
  incoming: MapMunicipalProject[],
  sourceType: ImportHistoryRecord['sourceType'],
  sourceName: string,
  fileFormat: string,
  warningsCount: number
): {
  rowsInserted: number;
  rowsUpdated: number;
  duplicatesSkipped: number;
} {
  const db = getDatabase();
  const existingProjects = listProjectsFromDb();

  const byCode = new Map<string, MapMunicipalProject>();
  const byNameFy = new Map<string, MapMunicipalProject>();
  for (const p of existingProjects) {
    byCode.set(p.projectCode.trim().toLowerCase(), p);
    byNameFy.set(`${p.projectName.trim().toLowerCase()}::${p.financialYear}`, p);
  }

  let rowsInserted = 0;
  let rowsUpdated = 0;
  let duplicatesSkipped = 0;
  const nowIso = new Date().toISOString();

  const insertStmt = db.prepare(`
    INSERT INTO PMC_PROJECTS (
      project_id, project_code, project_name, official_name, department, category,
      ward_id, ward_scope, admin_ward_geo_names_json, prabhag_numbers_json,
      location, latitude, longitude, coordinate_source, description, capacity_or_scale,
      estimated_cost, approved_funding, actual_expenditure, project_status,
      physical_progress, start_date, expected_completion_date, financial_year,
      source_url, source_document, source_page_or_table, evidence_note,
      last_updated, verification_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const updateStmt = db.prepare(`
    UPDATE PMC_PROJECTS
    SET project_name = ?, official_name = ?, department = ?, category = ?,
        ward_id = ?, ward_scope = ?, admin_ward_geo_names_json = ?, prabhag_numbers_json = ?,
        location = ?, latitude = ?, longitude = ?, coordinate_source = ?, description = ?,
        estimated_cost = ?, approved_funding = ?, actual_expenditure = ?, project_status = ?,
        physical_progress = ?, start_date = ?, expected_completion_date = ?,
        source_url = ?, source_document = ?, source_page_or_table = ?, evidence_note = ?,
        last_updated = ?, verification_status = ?
    WHERE project_id = ?
  `);

  const revStmt = db.prepare(`
    INSERT INTO PMC_PROJECT_REVISIONS (project_id, previous_snapshot_json, change_summary, changed_at)
    VALUES (?, ?, ?, ?)
  `);

  for (const p of incoming) {
    const match =
      byCode.get(p.projectCode.trim().toLowerCase()) ||
      byNameFy.get(`${p.projectName.trim().toLowerCase()}::${p.financialYear}`);

    if (!match) {
      insertStmt.run(
        p.projectId,
        p.projectCode,
        p.projectName,
        p.officialName,
        p.department,
        p.category,
        p.wardId,
        p.wardScope,
        JSON.stringify(p.adminWardGeoNames),
        JSON.stringify(p.prabhagNumbers2022),
        p.locationSummary,
        p.latitude,
        p.longitude,
        p.coordinateSource ?? null,
        p.description,
        p.capacityOrScale ?? null,
        p.estimatedCostCrores,
        p.approvedFundingCrores,
        p.actualExpenditureCrores,
        p.status,
        p.physicalProgressPercent,
        p.startDate,
        p.expectedCompletionDate,
        p.financialYear,
        p.sourceUrl,
        p.sourceDocument,
        p.sourcePageOrTable,
        p.evidenceNote,
        p.lastUpdated,
        p.verificationStatus
      );
      rowsInserted++;
      byCode.set(p.projectCode.trim().toLowerCase(), p);
      byNameFy.set(`${p.projectName.trim().toLowerCase()}::${p.financialYear}`, p);
      continue;
    }

    const unchanged =
      match.estimatedCostCrores === p.estimatedCostCrores &&
      match.approvedFundingCrores === p.approvedFundingCrores &&
      match.actualExpenditureCrores === p.actualExpenditureCrores &&
      match.status === p.status &&
      match.physicalProgressPercent === p.physicalProgressPercent &&
      match.locationSummary === p.locationSummary;

    if (unchanged) {
      duplicatesSkipped++;
      continue;
    }

    // Preserve previous snapshot before updating
    revStmt.run(
      match.projectId,
      JSON.stringify(match),
      `Updated via ${sourceType} (${sourceName})`,
      nowIso
    );

    updateStmt.run(
      p.projectName,
      p.officialName,
      p.department,
      p.category,
      p.wardId ?? match.wardId,
      p.wardScope,
      JSON.stringify(p.adminWardGeoNames.length ? p.adminWardGeoNames : match.adminWardGeoNames),
      JSON.stringify(p.prabhagNumbers2022.length ? p.prabhagNumbers2022 : match.prabhagNumbers2022),
      p.locationSummary,
      p.latitude ?? match.latitude,
      p.longitude ?? match.longitude,
      p.coordinateSource ?? match.coordinateSource ?? null,
      p.description,
      p.estimatedCostCrores ?? match.estimatedCostCrores,
      p.approvedFundingCrores ?? match.approvedFundingCrores,
      p.actualExpenditureCrores ?? match.actualExpenditureCrores,
      p.status,
      p.physicalProgressPercent ?? match.physicalProgressPercent,
      p.startDate ?? match.startDate,
      p.expectedCompletionDate ?? match.expectedCompletionDate,
      p.sourceUrl,
      p.sourceDocument,
      p.sourcePageOrTable,
      p.evidenceNote,
      p.lastUpdated,
      p.verificationStatus,
      match.projectId
    );
    rowsUpdated++;
  }

  insertImportLog({
    sourceType,
    sourceName,
    datasetType: 'projects',
    fileFormat,
    status: warningsCount > 0 ? 'Partial' : 'Success',
    rowsParsed: incoming.length,
    rowsInserted,
    rowsUpdated,
    duplicatesSkipped,
    warningsCount,
    notes: `Imported ${rowsInserted} new, updated ${rowsUpdated}, skipped ${duplicatesSkipped} duplicates.`,
    importedAt: nowIso
  });

  return { rowsInserted, rowsUpdated, duplicatesSkipped };
}

export function upsertImportedBudgets(
  incoming: PmcDepartmentBudgetRecord[],
  sourceType: ImportHistoryRecord['sourceType'],
  sourceName: string,
  fileFormat: string,
  warningsCount: number
): {
  rowsInserted: number;
  rowsUpdated: number;
  duplicatesSkipped: number;
} {
  const db = getDatabase();
  const existing = listDepartmentBudgetsFromDb();
  const keyMap = new Map<string, PmcDepartmentBudgetRecord>();
  for (const b of existing) {
    keyMap.set(
      `${b.departmentName.trim().toLowerCase()}::${b.budgetHead.trim().toLowerCase()}::${b.financialYear}`,
      b
    );
  }

  let rowsInserted = 0;
  let rowsUpdated = 0;
  let duplicatesSkipped = 0;

  const insertStmt = db.prepare(`
    INSERT INTO PMC_DEPARTMENT_BUDGETS (
      id, department_id, department_name, budget_head, financial_year,
      budget_estimate, revised_estimate, actual_expenditure,
      source_url, document_title, verification_status, notes, last_updated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const updateStmt = db.prepare(`
    UPDATE PMC_DEPARTMENT_BUDGETS
    SET budget_estimate = ?, revised_estimate = ?, actual_expenditure = ?,
        source_url = ?, document_title = ?, verification_status = ?, notes = ?, last_updated = ?
    WHERE id = ?
  `);

  for (const b of incoming) {
    const key = `${b.departmentName.trim().toLowerCase()}::${b.budgetHead.trim().toLowerCase()}::${b.financialYear}`;
    const match = keyMap.get(key);
    if (!match) {
      insertStmt.run(
        b.id,
        b.departmentId,
        b.departmentName,
        b.budgetHead,
        b.financialYear,
        b.budgetEstimateCrores,
        b.revisedEstimateCrores,
        b.actualExpenditureCrores,
        b.sourceUrl,
        b.documentTitle,
        b.verificationStatus,
        b.notes,
        b.lastUpdated
      );
      rowsInserted++;
      keyMap.set(key, b);
      continue;
    }

    const unchanged =
      match.budgetEstimateCrores === b.budgetEstimateCrores &&
      match.revisedEstimateCrores === b.revisedEstimateCrores &&
      match.actualExpenditureCrores === b.actualExpenditureCrores;

    if (unchanged) {
      duplicatesSkipped++;
      continue;
    }

    updateStmt.run(
      b.budgetEstimateCrores ?? match.budgetEstimateCrores,
      b.revisedEstimateCrores ?? match.revisedEstimateCrores,
      b.actualExpenditureCrores ?? match.actualExpenditureCrores,
      b.sourceUrl,
      b.documentTitle,
      b.verificationStatus,
      b.notes,
      b.lastUpdated,
      match.id
    );
    rowsUpdated++;
  }

  insertImportLog({
    sourceType,
    sourceName,
    datasetType: 'budgets',
    fileFormat,
    status: warningsCount > 0 ? 'Partial' : 'Success',
    rowsParsed: incoming.length,
    rowsInserted,
    rowsUpdated,
    duplicatesSkipped,
    warningsCount,
    notes: `Budgets: ${rowsInserted} inserted, ${rowsUpdated} updated, ${duplicatesSkipped} duplicates skipped.`,
    importedAt: new Date().toISOString()
  });

  return { rowsInserted, rowsUpdated, duplicatesSkipped };
}

export function getMapBootstrapPayload() {
  const wards = listWardsFromDb();
  const projects = listProjectsFromDb();
  const departmentBudgets = listDepartmentBudgetsFromDb();
  const importHistory = listImportHistoryFromDb();

  const lastUpdated =
    importHistory[0]?.importedAt ??
    projects[0]?.lastUpdated ??
    INITIAL_REPORTING_DATE;

  return {
    wards,
    projects,
    departmentBudgets,
    publicAssets: ALL_PUBLIC_MAP_ASSETS,
    importHistory,
    lastUpdated,
    dbStats: {
      wardsCount: wards.length,
      projectsCount: projects.length,
      markersCount: projects.filter((p) => p.latitude !== null && p.longitude !== null).length,
      departmentBudgetsCount: departmentBudgets.length,
      publicAssetsCount: ALL_PUBLIC_MAP_ASSETS.length
    }
  };
}
