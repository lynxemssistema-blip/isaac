import { supabaseAdmin } from '../config/supabase.js';
import { genAI, CHAT_MODEL, FALLBACK_CHAT_MODELS } from '../config/gemini.js';
import {
  sendSubscriptionApprovedNotification,
  generateBroadcastEmailDraft,
  sendBroadcastEmail,
  renderBroadcastEmailHtml,
  sendTaskReminderEmail,
  sendTaskCompletedEmail,
} from '../services/emailService.js';
import { getCached, setCached, invalidateCache } from '../utils/memoryCache.js';
import { invalidateAuthCache } from '../middlewares/authMiddleware.js';
import {
  sendWhatsAppTextSafe,
  resolveWhatsAppJid,
  isEvolutionEnabledInDatabase,
} from '../services/evolutionService.js';
import {
  invalidateEdsonVoiceCache,
  normalizeGeminiVoiceId,
  prewarmDemoVoice,
} from './voiceController.js';
import {
  saveActiveAiConfig,
  getAiEngineLiveStatus,
  runAiEngineLiveTest,
  normalizeAiConfig,
} from '../services/aiProviderService.js';

/**
 * Controller Administrativo (Exclusivo para Super Admin / Master)
 */

// 1. Obter métricas gerais do sistema
export async function getAdminMetrics(req, res) {
  try {
    const [usersRes, inscriptionsRes, memoriesRes, agentsRes] = await Promise.all([
      supabaseAdmin.from('izaque_profiles').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('izaque_inscriptions').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('izaque_user_memories').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('izaque_agents').select('id', { count: 'exact', head: true }),
    ]);

    // Contagem de memórias por categoria
    const { data: categoryStats } = await supabaseAdmin
      .from('izaque_user_memories')
      .select('category');

    const categoriesCount = (categoryStats || []).reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + 1;
      return acc;
    }, {});

    const appUsersCount = usersRes.count || 0;
    const inscriptionsCount = inscriptionsRes.count || 0;

    res.status(200).json({
      totalUsers: appUsersCount + inscriptionsCount,
      appUsersCount,
      inscriptionsCount,
      totalMemories: memoriesRes.count || 0,
      totalAgents: agentsRes.count || 0,
      categoriesCount,
    });
  } catch (error) {
    console.error('❌ Erro ao buscar métricas admin:', error);
    res.status(500).json({ error: 'Erro ao buscar métricas.' });
  }
}

// 2. Listar todos os usuários com perfis + inscritos da ficha simples (/inscricao)
export async function getAdminUsers(req, res) {
  try {
    const [profilesRes, inscriptionsRes] = await Promise.all([
      supabaseAdmin
        .from('izaque_profiles')
        .select('*')
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('izaque_inscriptions')
        .select('*')
        .order('created_at', { ascending: false }),
    ]);

    if (profilesRes.error) throw profilesRes.error;

    const appUsers = (profilesRes.data || []).map((u) => ({
      ...u,
      account_type: 'app',
      is_inscription: false,
    }));

    const inscriptionUsers = (inscriptionsRes.data || []).map((i) => ({
      id: i.id,
      full_name: i.full_name,
      email: i.email || null,
      phone: i.phone || null,
      notes: i.notes || null,
      is_active: i.is_active !== false,
      role: 'inscrito',
      plan_id: null,
      account_type: 'inscricao',
      is_inscription: true,
      created_at: i.created_at,
      updated_at: i.updated_at,
    }));

    const unified = [...appUsers, ...inscriptionUsers].sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );

    res.status(200).json(unified);
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao listar usuários.' });
  }
}

// 3. Atualizar role de usuário (ex: promover a admin/master)
export async function updateUserRole(req, res) {
  try {
    const { userId, role } = req.body;
    if (!userId || !['master', 'admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Dados inválidos para atualização de role.' });
    }

    const { data, error } = await supabaseAdmin
      .from('izaque_profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    invalidateAuthCache();
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Erro ao alterar role:', error);
    res.status(500).json({ error: 'Erro ao alterar role do usuário.' });
  }
}

