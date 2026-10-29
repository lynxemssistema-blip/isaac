import { supabaseAdmin } from '../config/supabase.js';
import { sendCampaignPdfEmail } from '../services/emailService.js';

const PDF_BUCKET = 'izaque-pdfs';
const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15 MB para garantir entrega confiável via anexo SMTP

async function ensurePdfBucket() {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = (buckets || []).some((b) => b.name === PDF_BUCKET);
    if (!exists) {
      await supabaseAdmin.storage.createBucket(PDF_BUCKET, {
        public: true,
        fileSizeLimit: 16 * 1024 * 1024,
        allowedMimeTypes: ['application/pdf'],
      });
    }
  } catch (err) {
    console.warn('⚠️ [PDF Bucket] Aviso ao verificar bucket:', err.message);
  }
}

export function normalizeSlug(raw = '') {
  return raw
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function sanitizeFileName(name = 'material.pdf') {
  const cleaned = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_');
  return cleaned.toLowerCase().endsWith('.pdf') ? cleaned : `${cleaned}.pdf`;
}

async function downloadCampaignPdfBuffer(storagePath) {
  const { data: blob, error } = await supabaseAdmin.storage
    .from(PDF_BUCKET)
    .download(storagePath);

  if (error || !blob) {
    throw new Error(`Falha ao carregar PDF do Storage: ${error?.message || 'Arquivo ausente'}`);
  }

  const arrayBuf = await blob.arrayBuffer();
  return Buffer.from(arrayBuf);
}

async function executeCampaignDelivery({
  campaign,
  userId = null,
  recipientEmail,
  recipientName,
  signupOrigin = 'direct_link',
  appUrl,
}) {
  let deliveryStatus = 'sent';
  let errorMessage = null;

  try {
    const pdfBuffer = await downloadCampaignPdfBuffer(campaign.pdf_storage_path);
    await sendCampaignPdfEmail({
      toEmail: recipientEmail,
      recipientName,
      campaignTitle: campaign.title,
      emailSubject: campaign.email_subject,
      emailBody: campaign.email_body,
      pdfBuffer,
      pdfFileName: campaign.pdf_file_name,
      pdfPublicUrl: campaign.pdf_public_url,
      appUrl,
    });
  } catch (err) {
    deliveryStatus = 'failed';
    errorMessage = err.message || 'Falha no envio SMTP';
    console.error(`❌ [PDF Delivery Error] Falha ao enviar PDF para ${recipientEmail}:`, errorMessage);
  }

  const { data: logRow } = await supabaseAdmin
    .from('izaque_pdf_deliveries')
    .insert({
      user_id: userId,
      campaign_id: campaign.id,
      recipient_email: recipientEmail.trim().toLowerCase(),
      recipient_name: recipientName || null,
      signup_origin: signupOrigin,
      delivery_status: deliveryStatus,
      error_message: errorMessage,
      sent_at: new Date().toISOString(),
    })
    .select()
    .maybeSingle();

  return {
    delivered: deliveryStatus === 'sent',
    errorMessage,
    deliveryLog: logRow,
  };
}

// ============================================================================
// ROTAS PÚBLICAS (PÁGINA DE CADASTRO DIRETO E MODAL DA LANDING PAGE)
// ============================================================================

export async function getPublicCampaignBySlug(req, res) {
  try {
    const slug = normalizeSlug(req.params.slug || '');
    if (!slug) {
      return res.status(400).json({ error: 'Slug inválido.' });
    }

    const { data: campaign, error } = await supabaseAdmin
      .from('izaque_pdf_campaigns')
      .select('id, title, slug, subtitle, pdf_file_name, is_default, is_active')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;

    if (!campaign) {
      // Fallback opcional: informa qual é a campanha padrão ativa, se existir
      const { data: fallbackDefault } = await supabaseAdmin
        .from('izaque_pdf_campaigns')
        .select('id, title, slug, subtitle, pdf_file_name, is_default, is_active')
        .eq('is_default', true)
        .eq('is_active', true)
        .maybeSingle();

      return res.status(200).json({
        found: false,
        campaign: fallbackDefault || null,
      });
    }

    res.status(200).json({ found: true, campaign });
  } catch (error) {
    console.error('❌ Erro ao buscar campanha pública por slug:', error);
    res.status(500).json({ error: 'Erro ao carregar informações do link de cadastro.' });
  }
}

export async function getPublicDefaultCampaign(req, res) {
  try {
    const { data: campaign, error } = await supabaseAdmin
      .from('izaque_pdf_campaigns')
      .select('id, title, slug, subtitle, pdf_file_name, is_default, is_active')
      .eq('is_default', true)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    res.status(200).json({ campaign: campaign || null });
  } catch (error) {
    console.error('❌ Erro ao buscar campanha padrão:', error);
    res.status(500).json({ error: 'Erro ao consultar material padrão.' });
  }
}

export async function completeSignupAndDeliverPdf(req, res) {
  try {
    const {
      userId,
      email,
      fullName,
      phone,
      birthDate,
      city,
      state,
      occupation,
      mainGoal,
      termsVersion,
      campaignSlug,
      signupOrigin = 'direct_link',
      appUrl,
    } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: 'userId e email são obrigatórios.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (fullName || '').trim();
    const now = new Date().toISOString();

    // 1. Resolve qual campanha de PDF deve ser aplicada
    let targetCampaign = null;
    if (campaignSlug) {
      const normalized = normalizeSlug(campaignSlug);
      const { data: bySlug } = await supabaseAdmin
        .from('izaque_pdf_campaigns')
        .select('*')
        .eq('slug', normalized)
        .eq('is_active', true)
        .maybeSingle();
      targetCampaign = bySlug || null;
    }

    if (!targetCampaign) {
      const { data: defaultCamp } = await supabaseAdmin
        .from('izaque_pdf_campaigns')
        .select('*')
        .eq('is_default', true)
        .eq('is_active', true)
        .maybeSingle();
      targetCampaign = defaultCamp || null;
    }

    // 2. Verifica perfil existente para preservar role/avatar se já criado por trigger
    const { data: existingProfile } = await supabaseAdmin
      .from('izaque_profiles')
      .select('id, role, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    const resolvedRole =
      existingProfile?.role ||
      (cleanEmail === 'edsonmanoel2012@gmail.com' ? 'master' : 'user');

    const profilePayload = {
      id: userId,
      email: cleanEmail,
      full_name: cleanName || cleanEmail.split('@')[0],
      role: resolvedRole,
      phone: phone ? phone.trim() : null,
      birth_date: birthDate ? birthDate : null,
      city: city ? city.trim() : null,
      state: state ? state.trim().toUpperCase() : null,
      occupation: occupation ? occupation.trim() : null,
      main_goal: mainGoal ? mainGoal.trim() : null,
      signup_campaign_id: targetCampaign?.id || null,
      terms_accepted: true,
      terms_accepted_at: now,
      terms_version: termsVersion || 'v1.0-beta-2026',
      updated_at: now,
    };

    const { data: savedProfile, error: profileErr } = await supabaseAdmin
      .from('izaque_profiles')
      .upsert(profilePayload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (profileErr) {
      console.error('⚠️ Erro ao salvar perfil completo:', profileErr);
    }

    // 3. Sincroniza metadados básicos em auth.users
    try {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          full_name: profilePayload.full_name,
          phone: profilePayload.phone,
          birth_date: profilePayload.birth_date,
          city: profilePayload.city,
          state: profilePayload.state,
          occupation: profilePayload.occupation,
          main_goal: profilePayload.main_goal,
        },
      });
    } catch (metaErr) {
      console.warn('⚠️ Aviso ao sincronizar user_metadata:', metaErr.message);
    }

    // 4. Registra aceite forense dos Termos de Uso
    const clientIp = req.headers['x-forwarded-for']
      ? req.headers['x-forwarded-for'].split(',')[0].trim()
      : req.socket?.remoteAddress || req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Navegador Web';

    const { error: termsErr } = await supabaseAdmin
      .from('izaque_terms_acceptances')
      .insert({
        user_id: userId,
        terms_version: termsVersion || 'v1.0-beta-2026',
        accepted: true,
        accepted_at: now,
        ip_address: clientIp,
        user_agent: userAgent,
      });

    if (termsErr) {
      console.warn('⚠️ Aviso ao gravar auditoria de termos no cadastro:', termsErr.message);
    }

    // 5. Vincula automaticamente ao grupo da campanha, se configurado
    if (targetCampaign?.target_group_id) {
      const { error: groupErr } = await supabaseAdmin
        .from('izaque_user_group_members')
        .upsert(
          { group_id: targetCampaign.target_group_id, user_id: userId },
          { onConflict: 'group_id,user_id', ignoreDuplicates: true }
        );
      if (groupErr) {
        console.warn('⚠️ Aviso ao vincular novo usuário ao grupo da campanha:', groupErr.message);
      }
    }

    // 6. Dispara o PDF por e-mail se houver campanha ativa aplicável
    let pdfDelivered = false;
    let deliveryError = null;

    if (targetCampaign) {
      const deliveryResult = await executeCampaignDelivery({
        campaign: targetCampaign,
        userId,
        recipientEmail: cleanEmail,
        recipientName: profilePayload.full_name,
        signupOrigin,
        appUrl,
      });
      pdfDelivered = deliveryResult.delivered;
      deliveryError = deliveryResult.errorMessage;
    }

    res.status(200).json({
      success: true,
      profile: savedProfile || profilePayload,
      hasCampaign: Boolean(targetCampaign),
      pdfDelivered,
      deliveryError,
      campaign: targetCampaign
        ? {
            id: targetCampaign.id,
            title: targetCampaign.title,
            slug: targetCampaign.slug,
            pdfFileName: targetCampaign.pdf_file_name,
          }
        : null,
    });
  } catch (error) {
    console.error('❌ Erro em completeSignupAndDeliverPdf:', error);
    res.status(500).json({ error: 'Erro ao concluir cadastro e processar envio do PDF.' });
  }
}

