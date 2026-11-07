import { genAI, CHAT_MODEL, FALLBACK_CHAT_MODELS } from '../config/gemini.js';

/**
 * Transcreve um áudio enviado pelo usuário usando a capacidade multimodal do Gemini
 * @param {string} audioBase64 Dados do áudio em base64
 * @param {string} mimeType Tipo MIME do áudio (ex: 'audio/webm', 'audio/mp4', 'audio/wav')
 * @returns {Promise<string>} Texto transcrito
 */
export async function transcribeAudioWithGemini(audioBase64, mimeType = 'audio/webm') {
  const modelsToTry = [CHAT_MODEL, ...(FALLBACK_CHAT_MODELS || [])].filter((m, i, arr) => arr.indexOf(m) === i);
  let lastError;

  const audioPart = {
    inlineData: {
      data: audioBase64,
      mimeType: mimeType.split(';')[0], // Limpa parâmetros adicionais do MIME
    },
  };

  const prompt = `
Você é o transcritor de áudio do sistema "ISAAC".
Sua função é ouvir atentamente este áudio em português e transcrever com máxima precisão palavra por palavra o desabafo ou pergunta do usuário.

REGRAS:
- Retorne EXCLUSIVAMENTE o texto transcrito.
- Não adicione introduções, explicações, comentários ou aspas (ex: NUNCA diga "Aqui está a transcrição:").
- Se o áudio for inaudível ou não contiver fala humana perceptível, retorne apenas: "[Áudio inaudível]".
`;

  for (const modelCandidate of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelCandidate,
        generationConfig: {
          temperature: 0.1,
        },
      });

      const result = await model.generateContent([prompt, audioPart]);
      const transcription = result.response.text().trim();

      console.log(`🎙️ [Audio Transcription] Transcrição concluída com ${modelCandidate} (${transcription.length} caracteres): "${transcription.slice(0, 60)}..."`);
      return transcription;
    } catch (error) {
      lastError = error;
      const isNotFound = error.message && (error.message.includes('404') || error.message.includes('not found'));
      if (isNotFound) {
        console.warn(`⚠️ [Audio Fallback] Modelo ${modelCandidate} não encontrado, tentando alternativa...`);
        continue;
      }
      throw new Error(`Falha ao transcrever áudio: ${error.message}`);
    }
  }

  throw new Error(`Falha ao transcrever áudio: ${lastError?.message || 'Erro desconhecido'}`);
}
