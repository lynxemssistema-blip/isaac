import { supabaseAdmin } from '../config/supabase.js';
import { invalidateCache } from '../utils/memoryCache.js';
import { invalidateEdsonVoiceCache, normalizeGeminiVoiceId } from './voiceController.js';

/**
 * Controller de Perfil do Usuário
 * Permite que o usuário visualize e edite seus dados e sincroniza automaticamente
 * os parâmetros de voz/áudio do usuário Edson Manoel (edsonmanoel2012@gmail.com)
 * como diretriz global para todos os casos da plataforma.
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
      whatsapp_opt_out,
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    }

    // 0. Busca perfil atual para fazer merge seguro de preferences (evita apagar voz/tema em atualizações parciais)
    const { data: existingProfile } = await supabaseAdmin
      .from('izaque_profiles')
      .select('id, email, role, preferences')
      .eq('id', userId)
      .maybeSingle();

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
    if (whatsapp_opt_out !== undefined) {
      updatePayload.whatsapp_opt_out = Boolean(whatsapp_opt_out);
      updatePayload.whatsapp_opt_out_at = whatsapp_opt_out ? new Date().toISOString() : null;
    }

    if (preferences !== undefined && typeof preferences === 'object' && preferences !== null) {
      const mergedPrefs = {
        ...(existingProfile?.preferences || {}),
        ...preferences,
      };
      if (mergedPrefs.gemini_voice) {
        mergedPrefs.gemini_voice = normalizeGeminiVoiceId(mergedPrefs.gemini_voice);
      }
      updatePayload.preferences = mergedPrefs;
    }

    // 1. Atualiza na tabela public.izaque_profiles
    const { data, error } = await supabaseAdmin
      .from('izaque_profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) throw error;

    // 2. Se o perfil atualizado for do Edson Manoel (SuperAdmin/Master), propaga imediatamente
    // os parâmetros de leitor/áudio/voz para izaque_system_settings (usado para TODOS os usuários)
    const targetEmail = String(data?.email || existingProfile?.email || '').toLowerCase();
    const targetRole = String(data?.role || existingProfile?.role || '').toLowerCase();
    const isEdsonOrMaster = targetEmail === 'edsonmanoel2012@gmail.com' || targetRole === 'master';

    if (isEdsonOrMaster && updatePayload.preferences) {
      const p = updatePayload.preferences;
      try {
        const globalVoiceSync = {
          updated_at: new Date().toISOString(),
          updated_by: userId,
        };
        if (p.guide_name !== undefined) globalVoiceSync.default_guide_name = p.guide_name || 'Isaac';
        if (p.voice_engine !== undefined) globalVoiceSync.default_voice_engine = p.voice_engine || 'gemini';
        if (p.gemini_voice !== undefined) {
          globalVoiceSync.default_gemini_voice = normalizeGeminiVoiceId(p.gemini_voice);
        }
        if (p.voice_gender !== undefined) globalVoiceSync.default_voice_gender = p.voice_gender || 'male';
        if (p.voice_rate !== undefined) globalVoiceSync.default_voice_rate = Number(p.voice_rate) || 0.90;
        if (p.voice_pitch !== undefined) globalVoiceSync.default_voice_pitch = Number(p.voice_pitch) || 0.95;
        if (p.voice_uri !== undefined) globalVoiceSync.default_voice_uri = p.voice_uri || '';
        if (p.prefer_browser !== undefined) globalVoiceSync.default_prefer_browser = Boolean(p.prefer_browser);
        if (p.ambient_track !== undefined) globalVoiceSync.default_ambient_track = p.ambient_track || '432hz';
        if (p.ambient_volume !== undefined) globalVoiceSync.default_ambient_volume = Number(p.ambient_volume) || 0.20;
        if (p.ambient_enabled !== undefined) globalVoiceSync.default_ambient_enabled = Boolean(p.ambient_enabled);
        if (p.immersive_voice !== undefined) globalVoiceSync.default_immersive_voice = Boolean(p.immersive_voice);

        await supabaseAdmin
          .from('izaque_system_settings')
          .update(globalVoiceSync)
          .eq('id', 'global');

        invalidateCache('system:settings');
        invalidateEdsonVoiceCache();
        console.log('🎙️ [Master Voice Sync] Parâmetros de áudio do Edson replicados para toda a plataforma:', {
          engine: globalVoiceSync.default_voice_engine,
          voice: globalVoiceSync.default_gemini_voice,
          rate: globalVoiceSync.default_voice_rate,
          pitch: globalVoiceSync.default_voice_pitch,
        });
      } catch (syncErr) {
        console.warn('⚠️ Aviso ao replicar parâmetros de áudio do Edson em system_settings:', syncErr.message);
      }
    }

    // 3. Sincroniza também no auth.users metadata para manter compatibilidade
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

    res.status(200).json({
      message: 'Perfil atualizado com sucesso!',
      profile: data,
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar perfil:', error.message);
    res.status(500).json({ error: 'Erro ao atualizar dados do perfil.', details: error.message });
  }
}