export async function sendPdfToExistingUser(req, res) {
  try {
    const { email, campaignSlug, appUrl } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Informe um e-mail válido.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const escapedEmail = cleanEmail.replace(/[%_]/g, '\\$&');

    // 1. Verifica se o usuário já possui conta em izaque_profiles
    const { data: existingProfile, error: profErr } = await supabaseAdmin
      .from('izaque_profiles')
      .select('id, full_name, email')
      .ilike('email', escapedEmail)
      .maybeSingle();

    if (profErr) throw profErr;

    if (!existingProfile) {
      return res.status(404).json({
        code: 'USER_NOT_FOUND',
        error:
          'Ainda não encontramos uma conta cadastrada com este e-mail. Preencha o formulário abaixo para criar seu acesso e receber o PDF agora!',
      });
    }

    // 2. Localiza a campanha solicitada (ou a campanha padrão ativa)
    let targetCampaign = null;
    if (campaignSlug) {
      const normalized = normalizeSlug(campaignSlug);
      const { data: bySlug } = await supabaseAdmin
        .from('izaque_pdf_campaigns')
        .select('*')
        .eq('slug', normalized)
        .eq('is_active', true)
        .maybeSingle();
      targetCampaign = bySlug || null;
    }

    if (!targetCampaign) {
      const { data: defaultCamp } = await supabaseAdmin
        .from('izaque_pdf_campaigns')
        .select('*')
        .eq('is_default', true)
        .eq('is_active', true)
        .maybeSingle();
      targetCampaign = defaultCamp || null;
    }

    if (!targetCampaign) {
      return res.status(404).json({
        error: 'Nenhum material PDF está ativo neste link no momento.',
      });
    }

    // 3. Proteção anti-abuso (máximo de 3 envios do mesmo PDF por hora para o mesmo e-mail)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabaseAdmin
      .from('izaque_pdf_deliveries')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', targetCampaign.id)
      .eq('recipient_email', cleanEmail)
      .eq('delivery_status', 'sent')
      .gte('sent_at', oneHourAgo);

    if ((recentCount || 0) >= 3) {
      return res.status(429).json({
        error:
          'Este PDF já foi enviado recentemente para o seu e-mail. Confira sua caixa de entrada e também as abas Spam ou Promoções.',
      });
    }

    // 4. Se a campanha tiver grupo associado, adiciona o membro também
    if (targetCampaign.target_group_id && existingProfile.id) {
      await supabaseAdmin
        .from('izaque_user_group_members')
        .upsert(
          { group_id: targetCampaign.target_group_id, user_id: existingProfile.id },
          { onConflict: 'group_id,user_id', ignoreDuplicates: true }
        );
    }

    // 5. Envia o PDF
    const deliveryResult = await executeCampaignDelivery({
      campaign: targetCampaign,
      userId: existingProfile.id,
      recipientEmail: cleanEmail,
      recipientName: existingProfile.full_name,
      signupOrigin: 'existing_user_link',
      appUrl,
    });

    if (!deliveryResult.delivered) {
      return res.status(500).json({
        error: `Não foi possível enviar o e-mail no momento: ${deliveryResult.errorMessage}`,
      });
    }

    res.status(200).json({
      success: true,
      pdfDelivered: true,
      recipientEmail: cleanEmail,
      campaign: {
        id: targetCampaign.id,
        title: targetCampaign.title,
        slug: targetCampaign.slug,
        pdfFileName: targetCampaign.pdf_file_name,
      },
    });
  } catch (error) {
    console.error('❌ Erro em sendPdfToExistingUser:', error);
    res.status(500).json({ error: 'Erro ao enviar o PDF para sua conta.' });
  }
}

