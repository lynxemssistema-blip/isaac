import { Router } from 'express';
import {
  handleChatMessage,
  handleAudioChatMessage,
  getActiveAgents,
  getChatHistory,
  clearChatHistory,
  getUserSessions,
  createUserSession,
  updateUserSession,
  deleteUserSession,
} from '../controllers/chatController.js';
import { handleGenerateVoice } from '../controllers/voiceController.js';
import { getProfile, updateProfile } from '../controllers/profileController.js';

const router = Router();

// Sessões de Conversa do Usuário (Múltiplas Conversas com RAG e Memória Global Unificada)
router.get('/chat/sessions/:userId', getUserSessions);
router.post('/chat/sessions', createUserSession);
router.patch('/chat/sessions/:sessionId', updateUserSession);
router.delete('/chat/sessions/:sessionId', deleteUserSession);

// Perfil do Usuário (Visualização e Edição de Nome, Foto e WhatsApp)
router.get('/profile/:userId', getProfile);
router.put('/profile/:userId', updateProfile);

// Listar agentes ativos para o seletor do chat
router.get('/agents', getActiveAgents);

import { handleForgotPassword, handleTestEmail, handleResetPasswordWithToken } from '../controllers/authController.js';
import {
  getPublicPlans,
  createPixOrder,
  sendSubscriberFeedback,
  getUserSubscriptionStatus,
  getPublicCreator,
} from '../controllers/subscriptionController.js';

// Histórico de Conversas Persistente (Recupera após F5 / Reload)
router.get('/chat/history/:userId', getChatHistory);
router.delete('/chat/history/:userId', clearChatHistory);

// Endpoint de Chat com RAG, Orquestração e Memória Contínua (Texto)
router.post('/chat', handleChatMessage);

// Endpoint de Chat com Áudio (Ouvir, Transcrever, RAG e Persistir no Supabase)
router.post('/chat/audio', handleAudioChatMessage);

// Endpoint de Voz Humanizada (Text-To-Speech com Cache no Supabase Storage)
router.post('/voice', handleGenerateVoice);

// Rotas de Autenticação e Suporte Oficial (Hostinger SMTP)
router.post('/auth/forgot-password', handleForgotPassword);
router.post('/auth/reset-password', handleResetPasswordWithToken);
router.post('/auth/test-email', handleTestEmail);

// Rotas de Planos, Checkout PIX e Suporte para Assinantes
router.get('/plans', getPublicPlans);
router.post('/subscription/pix-order', createPixOrder);
router.post('/subscription/feedback', sendSubscriberFeedback);
router.get('/subscription/status/:userId', getUserSubscriptionStatus);

// Rota do Perfil Público do Idealizador do ISAAC
router.get('/creator', getPublicCreator);

export default router;
