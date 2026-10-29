import { supabaseAdmin } from '../config/supabase.js';

/**
 * Controller de Perfil do Usuário
 * Permite que o usuário visualize e edite seus dados:
 * - Nome de exibição (full_name)
 * - Foto de perfil / Avatar (avatar_url)
 * - Telefone / WhatsApp (phone)
 */

export async function getProfile(req, res) {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    }

    const { data, error } = await supabaseAdmin
      .from('izaque_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Perfil não encontrado.' });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Erro ao buscar perfil:', error.message);
    res.status(500).json({ error: 'Erro ao buscar perfil.', details: error.message });
  }
}

export async function updateProfile(req, res) {
  try {
    const { userId } = req.params;
    const {
      full_name,
      phone,
      avatar_url,
      preferences,
      birth_date,
      city,
      state,
      occupation,
      main_goal,
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    }

    const updatePayload = {
      updated_at: new Date().toISOString(),
    };

    if (full_name !== undefined) updatePayload.full_name = full_name.trim();
    if (phone !== undefined) updatePayload.phone = phone.trim();
    if (avatar_url !== undefined) updatePayload.avatar_url = avatar_url.trim();
    if (birth_date !== undefined) updatePayload.birth_date = birth_date ? birth_date : null;
    if (city !== undefined) updatePayload.city = city ? city.trim() : null;
    if (state !== undefined) updatePayload.state = state ? state.trim().toUpperCase() : null;
    if (occupation !== undefined) updatePayload.occupation = occupation ? occupation.trim() : null;
    if (main_goal !== undefined) updatePayload.main_goal = main_goal ? main_goal.trim() : null;
    if (preferences !== undefined) {
      updatePayload.preferences = typeof preferences === 'object' && preferences !== null ? preferences : {};
    }

    // 1. Atualiza na tabela public.izaque_profiles
    const { data, error } = await supabaseAdmin
      .from('izaque_profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) throw error;

    // 2. Sincroniza também no auth.users metadata para manter compatibilidade
    try {
      const metaToUpdate = {};
      if (updatePayload.full_name !== undefined) metaToUpdate.full_name = updatePayload.full_name;
      if (updatePayload.phone !== undefined) metaToUpdate.phone = updatePayload.phone;
      if (updatePayload.avatar_url !== undefined) metaToUpdate.avatar_url = updatePayload.avatar_url;
      if (updatePayload.birth_date !== undefined) metaToUpdate.birth_date = updatePayload.birth_date;
      if (updatePayload.city !== undefined) metaToUpdate.city = updatePayload.city;
      if (updatePayload.state !== undefined) metaToUpdate.state = updatePayload.state;
      if (updatePayload.occupation !== undefined) metaToUpdate.occupation = updatePayload.occupation;
      if (updatePayload.main_goal !== undefined) metaToUpdate.main_goal = updatePayload.main_goal;
      if (updatePayload.preferences !== undefined) metaToUpdate.preferences = updatePayload.preferences;

      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: metaToUpdate,
      });
    } catch (metaErr) {
      console.warn('⚠️ Aviso ao sincronizar metadata em auth.users:', metaErr.message);
    }

    console.log(`👤 [Profile Updated] Perfil do usuário [${userId}] atualizado com sucesso:`, {
      name: updatePayload.full_name,
      phone: updatePayload.phone,
      hasAvatar: Boolean(updatePayload.avatar_url),
      hasPreferences: Boolean(updatePayload.preferences),
    });

    res.status(200).json({
      message: 'Perfil atualizado com sucesso!',
      profile: data,
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar perfil:', error.message);
    res.status(500).json({ error: 'Erro ao atualizar dados do perfil.', details: error.message });
  }
}