// ============================================================================
// ROTAS ADMINISTRATIVAS (GESTÃO DE MÚLTIPLOS PDFS, LINKS E ENTREGAS)
// ============================================================================

export async function getAdminPdfCampaigns(req, res) {
  try {
    const { data: campaigns, error } = await supabaseAdmin
      .from('izaque_pdf_campaigns')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    const { data: deliveries } = await supabaseAdmin
      .from('izaque_pdf_deliveries')
      .select('campaign_id, delivery_status, signup_origin');

    const statsMap = {};
    for (const d of deliveries || []) {
      if (!d.campaign_id) continue;
      if (!statsMap[d.campaign_id]) {
        statsMap[d.campaign_id] = {
          total: 0,
          sent: 0,
          failed: 0,
          directSignups: 0,
          existingUsers: 0,
          landingSignups: 0,
        };
      }
      const s = statsMap[d.campaign_id];
      s.total += 1;
      if (d.delivery_status === 'sent') s.sent += 1;
      if (d.delivery_status === 'failed') s.failed += 1;
      if (d.signup_origin === 'direct_link') s.directSignups += 1;
      if (d.signup_origin === 'existing_user_link') s.existingUsers += 1;
      if (d.signup_origin === 'landing_modal') s.landingSignups += 1;
    }

    const enriched = (campaigns || []).map((c) => ({
      ...c,
      stats: statsMap[c.id] || {
        total: 0,
        sent: 0,
        failed: 0,
        directSignups: 0,
        existingUsers: 0,
        landingSignups: 0,
      },
    }));

    res.status(200).json(enriched);
  } catch (error) {
    console.error('❌ Erro ao listar campanhas de PDF:', error);
    res.status(500).json({ error: 'Erro ao carregar campanhas de PDF.' });
  }
}

