import { supabase } from './supabase';
import { authFetch } from './authFetch';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL && import.meta.env.VITE_BACKEND_URL.trim() !== '')
  ? import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '')
  : '';

export async function fetchAdminMetrics() {
  // 1. Tenta via Backend Hermes
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/metrics`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  // 2. Fallback direto ao Supabase (garante exibição das métricas do banco)
  try {
    const [{ count: userCount }, { count: memoryCount }, { count: agentCount }] = await Promise.all([
      supabase.from('izaque_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('izaque_user_memories').select('*', { count: 'exact', head: true }),
      supabase.from('izaque_agents').select('*', { count: 'exact', head: true }),
    ]);

    const { data: mems } = await supabase.from('izaque_user_memories').select('category');
    const categoriesCount = { blocker: 0, goal: 0, belief: 0, pattern: 0 };
    (mems || []).forEach(m => {
      if (categoriesCount[m.category] !== undefined) categoriesCount[m.category]++;
    });

    return {
      totalUsers: userCount || 0,
      totalMemories: memoryCount || 0,
      totalAgents: agentCount || 0,
      categoriesCount,
    };
  } catch (err) {
    console.error('Erro no fallback de métricas Supabase:', err);
    return {
      totalUsers: 0,
      totalMemories: 0,
      totalAgents: 0,
      categoriesCount: { blocker: 0, goal: 0, belief: 0, pattern: 0 },
    };
  }
}

export async function fetchAdminUsers() {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/users`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  // Fallback direto ao Supabase
  try {
    const { data, error } = await supabase
      .from('izaque_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

export async function updateRole(userId, role) {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/users/role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    });
    if (res.ok) return await res.json();
  } catch {}

  // Fallback direto ao Supabase
  const { error } = await supabase
    .from('izaque_profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;
  return { success: true };
}

export async function fetchAdminMemories() {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/memories`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  // Fallback direto ao Supabase
  try {
    const { data, error } = await supabase
      .from('izaque_user_memories')
      .select('*, izaque_profiles(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

export async function fetchAdminAgents() {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/agents`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  // Fallback direto ao Supabase
  try {
    const { data, error } = await supabase
      .from('izaque_agents')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

export async function updateAgent(id, data) {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/agents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
  } catch {}

  // Fallback direto ao Supabase
  const { error } = await supabase
    .from('izaque_agents')
    .update(data)
    .eq('id', id);

  if (error) throw error;
  return { success: true };
}

export async function createAgent(data) {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
  } catch {}

  // Fallback direto ao Supabase
  const { data: created, error } = await supabase
    .from('izaque_agents')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return created;
}

export async function deleteAgent(id) {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/agents/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) return await res.json();
  } catch {}

  // Fallback direto ao Supabase
  const { error } = await supabase
    .from('izaque_agents')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true };
}

export async function fetchAgentDocuments(agentId) {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/agents/${agentId}/documents`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  const { data, error } = await supabase
    .from('izaque_agent_documents')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function uploadAgentDocument(agentId, data) {
  const res = await authFetch(`${BACKEND_URL}/api/admin/agents/${agentId}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao fazer upload de arquivo de estudo');
  }
  return await res.json();
}

