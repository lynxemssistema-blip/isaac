import express from 'express';
import {
  processEvolutionWebhookPayload,
  getEvolutionIntegrationStatus,
  setEvolutionIntegrationEnabled,
  runDailyInactivityFollowUp,
  sendTestFollowUpToPhone,
} from '../services/evolutionService.js';
import {
  getOutreachDashboardOverview,
  syncEvolutionContactsToDatabase,
  updateOutreachContactName,
  createOrScheduleOutreachCampaign,
  updateCampaignControlStatus,
  sendDirectOutreachPreview,
  updateOutreachSafetyConfig,
  getSavedOutreachTemplates,
  updateSavedOutreachTemplates,
  processOutreachQueueTick,
} from '../services/evolutionOutreachService.js';

const router = express.Router();

// ============================================================================
// 1. WEBHOOK PÚBLICO PARA EVOLUTION API
// URL Oficial: https://isaac.lynxems.com.br/api/webhooks/evolution
// Compatível tanto com webhookByEvents = false quanto webhookByEvents = true
// ============================================================================
router.get('/webhooks/evolution', (req, res) => {
  res.status(200).json({
    status: 'online',
    version: '2.1-unified-chat',
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

router.post('/admin/whatsapp/toggle', async (req, res) => {
  try {
    if (req.user?.role !== 'master') {
      return res.status(403).json({ error: 'Apenas o Superadmin (master) pode ativar ou desativar a Evolution API.' });
    }
    const enabled = Boolean(req.body?.enabled);
    const result = await setEvolutionIntegrationEnabled(enabled, req.user?.id || 'superadmin');
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao alterar estado da Evolution API.', details: err.message });
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

// ============================================================================
// 3. LISTA DE CONTATOS EVOLUTION + AGENDAMENTO ANTI-BAN + CONTROLE DE ENVIOS
// ============================================================================
router.get('/admin/whatsapp/outreach/overview', async (req, res) => {
  try {
    const overview = await getOutreachDashboardOverview({
      search: req.query.search || '',
      filter: req.query.filter || 'all',
      limit: req.query.limit || 2500,
    });
    res.status(200).json(overview);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar painel de contatos e envios WhatsApp.', details: err.message });
  }
});

router.put('/admin/whatsapp/outreach/contacts/:id/name', async (req, res) => {
  try {
    const result = await updateOutreachContactName({
      contactId: req.params.id,
      customName: req.body?.name ?? '',
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Erro ao salvar nome do contato.' });
  }
});

router.post('/admin/whatsapp/outreach/sync-contacts', async (req, res) => {
  try {
    const summary = await syncEvolutionContactsToDatabase();
    res.status(200).json(summary);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao sincronizar contatos da Evolution API.', details: err.message });
  }
});

router.post('/admin/whatsapp/outreach/campaigns', async (req, res) => {
  try {
    const result = await createOrScheduleOutreachCampaign({
      ...(req.body || {}),
      createdBy: req.user?.id || null,
    });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Erro ao programar campanha de envio WhatsApp.' });
  }
});

router.post('/admin/whatsapp/outreach/campaigns/:id/control', async (req, res) => {
  try {
    const action = String(req.body?.action || '').trim();
    if (!['pause', 'resume', 'cancel'].includes(action)) {
      return res.status(400).json({ error: 'Ação inválida. Use pause, resume ou cancel.' });
    }
    const result = await updateCampaignControlStatus(req.params.id, action);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar controle da campanha.', details: err.message });
  }
});

router.post('/admin/whatsapp/outreach/send-preview', async (req, res) => {
  try {
    const result = await sendDirectOutreachPreview({
      phone: req.body?.phone || '31995574906',
      flowType: req.body?.flowType || 'unregistered_invite_image',
      customImageUrl: req.body?.customImageUrl || '',
      customTemplate: req.body?.customTemplate || '',
      createdBy: req.user?.id || null,
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Erro ao disparar prévia controlada.' });
  }
});

router.post('/admin/whatsapp/outreach/process-now', async (req, res) => {
  try {
    const result = await processOutreachQueueTick({ bypassCooldown: Boolean(req.body?.bypassCooldown) });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao processar fila de envios.', details: err.message });
  }
});

router.put('/admin/whatsapp/outreach/safety', async (req, res) => {
  try {
    if (req.user?.role !== 'master') {
      return res.status(403).json({ error: 'Apenas o SuperAdmin (master) pode alterar a Trava de Segurança.' });
    }
    const updated = await updateOutreachSafetyConfig({
      restrictedMode: req.body?.restrictedMode,
      allowedPhones: req.body?.allowedPhones,
      dailyLimit: req.body?.dailyLimit,
      cooldownHours: req.body?.cooldownHours,
      updatedBy: req.user?.id || null,
    });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar Trava de Segurança.', details: err.message });
  }
});

router.get('/admin/whatsapp/outreach/templates', async (req, res) => {
  try {
    const templates = await getSavedOutreachTemplates();
    res.status(200).json(templates);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar modelos de mensagem.', details: err.message });
  }
});

router.put('/admin/whatsapp/outreach/templates', async (req, res) => {
  try {
    const updated = await updateSavedOutreachTemplates({
      unregisteredImageUrl: req.body?.unregisteredImageUrl,
      unregisteredTemplate: req.body?.unregisteredTemplate,
      registeredTemplate: req.body?.registeredTemplate,
      intlUnregisteredTemplate: req.body?.intlUnregisteredTemplate,
      intlRegisteredTemplate: req.body?.intlRegisteredTemplate,
      resetDefaults: req.body?.resetDefaults,
      updatedBy: req.user?.id || null,
    });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar modelos de mensagem do WhatsApp.', details: err.message });
  }
});

export default router;

