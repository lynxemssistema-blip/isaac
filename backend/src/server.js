import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import chatRoutes from './routes/chatRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import creativeTroubleRoutes from './routes/creativeTroubleRoutes.js';
import pdfCampaignRoutes from './routes/pdfCampaignRoutes.js';
import inscriptionRoutes from './routes/inscriptionRoutes.js';
import evolutionRoutes from './routes/evolutionRoutes.js';
import { startEvolutionDailyScheduler } from './services/evolutionService.js';
import { requireAdmin } from './middlewares/authMiddleware.js';
import { apiGeneralLimiter } from './middlewares/rateLimiters.js';
import {
  handleRobotsTxt,
  handleSitemapXml,
  handleLlmsTxt,
  handleLlmsFullTxt,
  handlePublicTopicsList,
  handlePublicTopicBySlug,
  serveSeoHtml,
} from './services/seoService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Confiar no proxy reverso (Traefik / Easypanel / Nginx) para IP real no Rate Limit e logs LGPD
app.set('trust proxy', 1);

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Busca o diretório compilado do frontend em múltiplos caminhos (Docker monólito, VPS e dev)
const candidateDistPaths = [
  path.resolve(__dirname, '../../frontend/dist'),      // Estrutura Docker (/app/backend/src -> /app/frontend/dist)
  path.resolve(__dirname, '../frontend/dist'),
  path.resolve(process.cwd(), 'frontend/dist'),        // Executado a partir da raiz
  path.resolve(process.cwd(), '../frontend/dist'),     // Executado de backend/
  path.resolve(process.cwd(), 'dist'),
];
const distPath = candidateDistPaths.find((p) => fs.existsSync(p)) || candidateDistPaths[0];

// Middlewares de Segurança, Compressão e Logging
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(compression());
app.use(
  cors({
    origin:
      !process.env.CORS_ORIGIN || process.env.CORS_ORIGIN === '*'
        ? '*'
        : process.env.CORS_ORIGIN.split(',').map((o) => o.trim()),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Limite de 2MB padrão contra DoS de memória; 25MB exclusivo para rotas de áudio e upload de PDF/documentos
const defaultJsonParser = express.json({ limit: '2mb' });
const largeUploadJsonParser = express.json({ limit: '25mb' });
app.use((req, res, next) => {
  const isLargeUpload =
    req.path === '/api/chat/audio' ||
    req.path.startsWith('/api/webhooks/evolution') ||
    req.path.startsWith('/api/admin/pdf-campaigns') ||
    /^\/api\/admin\/agents\/[^/]+\/documents/.test(req.path);
  return isLargeUpload ? largeUploadJsonParser(req, res, next) : defaultJsonParser(req, res, next);
});
app.use(express.urlencoded({ limit: '2mb', extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'short' : 'dev'));

// Health check para monitoramento na VPS / Easypanel
const healthHandler = (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'ISAAC API - Backend Orchestrator',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    frontendMounted: fs.existsSync(distPath),
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Endpoints Oficiais de SEO Tradicional & SEO para IA (GEO / AEO / LLMO)
app.get('/robots.txt', handleRobotsTxt);
app.get('/sitemap.xml', handleSitemapXml);
app.get('/llms.txt', handleLlmsTxt);
app.get('/llms-full.txt', handleLlmsFullTxt);

// Rate Limit geral (exceto webhook oficial de eventos da Evolution API) e Barreira Global Zero-Trust /api/admin/*
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/webhooks/evolution')) return next();
  return apiGeneralLimiter(req, res, next);
});
app.get('/api/public/topics', handlePublicTopicsList);
app.get('/api/public/topics/:slug', handlePublicTopicBySlug);
app.use('/api/admin', requireAdmin);

// Rotas da API
app.use('/api', evolutionRoutes);
app.use('/api', chatRoutes);
app.use('/api', adminRoutes);
app.use('/api', creativeTroubleRoutes);
app.use('/api', pdfCampaignRoutes);
app.use('/api', inscriptionRoutes);

// Servir frontend compilado em produção se o diretório dist existir
if (fs.existsSync(distPath)) {
  console.log(`📦 [Static Assets] Servindo frontend a partir de: ${distPath}`);
  app.use(
    express.static(distPath, {
      index: false, // Permite que '/' passe pelo injetor SSR dinâmico de Meta/JSON-LD/Shell
      setHeaders: (res, filePath) => {
        if (filePath.includes(`${path.sep}assets${path.sep}`) || filePath.includes('/assets/')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (
          filePath.endsWith('.jpg') ||
          filePath.endsWith('.png') ||
          filePath.endsWith('.svg') ||
          filePath.endsWith('.webmanifest')
        ) {
          res.setHeader('Cache-Control', 'public, max-age=86400');
        }
      },
    })
  );
  app.get('*', async (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health' || req.path.startsWith('/assets/')) {
      return next();
    }
    try {
      await serveSeoHtml(req, res, distPath);
    } catch (seoErr) {
      console.warn('⚠️ [SEO Fallback] Servindo index.html estático:', seoErr.message);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
} else {
  console.warn(`⚠️ [Static Assets] dist não encontrado em ${distPath}. Em dev, use o Vite (porta 5173).`);
}

// Fallback para rotas de API inexistentes
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada no servidor ISAAC API.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 [Unhandled Error]', err);
  res.status(500).json({ error: 'Erro interno no servidor ISAAC API.' });
});

// Proteções contra crash do processo em produção
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ [Unhandled Rejection at Promise]:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('🔥 [Uncaught Exception]:', err);
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 [ISAAC API] Servidor ativo na porta ${PORT}`);
  console.log(`🧠 [RAG Memory] Pronto para gerenciar memórias com Supabase e Gemini`);
  console.log(`📡 [Health Check] Acesse http://localhost:${PORT}/health`);
  console.log(`🌐 [Modo] ${process.env.NODE_ENV || 'development'}`);
  console.log(`====================================================`);
  startEvolutionDailyScheduler();
});

process.on('SIGTERM', () => {
  console.log('🛑 [SIGTERM] Encerrando servidor ISAAC API com graça...');
  server.close(() => {
    console.log('✅ Servidor finalizado com sucesso.');
    process.exit(0);
  });
});