export async function deleteAgentDocument(agentId, docId) {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/agents/${agentId}/documents/${docId}`, {
      method: 'DELETE',
    });
    if (res.ok) return await res.json();
  } catch {}

  const { error } = await supabase
    .from('izaque_agent_documents')
    .delete()
    .eq('id', docId);

  if (error) throw error;
  return { success: true };
}

export async function fetchDocumentChunks(agentId, docId) {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/agents/${agentId}/documents/${docId}/chunks`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  const { data, error } = await supabase
    .from('izaque_agent_knowledge')
    .select('id, content, created_at')
    .eq('document_id', docId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ==========================================
// GESTÃO DE PLANOS E ASSINATURAS (SUPERADMIN)
// ==========================================

export async function fetchAdminPlans() {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/plans`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  const { data, error } = await supabase
    .from('izaque_plans')
    .select('*')
    .order('price', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function updateAdminPlan(planId, updates) {
  const res = await authFetch(`${BACKEND_URL}/api/admin/plans/${planId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao atualizar plano.');
  }

  return await res.json();
}

export async function updateUserStatus(userId, isActive) {
  const res = await authFetch(`${BACKEND_URL}/api/admin/users/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, isActive }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao alterar status do usuário.');
  }

  return await res.json();
}

export async function updateUserPlan(userId, planId, planStatus = 'active') {
  const res = await authFetch(`${BACKEND_URL}/api/admin/users/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, planId, planStatus }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao atualizar plano do usuário.');
  }

  return await res.json();
}

export async function fetchAdminSubscriptions() {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/subscriptions`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  const { data, error } = await supabase
    .from('izaque_subscriptions')
    .select('*, plan:izaque_plans(name, billing_cycle)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function approveSubscription(subId, adminId) {
  const res = await authFetch(`${BACKEND_URL}/api/admin/subscriptions/${subId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Falha ao aprovar assinatura.');
  }

  return await res.json();
}

export async function fetchAdminFeedbacks() {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/feedbacks`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  const { data, error } = await supabase
    .from('izaque_feedbacks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchAdminCreator() {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/creator`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  const { data, error } = await supabase
    .from('izaque_creator')
    .select('*')
    .eq('id', 'main')
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || {};
}

export async function updateAdminCreator(creatorData) {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/creator`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creatorData),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch {}

  // Fallback direto ao Supabase
  const { data, error } = await supabase
    .from('izaque_creator')
    .upsert({
      id: 'main',
      ...creatorData,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return { success: true, creator: data };
}

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
    console.error('❌ Erro no upload de foto do idealizador:', error);
    throw error;
  }
}

/**
 * Consulta estatísticas de público para disparo de e-mails em massa
 */
export async function fetchBroadcastStats() {
  const res = await authFetch(`${BACKEND_URL}/api/admin/broadcast/stats`);
  if (!res.ok) throw new Error('Falha ao consultar estatísticas de e-mail');
  return await res.json();
}

/**
 * Solicita ao Gemini para redigir o e-mail de novidades
 */
export async function generateBroadcastDraft({ topic, targetAudience = 'all', extraPrompt = '' }) {
  const res = await authFetch(`${BACKEND_URL}/api/admin/broadcast/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, targetAudience, extraPrompt }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao gerar redação com IA.');
  }

  return data;
}

/**
 * Dispara e-mail em massa para os usuários
 */
