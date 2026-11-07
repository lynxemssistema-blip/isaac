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
import { handleForgotPassword, handleTestEmail, handleResetPasswordWithToken } from '../controllers/authController.js';
import {
  getPublicPlans,
  createPixOrder,
  sendSubscriberFeedback,
  getUserSubscriptionStatus,
  getPublicCreator,
} from '../controllers/subscriptionController.js';
import { requireAuth, requireAdmin, requireSelfOrAdmin } from '../middlewares/authMiddleware.js';
import { aiResourceLimiter, authAndMailLimiter } from '../middlewares/rateLimiters.js';

const router = Router();

// Sessões de Conversa do Usuário (Protegidas contra BOLA/IDOR)
router.get('/chat/sessions/:userId', requireSelfOrAdmin('userId'), getUserSessions);
router.post('/chat/sessions', requireSelfOrAdmin('userId'), createUserSession);
router.patch('/chat/sessions/:sessionId', requireAuth, updateUserSession);
router.delete('/chat/sessions/:sessionId', requireAuth, deleteUserSession);

// Perfil do Usuário (Protegido por dono ou Admin)
router.get('/profile/:userId', requireSelfOrAdmin('userId'), getProfile);
router.put('/profile/:userId', requireSelfOrAdmin('userId'), updateProfile);

// Listar agentes ativos para o seletor do chat (Metadados Públicos)
router.get('/agents', getActiveAgents);

// Histórico de Conversas Persistente (Protegido contra BOLA/IDOR)
router.get('/chat/history/:userId', requireSelfOrAdmin('userId'), getChatHistory);
router.delete('/chat/history/:userId', requireSelfOrAdmin('userId'), clearChatHistory);

// Endpoints de Chat com RAG, Orquestração e Memória Contínua
router.post('/chat', requireSelfOrAdmin('userId'), aiResourceLimiter, handleChatMessage);
router.post('/chat/audio', requireSelfOrAdmin('userId'), aiResourceLimiter, handleAudioChatMessage);

// Endpoint de Voz Humanizada (Text-To-Speech com Cache no Supabase Storage)
router.post('/voice', requireAuth, aiResourceLimiter, handleGenerateVoice);

// Rotas de Autenticação e Suporte Oficial (Hostinger SMTP com Rate Limit estrito)
router.post('/auth/forgot-password', authAndMailLimiter, handleForgotPassword);
router.post('/auth/reset-password', authAndMailLimiter, handleResetPasswordWithToken);
router.post('/auth/test-email', requireAdmin, authAndMailLimiter, handleTestEmail);

// Rotas de Planos, Checkout PIX e Suporte para Assinantes
router.get('/plans', getPublicPlans);
router.post('/subscription/pix-order', requireSelfOrAdmin('userId'), createPixOrder);
router.post('/subscription/feedback', requireAuth, authAndMailLimiter, sendSubscriberFeedback);
router.get('/subscription/status/:userId', requireSelfOrAdmin('userId'), getUserSubscriptionStatus);

// Rota do Perfil Público do Idealizador do ISAAC
router.get('/creator', getPublicCreator);

export default router;