// 4. Listar memórias de longo prazo (RAG) com informações de usuário
export async function getAdminMemories(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('izaque_user_memories')
      .select(`
        id,
        user_id,
        content,
        category,
        importance_score,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Erro ao listar memórias:', error);
    res.status(500).json({ error: 'Erro ao listar memórias.' });
  }
}

// 5. Listar e gerenciar Agentes/Mentores
export async function getAdminAgents(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('izaque_agents')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Erro ao listar agentes:', error);
    res.status(500).json({ error: 'Erro ao listar agentes.' });
  }
}

// 6. Atualizar System Prompt ou Temperatura do Agente
export async function updateAdminAgent(req, res) {
  try {
    const { id } = req.params;
    const { system_prompt, temperature, name, is_active, starter_questions } = req.body;

    const updatePayload = {
      system_prompt,
      temperature,
      name,
      is_active,
      updated_at: new Date().toISOString(),
    };

    if (starter_questions !== undefined) {
      updatePayload.starter_questions = starter_questions;
    }

    const { data, error } = await supabaseAdmin
      .from('izaque_agents')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    invalidateCache('agents:active_full');
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Erro ao atualizar agente:', error);
    res.status(500).json({ error: 'Erro ao atualizar agente.' });
  }
}

// 7. Criar novo Agente Especialista
export async function createAdminAgent(req, res) {
  try {
    const { name, slug, type = 'mindset', system_prompt, temperature = 0.7, starter_questions = [] } = req.body;

    if (!name || !system_prompt) {
      return res.status(400).json({ error: 'Nome e System Prompt são obrigatórios.' });
    }

    // Gerar slug caso não informado
    const finalSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4));

    const { data, error } = await supabaseAdmin
      .from('izaque_agents')
      .insert({
        name: name.trim(),
        slug: finalSlug,
        type: type.toLowerCase(),
        system_prompt: system_prompt.trim(),
        temperature: Number(temperature) || 0.7,
        starter_questions,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    invalidateCache('agents:active_full');
    console.log(`🤖 [ISAAC Multi-Agent] Novo especialista criado: "${data.name}" (${data.slug})`);
    res.status(201).json(data);
  } catch (error) {
    console.error('❌ Erro ao criar agente:', error);
    res.status(500).json({ error: 'Erro ao cadastrar agente.', details: error.message });
  }
}

// 8. Excluir Agente Especialista (exceto izaque-master / isaac-master)
export async function deleteAdminAgent(req, res) {
  try {
    const { id } = req.params;

    // Proteção para não excluir o mestre
    const { data: agent } = await supabaseAdmin
      .from('izaque_agents')
      .select('slug')
      .eq('id', id)
      .single();

    if (agent?.slug === 'izaque-master' || agent?.slug === 'isaac-master') {
      return res.status(400).json({ error: 'O Agente Mestre ISAAC não pode ser excluído.' });
    }

    const { error } = await supabaseAdmin
      .from('izaque_agents')
      .delete()
      .eq('id', id);

    if (error) throw error;
    invalidateCache('agents:active_full');
    res.status(200).json({ message: 'Agente removido com sucesso.' });
  } catch (error) {
    console.error('❌ Erro ao excluir agente:', error);
    res.status(500).json({ error: 'Erro ao excluir agente.' });
  }
}

// 9. Inserir arquivo/texto de estudo na base de conhecimento do agente
export async function uploadAgentDocument(req, res) {
  try {
    const { id } = req.params; // agentId
    const { title, content, fileBase64, mimeType, fileType = 'text' } = req.body;

    if (!title || (!content && !fileBase64)) {
      return res.status(400).json({ error: 'Título e conteúdo ou arquivo de estudo são obrigatórios.' });
    }

    let finalContent = content || '';

    // Se o arquivo for binário (ex: PDF ou documento), extrai texto integralmente via Gemini Multimodal
    if (fileBase64 && (!finalContent || finalContent.trim().length === 0)) {
      console.log(`📑 [Agent Grounding] Extraindo texto de documento binário via Gemini (${mimeType || 'application/pdf'})...`);
      const modelsToTry = [CHAT_MODEL, ...(FALLBACK_CHAT_MODELS || [])].filter((m, i, arr) => arr.indexOf(m) === i);
      let extractedSuccess = false;

      for (const modelCandidate of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({ model: modelCandidate });
          const extractRes = await model.generateContent([
            {
              inlineData: {
                data: fileBase64,
                mimeType: mimeType || 'application/pdf',
              },
            },
            'Você é um extrator de literatura técnica, livros e manuais para especialização de IA. Extraia e transcreva integralmente todo o conteúdo textual, tópicos, definições, frameworks e metodologias deste arquivo em português claro. Não faça resumos, preserve o texto completo.',
          ]);
          finalContent = extractRes.response.text();
          if (finalContent) {
            extractedSuccess = true;
            break;
          }
        } catch (mErr) {
          if (mErr.message && (mErr.message.includes('404') || mErr.message.includes('not found'))) {
            console.warn(`⚠️ [Document Fallback] Modelo ${modelCandidate} não encontrado, tentando alternativa...`);
            continue;
          }
          throw mErr;
        }
      }
    }

    if (!finalContent || finalContent.trim().length === 0) {
      return res.status(400).json({ error: 'Não foi possível extrair texto do documento para estudo.' });
    }

    const { ingestAgentDocument } = await import('../services/agentKnowledgeService.js');
    const document = await ingestAgentDocument({
      agentId: id,
      title,
      content: finalContent,
      fileType,
    });

    res.status(201).json(document);
  } catch (error) {
    console.error('❌ Erro ao processar documento do agente:', error);
    res.status(500).json({ error: 'Erro ao ingerir documento de estudo.', details: error.message });
  }
}

// 10. Listar documentos de estudo de um agente
export async function getAgentDocuments(req, res) {
  try {
    const { id } = req.params; // agentId
    const { data, error } = await supabaseAdmin
      .from('izaque_agent_documents')
      .select('*')
      .eq('agent_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('❌ Erro ao buscar documentos do agente:', error);
    res.status(500).json({ error: 'Erro ao listar documentos de estudo.' });
  }
}

// 11. Excluir documento de estudo e seus vetores no pgvector
export async function deleteAgentDocument(req, res) {
  try {
    const { docId } = req.params;
    const { error } = await supabaseAdmin
      .from('izaque_agent_documents')
      .delete()
      .eq('id', docId);

    if (error) throw error;
    res.status(200).json({ message: 'Documento e vetores de estudo removidos.' });
  } catch (error) {
    console.error('❌ Erro ao excluir documento:', error);
    res.status(500).json({ error: 'Erro ao excluir documento.' });
  }
}

// 12. Obter trechos (chunks) vetorizados de um documento para inspeção
export async function getAgentDocumentChunks(req, res) {
  try {
    const { docId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('izaque_agent_knowledge')
      .select('id, content, created_at')
      .eq('document_id', docId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('❌ Erro ao buscar trechos do documento:', error);
    res.status(500).json({ error: 'Erro ao carregar trechos do documento.' });
  }
}

// ==========================================
// GESTÃO DE PLANOS, PREÇOS E DADOS PIX (SUPERADMIN)
// ==========================================

// 13. Listar todos os planos cadastrados para edição
export async function getAdminPlans(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('izaque_plans')
      .select('*')
      .order('price', { ascending: true });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('❌ Erro ao listar planos admin:', error);
    res.status(500).json({ error: 'Erro ao carregar planos para administração.' });
  }
}

// 14. Atualizar valores, chave PIX e dados de um plano específico
export async function updateAdminPlan(req, res) {
  try {
    const { id } = req.params;
    const {
      name,
      price,
      billing_cycle,
      description,
      features,
      pix_key,
      pix_key_type,
      pix_beneficiary,
      activation_notice,
      is_active,
    } = req.body;

    const updates = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name.trim();
    if (price !== undefined) updates.price = Number(price);
    if (billing_cycle !== undefined) updates.billing_cycle = billing_cycle;
    if (description !== undefined) updates.description = description;
    if (features !== undefined) updates.features = Array.isArray(features) ? features : [];
    if (pix_key !== undefined) updates.pix_key = pix_key.trim();
    if (pix_key_type !== undefined) updates.pix_key_type = pix_key_type.trim();
    if (pix_beneficiary !== undefined) updates.pix_beneficiary = pix_beneficiary.trim();
    if (activation_notice !== undefined) updates.activation_notice = activation_notice.trim();
    if (is_active !== undefined) updates.is_active = Boolean(is_active);

    const { data, error } = await supabaseAdmin
      .from('izaque_plans')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    invalidateCache('plans:public');
    invalidateCache('seo:public_snapshot');

    console.log(`✅ [Plan Updated] Plano ${id} atualizado pelo Superadmin. Preço: R$ ${data.price}, Chave PIX: ${data.pix_key}`);
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Erro ao atualizar plano:', error);
    res.status(500).json({ error: 'Falha ao salvar alterações do plano.', details: error.message });
  }
}

// ==========================================
// GESTÃO DE ACESSO E PLANOS DE CLIENTES (SUPERADMIN)
// ==========================================

// 15. Ativar ou Bloquear/Desativar o acesso geral de um cliente (ou ficha de inscrição)
export async function updateUserStatus(req, res) {
  try {
    const { userId, isActive } = req.body;

    if (!userId || isActive === undefined) {
      return res.status(400).json({ error: 'ID de usuário e status isActive obrigatórios.' });
    }

    const now = new Date().toISOString();
    const { data: profileData, error: profileErr } = await supabaseAdmin
      .from('izaque_profiles')
      .update({
        is_active: Boolean(isActive),
        updated_at: now,
      })
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (profileErr) throw profileErr;

    if (profileData) {
      invalidateAuthCache();
      console.log(`👤 [User Access] Usuário ${userId} status alterado para: ${isActive ? 'ATIVO' : 'BLOQUEADO'}`);
      return res.status(200).json(profileData);
    }

    const { data: inscData, error: inscErr } = await supabaseAdmin
      .from('izaque_inscriptions')
      .update({
        is_active: Boolean(isActive),
        updated_at: now,
      })
      .eq('id', userId)
      .select()
      .single();

    if (inscErr) throw inscErr;

    console.log(`📋 [Inscription Status] Ficha ${userId} status alterado para: ${isActive ? 'ATIVO' : 'INATIVO'}`);
    res.status(200).json(inscData);
  } catch (error) {
    console.error('❌ Erro ao alterar status de acesso do usuário:', error);
    res.status(500).json({ error: 'Erro ao alterar status de acesso do usuário.' });
  }
}

// 16. Ativar ou alterar o plano de um usuário manualmente
export async function updateUserPlan(req, res) {
  try {
    const { userId, planId, planStatus, planExpiresAt } = req.body;

    if (!userId || !planId) {
      return res.status(400).json({ error: 'ID do usuário e plano são obrigatórios.' });
    }

    const updates = {
      plan_id: planId,
      plan_status: planStatus || 'active',
      updated_at: new Date().toISOString(),
    };

    if (planId !== 'free') {
      updates.plan_activated_at = new Date().toISOString();
      if (planExpiresAt) {
        updates.plan_expires_at = planExpiresAt;
      }
    } else {
      updates.plan_expires_at = null;
    }

    const { data, error } = await supabaseAdmin
      .from('izaque_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    console.log(`💎 [User Plan Updated] Usuário ${userId} teve o plano alterado para: ${planId}`);
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Erro ao atualizar plano do usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar plano do usuário.' });
  }
}

// 17. Listar todos os pedidos e assinaturas PIX
export async function getAdminSubscriptions(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('izaque_subscriptions')
      .select(`
        *,
        plan:izaque_plans(name, billing_cycle)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('❌ Erro ao buscar assinaturas admin:', error);
    res.status(500).json({ error: 'Erro ao carregar pedidos de assinatura.' });
  }
}

// 18. Aprovar pedido PIX e ativar plano do cliente imediatamente
export async function approveSubscription(req, res) {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    // Busca a assinatura
    const { data: sub, error: subErr } = await supabaseAdmin
      .from('izaque_subscriptions')
      .select('*, plan:izaque_plans(name, billing_cycle)')
      .eq('id', id)
      .single();

    if (subErr || !sub) {
      return res.status(404).json({ error: 'Pedido de assinatura não encontrado.' });
    }

    // Calcula validade (30 dias para mensal, 365 dias para anual)
    const now = new Date();
    const expiresAt = new Date(now);
    if (sub.plan?.billing_cycle === 'annual') {
      expiresAt.setDate(expiresAt.getDate() + 365);
    } else {
      expiresAt.setDate(expiresAt.getDate() + 30);
    }

    // 1. Atualiza a assinatura para 'active'
    await supabaseAdmin
      .from('izaque_subscriptions')
      .update({
        status: 'active',
        approved_at: now.toISOString(),
        approved_by: adminId || null,
      })
      .eq('id', id);

    // 2. Atualiza o perfil do usuário
    const { data: updatedProfile, error: profErr } = await supabaseAdmin
      .from('izaque_profiles')
      .update({
        plan_id: sub.plan_id,
        plan_status: 'active',
        plan_activated_at: now.toISOString(),
        plan_expires_at: expiresAt.toISOString(),
        is_active: true, // Garante que o acesso está ativo
        updated_at: now.toISOString(),
      })
      .eq('id', sub.user_id)
      .select()
      .single();

    if (profErr) throw profErr;

    // 3. Envia e-mail de parabéns e ativação para o cliente
    sendSubscriptionApprovedNotification({
      toEmail: sub.user_email,
      userName: sub.user_name,
      planName: sub.plan?.name || sub.plan_id,
    }).catch((e) => console.warn('Aviso ao enviar e-mail de aprovação:', e));

    console.log(`🎉 [Subscription Approved] Assinatura ${id} aprovada para ${sub.user_email}!`);
    res.status(200).json({
      success: true,
      message: `Plano ${sub.plan?.name || sub.plan_id} ativado com sucesso para ${sub.user_email}!`,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('❌ Erro ao aprovar assinatura:', error);
    res.status(500).json({ error: 'Falha ao aprovar assinatura.', details: error.message });
  }
}

// 19. Listar feedbacks, sugestões e reclamações recebidas de clientes
export async function getAdminFeedbacks(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('izaque_feedbacks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('❌ Erro ao buscar feedbacks:', error);
    res.status(500).json({ error: 'Erro ao carregar mensagens de suporte.' });
  }
}

// 20. Obter perfil do Idealizador do ISAAC
export async function getAdminCreator(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('izaque_creator')
      .select('*')
      .eq('id', 'main')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    res.status(200).json(data || {});
  } catch (error) {
    console.error('❌ Erro ao buscar dados do idealizador:', error);
    res.status(500).json({ error: 'Erro ao carregar dados do idealizador.' });
  }
}

