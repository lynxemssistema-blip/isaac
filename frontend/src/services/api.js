/**
 * Cliente de API para o Backend Hermes (Orquestrador ISAAC)
 * Nenhuma chave de API de LLM fica exposta no Frontend.
 */

import { supabase } from './supabase';
import { authFetch, BACKEND_URL } from './authFetch';

/**
 * Remove formatações Markdown, emojis, URLs e caracteres que quebram o fluxo da fala.
 * Otimizado para entonação calma e meditativa da mentoria.
 */
export function cleanTextForSpeech(text) {
  if (!text) return '';

  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`.*?`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[*_#~>]/g, '')
    .replace(/^\s*[-•*]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '')
    .replace(/\r\n/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\.{3,}/g, '... ')
    .trim();
}

/**
 * Calcula o hash SHA-256 do texto para verificação de cache no Supabase Storage
 */
export async function getCleanTextAndHash(text, voiceName = 'Charon') {
  const clean = cleanTextForSpeech(text);
  if (!clean) return { cleanText: '', fileName: '' };
  try {
    const normalizedVoice = (voiceName || 'Charon').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(`${normalizedVoice}_${clean}`);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      const fileName = `voice_${normalizedVoice}_${hashHex.slice(0, 24)}.wav`;
      return { cleanText: clean, fileName };
    }
    return { cleanText: clean, fileName: '' };
  } catch {
    return { cleanText: clean, fileName: '' };
  }
}

/**
 * Converte resposta da API para JSON com validação segura de Content-Type.
 * Evita que páginas HTML de servidores estáticos quebrem a aplicação com "Unexpected token <".
 */
async function safeParseJson(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const textSnippet = await response.text().catch(() => '');
    if (textSnippet.includes('<!doctype') || textSnippet.includes('<html')) {
      throw new Error(
        `O servidor web estático respondeu com HTML (index.html). O Backend Hermes Node.js precisa estar rodando ou configurado em VITE_BACKEND_URL.`
      );
    }
    throw new Error(`Resposta não-JSON recebida da API (status ${response.status})`);
  }
  return await response.json();
}

/**
 * Envia uma mensagem para o Backend Hermes processar com RAG e Gemini
 * @param {object} params
 * @param {string} params.message Texto enviado pelo usuário
 * @param {string} params.userId ID único do usuário autenticado no Supabase
 * @param {string} [params.agentId] ID do agente/mentor selecionado (opcional)
 * @param {Array} [params.history] Histórico recente da conversa
 * @returns {Promise<{reply: string, memoriesUsed: Array, timestamp: string}>}
 */
export async function sendChatMessage({ message, userId, agentId, history = [], sessionId, guidedConversationId }) {
  try {
    const response = await authFetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        userId,
        agentId,
        sessionId,
        guidedConversationId,
        history: history.map((item) => ({
          role: item.role,
          content: item.content,
        })),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro na requisição: status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Erro na comunicação com o Backend Hermes:', error);
    throw error;
  }
}

/**
 * Verifica o status de saúde do Backend
 */