export async function sendBroadcastEmail({ subject, htmlContent, targetAudience = 'all', testEmail = null, callToActionText = 'Visitar Meu Refúgio Agora' }) {
  const res = await authFetch(`${BACKEND_URL}/api/admin/broadcast/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, htmlContent, targetAudience, testEmail, callToActionText }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao disparar e-mails para os usuários.');
  }

  return data;
}

/**
 * Gestão de Conversas Direcionadas (Superadmin)
 */
export async function fetchAdminGuidedConversations() {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/guided-conversations`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  // Fallback direto ao Supabase
  try {
    const { data, error } = await supabase
      .from('izaque_guided_conversations')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Erro no fallback de conversas direcionadas admin:', err);
    return [];
  }
}

export async function createAdminGuidedConversation(payload) {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/guided-conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  // Fallback Supabase
  const { data, error } = await supabase
    .from('izaque_guided_conversations')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAdminGuidedConversation(id, payload) {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/guided-conversations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  // Fallback Supabase
  const { data, error } = await supabase
    .from('izaque_guided_conversations')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAdminGuidedConversation(id) {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/guided-conversations/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) return true;
  } catch {}

  // Fallback Supabase
  const { error } = await supabase
    .from('izaque_guided_conversations')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * Gestão de Grupos de Usuários & Classificação N:N (Superadmin)
 */
export async function fetchAdminUserGroups() {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/user-groups`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  // Fallback Supabase
  try {
    const { data: groups, error } = await supabase
      .from('izaque_user_groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return groups || [];
  } catch (err) {
    console.error('Erro no fallback de grupos admin:', err);
    return [];
  }
}

export async function createAdminUserGroup(payload) {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/user-groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  const { data, error } = await supabase
    .from('izaque_user_groups')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return { ...data, member_count: 0 };
}

export async function updateAdminUserGroup(id, payload) {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/user-groups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  const { data, error } = await supabase
    .from('izaque_user_groups')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAdminUserGroup(id) {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/user-groups/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) return true;
  } catch {}

  const { error } = await supabase
    .from('izaque_user_groups')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function fetchAdminGroupMembers(groupId) {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/user-groups/${groupId}/members`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  const { data, error } = await supabase
    .from('izaque_user_group_members')
    .select('user_id')
    .eq('group_id', groupId);

  if (error) throw error;
  const userIds = (data || []).map((m) => m.user_id);
  if (userIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from('izaque_profiles')
    .select('id, full_name, email, avatar_url, role, plan_status')
    .in('id', userIds);

  return profiles || [];
}

export async function fetchUserAssignedGroups(userId) {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/users/${userId}/groups`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  const { data, error } = await supabase
    .from('izaque_user_group_members')
    .select('group_id')
    .eq('user_id', userId);

  if (error) throw error;
  return (data || []).map((row) => row.group_id);
}

export async function setUserAssignedGroups(userId, groupIds) {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/users/${userId}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupIds }),
    });
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  // Fallback Supabase
  await supabase
    .from('izaque_user_group_members')
    .delete()
    .eq('user_id', userId);

  if (Array.isArray(groupIds) && groupIds.length > 0) {
    const inserts = groupIds.map((gId) => ({
      group_id: gId,
      user_id: userId,
    }));
    await supabase.from('izaque_user_group_members').insert(inserts);
  }

  return { success: true, groupIds };
}

/**
 * Disparar Mensagem de Texto e/ou Áudio para Grupos (Superadmin)
 */
export async function sendAdminGroupBroadcast({
  title,
  content,
  audio_url,
  target_group_ids,
  sender_id,
  send_whatsapp = true,
}) {
  const res = await authFetch(`${BACKEND_URL}/api/admin/group-broadcasts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      content,
      audio_url,
      target_group_ids,
      sender_id,
      send_whatsapp,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao disparar comunicado para os grupos.');
  }

  return data;
}

export async function fetchAdminGroupBroadcasts() {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/group-broadcasts`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  const { data } = await supabase
    .from('izaque_group_broadcasts')
    .select('*')
    .order('created_at', { ascending: false });

  return data || [];
}

/**
 * Upload de arquivo ou gravação de áudio para bucket Supabase
 */
export async function uploadBroadcastAudio(audioBlobOrFile) {
  try {
    const ext = audioBlobOrFile.name ? audioBlobOrFile.name.split('.').pop() : 'webm';
    const fileName = `broadcast_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('broadcasts')
      .upload(fileName, audioBlobOrFile, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('broadcasts')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('❌ Erro no upload de áudio de broadcast:', error);
    throw error;
  }
}

/**
 * ============================================================================
 * GESTÃO E CRONOGRAMA DO PROJETO ISAAC (MEMBROS, MARCOS, TAREFAS E COBRANÇAS)
 * ============================================================================
 */

export async function fetchProjectMembers() {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/project/members`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  const { data } = await supabase
    .from('izaque_project_members')
    .select('*')
    .order('name', { ascending: true });
  return data || [];
}

export async function createProjectMember(member) {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/project/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    });
    if (res.ok) return await res.json();
    const err = await res.json().catch(() => ({}));
    if (err.error) throw new Error(err.error);
  } catch (e) {
    if (e.message && !e.message.includes('fetch')) throw e;
  }

  const { data, error } = await supabase
    .from('izaque_project_members')
    .insert([member])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProjectMember(id, member) {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/project/members/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    });
    if (res.ok) return await res.json();
    const err = await res.json().catch(() => ({}));
    if (err.error) throw new Error(err.error);
  } catch (e) {
    if (e.message && !e.message.includes('fetch')) throw e;
  }

  const { data, error } = await supabase
    .from('izaque_project_members')
    .update({ ...member, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProjectMember(id) {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/project/members/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) return await res.json();
  } catch {}

  const { error } = await supabase
    .from('izaque_project_members')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return { success: true };
}

export async function fetchProjectMilestones() {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/project/milestones`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  const { data } = await supabase
    .from('izaque_project_milestones')
    .select('*')
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true });
  return data || [];
}

export async function createProjectMilestone(milestone) {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/project/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(milestone),
    });
    if (res.ok) return await res.json();
    const err = await res.json().catch(() => ({}));
    if (err.error) throw new Error(err.error);
  } catch (e) {
    if (e.message && !e.message.includes('fetch')) throw e;
  }

  const { data, error } = await supabase
    .from('izaque_project_milestones')
    .insert([milestone])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProjectMilestone(id, milestone) {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/project/milestones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(milestone),
    });
    if (res.ok) return await res.json();
    const err = await res.json().catch(() => ({}));
    if (err.error) throw new Error(err.error);
  } catch (e) {
    if (e.message && !e.message.includes('fetch')) throw e;
  }

  const { data, error } = await supabase
    .from('izaque_project_milestones')
    .update({ ...milestone, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProjectMilestone(id) {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/project/milestones/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) return await res.json();
  } catch {}

  const { error } = await supabase
    .from('izaque_project_milestones')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return { success: true };
}