// 21. Atualizar perfil do Idealizador pelo Super Admin
export async function updateAdminCreator(req, res) {
  try {
    const {
      name,
      title,
      bio,
      story,
      quote,
      image_url,
      social_instagram,
      social_linkedin,
      social_whatsapp,
      is_visible,
    } = req.body;

    const { data, error } = await supabaseAdmin
      .from('izaque_creator')
      .upsert({
        id: 'main',
        name: name || 'Edson Manoel',
        title: title || 'Idealizador & Criador do ISAAC',
        bio: bio || '',
        story: story || '',
        quote: quote || '',
        image_url: image_url || '',
        social_instagram: social_instagram || null,
        social_linkedin: social_linkedin || null,
        social_whatsapp: social_whatsapp || null,
        is_visible: is_visible !== undefined ? is_visible : true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    invalidateCache('creator:public');
    invalidateCache('seo:public_snapshot');
    res.status(200).json({
      success: true,
      message: 'Perfil do Idealizador atualizado com sucesso!',
      creator: data,
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar perfil do idealizador:', error);
    res.status(500).json({ error: 'Falha ao salvar dados do idealizador.', details: error.message });
  }
}

/**
 * 23. Solicita ao Gemini para redigir o e-mail de novidades detalhista e humanizado
 * POST /api/admin/broadcast/draft
 */
export async function generateBroadcastDraftController(req, res) {
  try {
    const { topic, targetAudience = 'all', extraPrompt = '' } = req.body;
    console.log('✍️ [Admin Broadcast] Solicitando ao Gemini redação do e-mail de novidades...');

    const draft = await generateBroadcastEmailDraft({
      topic,
      targetAudience,
      extraPrompt,
    });

    const appUrl = (process.env.APP_URL || 'https://isaac.lynxems.com.br').replace(/\/$/, '');
    const previewHtml = renderBroadcastEmailHtml({
      contentHtml: draft.bodyHtml,
      userName: 'Viajante',
      appUrl,
      callToActionText: draft.callToActionText || 'Visitar Meu Refúgio Agora',
    });

    res.status(200).json({
      success: true,
      draft,
      previewHtml,
    });
  } catch (error) {
    console.error('❌ Erro ao gerar rascunho de e-mail com IA:', error);
    res.status(500).json({
      error: 'Erro ao redigir e-mail com IA.',
      details: error.message,
    });
  }
}

/**
 * 24. Estatísticas de público para envio em massa
 * GET /api/admin/broadcast/stats
 */
export async function getBroadcastStatsController(req, res) {
  try {
    const [profilesRes, inscriptionsRes] = await Promise.all([
      supabaseAdmin
        .from('izaque_profiles')
        .select('id, email, plan_id, is_active')
        .not('email', 'is', null)
        .neq('is_active', false),
      supabaseAdmin
        .from('izaque_inscriptions')
        .select('id, email, is_active')
        .not('email', 'is', null)
        .neq('is_active', false),
    ]);

    if (profilesRes.error) throw profilesRes.error;

    const validProfiles = (profilesRes.data || []).filter((u) => u.email && u.email.includes('@'));
    const seenEmails = new Set(validProfiles.map((u) => u.email.trim().toLowerCase()));

    const extraInscriptions = (inscriptionsRes.data || []).filter((i) => {
      if (!i.email || !i.email.includes('@')) return false;
      const key = i.email.trim().toLowerCase();
      if (seenEmails.has(key)) return false;
      seenEmails.add(key);
      return true;
    });

    const subscribers = validProfiles.filter((u) => u.plan_id && u.plan_id !== 'free').length;
    const freeUsers =
      validProfiles.filter((u) => !u.plan_id || u.plan_id === 'free').length +
      extraInscriptions.length;
    const totalUsers = validProfiles.length + extraInscriptions.length;

    res.status(200).json({
      totalUsers,
      subscribers,
      freeUsers,
      inscriptionsWithEmail: extraInscriptions.length,
      smtpUser: process.env.SMTP_USER || 'suporte@lynxems.com.br',
      smtpHost: process.env.SMTP_HOST || 'smtp.hostinger.com',
    });
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas de público para e-mail:', error);
    res.status(500).json({ error: 'Falha ao buscar estatísticas de e-mail.', details: error.message });
  }
}

/**
 * 25. Disparo oficial do e-mail em massa para os usuários
 * POST /api/admin/broadcast/send
 */
export async function sendBroadcastMessageController(req, res) {
  try {
    const {
      subject,
      htmlContent,
      callToActionText = 'Visitar Meu Refúgio Agora',
      callToActionUrl = '',
      targetAudience = 'all',
      testEmail = null,
    } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: 'O assunto do e-mail é obrigatório.' });
    }

    if (!htmlContent || !htmlContent.trim()) {
      return res.status(400).json({ error: 'O conteúdo da mensagem é obrigatório.' });
    }

    console.log(`🚀 [Admin Broadcast] Iniciando disparo de e-mail (Público: ${targetAudience})...`);

    const result = await sendBroadcastEmail({
      subject: subject.trim(),
      htmlContent: htmlContent.trim(),
      callToActionText: callToActionText?.trim() || 'Visitar Meu Refúgio Agora',
      callToActionUrl: callToActionUrl ? String(callToActionUrl).trim() : '',
      targetAudience,
      testEmail,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Erro no disparo de broadcast de e-mail:', error);
    res.status(500).json({
      error: 'Falha ao disparar e-mails para os usuários.',
      details: error.message,
    });
  }
}

/**
 * 26. Listar conversas direcionadas ativas para os usuários
 * GET /api/guided-conversations
 */
export async function getPublicGuidedConversations(req, res) {
  try {
    const cached = getCached('guided:public');
    if (cached) return res.status(200).json(cached);

    const { data, error } = await supabaseAdmin
      .from('izaque_guided_conversations')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(setCached('guided:public', data || [], 60_000));
  } catch (error) {
    console.error('❌ Erro ao listar conversas direcionadas públicas:', error);
    res.status(500).json({ error: 'Erro ao carregar conversas direcionadas.' });
  }
}

/**
 * 27. Listar todas as conversas direcionadas para administração (Superadmin)
 * GET /api/admin/guided-conversations
 */
export async function getAdminGuidedConversations(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('izaque_guided_conversations')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('❌ Erro ao listar conversas direcionadas admin:', error);
    res.status(500).json({ error: 'Erro ao carregar conversas direcionadas para administração.' });
  }
}

/**
 * 28. Criar nova conversa direcionada com perguntas (Superadmin)
 * POST /api/admin/guided-conversations
 */
export async function createAdminGuidedConversation(req, res) {
  try {
    const {
      title,
      description,
      category = 'Geral',
      icon = 'Compass',
      agent_slug = 'izaque-master',
      questions = [],
      is_active = true,
      order_index = 0,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'O título da conversa direcionada é obrigatório.' });
    }

    const payload = {
      title: title.trim(),
      description: description ? description.trim() : '',
      category: category ? category.trim() : 'Geral',
      icon: icon ? icon.trim() : 'Compass',
      agent_slug: agent_slug ? agent_slug.trim() : 'izaque-master',
      questions: Array.isArray(questions) ? questions : [],
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      order_index: Number(order_index) || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('izaque_guided_conversations')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    invalidateCache('guided:public');
    invalidateCache('seo:public_snapshot');
    res.status(201).json(data);
  } catch (error) {
    console.error('❌ Erro ao criar conversa direcionada:', error);
    res.status(500).json({ error: 'Erro ao criar conversa direcionada: ' + error.message });
  }
}

/**
 * 29. Atualizar conversa direcionada e perguntas (Superadmin)
 * PUT /api/admin/guided-conversations/:id
 */
export async function updateAdminGuidedConversation(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      icon,
      agent_slug,
      questions,
      is_active,
      order_index,
    } = req.body;

    const updates = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (category !== undefined) updates.category = category.trim();
    if (icon !== undefined) updates.icon = icon.trim();
    if (agent_slug !== undefined) updates.agent_slug = agent_slug.trim();
    if (questions !== undefined) updates.questions = Array.isArray(questions) ? questions : [];
    if (is_active !== undefined) updates.is_active = Boolean(is_active);
    if (order_index !== undefined) updates.order_index = Number(order_index) || 0;

    const { data, error } = await supabaseAdmin
      .from('izaque_guided_conversations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    invalidateCache('guided:public');
    invalidateCache('seo:public_snapshot');
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Erro ao atualizar conversa direcionada:', error);
    res.status(500).json({ error: 'Erro ao atualizar conversa direcionada: ' + error.message });
  }
}

/**
 * 30. Excluir conversa direcionada (Superadmin)
 * DELETE /api/admin/guided-conversations/:id
 */
export async function deleteAdminGuidedConversation(req, res) {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('izaque_guided_conversations')
      .delete()
      .eq('id', id);

    if (error) throw error;
    invalidateCache('guided:public');
    invalidateCache('seo:public_snapshot');
    res.status(200).json({ success: true, message: 'Conversa direcionada removida com sucesso.' });
  } catch (error) {
    console.error('❌ Erro ao excluir conversa direcionada:', error);
    res.status(500).json({ error: 'Erro ao excluir conversa direcionada: ' + error.message });
  }
}

