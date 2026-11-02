import { supabaseAdmin } from '../config/supabase.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateAndCleanContact({ email, phone }) {
  const cleanEmail = email ? String(email).trim().toLowerCase() : '';
  const cleanPhone = phone ? String(phone).trim() : '';
  const phoneDigits = cleanPhone.replace(/\D/g, '');

  if (cleanEmail && !EMAIL_REGEX.test(cleanEmail)) {
    return {
      ok: false,
      error: 'O e-mail informado não parece válido. Verifique ou deixe em branco caso prefira informar apenas o celular.',
    };
  }

  if (cleanPhone && (phoneDigits.length < 10 || phoneDigits.length > 15)) {
    return {
      ok: false,
      error: 'Informe um número de celular/WhatsApp válido com DDD (ex.: (11) 99999-9999).',
    };
  }

  if (!cleanEmail && !cleanPhone) {
    return {
      ok: false,
      error: 'Informe pelo menos um e-mail válido ou um celular/WhatsApp válido para concluir sua inscrição.',
    };
  }

  return {
    ok: true,
    cleanEmail: cleanEmail || null,
    cleanPhone: cleanPhone || null,
    phoneDigits,
  };
}

/**
 * POST /api/inscriptions
 * Ficha pública de inscrição simples (sem senha, sem login no app, sem envio automático de e-mail).
 */
export async function createPublicInscription(req, res) {
  try {
    const { fullName, email, phone } = req.body;
    const cleanName = fullName ? String(fullName).trim() : '';

    if (cleanName.length < 2) {
      return res.status(400).json({
        error: 'Por favor, informe o seu nome completo.',
      });
    }

    const contactCheck = validateAndCleanContact({ email, phone });
    if (!contactCheck.ok) {
      return res.status(400).json({ error: contactCheck.error });
    }

    const { cleanEmail, cleanPhone } = contactCheck;
    const now = new Date().toISOString();

    // Verifica se já existe inscrição anterior com o mesmo e-mail ou telefone para evitar duplicatas
    let existing = null;
    if (cleanEmail) {
      const escapedEmail = cleanEmail.replace(/[%_]/g, '\\$&');
      const { data: byEmail } = await supabaseAdmin
        .from('izaque_inscriptions')
        .select('*')
        .ilike('email', escapedEmail)
        .maybeSingle();
      existing = byEmail || null;
    }

    if (!existing && cleanPhone) {
      const { data: byPhone } = await supabaseAdmin
        .from('izaque_inscriptions')
        .select('*')
        .eq('phone', cleanPhone)
        .maybeSingle();
      existing = byPhone || null;
    }

    if (existing) {
      const { data: updated, error: updateErr } = await supabaseAdmin
        .from('izaque_inscriptions')
        .update({
          full_name: cleanName,
          email: cleanEmail || existing.email,
          phone: cleanPhone || existing.phone,
          is_active: true,
          updated_at: now,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      return res.status(200).json({
        success: true,
        inscription: {
          id: updated.id,
          full_name: updated.full_name,
        },
      });
    }

    const { data: created, error: insertErr } = await supabaseAdmin
      .from('izaque_inscriptions')
      .insert({
        full_name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        is_active: true,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    res.status(201).json({
      success: true,
      inscription: {
        id: created.id,
        full_name: created.full_name,
      },
    });
  } catch (error) {
    console.error('❌ Erro ao registrar ficha de inscrição:', error);
    res.status(500).json({
      error: 'Não foi possível concluir o envio da sua inscrição no momento. Tente novamente em instantes.',
    });
  }
}

/**
 * PUT /api/admin/inscriptions/:id
 * Edição administrativa de um inscrito da ficha simples.
 */
export async function updateAdminInscription(req, res) {
  try {
    const { id } = req.params;
    const { fullName, email, phone, notes, isActive } = req.body;

    const updates = {
      updated_at: new Date().toISOString(),
    };

    if (fullName !== undefined) {
      const cleanName = String(fullName).trim();
      if (cleanName.length < 2) {
        return res.status(400).json({ error: 'O nome deve ter pelo menos 2 caracteres.' });
      }
      updates.full_name = cleanName;
    }

    if (email !== undefined || phone !== undefined) {
      const contactCheck = validateAndCleanContact({ email, phone });
      if (!contactCheck.ok) {
        return res.status(400).json({ error: contactCheck.error });
      }
      updates.email = contactCheck.cleanEmail;
      updates.phone = contactCheck.cleanPhone;
    }

    if (notes !== undefined) {
      updates.notes = notes ? String(notes).trim() : null;
    }

    if (isActive !== undefined) {
      updates.is_active = Boolean(isActive);
    }

    const { data, error } = await supabaseAdmin
      .from('izaque_inscriptions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      ...data,
      account_type: 'inscricao',
      is_inscription: true,
      role: 'inscrito',
      plan_id: 'inscricao',
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar inscrito:', error);
    res.status(500).json({ error: 'Erro ao atualizar dados da inscrição.' });
  }
}

/**
 * DELETE /api/admin/inscriptions/:id
 * Exclusão administrativa de uma ficha de inscrição + vínculos em grupos.
 */
export async function deleteAdminInscription(req, res) {
  try {
    const { id } = req.params;

    await supabaseAdmin
      .from('izaque_user_group_members')
      .delete()
      .eq('user_id', id);

    const { error } = await supabaseAdmin
      .from('izaque_inscriptions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao excluir inscrição:', error);
    res.status(500).json({ error: 'Erro ao excluir registro de inscrição.' });
  }
}

