import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import chatRoutes from './routes/chatRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import creativeTroubleRoutes from './routes/creativeTroubleRoutes.js';
import pdfCampaignRoutes from './routes/pdfCampaignRoutes.js';
import inscriptionRoutes from './routes/inscriptionRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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

// Middlewares de Segurança e Logging
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN === '*' ? '*' : process.env.CORS_ORIGIN?.split(','),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));
app.use(morgan('dev'));

// Health check para monitoramento na VPS / Easypanel
const healthHandler = (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'IZAQUE API - Backend Orchestrator',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    frontendMounted: fs.existsSync(distPath),
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Rotas da API
app.use('/api', chatRoutes);
app.use('/api', adminRoutes);
app.use('/api', creativeTroubleRoutes);
app.use('/api', pdfCampaignRoutes);
app.use('/api', inscriptionRoutes);

// Servir frontend compilado em produção se o diretório dist existir
if (fs.existsSync(distPath)) {
  console.log(`📦 [Static Assets] Servindo frontend a partir de: ${distPath}`);
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.warn(`⚠️ [Static Assets] dist não encontrado em ${distPath}. Em dev, use o Vite (porta 5173).`);
}

// Fallback para rotas de API inexistentes
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada no servidor IZAQUE API.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 [Unhandled Error]', err);
  res.status(500).json({ error: 'Erro interno no servidor IZAQUE API.' });
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
  console.log(`🚀 [IZAQUE API] Servidor ativo na porta ${PORT}`);
  console.log(`🧠 [RAG Memory] Pronto para gerenciar memórias com Supabase e Gemini`);
  console.log(`📡 [Health Check] Acesse http://localhost:${PORT}/health`);
  console.log(`🌐 [Modo] ${process.env.NODE_ENV || 'development'}`);
  console.log(`====================================================`);
});

process.on('SIGTERM', () => {
  console.log('🛑 [SIGTERM] Encerrando servidor IZAQUE API com graça...');
  server.close(() => {
    console.log('✅ Servidor finalizado com sucesso.');
    process.exit(0);
  });
});