/**
 * 31. Listar Grupos de Usuários com contagem de membros (Superadmin)
 * GET /api/admin/user-groups
 */
export async function getAdminUserGroups(req, res) {
  try {
    const { data: groups, error: groupsError } = await supabaseAdmin
      .from('izaque_user_groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (groupsError) throw groupsError;

    // Buscar membros para calcular contagem por grupo
    const { data: members, error: membersError } = await supabaseAdmin
      .from('izaque_user_group_members')
      .select('group_id, user_id');

    if (membersError) throw membersError;

    const countMap = {};
    (members || []).forEach((m) => {
      countMap[m.group_id] = (countMap[m.group_id] || 0) + 1;
    });

    const enriched = (groups || []).map((g) => ({
      ...g,
      member_count: countMap[g.id] || 0,
    }));

    res.status(200).json(enriched);
  } catch (error) {
    console.error('❌ Erro ao listar grupos de usuários:', error);
    res.status(500).json({ error: 'Erro ao carregar grupos de usuários.' });
  }
}

/**
 * 32. Criar novo Grupo de Usuários (Superadmin)
 * POST /api/admin/user-groups
 */
export async function createAdminUserGroup(req, res) {
  try {
    const { name, description = '', color = '#0f766e' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'O nome do grupo é obrigatório.' });
    }

    const { data, error } = await supabaseAdmin
      .from('izaque_user_groups')
      .insert({
        name: name.trim(),
        description: description ? description.trim() : '',
        color: color ? color.trim() : '#0f766e',
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ ...data, member_count: 0 });
  } catch (error) {
    console.error('❌ Erro ao criar grupo de usuários:', error);
    res.status(500).json({ error: 'Erro ao criar grupo: ' + error.message });
  }
}

/**
 * 33. Atualizar Grupo de Usuários (Superadmin)
 * PUT /api/admin/user-groups/:id
 */
export async function updateAdminUserGroup(req, res) {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (color !== undefined) updates.color = color.trim();

    const { data, error } = await supabaseAdmin
      .from('izaque_user_groups')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Erro ao atualizar grupo de usuários:', error);
    res.status(500).json({ error: 'Erro ao atualizar grupo: ' + error.message });
  }
}

/**
 * 34. Excluir Grupo de Usuários (Superadmin)
 * DELETE /api/admin/user-groups/:id
 */
export async function deleteAdminUserGroup(req, res) {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('izaque_user_groups')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(200).json({ success: true, message: 'Grupo excluído com sucesso.' });
  } catch (error) {
    console.error('❌ Erro ao excluir grupo:', error);
    res.status(500).json({ error: 'Erro ao excluir grupo: ' + error.message });
  }
}

/**
 * 35. Listar Membros de um Grupo (Superadmin)
 * GET /api/admin/user-groups/:id/members
 */
export async function getAdminGroupMembers(req, res) {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('izaque_user_group_members')
      .select('user_id, created_at')
      .eq('group_id', id);

    if (error) throw error;

    const userIds = (data || []).map((m) => m.user_id);
    if (userIds.length === 0) return res.status(200).json([]);

    const [profRes, inscRes] = await Promise.all([
      supabaseAdmin
        .from('izaque_profiles')
        .select('id, full_name, email, phone, avatar_url, role, plan_status')
        .in('id', userIds),
      supabaseAdmin
        .from('izaque_inscriptions')
        .select('id, full_name, email, phone')
        .in('id', userIds),
    ]);

    if (profRes.error) throw profRes.error;

    const appProfiles = (profRes.data || []).map((p) => ({ ...p, is_inscription: false }));
    const inscProfiles = (inscRes.data || []).map((i) => ({
      id: i.id,
      full_name: i.full_name,
      email: i.email || i.phone || 'Sem e-mail',
      phone: i.phone || null,
      avatar_url: null,
      role: 'inscrito',
      plan_status: 'inscricao',
      is_inscription: true,
    }));

    res.status(200).json([...appProfiles, ...inscProfiles]);
  } catch (error) {
    console.error('❌ Erro ao listar membros do grupo:', error);
    res.status(500).json({ error: 'Erro ao carregar membros do grupo.' });
  }
}

/**
 * 36. Consultar grupos de um usuário específico (Superadmin)
 * GET /api/admin/users/:userId/groups
 */
export async function getUserAssignedGroups(req, res) {
  try {
    const { userId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('izaque_user_group_members')
      .select('group_id')
      .eq('user_id', userId);

    if (error) throw error;
    const groupIds = (data || []).map((row) => row.group_id);
    res.status(200).json(groupIds);
  } catch (error) {
    console.error('❌ Erro ao buscar grupos do usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar grupos do usuário.' });
  }
}

/**
 * 37. Atualizar grupos atribuídos a um usuário (Classificação de Usuário em múltiplos grupos)
 * POST /api/admin/users/:userId/groups
 */
export async function setUserAssignedGroups(req, res) {
  try {
    const { userId } = req.params;
    const { groupIds = [] } = req.body;

    // 1. Remove memberships anteriores
    await supabaseAdmin
      .from('izaque_user_group_members')
      .delete()
      .eq('user_id', userId);

    // 2. Insere as novas memberships se houver
    if (Array.isArray(groupIds) && groupIds.length > 0) {
      const inserts = groupIds.map((gId) => ({
        group_id: gId,
        user_id: userId,
      }));

      const { error: insertError } = await supabaseAdmin
        .from('izaque_user_group_members')
        .insert(inserts);

      if (insertError) throw insertError;
    }

    res.status(200).json({ success: true, groupIds });
  } catch (error) {
    console.error('❌ Erro ao atualizar grupos do usuário:', error);
    res.status(500).json({ error: 'Erro ao salvar grupos do usuário: ' + error.message });
  }
}

/**
 * 38. Disparar Mensagem ou Áudio para um ou mais Grupos com deduplicação
 * POST /api/admin/group-broadcasts
 */