export async function checkBackendHealth() {
  try {
    const res = await authFetch(`${BACKEND_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Busca todos os agentes especialistas ativos para o seletor do chat
 */
export async function fetchActiveAgents() {
  // 1. Tenta via Backend Hermes
  try {
    const res = await authFetch(`${BACKEND_URL}/api/agents`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    }
  } catch {}

  // 2. Fallback direto ao Supabase (garante que os agentes carreguem 100% mesmo com backend offline)
  try {
    const { data, error } = await supabase
      .from('izaque_agents')
      .select('id, name, slug, type, temperature, system_prompt, is_active, starter_questions')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.warn('⚠️ Falha ao buscar especialistas no Supabase:', error?.message);
    return [];
  }
}

/**
 * Envia um áudio de voz para transcrição e processamento com RAG no Backend Hermes
 * @param {object} params
 * @param {string} params.audioBase64 Áudio gravado em base64
 * @param {string} [params.mimeType] Tipo MIME (ex: audio/webm, audio/wav)
 * @param {string} params.userId ID único do usuário autenticado no Supabase
 * @param {string} [params.agentId] ID do mentor especialista (ou 'auto')
 * @param {number} [params.durationSeconds] Duração do áudio gravado em segundos
 * @param {Array} [params.history] Histórico recente da conversa
 * @param {string} [params.sessionId] ID da sessão de conversa
 * @returns {Promise<{transcription: string, reply: string, agentUsed: object, memoriesUsed: Array, knowledgeUsed: Array, timestamp: string}>}
 */
export async function sendAudioChatMessage({ audioBase64, mimeType = 'audio/webm', userId, agentId, durationSeconds, history = [], sessionId, guidedConversationId }) {
  try {
    const response = await authFetch(`${BACKEND_URL}/api/chat/audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioBase64,
        mimeType,
        userId,
        agentId,
        durationSeconds,
        sessionId,
        guidedConversationId,
        history: history.map((item) => ({
          role: item.role,
          content: item.content,
        })),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ao processar áudio: status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem de áudio:', error);
    throw error;
  }
}

/**
 * Solicita ao Backend Hermes a sintetização ou resgate do cache de áudio da reflexão.
 * Se o backend estiver offline ou retornar 404 (ex: em hospedagem estática/VPS sem proxy),
 * busca diretamente no cache do Supabase Storage ou ativa a Web Speech API nativa.
 * @param {object} params
 * @param {string} params.text Texto da reflexão
 * @param {string} [params.voiceName] Nome da voz (Charon, Aoede, Kore, etc.)
 * @returns {Promise<{audioUrl: string|null, fromCache: boolean, cleanedText: string, useSpeechSynthesis: boolean, voiceName?: string}>}
 */
export async function fetchVoiceAudio({ text, messageId, voiceName = 'Charon' }) {
  const { cleanText, fileName } = await getCleanTextAndHash(text, voiceName);
  if (!cleanText) {
    throw new Error('Texto não possui caracteres válidos para leitura.');
  }

  // 1. Tenta sintetizar via Backend Hermes (Gemini TTS -> ElevenLabs -> OpenAI -> Google TTS)
  try {
    const response = await authFetch(`${BACKEND_URL}/api/voice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, messageId, voiceName }),
    });

    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (data?.audioUrl) {
          return {
            audioUrl: data.audioUrl,
            fromCache: Boolean(data.fromCache),
            cleanedText: cleanText,
            useSpeechSynthesis: false,
            voiceName: data.voiceName || voiceName,
          };
        }
      }
    }
  } catch (backendErr) {
    console.warn('⚠️ [Voice] Backend /api/voice indisponível, buscando alternativas:', backendErr?.message);
  }

  // 2. FALLBACK 1: Verifica diretamente no Supabase Storage se o áudio já foi gerado e salvo em cache
  if (fileName) {
    try {
      const { data: publicUrlData } = supabase.storage
        .from('audio_cache')
        .getPublicUrl(fileName);

      if (publicUrlData?.publicUrl) {
        const headCheck = await fetch(publicUrlData.publicUrl, { method: 'HEAD' }).catch(() => null);
        if (headCheck && headCheck.ok) {
          console.log('⚡ [Voice Cache Hit] Áudio encontrado diretamente no Supabase Storage:', fileName);
          return {
            audioUrl: publicUrlData.publicUrl,
            fromCache: true,
            cleanedText: cleanText,
            useSpeechSynthesis: false,
          };
        }
      }
    } catch (storageErr) {
      console.warn('⚠️ [Voice] Verificação direta de cache no Supabase Storage indisponível:', storageErr?.message);
    }
  }

  // 3. FALLBACK 2: Se não houver áudio pré-gerado e o backend não responder (404/offline),
  // aciona a síntese de voz nativa do navegador (Web Speech API pt-BR) para voz sem interrupção
  return {
    audioUrl: null,
    fromCache: false,
    cleanedText: cleanText,
    useSpeechSynthesis: true,
  };
}

/**
 * Busca o histórico de conversas do usuário no Supabase (filtrado opcionalmente por sessão)
 * @param {string} userId ID único do usuário
 * @param {string} [sessionId] ID da sessão específica
 * @returns {Promise<Array<{id: string, sessionId?: string, role: string, content: string, isVoice: boolean, durationSeconds: number, timestamp: string}>>}
 */
export async function fetchChatHistory(userId, sessionId = null) {
  if (!userId) return [];

  // 1. Tenta buscar via Backend Hermes
  try {
    const url = sessionId
      ? `${BACKEND_URL}/api/chat/history/${userId}?sessionId=${sessionId}`
      : `${BACKEND_URL}/api/chat/history/${userId}`;
    const response = await authFetch(url);
    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (Array.isArray(data)) return data;
      }
    }
  } catch {}

  // 2. FALLBACK DIRETO AO BANCO SUPABASE: Garante que as mensagens do usuário
  // carreguem 100% diretamente da nuvem, mesmo sem o backend Node ativo na VPS!
  try {
    let query = supabase
      .from('izaque_messages')
      .select('id, session_id, role, content, is_audio, audio_duration_seconds, created_at, izaque_agents(id, name, slug, type)')
      .eq('user_id', userId);

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data: messages, error } = await query
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.warn('⚠️ Erro ao consultar Supabase izaque_messages:', error.message);
      return [];
    }

    return (messages || []).map((msg) => ({
      id: msg.id,
      sessionId: msg.session_id,
      role: msg.role === 'assistant' ? 'guide' : 'user',
      content: msg.content,
      isVoice: Boolean(msg.is_audio),
      durationSeconds: msg.audio_duration_seconds || 0,
      timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date(msg.created_at).toLocaleDateString('pt-BR'),
      created_at: msg.created_at,
      agentUsed: msg.izaque_agents ? {
        id: msg.izaque_agents.id,
        name: msg.izaque_agents.name,
        slug: msg.izaque_agents.slug,
        type: msg.izaque_agents.type,
      } : null,
    }));
  } catch (err) {
    console.warn('⚠️ Falha ao buscar histórico persistido do Supabase:', err?.message);
    return [];
  }
}

/**
 * Limpa o histórico de conversas do usuário (ou de uma sessão específica)
 * @param {string} userId ID único do usuário
 * @param {string} [sessionId] ID da sessão
 */
export async function clearChatHistory(userId, sessionId = null) {
  try {
    if (!userId) return;
    const url = sessionId
      ? `${BACKEND_URL}/api/chat/history/${userId}?sessionId=${sessionId}`
      : `${BACKEND_URL}/api/chat/history/${userId}`;
    const response = await authFetch(url, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Falha ao limpar histórico');
    return await response.json();
  } catch (error) {
    console.error('❌ Erro ao limpar histórico:', error);
    throw error;
  }
}

/**
 * Busca todas as sessões de conversa do usuário
 * @param {string} userId
 */
export async function fetchUserSessions(userId) {
  if (!userId) return [];

  try {
    const res = await authFetch(`${BACKEND_URL}/api/chat/sessions/${userId}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}

  // Fallback direto ao Supabase
  try {
    const { data, error } = await supabase
      .from('izaque_chat_sessions')
      .select('id, user_id, title, guided_conversation_id, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (!error && Array.isArray(data)) return data;
  } catch {}

  return [];
}

/**
 * Cria uma nova sessão de conversa vazia
 * @param {string} userId
 * @param {string} [title]
 * @param {string} [guidedConversationId]
 */
export async function createUserSession(userId, title = 'Nova Reflexão', guidedConversationId = null) {
  if (!userId) return null;

  try {
    const res = await authFetch(`${BACKEND_URL}/api/chat/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, guidedConversationId }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  // Fallback Supabase
  try {
    const { data, error } = await supabase
      .from('izaque_chat_sessions')
      .insert({
        user_id: userId,
        title,
        guided_conversation_id: guidedConversationId || null,
      })
      .select()
      .single();
    if (!error) return data;
  } catch {}

  return null;
}

/**
 * Renomeia o título de uma sessão
 * @param {string} sessionId
 * @param {string} title
 */
export async function updateUserSession(sessionId, title) {
  if (!sessionId || !title) return null;

  try {
    const res = await authFetch(`${BACKEND_URL}/api/chat/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  // Fallback Supabase
  try {
    const { data, error } = await supabase
      .from('izaque_chat_sessions')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .select()
      .single();
    if (!error) return data;
  } catch {}

  return null;
}

/**
 * Remove uma sessão de conversa e suas mensagens
 * @param {string} sessionId
 */
export async function deleteUserSession(sessionId) {
  if (!sessionId) return false;

  try {
    const res = await authFetch(`${BACKEND_URL}/api/chat/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    if (res.ok) return true;
  } catch {}

  // Fallback Supabase
  try {
    const { error } = await supabase
      .from('izaque_chat_sessions')
      .delete()
      .eq('id', sessionId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Atualiza os dados de perfil do usuário (nome, telefone/WhatsApp, foto/avatar)
 * @param {string} userId
 * @param {{full_name?: string, phone?: string, avatar_url?: string}} profileData
 */
export async function updateUserProfile(userId, profileData) {
  try {
    const response = await authFetch(`${BACKEND_URL}/api/profile/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Falha ao atualizar dados de perfil');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Erro ao atualizar perfil via API:', error);
    throw error;
  }
}

/**
 * Upload de foto de perfil/avatar para o Supabase Storage (bucket avatars)
 * @param {string} userId
 * @param {File} file
 * @returns {Promise<string>} URL pública da foto
 */
export async function uploadUserAvatar(userId, file) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;

    // Usa o import estático do topo do arquivo (evita aviso de chunk conflitante no Vite)
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('❌ Erro ao fazer upload de foto de perfil:', error);
    throw error;
  }
}

/**
 * Upload de foto do idealizador para o Supabase Storage (bucket avatars)
 * @param {File} file
 * @returns {Promise<string>} URL pública da foto
 */
export async function uploadCreatorPhoto(file) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `creator_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('❌ Erro ao fazer upload de foto do idealizador:', error);
    throw error;
  }
}

/**
 * Solicita o envio do e-mail de recuperação de senha via suporte@lynxems.com.br
 * @param {string} email
 * @returns {Promise<{message: string, sentTo?: string}>}
 */
export async function requestPasswordReset(email) {
  try {
    const response = await authFetch(`${BACKEND_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao processar recuperação de senha.');
    }

    return data;
  } catch (error) {
    console.error('❌ Erro ao solicitar recuperação de senha:', error);
    throw error;
  }
}

/**
 * Busca planos ativos disponíveis para o cliente
 */
export async function fetchPublicPlans() {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/plans`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {}

  // Fallback direto ao Supabase
  const { data, error } = await supabase
    .from('izaque_plans')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Cria um pedido de assinatura PIX
 */
export async function createPixOrder({ planId, userId, userEmail, userName }) {
  const res = await authFetch(`${BACKEND_URL}/api/subscription/pix-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId, userId, userEmail, userName }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao processar pedido PIX.');
  }

  return data;
}

