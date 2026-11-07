import { supabaseAdmin } from '../config/supabase.js';
import {
  sendSubscriptionOrderNotification,
  sendFeedbackToSupport,
} from '../services/emailService.js';
import { getCached, setCached } from '../utils/memoryCache.js';

/**
 * Controller de Planos e Assinaturas (Rotas Públicas e de Usuários)
 */

// 1. Obter lista de planos ativos para exibição no aplicativo (Cache TTL 60s)
export async function getPublicPlans(req, res) {
  try {
    const cached = getCached('plans:public');
    if (cached) return res.status(200).json(cached);

    const { data, error } = await supabaseAdmin
      .from('izaque_plans')
      .select('id, name, price, billing_cycle, description, features, pix_key, pix_key_type, pix_beneficiary, activation_notice, is_active')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) throw error;
    res.status(200).json(setCached('plans:public', data || [], 60_000));
  } catch (error) {
    console.error('❌ Erro ao buscar planos públicos:', error);
    res.status(500).json({ error: 'Erro ao carregar planos disponíveis.' });
  }
}

// 2. Criar pedido de assinatura PIX (Iniciado pelo usuário)
export async function createPixOrder(req, res) {
  try {
    const { planId, userId, userEmail, userName } = req.body;

    if (!planId || !userId || !userEmail) {
      return res.status(400).json({ error: 'Dados incompletos para geração do pedido PIX.' });
    }

    // Busca o plano selecionado
    const { data: plan, error: planError } = await supabaseAdmin
      .from('izaque_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ error: 'Plano selecionado não encontrado ou inativo.' });
    }

    // Registra a intenção de pagamento na tabela izaque_subscriptions
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('izaque_subscriptions')
      .insert({
        user_id: userId,
        user_email: userEmail.trim().toLowerCase(),
        user_name: userName || userEmail.split('@')[0],
        plan_id: plan.id,
        amount: plan.price,
        status: 'pending',
        pix_key_used: plan.pix_key,
        notes: `Pedido PIX gerado pelo app. Aguardando confirmação.`,
      })
      .select()
      .single();

    if (subError) throw subError;

    // Dispara e-mail de notificação para o usuário e alerta para a equipe Lynx
    sendSubscriptionOrderNotification({
      toEmail: userEmail.trim().toLowerCase(),
      userName: userName || '',
      planName: plan.name,
      price: plan.price,
      pixKey: plan.pix_key,
    }).catch((e) => console.warn('Aviso envio e-mail pedido PIX:', e));

    res.status(200).json({
      success: true,
      message: 'Pedido PIX registrado com sucesso!',
      order: subscription,
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        pix_key: plan.pix_key,
        pix_key_type: plan.pix_key_type,
        pix_beneficiary: plan.pix_beneficiary,
        activation_notice: plan.activation_notice,
      },
    });
  } catch (error) {
    console.error('❌ Erro ao criar pedido PIX:', error);
    res.status(500).json({ error: 'Falha ao processar pedido PIX.', details: error.message });
  }
}

// 3. Enviar mensagem de suporte / reclamação / sugestão de assinante
export async function sendSubscriberFeedback(req, res) {
  try {
    const { userId, userEmail, userName, type, subject, message } = req.body;

    if (!userEmail || !subject || !message) {
      return res.status(400).json({ error: 'Por favor, preencha o assunto e a mensagem.' });
    }

    // Busca o plano atual do usuário
    let userPlan = 'free';
    if (userId) {
      const { data: profile } = await supabaseAdmin
        .from('izaque_profiles')
        .select('plan_id')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.plan_id) {
        userPlan = profile.plan_id;
      }
    }

    // Salva no banco para histórico e auditoria
    const { data: feedbackRecord, error: fbError } = await supabaseAdmin
      .from('izaque_feedbacks')
      .insert({
        user_id: userId || null,
        user_email: userEmail.trim().toLowerCase(),
        user_name: userName || userEmail.split('@')[0],
        user_plan: userPlan,
        type: type || 'support',
        subject: subject.trim(),
        message: message.trim(),
        status: 'open',
      })
      .select()
      .single();

    if (fbError) {
      console.warn('⚠️ Erro ao gravar feedback na tabela, prosseguindo com envio de e-mail:', fbError.message);
    }

    // Dispara e-mail oficial para suporte@lynxems.com.br
    await sendFeedbackToSupport({
      fromEmail: userEmail.trim().toLowerCase(),
      userName: userName || userEmail.split('@')[0],
      userPlan,
      type: type || 'support',
      subject: subject.trim(),
      message: message.trim(),
    });

    res.status(200).json({
      success: true,
      message: 'Sua mensagem foi entregue com sucesso à equipe de suporte da Lynx EMS.',
      feedbackId: feedbackRecord?.id,
    });
  } catch (error) {
    console.error('❌ Erro ao processar feedback de assinante:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem de suporte.', details: error.message });
  }
}

// 4. Obter status da assinatura do usuário atual
export async function getUserSubscriptionStatus(req, res) {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'ID de usuário obrigatório.' });
    }

    const { data: profile } = await supabaseAdmin
      .from('izaque_profiles')
      .select('id, plan_id, is_active, plan_status, plan_activated_at, plan_expires_at')
      .eq('id', userId)
      .single();

    const { data: latestOrder } = await supabaseAdmin
      .from('izaque_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    res.status(200).json({
      profile: profile || null,
      latestOrder: latestOrder || null,
    });
  } catch (error) {
    console.error('❌ Erro ao consultar assinatura do usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar dados da assinatura.' });
  }
}

// 5. Obter dados públicos do Idealizador para a Landing Page (Cache TTL 60s)
export async function getPublicCreator(req, res) {
  try {
    const cached = getCached('creator:public');
    if (cached !== undefined) return res.status(200).json(cached);

    const { data, error } = await supabaseAdmin
      .from('izaque_creator')
      .select('name, title, bio, story, quote, image_url, social_instagram, social_linkedin, social_whatsapp, is_visible')
      .eq('id', 'main')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    res.status(200).json(setCached('creator:public', data || null, 60_000));
  } catch (error) {
    console.error('❌ Erro ao buscar dados públicos do idealizador:', error);
    res.status(500).json({ error: 'Erro ao carregar dados do idealizador.' });
  }
}

