import { supabase } from './supabase';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL && import.meta.env.VITE_BACKEND_URL.trim() !== '')
  ? import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '')
  : '';

/**
 * Módulo de API do Incômodo Criativo
 * Metodologia: Mentor Thiago Prata / David Hawkins
 */

// 0. Passo do Chat Guiado Interativo (IA Isaac / Thiago Prata)
export async function sendCreativeTroubleChatStep({ step, userMessage, history, currentData }) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/creative-troubles/chat-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step, userMessage, history, currentData }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('⚠️ Falha ao comunicar com o agente de chat do Incômodo Criativo:', err);
  }

  return {
    nextStep: step,
    agentMessage: 'Ocorreu uma instabilidade na conexão com o mentor. Pode tentar novamente?',
    suggestedOptions: ['Tentar novamente'],
    extractedData: currentData,
  };
}

// 1. Analisar Fato de forma socrática com IA (separar Fato de Julgamento)
export async function analyzeFactWithAI(rawDescription) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/creative-troubles/analyze-fact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawDescription }),
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('⚠️ Falha ao consultar backend para análise de fato, usando reflexão local:', err);
  }

  // Fallback heurístico inteligente caso o backend esteja temporariamente inacessível
  return {
    cleanFact: rawDescription.trim(),
    perceivedJudgments: 'Verifique se há adjetivos ou acusações e tente focar apenas no que aconteceu de concreto.',
    socraticQuestion: 'Se uma câmera estivesse gravando a situação sem som, quais imagens e ações ela teria registrado?',
  };
}

// 2. Gerar Diagnóstico Clínico do Incômodo (Dossiê da Virada)
export async function generateTroubleDiagnosis(troubleData) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/creative-troubles/diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(troubleData),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('⚠️ Falha ao gerar diagnóstico via backend:', err);
  }

  // Fallback baseado na regra IRRI e Postura
  const posture = troubleData.posture_level || 1;
  const resp = troubleData.responsibility_score || 3;
  const inf = troubleData.influence_score || 3;

  let quadrant = 'Alavanca de Ação';
  let advice = 'Foque no que está sob sua responsabilidade direta.';
  if (resp <= 2 && inf <= 2) {
    quadrant = 'Desapego & Proteção Emocional';
    advice = 'Não gaste sua força vital tentando controlar o incontrolável.';
  }

  return {
    summary: `Incômodo registrado com intensidade ${troubleData.intensity_score}/5 e postura nível [${posture}].`,
    quadrant,
    quadrantAdvice: advice,
    postureCritique: 'Eleve sua postura do diagnóstico para a proposição de soluções viáveis.',
    hawkinsBridge: 'Use a energia da insatisfação para ativar a Coragem e sair da reatividade.',
    recommendedNextPosture: Math.min(10, posture + 1),
    suggestedMicroAction: 'Defina 1 ação simples que dependa 100% de você nas próximas 24 horas.',
  };
}

// 3. Salvar novo Incômodo Criativo
export async function createCreativeTrouble(troubleData) {
  // 1. Tenta via Backend Hermes
  try {
    const res = await fetch(`${BACKEND_URL}/api/creative-troubles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(troubleData),
    });

    if (res.ok) {
      const json = await res.json();
      return json.trouble || json;
    }
  } catch (e) {
    console.warn('⚠️ Falha na API backend Hermes, usando fallback Supabase:', e);
  }

  // 2. Fallback direto Supabase
  const { data, error } = await supabase
    .from('izaque_creative_troubles')
    .insert([troubleData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 4. Buscar incômodos do usuário logado
export async function fetchUserCreativeTroubles(userId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/creative-troubles?user_id=${userId}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.warn('⚠️ Falha na API backend Hermes, buscando via Supabase:', e);
  }

  const { data, error } = await supabase
    .from('izaque_creative_troubles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// 5. Atualizar status ou dados do incômodo
export async function updateCreativeTrouble(id, updates) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/creative-troubles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('⚠️ Falha ao atualizar via backend Hermes, usando Supabase:', e);
  }

  const { data, error } = await supabase
    .from('izaque_creative_troubles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 6. Excluir incômodo
export async function deleteCreativeTrouble(id) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/creative-troubles/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) return true;
  } catch (e) {
    console.warn('⚠️ Falha ao excluir via backend Hermes, usando Supabase:', e);
  }

  const { error } = await supabase
    .from('izaque_creative_troubles')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// 7. EXCLUSIVO SUPER ADMIN: Buscar todos os diagnósticos clínicos
export async function fetchAdminCreativeTroubles() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/creative-troubles`);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    console.warn('⚠️ Falha ao buscar diagnósticos via backend Hermes, usando Supabase direto:', e);
  }

  // Fallback Supabase
  const [{ data: troubles }, { data: profiles }] = await Promise.all([
    supabase.from('izaque_creative_troubles').select('*').order('created_at', { ascending: false }),
    supabase.from('izaque_profiles').select('id, full_name, email, role, avatar_url'),
  ]);

  const profileMap = new Map((profiles || []).map(p => [p.id, p]));
  const enriched = (troubles || []).map(t => ({
    ...t,
    user: profileMap.get(t.user_id) || { full_name: 'Usuário', email: 'Desconhecido' },
  }));

  const total = enriched.length;
  const reactiveCount = enriched.filter(t => t.posture_level <= 2).length;
  const executiveCount = enriched.filter(t => t.posture_level >= 7).length;
  const avgIntensity = total > 0 ? (enriched.reduce((acc, c) => acc + (c.intensity_score || 0), 0) / total).toFixed(1) : 0;
  const avgInfluence = total > 0 ? (enriched.reduce((acc, c) => acc + (c.influence_score || 0), 0) / total).toFixed(1) : 0;

  return {
    metrics: { total, reactiveCount, executiveCount, avgIntensity, avgInfluence },
    troubles: enriched,
  };
}

// 8. EXCLUSIVO SUPER ADMIN: Salvar anotações privadas do Mentor
export async function saveAdminMentorNotes(id, mentorNotes, reviewerId = null) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/creative-troubles/${id}/mentor-notes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mentor_notes: mentorNotes }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.trouble || data;
    }
  } catch (e) {
    console.warn('⚠️ Falha ao salvar notas via backend Hermes, usando Supabase:', e);
  }

  const { data, error } = await supabase
    .from('izaque_creative_troubles')
    .update({
      mentor_notes: mentorNotes,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 9. Cruzamento Metodológico de Múltiplos Incômodos (Raio-X de Padrões Inconscientes)
export async function fetchCreativeTroublesCrossAnalysis(userId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/creative-troubles/cross-analysis?userId=${userId}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('⚠️ Falha ao buscar cruzamento de incômodos via API:', err);
  }
  return null;
}