export async function getAdminPdfDeliveries(req, res) {
  try {
    const { campaignId } = req.query;
    let query = supabaseAdmin
      .from('izaque_pdf_deliveries')
      .select(`
        *,
        campaign:izaque_pdf_campaigns(id, title, slug, pdf_file_name)
      `)
      .order('sent_at', { ascending: false })
      .limit(150);

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    const { data: deliveries, error } = await query;
    if (error) throw error;

    // Enriquece com telefone/cidade/objetivo do perfil quando houver user_id
    const userIds = [...new Set((deliveries || []).map((d) => d.user_id).filter(Boolean))];
    let profilesById = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('izaque_profiles')
        .select('id, full_name, phone, city, state, occupation, main_goal')
        .in('id', userIds);
      for (const p of profiles || []) {
        profilesById[p.id] = p;
      }
    }

    const enriched = (deliveries || []).map((d) => ({
      ...d,
      profile: d.user_id ? profilesById[d.user_id] || null : null,
    }));

    res.status(200).json(enriched);
  } catch (error) {
    console.error('❌ Erro ao listar entregas de PDF:', error);
    res.status(500).json({ error: 'Erro ao carregar histórico de envios de PDF.' });
  }
}

export async function createAdminPdfCampaign(req, res) {
  try {
    const {
      title,
      slug,
      subtitle,
      emailSubject,
      emailBody,
      targetGroupId,
      isDefault = false,
      isActive = true,
      pdfBase64,
      pdfFileName,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'O título da campanha/material é obrigatório.' });
    }
    if (!pdfBase64 || !pdfFileName) {
      return res.status(400).json({ error: 'Anexe um arquivo PDF válido para esta campanha.' });
    }

    const cleanSlug = normalizeSlug(slug || title);
    if (!cleanSlug) {
      return res.status(400).json({ error: 'Informe um identificador (slug) válido para o link.' });
    }

    // Verifica duplicidade de slug
    const { data: existingSlug } = await supabaseAdmin
      .from('izaque_pdf_campaigns')
      .select('id')
      .eq('slug', cleanSlug)
      .maybeSingle();

    if (existingSlug) {
      return res.status(400).json({
        error: `Já existe um link com o identificador "${cleanSlug}". Escolha outro nome para o link.`,
      });
    }

    const base64Clean = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;
    const pdfBuffer = Buffer.from(base64Clean, 'base64');

    if (pdfBuffer.length > MAX_PDF_BYTES) {
      return res.status(400).json({
        error: 'O arquivo PDF deve ter no máximo 15 MB para garantir entrega por e-mail.',
      });
    }

    await ensurePdfBucket();

    const safeFileName = sanitizeFileName(pdfFileName);
    const storagePath = `campaigns/${Date.now()}_${cleanSlug}_${safeFileName}`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from(PDF_BUCKET)
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadErr) {
      throw new Error(`Falha ao armazenar PDF no Supabase Storage: ${uploadErr.message}`);
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(PDF_BUCKET)
      .getPublicUrl(storagePath);

    if (Boolean(isDefault)) {
      await supabaseAdmin
        .from('izaque_pdf_campaigns')
        .update({ is_default: false, updated_at: new Date().toISOString() })
        .eq('is_default', true);
    }

    const { data: created, error: insertErr } = await supabaseAdmin
      .from('izaque_pdf_campaigns')
      .insert({
        title: title.trim(),
        slug: cleanSlug,
        subtitle: subtitle ? subtitle.trim() : null,
        pdf_file_name: safeFileName,
        pdf_storage_path: storagePath,
        pdf_public_url: publicUrlData?.publicUrl || null,
        pdf_size_bytes: pdfBuffer.length,
        email_subject:
          emailSubject && emailSubject.trim()
            ? emailSubject.trim()
            : `📄 Seu material chegou: ${title.trim()}`,
        email_body: emailBody ? emailBody.trim() : null,
        target_group_id: targetGroupId || null,
        is_default: Boolean(isDefault),
        is_active: Boolean(isActive),
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    res.status(201).json(created);
  } catch (error) {
    console.error('❌ Erro ao criar campanha de PDF:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar campanha de PDF.' });
  }
}

