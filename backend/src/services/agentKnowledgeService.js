import { supabaseAdmin } from '../config/supabase.js';
import { generateEmbedding } from './memoryService.js';
import { runCpuTask } from '../utils/workerPool.js';

/**
 * Divide textos longos em pedaços (chunks) com sobreposição para manter o contexto semântico.
 * @param {string} text Conteúdo completo do documento
 * @param {number} chunkSize Tamanho alvo de cada pedaço (caracteres)
 * @param {number} overlap Sobreposição entre pedaços consecutivos
 * @returns {string[]} Lista de chunks
 */
export function splitTextIntoChunks(text, chunkSize = 1000, overlap = 150) {
  if (!text || text.trim() === '') return [];

  const cleanText = text.replace(/\r\n/g, '\n').trim();
  const chunks = [];
  let startIndex = 0;

  while (startIndex < cleanText.length) {
    let endIndex = startIndex + chunkSize;

    // Tenta quebrar em parágrafos ou pontuação final se estiver próximo
    if (endIndex < cleanText.length) {
      const naturalBreak = cleanText.lastIndexOf('\n\n', endIndex);
      const sentenceBreak = cleanText.lastIndexOf('. ', endIndex);

      if (naturalBreak > startIndex + chunkSize * 0.6) {
        endIndex = naturalBreak;
      } else if (sentenceBreak > startIndex + chunkSize * 0.6) {
        endIndex = sentenceBreak + 1;
      }
    }

    const chunk = cleanText.slice(startIndex, endIndex).trim();
    if (chunk.length > 20) {
      chunks.push(chunk);
    }

    startIndex = endIndex - overlap;
    if (startIndex >= cleanText.length - 20) break;
  }

  return chunks;
}

/**
 * Processa e ingere um arquivo de estudo/documento na base de conhecimento do agente.
 * Vetoriza cada trecho em 768 dimensões com o Gemini e persiste no Supabase pgvector.
 */
export async function ingestAgentDocument({ agentId, title, content, fileType = 'text' }) {
  try {
    if (!agentId || !title || !content) {
      throw new Error('agentId, title e content são obrigatórios para ingestão.');
    }

    console.log(`📚 [Agent Grounding] Iniciando ingestão do documento "${title}" para o agente [${agentId}]...`);

    // 1. Cria o registro do documento pai
    const { data: docRecord, error: docErr } = await supabaseAdmin
      .from('izaque_agent_documents')
      .insert({
        agent_id: agentId,
        title: title.trim(),
        file_type: fileType,
        total_chunks: 0,
      })
      .select()
      .single();

    if (docErr) throw docErr;

    // 2. Quebra em chunks em Worker Thread (evitando bloqueio do Event Loop em documentos longos)
    const chunks = await runCpuTask('chunkText', {
      text: content,
      chunkSize: 1000,
      overlap: 150,
    }).catch(() => splitTextIntoChunks(content));
    console.log(`📑 [Agent Grounding] Documento dividido em ${chunks.length} trechos. Gerando embeddings 768d...`);

    // 3. Gera embeddings e salva trecho a trecho (ou em lotes)
    let savedCount = 0;
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      try {
        const embedding = await generateEmbedding(chunkText);

        await supabaseAdmin.from('izaque_agent_knowledge').insert({
          agent_id: agentId,
          document_id: docRecord.id,
          content: chunkText,
          embedding,
        });

        savedCount++;
      } catch (embErr) {
        console.warn(`⚠️ Falha ao vetorizar trecho ${i + 1} de "${title}":`, embErr.message);
      }
    }

    // 4. Atualiza o total de trechos indexados
    await supabaseAdmin
      .from('izaque_agent_documents')
      .update({ total_chunks: savedCount })
      .eq('id', docRecord.id);

    console.log(`✅ [Agent Grounding] Documento "${title}" indexado com sucesso (${savedCount} vetores ativos no pgvector)!`);
    return { ...docRecord, total_chunks: savedCount };
  } catch (error) {
    console.error('❌ Erro na ingestão de documento do agente:', error);
    throw error;
  }
}

/**
 * Busca trechos técnicos relevantes na base de conhecimento do especialista via RPC
 */
export async function searchAgentKnowledge(agentId, queryEmbedding, options = {}) {
  const { matchThreshold = 0.40, matchCount = 3 } = options;
  try {
    const { data, error } = await supabaseAdmin.rpc('izaque_match_agent_knowledge', {
      query_embedding: queryEmbedding,
      p_agent_id: agentId,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });

    if (error) {
      console.warn('⚠️ Erro ao buscar conhecimento do agente:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn('⚠️ Exceção ao consultar conhecimento do agente:', err.message);
    return [];
  }
}

/**
 * Formata os trechos de estudo para inclusão no Super-Prompt do Especialista
 */
export function formatAgentKnowledgeForPrompt(knowledgeChunks) {
  if (!knowledgeChunks || knowledgeChunks.length === 0) return '';

  const lines = knowledgeChunks.map((k, idx) => {
    const similarityPercent = Math.round((k.similarity || 0) * 100);
    return `[Estudo/Técnica ${idx + 1} - Relevância: ${similarityPercent}%]:\n"${k.content}"`;
  });

  return `=== BASE DE ESTUDOS E CONHECIMENTO TÉCNICO DO ESPECIALISTA (RAG DE DOMÍNIO) ===
Abaixo estão materiais técnicos, livros, métodos e artigos que você estudou especificamente para esta especialidade:
${lines.join('\n\n')}

DIRETRIZ DE ESPECIALIZAÇÃO:
- Aplique esses conceitos técnicos, frameworks e terminologias de forma didática na sua resposta.
- Una esses fundamentos teóricos com os bloqueios emocionais reais que o usuário relatou.
================================================================================`;
}
