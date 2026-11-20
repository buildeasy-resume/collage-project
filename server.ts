import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import {
  getDatabase,
  getMapBootstrapPayload,
  getProjectRevisionsFromDb
} from './server/pmcDatabase.ts';
import {
  type IngestionDatasetType,
  fetchAndParseUrl,
  parseUploadedBuffer,
  publishPreviewResult,
  runAutomatedPortalSync
} from './server/pmcIngestion.ts';

const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

function parseDatasetType(raw: unknown): IngestionDatasetType {
  return raw === 'budgets' ? 'budgets' : 'projects';
}

async function startServer() {
  // Initialize SQLite schema & deterministic PMC seed
  getDatabase();

  const app = express();
  app.use(express.json({ limit: '4mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, database: 'pmc_civic.db' });
  });

  app.get('/api/pmc/map-bootstrap', (_req, res) => {
    try {
      res.json(getMapBootstrapPayload());
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to read PMC database.'
      });
    }
  });

  app.get('/api/pmc/projects/:id/history', (req, res) => {
    try {
      const revisions = getProjectRevisionsFromDb(req.params.id);
      res.json({ revisions });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to fetch project revision history.'
      });
    }
  });

  app.post('/api/pmc/import/sync', async (_req, res) => {
    try {
      const sync = await runAutomatedPortalSync();
      res.json({
        sync,
        bootstrap: getMapBootstrapPayload()
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Automated portal sync failed.'
      });
    }
  });

  app.post('/api/pmc/import/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Please select a CSV, Excel (.xlsx/.xls), or PDF file.' });
        return;
      }

      const ext = req.file.originalname.split('.').pop()?.toLowerCase() ?? '';
      if (!['csv', 'xlsx', 'xls', 'pdf'].includes(ext)) {
        res.status(400).json({
          error: 'Unsupported file format. Only CSV, XLSX, XLS, and PDF files are accepted.'
        });
        return;
      }

      const datasetType = parseDatasetType(req.body?.datasetType);
      const action = req.body?.action === 'publish' ? 'publish' : 'preview';

      const preview = await parseUploadedBuffer(
        req.file.buffer,
        req.file.originalname,
        datasetType
      );

      if (action === 'preview') {
        res.json({ preview });
        return;
      }

      const result = publishPreviewResult(preview, 'manual-upload');
      res.json({
        preview,
        result,
        bootstrap: getMapBootstrapPayload()
      });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Failed to parse uploaded file.'
      });
    }
  });

  app.post('/api/pmc/import/url', async (req, res) => {
    try {
      const rawUrl = String(req.body?.url ?? '').trim();
      if (!rawUrl) {
        res.status(400).json({ error: 'Document URL is required.' });
        return;
      }
      const datasetType = parseDatasetType(req.body?.datasetType);
      const action = req.body?.action === 'publish' ? 'publish' : 'preview';

      const preview = await fetchAndParseUrl(rawUrl, datasetType);
      if (action === 'preview') {
        res.json({ preview });
        return;
      }

      const result = publishPreviewResult(preview, 'url-fetch');
      res.json({
        preview,
        result,
        bootstrap: getMapBootstrapPayload()
      });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Failed to fetch or parse URL document.'
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found. Run npm run build.');
      }
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`JanDhan Insights server running at http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