/**
 * Envia sugestão, reclamação ou pedido de suporte do assinante
 */
export async function sendSubscriberFeedback({ userId, userEmail, userName, type, subject, message }) {
  const res = await authFetch(`${BACKEND_URL}/api/subscription/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, userEmail, userName, type, subject, message }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao enviar mensagem ao suporte.');
  }

  return data;
}

/**
 * Consulta dados e status de assinatura do usuário
 */
export async function fetchUserSubscriptionStatus(userId) {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/subscription/status/${userId}`);
    if (res.ok) return await res.json();
  } catch {}

  const { data: profile } = await supabase
    .from('izaque_profiles')
    .select('id, plan_id, is_active, plan_status, plan_activated_at, plan_expires_at')
    .eq('id', userId)
    .single();

  return { profile, latestOrder: null };
}

/**
 * Consulta dados públicos do Idealizador para a Landing Page
 */
export async function fetchPublicCreator() {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/creator`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Aviso ao buscar dados do idealizador:', err);
  }

  const { data } = await supabase
    .from('izaque_creator')
    .select('name, title, bio, story, quote, image_url, social_instagram, social_linkedin, social_whatsapp, is_visible')
    .eq('id', 'main')
    .maybeSingle();

  return data;
}

/**
 * Consulta dados completos do Idealizador para o Painel Admin
 */
export async function fetchAdminCreator() {
  const res = await authFetch(`${BACKEND_URL}/api/admin/creator`);
  if (!res.ok) throw new Error('Falha ao carregar perfil do idealizador.');
  return await res.json();
}

/**
 * Atualiza dados do Idealizador pelo Super Admin
 */
export async function updateAdminCreator(creatorData) {
  const res = await authFetch(`${BACKEND_URL}/api/admin/creator`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creatorData),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao salvar dados do idealizador.');
  }

  return data;
}

/**
 * Consulta conversas direcionadas ativas para os usuários do sistema
 */
export async function fetchPublicGuidedConversations() {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/guided-conversations`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch (err) {
    console.warn('Aviso ao buscar conversas direcionadas via backend:', err);
  }

  // Fallback Supabase
  try {
    const { data, error } = await supabase
      .from('izaque_guided_conversations')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });

    if (!error && data) return data;
  } catch (err) {
    console.error('Erro no fallback de conversas direcionadas Supabase:', err);
  }

  return [];
}