export async function updateAdminPdfCampaign(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      subtitle,
      emailSubject,
      emailBody,
      targetGroupId,
      isDefault,
      isActive,
      pdfBase64,
      pdfFileName,
    } = req.body;

    const { data: current, error: findErr } = await supabaseAdmin
      .from('izaque_pdf_campaigns')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (findErr) throw findErr;
    if (!current) {
      return res.status(404).json({ error: 'Campanha não encontrada.' });
    }

    const updates = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updates.title = title.trim();

    if (slug !== undefined) {
      const cleanSlug = normalizeSlug(slug);
      if (!cleanSlug) {
        return res.status(400).json({ error: 'O identificador (slug) não pode ficar vazio.' });
      }
      if (cleanSlug !== current.slug) {
        const { data: dup } = await supabaseAdmin
          .from('izaque_pdf_campaigns')
          .select('id')
          .eq('slug', cleanSlug)
          .neq('id', id)
          .maybeSingle();
        if (dup) {
          return res.status(400).json({
            error: `O identificador "${cleanSlug}" já está sendo usado em outro link.`,
          });
        }
        updates.slug = cleanSlug;
      }
    }

    if (subtitle !== undefined) updates.subtitle = subtitle ? subtitle.trim() : null;
    if (emailSubject !== undefined) updates.email_subject = emailSubject.trim();
    if (emailBody !== undefined) updates.email_body = emailBody ? emailBody.trim() : null;
    if (targetGroupId !== undefined) updates.target_group_id = targetGroupId || null;
    if (isActive !== undefined) updates.is_active = Boolean(isActive);

    // Substituição opcional do arquivo PDF
    if (pdfBase64 && pdfFileName) {
      const base64Clean = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;
      const pdfBuffer = Buffer.from(base64Clean, 'base64');

      if (pdfBuffer.length > MAX_PDF_BYTES) {
        return res.status(400).json({
          error: 'O arquivo PDF deve ter no máximo 15 MB.',
        });
      }

      await ensurePdfBucket();
      const safeFileName = sanitizeFileName(pdfFileName);
      const effectiveSlug = updates.slug || current.slug;
      const newStoragePath = `campaigns/${Date.now()}_${effectiveSlug}_${safeFileName}`;

      const { error: uploadErr } = await supabaseAdmin.storage
        .from(PDF_BUCKET)
        .upload(newStoragePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadErr) {
        throw new Error(`Falha ao atualizar PDF no Storage: ${uploadErr.message}`);
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from(PDF_BUCKET)
        .getPublicUrl(newStoragePath);

      updates.pdf_file_name = safeFileName;
      updates.pdf_storage_path = newStoragePath;
      updates.pdf_public_url = publicUrlData?.publicUrl || null;
      updates.pdf_size_bytes = pdfBuffer.length;

      // Remove arquivo antigo silenciosamente para não acumular lixo
      if (current.pdf_storage_path && current.pdf_storage_path !== newStoragePath) {
        supabaseAdmin.storage.from(PDF_BUCKET).remove([current.pdf_storage_path]).catch(() => {});
      }
    }

    if (isDefault !== undefined) {
      const wantDefault = Boolean(isDefault);
      if (wantDefault) {
        await supabaseAdmin
          .from('izaque_pdf_campaigns')
          .update({ is_default: false, updated_at: new Date().toISOString() })
          .eq('is_default', true)
          .neq('id', id);
      }
      updates.is_default = wantDefault;
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('izaque_pdf_campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;
    res.status(200).json(updated);
  } catch (error) {
    console.error('❌ Erro ao atualizar campanha de PDF:', error);
    res.status(500).json({ error: error.message || 'Erro ao atualizar campanha de PDF.' });
  }
}

export async function deleteAdminPdfCampaign(req, res) {
  try {
    const { id } = req.params;
    const { data: current } = await supabaseAdmin
      .from('izaque_pdf_campaigns')
      .select('id, pdf_storage_path')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabaseAdmin
      .from('izaque_pdf_campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;

    if (current?.pdf_storage_path) {
      supabaseAdmin.storage.from(PDF_BUCKET).remove([current.pdf_storage_path]).catch(() => {});
    }

    res.status(200).json({ success: true, message: 'Campanha e arquivo PDF removidos.' });
  } catch (error) {
    console.error('❌ Erro ao excluir campanha de PDF:', error);
    res.status(500).json({ error: 'Erro ao remover campanha de PDF.' });
  }
}

export async function testOrResendCampaignPdf(req, res) {
  try {
    const { id } = req.params; // campaignId
    const { toEmail, recipientName, appUrl } = req.body;

    if (!toEmail || !toEmail.includes('@')) {
      return res.status(400).json({ error: 'Informe um e-mail válido para o envio.' });
    }

    const { data: campaign, error } = await supabaseAdmin
      .from('izaque_pdf_campaigns')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!campaign) {
      return res.status(404).json({ error: 'Campanha de PDF não encontrada.' });
    }

    const result = await executeCampaignDelivery({
      campaign,
      userId: null,
      recipientEmail: toEmail.trim().toLowerCase(),
      recipientName: recipientName || 'Teste Admin',
      signupOrigin: 'admin_manual',
      appUrl,
    });

    if (!result.delivered) {
      return res.status(500).json({
        error: `Falha no disparo SMTP: ${result.errorMessage}`,
      });
    }

    res.status(200).json({
      success: true,
      message: `PDF "${campaign.pdf_file_name}" enviado com sucesso para ${toEmail}!`,
    });
  } catch (error) {
    console.error('❌ Erro ao disparar PDF manual/teste:', error);
    res.status(500).json({ error: 'Erro ao disparar e-mail com PDF.' });
  }
}

