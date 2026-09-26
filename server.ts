import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { 
  analyzeDocumentWithGemini, 
  askQuestionWithGemini, 
  compareDocumentsWithGemini, 
  draftClarificationEmail, 
  explainGeneralLegalTopic, 
  generateProfessionalBriefing 
} from './server/geminiService';
import { 
  SAMPLE_EMPLOYMENT_AGREEMENT, 
  SAMPLE_REVISED_EMPLOYMENT_AGREEMENT, 
  SAMPLE_COMMERCIAL_LEASE, 
  SAMPLE_RESIDENTIAL_RENTAL,
  SAMPLE_SOCIETY_NOTICE,
  SAMPLE_COMPARISON, 
  SAMPLE_LEGAL_INFO_TOPICS 
} from './src/data/sampleDocuments';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for JSON bodies with generous limit for PDF base64 payloads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Routes (Mounted FIRST)
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      product: 'CLAUSETRACE',
      tagline: 'UNDERSTAND. VERIFY. ACT.',
      geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY')
    });
  });

  // Get sample pre-loaded realistic documents
  app.get('/api/sample-documents', (req, res) => {
    res.json({
      documents: [
        SAMPLE_RESIDENTIAL_RENTAL,
        SAMPLE_EMPLOYMENT_AGREEMENT,
        SAMPLE_SOCIETY_NOTICE,
        SAMPLE_COMMERCIAL_LEASE,
        SAMPLE_REVISED_EMPLOYMENT_AGREEMENT,
      ],
      defaultComparison: SAMPLE_COMPARISON,
      legalInfoTopics: SAMPLE_LEGAL_INFO_TOPICS,
    });
  });

  // Flagship Document X-Ray Analysis
  app.post('/api/analyze-document', async (req, res) => {
    try {
      const { title, base64Data, mimeType, textContent } = req.body;
      if (!base64Data && !textContent) {
        return res.status(400).json({ error: 'Please provide either document base64 data or text content.' });
      }

      const result = await analyzeDocumentWithGemini({
        title: title || 'Uploaded Document',
        base64Data,
        mimeType: mimeType || 'application/pdf',
        textContent,
      });

      res.json(result);
    } catch (err: any) {
      console.error('API /api/analyze-document error:', err);
      res.status(500).json({ error: 'Document analysis could not be completed. Please try again.' });
    }
  });

  // Grounded Ask Engine
  app.post('/api/ask', async (req, res) => {
    try {
      const { document, question } = req.body;
      if (!document || !question) {
        return res.status(400).json({ error: 'Document and question are required.' });
      }

      const answer = await askQuestionWithGemini({ document, question });
      res.json(answer);
    } catch (err: any) {
      console.error('API /api/ask error:', err);
      res.status(500).json({ error: 'Failed to process question.' });
    }
  });

  // Compare Two Documents
  app.post('/api/compare', async (req, res) => {
    try {
      const { docA, docB } = req.body;
      if (!docA || !docB) {
        return res.status(400).json({ error: 'Two documents are required for comparison.' });
      }

      const comparison = await compareDocumentsWithGemini({ docA, docB });
      res.json(comparison);
    } catch (err: any) {
      console.error('API /api/compare error:', err);
      res.status(500).json({ error: 'Comparison failed.' });
    }
  });

  // Action Center: Draft Clarification Email
  app.post('/api/draft-email', async (req, res) => {
    try {
      const { findingTitle, category, evidence, section, page, recipientRole } = req.body;
      const draft = await draftClarificationEmail({
        findingTitle: findingTitle || 'Contract Provision',
        category: category || 'General',
        evidence: evidence || '',
        section: section || 'Clause',
        page: Number(page) || 1,
        recipientRole: recipientRole || 'HR Department',
      });
      res.json(draft);
    } catch (err: any) {
      console.error('API /api/draft-email error:', err);
      res.status(500).json({ error: 'Failed to generate email draft.' });
    }
  });

  // General Legal Information (Separated from document evidence)
  app.post('/api/legal-info', async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ error: 'Query is required.' });
      }

      const info = await explainGeneralLegalTopic(query);
      res.json(info);
    } catch (err: any) {
      console.error('API /api/legal-info error:', err);
      res.status(500).json({ error: 'Failed to retrieve legal information.' });
    }
  });

  // Professional Legal Briefing Generator
  app.post('/api/briefing', async (req, res) => {
    try {
      const { document } = req.body;
      if (!document) {
        return res.status(400).json({ error: 'Document is required to generate professional briefing.' });
      }

      const briefing = await generateProfessionalBriefing(document);
      res.json(briefing);
    } catch (err: any) {
      console.error('API /api/briefing error:', err);
      res.status(500).json({ error: 'Failed to generate briefing.' });
    }
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CLAUSETRACE server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
