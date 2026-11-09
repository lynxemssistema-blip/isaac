import { genAI, EMBEDDING_MODEL } from '../config/gemini.js';
import { supabaseAdmin } from '../config/supabase.js';

const MAX_EMBEDDING_CACHE_ITEMS = 250;
const EMBEDDING_CACHE_TTL_MS = 15 * 60_000;
const embeddingMemoryCache = new Map();

/**
 * Gera o embedding vetorial de um texto usando o Google Gemini (dimensão 768) com cache LRU em RAM (< 1ms em hits).
 * @param {string} text Texto de entrada
 * @returns {Promise<number[]>} Vetor numérico de 768 dimensões
 */
export async function generateEmbedding(text) {
  const cleanKey = String(text || '').trim().toLowerCase().slice(0, 600);
  if (!cleanKey) return null;

  const cached = embeddingMemoryCache.get(cleanKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.vector;
  }

  const modelsToTry = [EMBEDDING_MODEL, 'gemini-embedding-001'].filter((m, i, arr) => arr.indexOf(m) === i);
  let lastError = null;

  for (const modelCandidate of modelsToTry) {
    try {
      const embeddingModel = genAI.getGenerativeModel({ model: modelCandidate });
      const result = await embeddingModel.embedContent({
        content: { parts: [{ text: String(text).slice(0, 4000) }] },
        outputDimensionality: 768,
      });
      const vector = result.embedding.values;
      if (vector) {
        if (embeddingMemoryCache.size >= MAX_EMBEDDING_CACHE_ITEMS) {
          const oldestKey = embeddingMemoryCache.keys().next().value;
          if (oldestKey) embeddingMemoryCache.delete(oldestKey);
        }
        embeddingMemoryCache.set(cleanKey, { vector, expiresAt: Date.now() + EMBEDDING_CACHE_TTL_MS });
      }
      return vector;
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ [Embedding] Modelo ${modelCandidate} falhou:`, error.message);
      continue;
    }
  }

  console.error('❌ Não foi possível gerar embedding com nenhum modelo disponível:', lastError?.message);
  return null;
}

/**
 * Busca memórias relevantes de longo prazo do usuário via RPC 'izaque_match_memories' (pgvector).
 * @param {string} userId ID do usuário no Supabase
 * @param {number[]} queryEmbedding Vetor de 768 posições
 * @param {object} options Parâmetros de threshold e limite
 * @returns {Promise<Array>} Lista de memórias encontradas com similaridade
 */
export async function searchMemories(userId, queryEmbedding, options = {}) {
  const { matchThreshold = 0.45, matchCount = 5 } = options;

  // Isolamento rigoroso: se não for UUID válido de usuário autenticado, retorna vazio
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId || '');
  if (!isUuid) {
    return [];
  }

  try {
    const { data, error } = await supabaseAdmin.rpc('izaque_match_memories', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
      p_user_id: userId,
    });

    if (error) {
      console.error('❌ Erro ao executar RPC izaque_match_memories no Supabase:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('❌ Exceção ao buscar memórias vetoriais:', err.message);
    return [];
  }
}

/**
 * Formata as memórias recuperadas para injeção fluida e psicológica no Prompt.
 * @param {Array} memories Lista de memórias retornadas do banco
 * @returns {string} Texto formatado para o prompt
 */
export function formatMemoriesForPrompt(memories) {
  if (!memories || memories.length === 0) {
    return 'Nenhum histórico prévio ou bloqueio registrado para este contexto específico.';
  }

  const formattedLines = memories.map((m, index) => {
    const dataFormatada = new Date(m.created_at).toLocaleDateString('pt-BR');
    const categoria = (m.category || 'bloqueio').toUpperCase();
    const confianca = Math.round((m.similarity || 0) * 100);
    return `${index + 1}. [${categoria} | Registrado em ${dataFormatada} | Relevância: ${confianca}%]: "${m.content}"`;
  });

  return `=== MEMÓRIAS DE LONGO PRAZO RECUPERADAS (HISTÓRICO PSICOLÓGICO DO USUÁRIO) ===
Abaixo estão fatos reais, travas mentais, padrões e crenças que o usuário já revelou em conversas anteriores:
${formattedLines.join('\n')}

DIRETRIZ DE USO DAS MEMÓRIAS:
- Integre esse conhecimento com discrição cirúrgica e empatia.
- Confronte desculpas ou contradições caso o usuário esteja repetindo um ciclo que já foi identificado no passado.
- Não soe artificial como um robô listando dados; atue como um mentor que realmente conhece e lembra da jornada dele.
================================================================================`;
}

/**
 * Salva uma nova memória de longo prazo no Supabase na tabela izaque_user_memories.
 * @param {object} param0 { userId, content, category, importanceScore }
 */
export async function saveMemory({ userId, content, category = 'blocker', importanceScore = 3 }) {
  try {
    const embedding = await generateEmbedding(content);

    const { data, error } = await supabaseAdmin
      .from('izaque_user_memories')
      .insert({
        user_id: userId,
        content: content.trim(),
        category,
        importance_score: importanceScore,
        embedding,
      })
      .select('id, content, category, created_at')
      .single();

    if (error) {
      console.error('❌ Erro ao salvar memória na tabela izaque_user_memories:', error);
      return null;
    }

    console.log(`🧠 [Hermes Memory] Nova memória salva para o usuário ${userId}: [${category}] "${content}"`);
    return data;
  } catch (err) {
    console.error('❌ Exceção ao salvar memória:', err.message);
    return null;
  }
}
