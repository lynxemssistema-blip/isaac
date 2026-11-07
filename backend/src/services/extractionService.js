import { genAI, CHAT_MODEL, FALLBACK_CHAT_MODELS } from '../config/gemini.js';
import { saveMemory } from './memoryService.js';

/**
 * Analisa a interação de forma assíncrona em background para extrair aprendizados duradouros.
 * Se o usuário revelou um bloqueio, crença, trauma ou meta, resume e salva na tabela izaque_user_memories.
 * 
 * @param {string} userId ID do usuário
 * @param {string} userMessage Mensagem enviada pelo usuário
 * @param {string} assistantReply Resposta fornecida pelo mentor
 */
export async function extractAndSaveMemoryAsync(userId, userMessage, assistantReply = '') {
  // Dispara a execução sem esperar, garantindo zero impacto na latência do usuário
  setImmediate(async () => {
    try {
      // Ignora mensagens extremamente curtas (ex: 'ok', 'oi')
      if (!userMessage || userMessage.trim().length < 8) {
        return;
      }

      const extractionPrompt = `
Você é um observador psicológico sênior e guardião de memória contínua do sistema "ISAAC".
Sua missão essencial é analisar a fala do usuário (especialmente quando responde a perguntas de condução dos mentores) e extrair FATOS DURADOUROS, APRENDIZADOS, VIVÊNCIAS E GATILHOS para aprimorar e personalizar permanentemente o conhecimento do agente sobre este usuário.

Critérios para extrair e registrar na memória permanente:
- Respostas a perguntas reflexivas e de condução dos mentores (histórico pessoal, desabafos, rotina)
- Luta contra vícios, álcool, sobriedade, fissura, dias sóbrio ou gatilhos de recaída
- Bloqueios emocionais citados, medos (de errar, de cobrar, de expor-se, de ser rejeitado) ou traumas
- Crenças limitantes sobre merecimento, dinheiro, valor do trabalho ou história familiar
- Padrões de autossabotagem, procrastinação, fuga ou centralização excessiva
- Princípios espirituais, fé em Deus, oração ou dúvidas existenciais
- Metas transformacionais, compromissos assumidos ou vitórias diárias celebradas

NÃO EXTRAIA:
- Apenas saudações sem conteúdo ("olá", "bom dia")
- Confirmações puramente mecânicas ("ok", "entendi", "valeu")

Entrada do Usuário: "${userMessage}"
Contexto da Resposta do Mentor: "${assistantReply.slice(0, 300)}"

Retorne EXCLUSIVAMENTE um objeto JSON válido no seguinte formato:
{
  "shouldStore": true ou false,
  "category": "sobriety" | "blocker" | "belief" | "pattern" | "goal" | "reflection" | "spirituality" | "finance" | "leadership",
  "content": "Resumo sintético em 1 frase na 3ª pessoa revelando o fato sobre o usuário. Ex: 'Relatou forte gatilho de beber quando chega em casa cansado do trabalho à noite.' ou 'Assumiu o compromisso de se manter 100% sóbrio hoje.' ou 'Possui receio de cobrar o valor justo pelo seu serviço por medo de julgamento.'",
  "importanceScore": número de 1 a 5 (5 sendo um fato vital sobre a vida, sobriedade ou mentalidade do usuário)
}
Se nada relevante foi revelado, retorne apenas: {"shouldStore": false}
`;

      const modelsToTry = [CHAT_MODEL, ...(FALLBACK_CHAT_MODELS || [])].filter((m, i, arr) => arr.indexOf(m) === i);
      let responseText = '';

      for (const modelCandidate of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelCandidate,
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1, // Baixa temperatura para extração determinística
            },
          });

          const result = await model.generateContent(extractionPrompt);
          responseText = result.response.text();
          if (responseText) break;
        } catch (err) {
          if (err.message && (err.message.includes('404') || err.message.includes('not found'))) {
            console.warn(`⚠️ [Memory Fallback] Modelo ${modelCandidate} não encontrado, tentando alternativa...`);
            continue;
          }
          throw err;
        }
      }
      
      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch (parseError) {
        console.warn('⚠️ [Memory Extraction] Falha ao parsear JSON da extração:', responseText);
        return;
      }

      if (parsed.shouldStore && parsed.content && parsed.content.trim().length > 5) {
        console.log(`💡 [Memory Extraction] Fato psicológico identificado: "${parsed.content}"`);
        await saveMemory({
          userId,
          content: parsed.content,
          category: parsed.category || 'blocker',
          importanceScore: parsed.importanceScore || 3,
        });
      }
    } catch (err) {
      console.error('⚠️ [Memory Extraction] Erro durante o processo de extração em background:', err.message);
    }
  });
}