export async function fetchProjectTasks(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.milestone_id) params.append('milestone_id', filters.milestone_id);
    if (filters.status) params.append('status', filters.status);
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await authFetch(`${BACKEND_URL}/api/admin/project/tasks${qs}`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  let query = supabase
    .from('izaque_project_tasks')
    .select(`
      *,
      milestone:izaque_project_milestones(id, title, color, status),
      member:izaque_project_members(id, name, email, role_title)
    `)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (filters.milestone_id) query = query.eq('milestone_id', filters.milestone_id);
  if (filters.status) query = query.eq('status', filters.status);

  const { data } = await query;
  return data || [];
}

export async function createProjectTask(task) {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/project/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (res.ok) return await res.json();
    const err = await res.json().catch(() => ({}));
    if (err.error) throw new Error(err.error);
  } catch (e) {
    if (e.message && !e.message.includes('fetch')) throw e;
  }

  const { data, error } = await supabase
    .from('izaque_project_tasks')
    .insert([task])
    .select(`
      *,
      milestone:izaque_project_milestones(id, title, color, status),
      member:izaque_project_members(id, name, email, role_title)
    `)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProjectTask(id, task) {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/project/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (res.ok) return await res.json();
    const err = await res.json().catch(() => ({}));
    if (err.error) throw new Error(err.error);
  } catch (e) {
    if (e.message && !e.message.includes('fetch')) throw e;
  }

  const { data, error } = await supabase
    .from('izaque_project_tasks')
    .update({ ...task, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      milestone:izaque_project_milestones(id, title, color, status),
      member:izaque_project_members(id, name, email, role_title)
    `)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProjectTask(id) {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/project/tasks/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) return await res.json();
  } catch {}

  const { error } = await supabase
    .from('izaque_project_tasks')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return { success: true };
}

export async function triggerTaskReminder(taskId) {
  const res = await authFetch(`${BACKEND_URL}/api/admin/project/tasks/${taskId}/notify`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Falha ao disparar lembrete.');
  return data;
}

export async function runAutomatedRemindersCheck() {
  const res = await authFetch(`${BACKEND_URL}/api/admin/project/check-reminders`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Falha na checagem automática.');
  return data;
}

export async function fetchProjectNotificationsLog() {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/project/notifications-log`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  const { data } = await supabase
    .from('izaque_project_notifications_log')
    .select(`
      *,
      task:izaque_project_tasks(id, title),
      member:izaque_project_members(id, name, role_title)
    `)
    .order('sent_at', { ascending: false })
    .limit(50);
  return data || [];
}

/**
 * PARÂMETROS AVANÇADOS GLOBAIS DO SISTEMA (SUPERADMIN)
 */
export async function fetchSystemSettings() {
  // 1. Tenta via backend Hermes
  try {
    const res = await authFetch(`${BACKEND_URL}/api/system/settings`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  // 2. Fallback direto ao Supabase
  try {
    const { data, error } = await supabase
      .from('izaque_system_settings')
      .select('*')
      .eq('id', 'global')
      .maybeSingle();

    if (!error && data) return data;
  } catch (err) {
    console.warn('Erro no fallback de parâmetros Supabase:', err);
  }

  // Fallback seguro caso não haja conexão
  return {
    id: 'global',
    show_theme_selector: true,
    show_settings_button: true,
    show_ambient_sound_button: true,
    show_creative_troubles: true,
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
    default_gemini_voice: 'Charon',
    default_immersive_voice: false,
  };
}

export async function updateSystemSettings(settings) {
  // 1. Tenta via backend Hermes
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/system/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  // 2. Fallback direto ao Supabase
  const payload = {
    id: 'global',
    ...settings,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('izaque_system_settings')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * TERMOS E CONDIÇÕES DE USO (CLICKWRAP COM AUDITORIA FORENSE)
 */
export async function acceptTermsOfUseApi({ userId, termsVersion = 'v1.0-beta-2026' }) {
  // 1. Tenta via backend Hermes (que captura IP real e headers)
  try {
    const res = await authFetch(`${BACKEND_URL}/api/terms/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, termsVersion }),
    });
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  // 2. Fallback direto ao Supabase (garantia técnica client-side)
  const now = new Date().toISOString();
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Navegador Web';

  try {
    await supabase.from('izaque_terms_acceptances').insert({
      user_id: userId,
      terms_version: termsVersion,
      accepted: true,
      accepted_at: now,
      user_agent: userAgent,
      ip_address: 'client-browser-direct',
    });
  } catch (err) {
    console.warn('Erro ao inserir log de termos via Supabase:', err);
  }

  const { data, error } = await supabase
    .from('izaque_profiles')
    .update({
      terms_accepted: true,
      terms_accepted_at: now,
      terms_version: termsVersion,
      updated_at: now,
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return { success: true, profile: data, timestamp: now };
}

export async function fetchTermsAcceptanceLogs() {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/admin/terms/logs`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  const { data, error } = await supabase
    .from('izaque_terms_acceptances')
    .select(`
      *,
      profile:izaque_profiles(full_name, email)
    `)
    .order('accepted_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data || [];
}




// ============================================================================
// LINKS DE CADASTRO DIRETO & ENVIO AUTOMÁTICO DE MÚLTIPLOS PDFS
// ============================================================================

export async function fetchPublicCampaignBySlug(slug) {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/campaigns/public/${encodeURIComponent(slug)}`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  const { data } = await supabase
    .from('izaque_pdf_campaigns')
    .select('id, title, slug, subtitle, pdf_file_name, is_default, is_active')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  return { found: Boolean(data), campaign: data || null };
}

export async function fetchPublicDefaultCampaign() {
  try {
    const res = await authFetch(`${BACKEND_URL}/api/campaigns/public-default`);
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await res.json();
    }
  } catch {}

  const { data } = await supabase
    .from('izaque_pdf_campaigns')
    .select('id, title, slug, subtitle, pdf_file_name, is_default, is_active')
    .eq('is_default', true)
    .eq('is_active', true)
    .maybeSingle();

  return { campaign: data || null };
}

export async function completeSignupAndDeliverPdfApi(payload) {
  const res = await authFetch(`${BACKEND_URL}/api/campaigns/complete-signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao finalizar cadastro e enviar PDF.');
  }
  return data;
}

export async function sendPdfToExistingUserApi(payload) {
  const res = await authFetch(`${BACKEND_URL}/api/campaigns/send-existing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Falha ao solicitar envio do PDF.');
    err.code = data.code || null;
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function fetchAdminPdfCampaigns() {
  const res = await authFetch(`${BACKEND_URL}/api/admin/pdf-campaigns`);
  const data = await res.json().catch(() => []);
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao carregar campanhas de PDF.');
  }
  return data;
}

export async function createAdminPdfCampaign(payload) {
  const res = await authFetch(`${BACKEND_URL}/api/admin/pdf-campaigns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao criar campanha de PDF.');
  }
  return data;
}

export async function updateAdminPdfCampaign(id, payload) {
  const res = await authFetch(`${BACKEND_URL}/api/admin/pdf-campaigns/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao atualizar campanha de PDF.');
  }
  return data;
}

export async function deleteAdminPdfCampaign(id) {
  const res = await authFetch(`${BACKEND_URL}/api/admin/pdf-campaigns/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao excluir campanha de PDF.');
  }
  return data;
}

export async function sendTestOrManualCampaignPdf(id, payload) {
  const res = await authFetch(`${BACKEND_URL}/api/admin/pdf-campaigns/${id}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao enviar PDF.');
  }
  return data;
}

export async function fetchAdminPdfDeliveries(campaignId = '') {
  const qs = campaignId ? `?campaignId=${encodeURIComponent(campaignId)}` : '';
  const res = await authFetch(`${BACKEND_URL}/api/admin/pdf-deliveries${qs}`);
  const data = await res.json().catch(() => []);
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao carregar histórico de envios.');
  }
  return data;
}

// ============================================================================
// FICHA SIMPLES DE INSCRIÇÃO PÚBLICA (/inscricao — SEM SENHA / SEM ENVIO)
// ============================================================================

export async function submitPublicInscriptionApi(payload) {
  const res = await authFetch(`${BACKEND_URL}/api/inscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao enviar ficha de inscrição.');
  }
  return data;
}

export async function updateAdminInscriptionApi(id, payload) {
  const res = await authFetch(`${BACKEND_URL}/api/admin/inscriptions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao atualizar inscrição.');
  }
  return data;
}

export async function deleteAdminInscriptionApi(id) {
  const res = await authFetch(`${BACKEND_URL}/api/admin/inscriptions/${id}`, {
    method: 'DELETE',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao excluir inscrição.');
  }
  return data;
}

// ============================================================================
// CONTROLE SUPERADMIN DA INTEGRAÇÃO EVOLUTION API (WHATSAPP)
// ============================================================================

export async function fetchAdminEvolutionStatus() {
  const res = await authFetch(`${BACKEND_URL}/api/admin/whatsapp/status`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao consultar status da Evolution API.');
  }
  return data;
}

export async function toggleAdminEvolutionApi(enabled) {
  const res = await authFetch(`${BACKEND_URL}/api/admin/whatsapp/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: Boolean(enabled) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao alterar estado da Evolution API.');
  }
  return data;
}

export async function sendAdminEvolutionTest(phone) {
  const res = await authFetch(`${BACKEND_URL}/api/admin/whatsapp/send-test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao enviar mensagem de teste.');
  }
  return data;
}

export async function fetchAdminAsaasOverview() {
  const res = await authFetch(`${BACKEND_URL}/api/admin/asaas/overview`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao carregar painel Asaas.');
  }
  return data;
}

export async function updateAdminAsaasPlanApi(payload) {
  const res = await authFetch(`${BACKEND_URL}/api/admin/asaas/plan`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao atualizar plano no Asaas.');
  }
  return data;
}

// ============================================================================
// CONTATOS EVOLUTION WHATSAPP + PROGRAMAÇÃO DE ENVIOS ANTI-BAN + CONTROLE
// ============================================================================

export async function fetchAdminWhatsappOutreachOverview({ search = '', filter = 'all', limit = 2500 } = {}) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (filter) params.set('filter', filter);
  if (limit) params.set('limit', String(limit));

  const res = await authFetch(`${BACKEND_URL}/api/admin/whatsapp/outreach/overview?${params.toString()}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao carregar contatos e controle de envios WhatsApp.');
  }
  return data;
}

export async function syncAdminEvolutionContactsApi() {
  const res = await authFetch(`${BACKEND_URL}/api/admin/whatsapp/outreach/sync-contacts`, {
    method: 'POST',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao sincronizar contatos da Evolution API.');
  }
  return data;
}

export async function createAdminWhatsappCampaignApi(payload) {
  const res = await authFetch(`${BACKEND_URL}/api/admin/whatsapp/outreach/campaigns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao programar campanha de envio.');
  }
  return data;
}

export async function controlAdminWhatsappCampaignApi(campaignId, action) {
  const res = await authFetch(`${BACKEND_URL}/api/admin/whatsapp/outreach/campaigns/${campaignId}/control`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao atualizar campanha.');
  }
  return data;
}

export async function updateAdminWhatsappCampaignSettingsApi(campaignId, payload) {
  const res = await authFetch(`${BACKEND_URL}/api/admin/whatsapp/outreach/campaigns/${campaignId}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao salvar ajustes do Piloto Automático no Servidor.');
  }
  return data;
}

export async function triggerAdminWhatsappProcessNowApi(bypassCooldown = false) {
  const res = await authFetch(`${BACKEND_URL}/api/admin/whatsapp/outreach/process-now`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bypassCooldown }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao acionar disparo imediato no servidor.');
  }
  return data;
}

export async function sendAdminWhatsappOutreachPreviewApi(payload) {
  const res = await authFetch(`${BACKEND_URL}/api/admin/whatsapp/outreach/send-preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao disparar envio controlado.');
  }
  return data;
}

export async function updateAdminWhatsappSafetyApi(payload) {
  const res = await authFetch(`${BACKEND_URL}/api/admin/whatsapp/outreach/safety`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao atualizar Trava de Segurança.');
  }
  return data;
}

export async function saveAdminWhatsappOutreachTemplatesApi(payload) {
  const res = await authFetch(`${BACKEND_URL}/api/admin/whatsapp/outreach/templates`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao salvar modelos de mensagem do WhatsApp.');
  }
  return data;
}

export async function updateAdminWhatsappContactNameApi(contactId, name) {
  const res = await authFetch(`${BACKEND_URL}/api/admin/whatsapp/outreach/contacts/${contactId}/name`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao salvar nome do contato.');
  }
  return data;
}

export async function fetchSuperAdminEbooksApi() {
  const res = await authFetch(`${BACKEND_URL}/api/superadmin/ebooks`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Acesso negado: exclusivo para Superadmin.');
  }
  return data;
}



