import express from 'express';
import {
  processEvolutionWebhookPayload,
  getEvolutionIntegrationStatus,
  runDailyInactivityFollowUp,
  sendTestFollowUpToPhone,
} from '../services/evolutionService.js';

const router = express.Router();

// ============================================================================
// 1. WEBHOOK PÚBLICO PARA EVOLUTION API
// URL Oficial: https://isaac.lynxems.com.br/api/webhooks/evolution
// Compatível tanto com webhookByEvents = false quanto webhookByEvents = true
// ============================================================================
router.get('/webhooks/evolution', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'ISAAC Evolution Webhook Receiver',
    endpoint: 'https://isaac.lynxems.com.br/api/webhooks/evolution',
    supportsEventsSubpath: true,
  });
});

async function handleWebhookRequest(req, res) {
  // Responde 200 imediatamente para evitar retries/fila presa na Evolution API
  res.status(200).json({ received: true });

  setImmediate(async () => {
    try {
      await processEvolutionWebhookPayload(req.params.event || null, req.body || {});
    } catch (err) {
      console.error('⚠️ [Evolution Webhook] Erro ao processar evento:', err.message);
    }
  });
}

router.post('/webhooks/evolution', handleWebhookRequest);
router.post('/webhooks/evolution/:event', handleWebhookRequest);

// ============================================================================
// 2. ROTAS ADMINISTRATIVAS (Protegidas por requireAdmin em server.js)
// ============================================================================
router.get('/admin/whatsapp/status', async (req, res) => {
  try {
    const status = await getEvolutionIntegrationStatus();
    res.status(200).json(status);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao consultar status da Evolution API.', details: err.message });
  }
});

router.post('/admin/whatsapp/run-daily-check', async (req, res) => {
  try {
    const dryRun = Boolean(req.body?.dryRun);
    const result = await runDailyInactivityFollowUp({ dryRun, triggerType: 'admin_manual' });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao executar varredura de follow-up.', details: err.message });
  }
});

router.post('/admin/whatsapp/send-test', async (req, res) => {
  try {
    const phone = String(req.body?.phone || '').trim();
    if (!phone) {
      return res.status(400).json({ error: 'Informe o número de celular para o envio de teste.' });
    }
    const result = await sendTestFollowUpToPhone(phone);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar mensagem de teste no WhatsApp.', details: err.message });
  }
});

export default router;
