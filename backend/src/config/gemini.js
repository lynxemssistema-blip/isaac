import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Tenta carregar o .env de múltiplos locais (funciona em dev com nodemon, Docker e VPS)
const envCandidates = [
  path.resolve(__dirname, '../../.env'),    // relativo a src/config/ → backend/.env
  path.resolve(process.cwd(), '.env'),       // CWD (nodemon executa em backend/)
  path.resolve(process.cwd(), 'backend/.env'), // CWD na raiz do projeto
];
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) { dotenv.config({ path: envPath }); break; }
}

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('====================================================');
  console.error('❌ [FATAL] GEMINI_API_KEY não foi configurada!');
  console.error('📝 Configure a variável de ambiente no painel do Easypanel/VPS.');
  console.error('====================================================');
}

export const genAI = new GoogleGenerativeAI(apiKey || 'placeholder');

// Proteção para Produção / Easypanel:
// Se o usuário tiver configurado um modelo descontinuado pelo Google (ex: gemini-2.0-flash ou gemini-2.5-flash),
// redirecionamos automaticamente para gemini-3.6-flash para evitar 404/500 no Easypanel.
let rawChatModel = (process.env.GEMINI_CHAT_MODEL || '').trim();
if (!rawChatModel || rawChatModel.includes('2.0-flash') || rawChatModel.includes('2.5-flash')) {
  rawChatModel = 'gemini-3.6-flash';
}

export const CHAT_MODEL = rawChatModel;

// Proteção de Embedding para Produção:
// text-embedding-004 e embedding-001 retornam 404 com a chave na API v1beta do Gemini.
// gemini-embedding-001 é o modelo oficial compatível e suporta outputDimensionality: 768.
let rawEmbeddingModel = (process.env.GEMINI_EMBEDDING_MODEL || '').trim();
if (!rawEmbeddingModel || rawEmbeddingModel.includes('text-embedding-004') || rawEmbeddingModel === 'embedding-001') {
  rawEmbeddingModel = 'gemini-embedding-001';
}

export const EMBEDDING_MODEL = rawEmbeddingModel;
export const FALLBACK_CHAT_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];