export async function sendGroupBroadcast(req, res) {
  try {
    const {
      title,
      content = '',
      audio_url = null,
      target_group_ids = [],
      sender_id = null,
      send_whatsapp = false,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'O título do comunicado é obrigatório.' });
    }

    if (!Array.isArray(target_group_ids) || target_group_ids.length === 0) {
      return res.status(400).json({ error: 'Selecione pelo menos um grupo de destino.' });
    }

    if (!content?.trim() && !audio_url) {
      return res.status(400).json({ error: 'Informe uma mensagem em texto ou anexe um áudio para disparo.' });
    }

    // 1. Obter lista de usuários dos grupos selecionados com deduplicação (DISTINCT)
    const { data: memberRows, error: membersError } = await supabaseAdmin
      .from('izaque_user_group_members')
      .select('user_id')
      .in('group_id', target_group_ids);

    if (membersError) throw membersError;

    // Deduplicação: cria conjunto de IDs únicos
    const uniqueUserIds = Array.from(new Set((memberRows || []).map((m) => m.user_id)));

    if (uniqueUserIds.length === 0) {
      return res.status(400).json({
        error: 'Nenhum usuário foi encontrado nos grupos selecionados para receber o comunicado.',
      });
    }

    // 2. Registrar o broadcast na tabela izaque_group_broadcasts
    const { data: broadcast, error: broadcastError } = await supabaseAdmin
      .from('izaque_group_broadcasts')
      .insert({
        title: title.trim(),
        content: content ? content.trim() : '',
        audio_url: audio_url || null,
        target_group_ids,
        sender_id: sender_id || null,
      })
      .select()
      .single();

    if (broadcastError) throw broadcastError;

    const personalizeText = (rawText, fullName) => {
      const firstName = String(fullName || '')
        .trim()
        .split(/\s+/)[0];
      const safeName = firstName
        ? firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
        : 'amigo(a)';
      return String(rawText || '').replace(/\{nome\}/gi, safeName);
    };

    // 3. Carrega contas reais do app (izaque_profiles) e fichas (/inscricao)
    const [realAppUsersRes, inscUsersRes] = await Promise.all([
      supabaseAdmin
        .from('izaque_profiles')
        .select('id, full_name, phone, whatsapp_jid, whatsapp_opt_out, is_active')
        .in('id', uniqueUserIds),
      supabaseAdmin
        .from('izaque_inscriptions')
        .select('id, full_name, phone, is_active')
        .in('id', uniqueUserIds),
    ]);

    const realAppUsers = realAppUsersRes.data || [];
    const inscUsers = inscUsersRes.data || [];

    if (realAppUsers.length > 0) {
      const notificationsToInsert = realAppUsers.map((u) => ({
        user_id: u.id,
        broadcast_id: broadcast.id,
        title: personalizeText(title.trim(), u.full_name),
        content: content ? personalizeText(content.trim(), u.full_name) : '',
        audio_url: audio_url || null,
        is_read: false,
      }));

      const { error: notifError } = await supabaseAdmin
        .from('izaque_user_notifications')
        .insert(notificationsToInsert);

      if (notifError) throw notifError;
    }

    // 4. Se solicitado envio também no WhatsApp (Evolution API com proteção Anti-Ban 280ms-450ms e respeito ao opt-out)
    let whatsappQueuedCount = 0;
    if (send_whatsapp) {
      const evoEnabled = await isEvolutionEnabledInDatabase();
      if (evoEnabled) {
        const eligibleWhatsappTargets = [
          ...realAppUsers.filter(
            (u) => u.is_active !== false && !u.whatsapp_opt_out && (u.whatsapp_jid || u.phone)
          ),
          ...inscUsers.filter((i) => i.is_active !== false && i.phone),
        ];

        whatsappQueuedCount = eligibleWhatsappTargets.length;

        if (eligibleWhatsappTargets.length > 0) {
          setImmediate(async () => {
            for (const target of eligibleWhatsappTargets) {
              try {
                const jidInfo = await resolveWhatsAppJid(target.whatsapp_jid || target.phone);
                if (!jidInfo?.exists || !jidInfo?.jid) continue;

                const personalTitle = personalizeText(title.trim(), target.full_name);
                const personalBody = content
                  ? personalizeText(content.trim(), target.full_name)
                  : '';
                let fullWhatsappMsg = personalBody
                  ? `*${personalTitle}*\n\n${personalBody}`
                  : `*${personalTitle}*\n\nAcesse seu espaço de mentoria em https://isaac.lynxems.com.br/`;

                if (audio_url) {
                  fullWhatsappMsg += `\n\n🎧 Ouça também a mensagem de voz preparada para você: ${audio_url}`;
                }

                await sendWhatsAppTextSafe({
                  jidOrNumber: jidInfo.jid,
                  text: fullWhatsappMsg,
                });
              } catch (wErr) {
                console.warn('⚠️ [Group Broadcast WhatsApp] Aviso no envio individual:', wErr.message);
              }
            }
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      broadcastId: broadcast.id,
      deliveredUsersCount: uniqueUserIds.length,
      whatsappQueuedCount,
      message:
        whatsappQueuedCount > 0
          ? `Comunicado enviado para ${uniqueUserIds.length} membro(s) no App e disparado com proteção Anti-Ban para ${whatsappQueuedCount} WhatsApp(s)!`
          : `Comunicado enviado com sucesso para ${uniqueUserIds.length} usuário(s)!`,
    });
  } catch (error) {
    console.error('❌ Erro no envio de comunicado para grupos:', error);
    res.status(500).json({ error: 'Erro ao enviar comunicado para grupos: ' + error.message });
  }
}

/**
 * 39. Listar histórico de disparos por grupo (Superadmin)
 * GET /api/admin/group-broadcasts
 */
export async function getAdminGroupBroadcasts(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('izaque_group_broadcasts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('❌ Erro ao listar comunicados:', error);
    res.status(500).json({ error: 'Erro ao carregar histórico de comunicados.' });
  }
}

/**
 * 40. Obter notificações e comunicados do usuário logado (In-App)
 * GET /api/user/notifications/:userId
 */
export async function getUserNotifications(req, res) {
  try {
    const { userId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('izaque_user_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('❌ Erro ao buscar notificações do usuário:', error);
    res.status(500).json({ error: 'Erro ao carregar notificações.' });
  }
}

/**
 * 41. Marcar notificação como lida
 * PATCH /api/user/notifications/:id/read
 */
export async function markNotificationAsRead(req, res) {
  try {
    const { id } = req.params;
    let query = supabaseAdmin
      .from('izaque_user_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);

    if (req.user && req.user.role !== 'master' && req.user.role !== 'admin') {
      query = query.eq('user_id', req.user.id);
    }

    const { data, error } = await query.select().maybeSingle();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Erro ao marcar notificação como lida:', error);
    res.status(500).json({ error: 'Erro ao atualizar notificação.' });
  }
}

/**
 * 42. Marcar todas as notificações do usuário como lidas
 * PATCH /api/user/notifications/read-all/:userId
 */
export async function markAllNotificationsAsRead(req, res) {
  try {
    const { userId } = req.params;
    const { error } = await supabaseAdmin
      .from('izaque_user_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao marcar todas notificações como lidas:', error);
    res.status(500).json({ error: 'Erro ao atualizar notificações.' });
  }
}

/**
 * ============================================================================
 * GESTÃO E CRONOGRAMA DO PROJETO ISAAC (MEMBROS, MARCOS, TAREFAS E COBRANÇAS)
 * ============================================================================
 */

/**
 * 43. Listar membros da equipe de execução do projeto
 * GET /api/admin/project/members
 */
export async function getProjectMembers(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('izaque_project_members')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('❌ Erro ao buscar membros do projeto:', error);
    res.status(500).json({ error: 'Erro ao listar membros do projeto: ' + error.message });
  }
}

/**
 * 44. Criar membro da equipe do projeto
 * POST /api/admin/project/members
 */
export async function createProjectMember(req, res) {
  try {
    const { name, email, role_title, phone, is_active } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'O nome do membro é obrigatório.' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Informe um e-mail válido para notificações.' });
    }

    const { data, error } = await supabaseAdmin
      .from('izaque_project_members')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role_title: role_title ? role_title.trim() : 'Responsável Técnico',
        phone: phone ? phone.trim() : null,
        is_active: is_active !== undefined ? Boolean(is_active) : true,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('❌ Erro ao cadastrar membro do projeto:', error);
    res.status(500).json({ error: 'Erro ao cadastrar membro: ' + error.message });
  }
}

/**
 * 45. Atualizar membro da equipe do projeto
 * PUT /api/admin/project/members/:id
 */
export async function updateProjectMember(req, res) {
  try {
    const { id } = req.params;
    const { name, email, role_title, phone, is_active } = req.body;

    const updateData = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (role_title !== undefined) updateData.role_title = role_title.trim();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);

    const { data, error } = await supabaseAdmin
      .from('izaque_project_members')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Erro ao atualizar membro do projeto:', error);
    res.status(500).json({ error: 'Erro ao atualizar membro: ' + error.message });
  }
}

/**
 * 46. Excluir membro da equipe do projeto
 * DELETE /api/admin/project/members/:id
 */
export async function deleteProjectMember(req, res) {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('izaque_project_members')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(200).json({ success: true, message: 'Membro removido com sucesso.' });
  } catch (error) {
    console.error('❌ Erro ao remover membro do projeto:', error);
    res.status(500).json({ error: 'Erro ao remover membro: ' + error.message });
  }
}

/**
 * 47. Listar etapas / marcos (Milestones) do projeto
 * GET /api/admin/project/milestones
 */
export async function getProjectMilestones(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('izaque_project_milestones')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('❌ Erro ao listar etapas do projeto:', error);
    res.status(500).json({ error: 'Erro ao listar etapas: ' + error.message });
  }
}

/**
 * 48. Criar etapa / marco
 * POST /api/admin/project/milestones
 */
export async function createProjectMilestone(req, res) {
  try {
    const { title, description, status, start_date, target_date, order_index, color } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'O título da etapa é obrigatório.' });
    }

    const { data, error } = await supabaseAdmin
      .from('izaque_project_milestones')
      .insert({
        title: title.trim(),
        description: description ? description.trim() : '',
        status: status || 'in_progress',
        start_date: start_date || null,
        target_date: target_date || null,
        order_index: Number(order_index) || 0,
        color: color || '#0f766e',
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('❌ Erro ao criar etapa do projeto:', error);
    res.status(500).json({ error: 'Erro ao criar etapa: ' + error.message });
  }
}

/**
 * 49. Atualizar etapa / marco
 * PUT /api/admin/project/milestones/:id
 */
export async function updateProjectMilestone(req, res) {
  try {
    const { id } = req.params;
    const { title, description, status, start_date, target_date, completed_date, order_index, color } = req.body;

    const updateData = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : '';
    if (status !== undefined) updateData.status = status;
    if (start_date !== undefined) updateData.start_date = start_date || null;
    if (target_date !== undefined) updateData.target_date = target_date || null;
    if (completed_date !== undefined) updateData.completed_date = completed_date || null;
    if (order_index !== undefined) updateData.order_index = Number(order_index) || 0;
    if (color !== undefined) updateData.color = color;

    const { data, error } = await supabaseAdmin
      .from('izaque_project_milestones')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Erro ao atualizar etapa do projeto:', error);
    res.status(500).json({ error: 'Erro ao atualizar etapa: ' + error.message });
  }
}

/**
 * 50. Excluir etapa / marco
 * DELETE /api/admin/project/milestones/:id
 */
export async function deleteProjectMilestone(req, res) {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('izaque_project_milestones')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(200).json({ success: true, message: 'Etapa removida com sucesso.' });
  } catch (error) {
    console.error('❌ Erro ao excluir etapa do projeto:', error);
    res.status(500).json({ error: 'Erro ao excluir etapa: ' + error.message });
  }
}

/**
 * 51. Listar tarefas / atividades do projeto com joins
 * GET /api/admin/project/tasks
 */