/**
 * Notificações e Comunicados recebidos pelo Usuário (In-App)
 */
export async function fetchUserNotifications(userId) {
  if (!userId) return [];
  try {
    const res = await authFetch(`${BACKEND_URL}/api/user/notifications/${userId}`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch (err) {
    console.warn('Aviso ao buscar notificações via backend:', err);
  }

  // Fallback Supabase
  try {
    const { data, error } = await supabase
      .from('izaque_user_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!error && data) return data;
  } catch (err) {
    console.error('Erro no fallback de notificações Supabase:', err);
  }

  return [];
}

export async function markNotificationAsRead(notificationId) {
  if (!notificationId) return null;
  try {
    const res = await authFetch(`${BACKEND_URL}/api/user/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
    if (res.ok) return await res.json();
  } catch {}

  const { data } = await supabase
    .from('izaque_user_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .select()
    .single();

  return data;
}

export async function markAllNotificationsAsRead(userId) {
  if (!userId) return null;
  try {
    const res = await authFetch(`${BACKEND_URL}/api/user/notifications/read-all/${userId}`, {
      method: 'PATCH',
    });
    if (res.ok) return true;
  } catch {}

  await supabase
    .from('izaque_user_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false);

  return true;
}

/**
 * Assinatura Asaas — Plano ISAAC no WhatsApp (R$ 14,99/mês)
 * (O Plano Gratuito é 100% livre no App e nunca chama o Asaas)
 */
export async function createAsaasWhatsappCheckout({ cpfCnpj, phone }) {
  const res = await authFetch(`${BACKEND_URL}/api/subscriptions/asaas/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cpfCnpj, phone }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Não foi possível gerar a cobrança no Asaas.');
  }
  return data;
}

export async function fetchAsaasWhatsappPlanStatus() {
  const res = await authFetch(`${BACKEND_URL}/api/subscriptions/asaas/status`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Não foi possível consultar o status da assinatura.');
  }
  return data;
}

export async function cancelAsaasWhatsappSubscription() {
  const res = await authFetch(`${BACKEND_URL}/api/subscriptions/asaas/cancel`, {
    method: 'POST',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Não foi possível cancelar a assinatura.');
  }
  return data;
}


