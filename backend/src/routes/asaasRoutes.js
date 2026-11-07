import express from 'express';
import { requireAuth, requireAdmin } from '../middlewares/authMiddleware.js';
import {
  createOrGetWhatsappSubscriptionCheckout,
  syncUserWhatsappPlanStatus,
  cancelUserWhatsappSubscription,
  processAsaasWebhook,
  getAdminAsaasOverview,
  updateAdminAsaasPlan,
} from '../services/asaasService.js';

const router = express.Router();

// ============================================================================
// 1. WEBHOOK PÚBLICO DO ASAAS v3
// URL Oficial: https://isaac.lynxems.com.br/api/webhooks/asaas
// Autenticado pelo header: asaas-access-token
// ============================================================================
router.get('/webhooks/asaas', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'ISAAC Asaas v3 Webhook Receiver',
    endpoint: 'https://isaac.lynxems.com.br/api/webhooks/asaas',
  });
});

router.post('/webhooks/asaas', async (req, res) => {
  try {
    const result = await processAsaasWebhook(req.headers || {}, req.body || {});
    return res.status(200).json({ received: true, ...result });
  } catch (err) {
    if (err.statusCode === 401) {
      return res.status(401).json({ error: err.message });
    }
    console.error('❌ [Asaas Webhook] Erro ao processar evento:', err.message);
    return res.status(500).json({ error: 'Erro interno ao processar webhook Asaas.' });
  }
});

// ============================================================================
// 2. ROTAS DE ASSINATURA DO PLANO WHATSAPP (R$ 14,99/mês) — Plano Gratuito é 100% livre sem Asaas
// ============================================================================
router.post('/subscriptions/asaas/checkout', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { cpfCnpj, phone } = req.body || {};
    const checkout = await createOrGetWhatsappSubscriptionCheckout({ userId, cpfCnpj, phone });
    res.status(200).json(checkout);
  } catch (err) {
    console.error('❌ [Asaas Checkout] Erro ao gerar assinatura WhatsApp:', err.message);
    res.status(400).json({ error: err.message || 'Falha ao gerar assinatura no Asaas.' });
  }
});

router.get('/subscriptions/asaas/status', requireAuth, async (req, res) => {
  try {
    const status = await syncUserWhatsappPlanStatus(req.user.id);
    res.status(200).json(status);
  } catch (err) {
    console.error('❌ [Asaas Status] Erro ao sincronizar assinatura:', err.message);
    res.status(500).json({ error: err.message || 'Falha ao consultar assinatura.' });
  }
});

router.post('/subscriptions/asaas/cancel', requireAuth, async (req, res) => {
  try {
    const result = await cancelUserWhatsappSubscription(req.user.id);
    res.status(200).json(result);
  } catch (err) {
    console.error('❌ [Asaas Cancel] Erro ao cancelar assinatura:', err.message);
    res.status(500).json({ error: err.message || 'Falha ao cancelar assinatura.' });
  }
});

// ============================================================================
// 3. PAINEL ADMINISTRATIVO DE PLANOS & PAGAMENTOS ASAAS (SUPERADMIN / ADMIN)
// ============================================================================
router.get('/admin/asaas/overview', requireAdmin, async (req, res) => {
  try {
    const overview = await getAdminAsaasOverview();
    res.status(200).json(overview);
  } catch (err) {
    console.error('❌ [Admin Asaas Overview] Erro:', err.message);
    res.status(500).json({ error: err.message || 'Falha ao carregar painel Asaas.' });
  }
});

router.put('/admin/asaas/plan', requireAdmin, async (req, res) => {
  try {
    if (req.user?.role !== 'master') {
      return res.status(403).json({ error: 'Apenas o SuperAdmin pode alterar valores do plano no Asaas.' });
    }
    const result = await updateAdminAsaasPlan(req.body || {});
    res.status(200).json(result);
  } catch (err) {
    console.error('❌ [Admin Asaas Plan Update] Erro:', err.message);
    res.status(400).json({ error: err.message || 'Falha ao sincronizar plano com o Asaas.' });
  }
});

export default router;