export async function getProjectTasks(req, res) {
  try {
    const { milestone_id, status } = req.query;

    let query = supabaseAdmin
      .from('izaque_project_tasks')
      .select(`
        *,
        milestone:izaque_project_milestones(id, title, color, status),
        member:izaque_project_members(id, name, email, role_title)
      `)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (milestone_id) {
      query = query.eq('milestone_id', milestone_id);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('❌ Erro ao listar atividades do projeto:', error);
    res.status(500).json({ error: 'Erro ao listar atividades: ' + error.message });
  }
}

/**
 * 52. Criar tarefa / atividade
 * POST /api/admin/project/tasks
 */
export async function createProjectTask(req, res) {
  try {
    const {
      milestone_id,
      assigned_member_id,
      title,
      description,
      status = 'pending',
      priority = 'medium',
      start_date,
      due_date,
      checklist = [],
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'O título da atividade é obrigatório.' });
    }

    const { data, error } = await supabaseAdmin
      .from('izaque_project_tasks')
      .insert({
        milestone_id: milestone_id || null,
        assigned_member_id: assigned_member_id || null,
        title: title.trim(),
        description: description ? description.trim() : '',
        status,
        priority,
        start_date: start_date || null,
        due_date: due_date || null,
        checklist: Array.isArray(checklist) ? checklist : [],
      })
      .select(`
        *,
        milestone:izaque_project_milestones(id, title, color, status),
        member:izaque_project_members(id, name, email, role_title)
      `)
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('❌ Erro ao criar atividade do projeto:', error);
    res.status(500).json({ error: 'Erro ao criar atividade: ' + error.message });
  }
}

/**
 * 53. Atualizar tarefa / atividade (e notificar conclusão se solicitado)
 * PUT /api/admin/project/tasks/:id
 */
export async function updateProjectTask(req, res) {
  try {
    const { id } = req.params;
    const {
      milestone_id,
      assigned_member_id,
      title,
      description,
      status,
      priority,
      start_date,
      due_date,
      checklist,
      notify_completion,
    } = req.body;

    // Buscar estado atual da tarefa
    const { data: currentTask } = await supabaseAdmin
      .from('izaque_project_tasks')
      .select(`
        *,
        milestone:izaque_project_milestones(id, title),
        member:izaque_project_members(id, name, email)
      `)
      .eq('id', id)
      .single();

    const updateData = { updated_at: new Date().toISOString() };
    if (milestone_id !== undefined) updateData.milestone_id = milestone_id || null;
    if (assigned_member_id !== undefined) updateData.assigned_member_id = assigned_member_id || null;
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : '';
    if (priority !== undefined) updateData.priority = priority;
    if (start_date !== undefined) updateData.start_date = start_date || null;
    if (due_date !== undefined) updateData.due_date = due_date || null;
    if (checklist !== undefined && Array.isArray(checklist)) updateData.checklist = checklist;

    let isNewlyCompleted = false;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'completed' && currentTask?.status !== 'completed') {
        updateData.completed_at = new Date().toISOString();
        isNewlyCompleted = true;
      } else if (status !== 'completed') {
        updateData.completed_at = null;
      }
    }

    const { data: updatedTask, error } = await supabaseAdmin
      .from('izaque_project_tasks')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        milestone:izaque_project_milestones(id, title, color, status),
        member:izaque_project_members(id, name, email, role_title)
      `)
      .single();

    if (error) throw error;

    // Se acabou de ser concluída e foi pedido para notificar (ou automático)
    if (isNewlyCompleted && (notify_completion || currentTask?.member?.email)) {
      try {
        const supportEmail = process.env.SMTP_USER || 'suporte@lynxems.com.br';
        const recipient = currentTask?.member?.email || supportEmail;

        await sendTaskCompletedEmail({
          recipientEmail: recipient,
          taskTitle: updatedTask.title,
          taskDescription: updatedTask.description,
          memberName: updatedTask.member?.name || 'Equipe ISAAC',
          completedDate: updatedTask.completed_at,
          milestoneTitle: updatedTask.milestone?.title || 'Fase Geral',
        });

        // Log da notificação
        await supabaseAdmin.from('izaque_project_notifications_log').insert({
          task_id: updatedTask.id,
          member_id: updatedTask.assigned_member_id,
          type: 'task_completed',
          recipient_email: recipient,
          subject: `✅ [ENTREGA CONCLUÍDA] Atividade Finalizada: ${updatedTask.title}`,
          status: 'sent',
        });
      } catch (emailErr) {
        console.warn('⚠️ Falha ao enviar e-mail de conclusão de tarefa:', emailErr.message);
      }
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error('❌ Erro ao atualizar atividade do projeto:', error);
    res.status(500).json({ error: 'Erro ao atualizar atividade: ' + error.message });
  }
}

/**
 * 54. Excluir tarefa / atividade
 * DELETE /api/admin/project/tasks/:id
 */
export async function deleteProjectTask(req, res) {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('izaque_project_tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(200).json({ success: true, message: 'Atividade removida com sucesso.' });
  } catch (error) {
    console.error('❌ Erro ao excluir atividade:', error);
    res.status(500).json({ error: 'Erro ao excluir atividade: ' + error.message });
  }
}

/**
 * 55. Envio manual de cobrança / lembrete de tarefa para o responsável
 * POST /api/admin/project/tasks/:id/notify
 */
export async function notifyTaskReminder(req, res) {
  try {
    const { id } = req.params;

    const { data: task, error: fetchErr } = await supabaseAdmin
      .from('izaque_project_tasks')
      .select(`
        *,
        milestone:izaque_project_milestones(id, title),
        member:izaque_project_members(id, name, email)
      `)
      .eq('id', id)
      .single();

    if (fetchErr || !task) {
      return res.status(404).json({ error: 'Atividade não encontrada.' });
    }

    if (!task.member || !task.member.email) {
      return res.status(400).json({ error: 'Esta atividade não possui um responsável com e-mail cadastrado.' });
    }

    // Calcular dias restantes
    let daysRemaining = 0;
    let isDueToday = false;
    if (task.due_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(task.due_date + 'T00:00:00');
      const diffMs = due - today;
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      isDueToday = daysRemaining === 0;
    }

    await sendTaskReminderEmail({
      recipientEmail: task.member.email,
      recipientName: task.member.name,
      taskTitle: task.title,
      taskDescription: task.description,
      dueDate: task.due_date,
      daysRemaining: Math.max(0, daysRemaining),
      milestoneTitle: task.milestone?.title || 'Fase Geral',
      priority: task.priority,
      isDueToday,
    });

    // Registrar no log
    await supabaseAdmin.from('izaque_project_notifications_log').insert({
      task_id: task.id,
      member_id: task.assigned_member_id,
      type: isDueToday ? 'reminder_due' : 'manual_notice',
      recipient_email: task.member.email,
      subject: isDueToday
        ? `🚨 [PRAZO HOJE] Entrega da Atividade: ${task.title}`
        : `⏰ [LEMBRETE] ${daysRemaining} dia(s) para o prazo: ${task.title}`,
      status: 'sent',
    });

    // Atualizar registro da tarefa
    await supabaseAdmin
      .from('izaque_project_tasks')
      .update({
        notified_due_at: isDueToday ? new Date().toISOString() : task.notified_due_at,
        notified_pre_at: !isDueToday ? new Date().toISOString() : task.notified_pre_at,
      })
      .eq('id', task.id);

    res.status(200).json({
      success: true,
      message: `E-mail de cobrança enviado com sucesso para ${task.member.name} (${task.member.email}).`,
    });
  } catch (error) {
    console.error('❌ Erro ao enviar lembrete manual de tarefa:', error);
    res.status(500).json({ error: 'Falha ao enviar e-mail: ' + error.message });
  }
}

/**
 * 56. Rotina de checagem e disparo automático de cobranças de prazos
 * POST /api/admin/project/check-reminders
 */
export async function runProjectRemindersCheck(req, res) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Buscar tarefas ativas com data de vencimento e membro responsável
    const { data: tasks, error } = await supabaseAdmin
      .from('izaque_project_tasks')
      .select(`
        *,
        milestone:izaque_project_milestones(id, title),
        member:izaque_project_members(id, name, email, is_active)
      `)
      .not('due_date', 'is', null)
      .not('assigned_member_id', 'is', null)
      .not('status', 'in', '("completed","blocked")');

    if (error) throw error;

    const dispatched = [];
    const skipped = [];

    for (const task of tasks || []) {
      if (!task.member || !task.member.email || task.member.is_active === false) {
        skipped.push({ taskId: task.id, reason: 'Sem membro ou membro inativo' });
        continue;
      }

      const due = new Date(task.due_date + 'T00:00:00');
      const diffMs = due - today;
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Caso 1: Vencimento HOJE (D-0) e ainda não notificado hoje
      if (daysRemaining === 0) {
        const alreadyNotifiedToday = task.notified_due_at &&
          new Date(task.notified_due_at).toISOString().split('T')[0] === today.toISOString().split('T')[0];

        if (!alreadyNotifiedToday) {
          await sendTaskReminderEmail({
            recipientEmail: task.member.email,
            recipientName: task.member.name,
            taskTitle: task.title,
            taskDescription: task.description,
            dueDate: task.due_date,
            daysRemaining: 0,
            milestoneTitle: task.milestone?.title || 'Fase Geral',
            priority: task.priority,
            isDueToday: true,
          });

          await supabaseAdmin.from('izaque_project_notifications_log').insert({
            task_id: task.id,
            member_id: task.assigned_member_id,
            type: 'reminder_due',
            recipient_email: task.member.email,
            subject: `🚨 [PRAZO HOJE] Entrega da Atividade: ${task.title}`,
            status: 'sent',
          });

          await supabaseAdmin
            .from('izaque_project_tasks')
            .update({ notified_due_at: new Date().toISOString() })
            .eq('id', task.id);

          dispatched.push({ taskId: task.id, taskTitle: task.title, type: 'D-0 (Hoje)', to: task.member.email });
        }
      }
      // Caso 2: Aviso Prévio (Faltam 1 ou 2 dias) e ainda não enviado
      else if (daysRemaining > 0 && daysRemaining <= 2) {
        if (!task.notified_pre_at) {
          await sendTaskReminderEmail({
            recipientEmail: task.member.email,
            recipientName: task.member.name,
            taskTitle: task.title,
            taskDescription: task.description,
            dueDate: task.due_date,
            daysRemaining,
            milestoneTitle: task.milestone?.title || 'Fase Geral',
            priority: task.priority,
            isDueToday: false,
          });

          await supabaseAdmin.from('izaque_project_notifications_log').insert({
            task_id: task.id,
            member_id: task.assigned_member_id,
            type: 'reminder_pre',
            recipient_email: task.member.email,
            subject: `⏰ [LEMBRETE] ${daysRemaining} dia(s) para o prazo: ${task.title}`,
            status: 'sent',
          });

          await supabaseAdmin
            .from('izaque_project_tasks')
            .update({ notified_pre_at: new Date().toISOString() })
            .eq('id', task.id);

          dispatched.push({ taskId: task.id, taskTitle: task.title, type: `D-${daysRemaining} (Prévia)`, to: task.member.email });
        }
      }
    }

    res.status(200).json({
      success: true,
      scanned: (tasks || []).length,
      dispatchedCount: dispatched.length,
      dispatched,
      skippedCount: skipped.length,
    });
  } catch (error) {
    console.error('❌ Erro na checagem de cobranças automáticas:', error);
    res.status(500).json({ error: 'Erro ao verificar cobranças: ' + error.message });
  }
}

/**
 * 57. Obter log de notificações e cobranças enviadas
 * GET /api/admin/project/notifications-log
 */
export async function getProjectNotificationsLog(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('izaque_project_notifications_log')
      .select(`
        *,
        task:izaque_project_tasks(id, title),
        member:izaque_project_members(id, name, role_title)
      `)
      .order('sent_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('❌ Erro ao listar logs de notificações:', error);
    res.status(500).json({ error: 'Erro ao listar histórico de avisos: ' + error.message });
  }
}

/**
 * 58. Obter parâmetros globais avançados do sistema
 * GET /api/system/settings
 */
export async function getSystemSettings(req, res) {
  try {
    const cached = getCached('system:settings');
    if (cached) return res.status(200).json(cached);

    const [{ data, error }, { data: edsonProfile }] = await Promise.all([
      supabaseAdmin
        .from('izaque_system_settings')
        .select('*')
        .eq('id', 'global')
        .maybeSingle(),
      supabaseAdmin
        .from('izaque_profiles')
        .select('preferences')
        .eq('email', 'edsonmanoel2012@gmail.com')
        .maybeSingle(),
    ]);

    if (error && error.code !== 'PGRST116') throw error;

    const edsonPrefs = edsonProfile?.preferences || {};

    const settings = data || {
      id: 'global',
      show_theme_selector: true,
      show_settings_button: true,
      show_ambient_sound_button: true,
      show_creative_troubles: true,
      evolution_whatsapp_enabled: true,
      show_landing_creator: true,
      show_landing_sensations: true,
      show_landing_features: true,
      show_landing_security: true,
      show_landing_steps: true,
      show_landing_cta: true,
      default_theme: 'indigo',
      default_guide_name: 'Isaac',
      default_ambient_track: '432hz',
      default_ambient_volume: 0.20,
      default_ambient_enabled: false,
      default_voice_engine: 'gemini',
      default_gemini_voice: 'Aoede',
      default_voice_gender: 'male',
      default_voice_rate: 0.90,
      default_voice_pitch: 0.95,
      default_voice_uri: '',
      default_prefer_browser: false,
      default_immersive_voice: false,
    };

    const resolvedGeminiVoice = normalizeGeminiVoiceId(
      settings.default_gemini_voice || edsonPrefs.gemini_voice || 'Aoede'
    );

    const normalizedSettings = {
      ...settings,
      show_creative_troubles: settings.show_creative_troubles !== undefined ? settings.show_creative_troubles : true,
      evolution_whatsapp_enabled:
        settings.evolution_whatsapp_enabled !== undefined ? settings.evolution_whatsapp_enabled : true,
      show_landing_creator: settings.show_landing_creator !== undefined ? settings.show_landing_creator : true,
      show_landing_sensations: settings.show_landing_sensations !== undefined ? settings.show_landing_sensations : true,
      show_landing_features: settings.show_landing_features !== undefined ? settings.show_landing_features : true,
      show_landing_security: settings.show_landing_security !== undefined ? settings.show_landing_security : true,
      show_landing_steps: settings.show_landing_steps !== undefined ? settings.show_landing_steps : true,
      show_landing_cta: settings.show_landing_cta !== undefined ? settings.show_landing_cta : true,
      default_guide_name: settings.default_guide_name || edsonPrefs.guide_name || 'Isaac',
      default_voice_engine: settings.default_voice_engine || edsonPrefs.voice_engine || 'gemini',
      default_gemini_voice: resolvedGeminiVoice,
      default_voice_gender: settings.default_voice_gender || edsonPrefs.voice_gender || 'male',
      default_voice_rate: Number(settings.default_voice_rate ?? edsonPrefs.voice_rate ?? 0.90),
      default_voice_pitch: Number(settings.default_voice_pitch ?? edsonPrefs.voice_pitch ?? 0.95),
      default_voice_uri: settings.default_voice_uri ?? edsonPrefs.voice_uri ?? '',
      default_prefer_browser: Boolean(settings.default_prefer_browser ?? edsonPrefs.prefer_browser ?? false),
      default_ambient_track: settings.default_ambient_track || edsonPrefs.ambient_track || '432hz',
      default_ambient_volume: Number(settings.default_ambient_volume ?? edsonPrefs.ambient_volume ?? 0.20),
      default_ambient_enabled: Boolean(settings.default_ambient_enabled ?? edsonPrefs.ambient_enabled ?? false),
      default_immersive_voice: Boolean(settings.default_immersive_voice ?? edsonPrefs.immersive_voice ?? false),
    };

    res.status(200).json(setCached('system:settings', normalizedSettings, 60_000));
  } catch (error) {
    console.error('❌ Erro ao buscar parâmetros do sistema:', error);
    res.status(200).json({
      id: 'global',
      show_theme_selector: true,
      show_settings_button: true,
      show_ambient_sound_button: true,
      show_creative_troubles: true,
      evolution_whatsapp_enabled: true,
      show_landing_creator: true,
      show_landing_sensations: true,
      show_landing_features: true,
      show_landing_security: true,
      show_landing_steps: true,
      show_landing_cta: true,
      default_theme: 'indigo',
      default_guide_name: 'Isaac',
      default_ambient_track: '432hz',
      default_ambient_volume: 0.20,
      default_ambient_enabled: false,
      default_voice_engine: 'gemini',
      default_gemini_voice: 'Aoede',
      default_voice_gender: 'male',
      default_voice_rate: 0.90,
      default_voice_pitch: 0.95,
      default_voice_uri: '',
      default_prefer_browser: false,
      default_immersive_voice: false,
    });
  }
}

/**
 * 59. Atualizar parâmetros globais avançados do sistema (Superadmin apenas)
 * PUT /api/admin/system/settings
 */
export async function updateSystemSettings(req, res) {
  try {
    const {
      show_theme_selector,
      show_settings_button,
      show_ambient_sound_button,
      show_creative_troubles,
      evolution_whatsapp_enabled,
      show_landing_creator,
      show_landing_sensations,
      show_landing_features,
      show_landing_security,
      show_landing_steps,
      show_landing_cta,
      default_theme,
      default_guide_name,
      default_ambient_track,
      default_ambient_volume,
      default_ambient_enabled,
      default_voice_engine,
      default_gemini_voice,
      default_voice_gender,
      default_voice_rate,
      default_voice_pitch,
      default_voice_uri,
      default_prefer_browser,
      default_immersive_voice,
      updated_by,
    } = req.body;

    const { data: currentRow } = await supabaseAdmin
      .from('izaque_system_settings')
      .select('*')
      .eq('id', 'global')
      .maybeSingle();

    const cleanGeminiVoice = normalizeGeminiVoiceId(
      default_gemini_voice || currentRow?.default_gemini_voice || 'Aoede'
    );
    const cleanEngine = default_voice_engine || currentRow?.default_voice_engine || 'gemini';
    const cleanPreferBrowser =
      default_prefer_browser !== undefined
        ? Boolean(default_prefer_browser)
        : cleanEngine === 'browser';

    const payload = {
      ...(currentRow || {}),
      id: 'global',
      show_theme_selector: show_theme_selector !== undefined ? Boolean(show_theme_selector) : Boolean(currentRow?.show_theme_selector ?? true),
      show_settings_button: show_settings_button !== undefined ? Boolean(show_settings_button) : Boolean(currentRow?.show_settings_button ?? true),
      show_ambient_sound_button: show_ambient_sound_button !== undefined ? Boolean(show_ambient_sound_button) : Boolean(currentRow?.show_ambient_sound_button ?? true),
      show_creative_troubles: show_creative_troubles !== undefined ? Boolean(show_creative_troubles) : Boolean(currentRow?.show_creative_troubles ?? true),
      evolution_whatsapp_enabled:
        evolution_whatsapp_enabled !== undefined ? Boolean(evolution_whatsapp_enabled) : Boolean(currentRow?.evolution_whatsapp_enabled ?? true),
      show_landing_creator: show_landing_creator !== undefined ? Boolean(show_landing_creator) : Boolean(currentRow?.show_landing_creator ?? true),
      show_landing_sensations: show_landing_sensations !== undefined ? Boolean(show_landing_sensations) : Boolean(currentRow?.show_landing_sensations ?? true),
      show_landing_features: show_landing_features !== undefined ? Boolean(show_landing_features) : Boolean(currentRow?.show_landing_features ?? true),
      show_landing_security: show_landing_security !== undefined ? Boolean(show_landing_security) : Boolean(currentRow?.show_landing_security ?? true),
      show_landing_steps: show_landing_steps !== undefined ? Boolean(show_landing_steps) : Boolean(currentRow?.show_landing_steps ?? true),
      show_landing_cta: show_landing_cta !== undefined ? Boolean(show_landing_cta) : Boolean(currentRow?.show_landing_cta ?? true),
      default_theme: default_theme || currentRow?.default_theme || 'indigo',
      default_guide_name: default_guide_name || currentRow?.default_guide_name || 'Isaac',
      default_ambient_track: default_ambient_track || currentRow?.default_ambient_track || '432hz',
      default_ambient_volume: default_ambient_volume !== undefined ? Number(default_ambient_volume) : Number(currentRow?.default_ambient_volume ?? 0.20),
      default_ambient_enabled: default_ambient_enabled !== undefined ? Boolean(default_ambient_enabled) : Boolean(currentRow?.default_ambient_enabled ?? false),
      default_voice_engine: cleanEngine,
      default_gemini_voice: cleanGeminiVoice,
      default_voice_gender: default_voice_gender || currentRow?.default_voice_gender || 'male',
      default_voice_rate: default_voice_rate !== undefined ? Number(default_voice_rate) : Number(currentRow?.default_voice_rate ?? 0.90),
      default_voice_pitch: default_voice_pitch !== undefined ? Number(default_voice_pitch) : Number(currentRow?.default_voice_pitch ?? 0.95),
      default_voice_uri: default_voice_uri !== undefined ? String(default_voice_uri) : (currentRow?.default_voice_uri || ''),
      default_prefer_browser: cleanPreferBrowser,
      default_immersive_voice: default_immersive_voice !== undefined ? Boolean(default_immersive_voice) : Boolean(currentRow?.default_immersive_voice ?? false),
      updated_at: new Date().toISOString(),
      updated_by: updated_by || null,
    };

    const { data, error } = await supabaseAdmin
      .from('izaque_system_settings')
      .upsert(payload)
      .select()
      .single();

    if (error) throw error;

    // Sincroniza de volta no perfil do Edson Manoel para manter 100% de paridade
    try {
      const { data: edsonRow } = await supabaseAdmin
        .from('izaque_profiles')
        .select('id, preferences')
        .eq('email', 'edsonmanoel2012@gmail.com')
        .maybeSingle();

      if (edsonRow?.id) {
        const hasAiFields =
          req.body?.ai_provider_mode !== undefined ||
          req.body?.vps_model !== undefined ||
          req.body?.vps_auto_fallback_gemini !== undefined ||
          req.body?.gemini_auto_fallback_vps !== undefined ||
          req.body?.vps_max_concurrent !== undefined;

        const nextAiConfig = hasAiFields
          ? {
              ...normalizeAiConfig({
                ...(edsonRow.preferences?.system_ai_config || {}),
                ...req.body,
              }),
              updated_at: new Date().toISOString(),
            }
          : edsonRow.preferences?.system_ai_config;

        const mergedEdsonPrefs = {
          ...(edsonRow.preferences || {}),
          ...(nextAiConfig ? { system_ai_config: nextAiConfig } : {}),
          guide_name: payload.default_guide_name,
          voice_engine: payload.default_voice_engine,
          gemini_voice: payload.default_gemini_voice,
          voice_gender: payload.default_voice_gender,
          voice_rate: payload.default_voice_rate,
          voice_pitch: payload.default_voice_pitch,
          voice_uri: payload.default_voice_uri,
          prefer_browser: payload.default_prefer_browser,
          ambient_track: payload.default_ambient_track,
          ambient_volume: payload.default_ambient_volume,
          ambient_enabled: payload.default_ambient_enabled,
          immersive_voice: payload.default_immersive_voice,
        };
        await supabaseAdmin
          .from('izaque_profiles')
          .update({ preferences: mergedEdsonPrefs, updated_at: new Date().toISOString() })
          .eq('id', edsonRow.id);
        invalidateCache('system:ai_config');
      }
    } catch (syncErr) {
      console.warn('⚠️ Aviso ao sincronizar system_settings com perfil do Edson:', syncErr.message);
    }

    invalidateCache('system:settings');
    invalidateEdsonVoiceCache();
    prewarmDemoVoice().catch(() => {});
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Erro ao salvar parâmetros do sistema:', error);
    res.status(500).json({ error: 'Erro ao salvar parâmetros avançados: ' + error.message });
  }
}

/**
 * 60. Aceitar Termos de Uso (Clickwrap com validade jurídica forense)
 * POST /api/terms/accept
 */
export async function acceptTermsOfUse(req, res) {
  try {
    const { userId, termsVersion } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório.' });
    }

    const clientIp = req.headers['x-forwarded-for']
      ? req.headers['x-forwarded-for'].split(',')[0].trim()
      : req.socket?.remoteAddress || req.ip || '127.0.0.1';

    const userAgent = req.headers['user-agent'] || 'Navegador Web';
    const version = termsVersion || 'v1.0-beta-2026';
    const now = new Date().toISOString();

    // 1. Grava na tabela de auditoria forense
    const { error: logError } = await supabaseAdmin
      .from('izaque_terms_acceptances')
      .insert({
        user_id: userId,
        terms_version: version,
        accepted: true,
        accepted_at: now,
        ip_address: clientIp,
        user_agent: userAgent,
      });

    if (logError) {
      console.warn('⚠️ Erro ao registrar log forense de termos:', logError);
    }

    // 2. Atualiza no perfil do usuário em public.izaque_profiles
    const { data: updatedProfile, error: profileError } = await supabaseAdmin
      .from('izaque_profiles')
      .update({
        terms_accepted: true,
        terms_accepted_at: now,
        terms_version: version,
        updated_at: now,
      })
      .eq('id', userId)
      .select()
      .single();

    if (profileError) {
      console.warn('⚠️ Erro ao atualizar perfil com termos:', profileError);
    }

    res.status(200).json({
      success: true,
      message: 'Termos de uso aceitos e registrados com prova técnica forense.',
      timestamp: now,
      ip: clientIp,
      version,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('❌ Erro no aceite de termos de uso:', error);
    res.status(500).json({ error: 'Erro ao registrar aceite de termos: ' + error.message });
  }
}

/**
 * 61. Listar logs de auditoria de termos de uso (Superadmin)
 * GET /api/admin/terms/logs
 */
export async function getTermsAcceptanceLogs(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('izaque_terms_acceptances')
      .select(`
        *,
        profile:izaque_profiles(full_name, email)
      `)
      .order('accepted_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('❌ Erro ao listar logs de termos:', error);
    res.status(500).json({ error: 'Erro ao buscar logs de termos: ' + error.message });
  }
}

/**
 * 62. Consultar status ao vivo e configuração da Chave Mestra de IA (Gemini Cloud ⇄ VPS LynxHub)
 * GET /api/admin/ai-engine/status
 */
export async function getAdminAiEngineStatus(req, res) {
  try {
    const status = await getAiEngineLiveStatus();
    res.status(200).json(status);
  } catch (error) {
    console.error('❌ Erro ao consultar status do motor de IA:', error);
    res.status(500).json({ error: 'Erro ao consultar status do motor de IA: ' + error.message });
  }
}

/**
 * 63. Alternar imediatamente o motor de IA (Gemini Cloud / Híbrido / VPS LynxHub) sem reiniciar
 * PUT /api/admin/ai-engine/config
 */
export async function updateAdminAiEngineConfig(req, res) {
  try {
    const saved = await saveActiveAiConfig(req.body || {});
    res.status(200).json({
      success: true,
      config: saved,
      message: 'Motor de IA atualizado em tempo real com zero perda de dados ou funcionalidades!',
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar motor de IA:', error);
    res.status(500).json({ error: 'Erro ao atualizar motor de IA: ' + error.message });
  }
}

/**
 * 64. Testar em tempo real a resposta e latência do Gemini Cloud ou da VPS LynxHub
 * POST /api/admin/ai-engine/test
 */
export async function testAdminAiEngine(req, res) {
  try {
    const { targetProvider = 'vps', vpsModelOverride = '' } = req.body || {};
    const result = await runAiEngineLiveTest({ targetProvider, vpsModelOverride });
    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Erro no teste ao vivo do motor de IA:', error);
    res.status(500).json({ error: error.message || 'Falha ao testar motor de IA.' });
  }
}







