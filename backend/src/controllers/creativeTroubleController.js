import { supabaseAdmin } from '../config/supabase.js';
import { generateUnifiedText } from '../services/aiProviderService.js';

/**
 * Controller do Módulo Incômodo Criativo
 * Metodologia: Mentor Thiago Prata / Dr. David Hawkins
 */

// 10 Níveis de Postura definidos na metodologia
export const POSTURE_LEVELS = {
  1: { name: 'Reclamar', category: 'reativo', desc: 'Concentra em detalhar o problema, reclamando das situações e das pessoas.' },
  2: { name: 'Justificar', category: 'reativo', desc: 'Concentra em dar os motivos porque não resolveu, citando que outros ou acontecimentos afetaram suas ações.' },
  3: { name: 'Reconhecer', category: 'limiar', desc: 'Investiga causas, distingue o que está fora do seu controle do que é responsabilidade sua.' },
  4: { name: 'Investigar', category: 'construtivo', desc: 'Explora hipóteses, alternativas e referências para compreender caminhos viáveis.' },
  5: { name: 'Analisar', category: 'construtivo', desc: 'Avalia quanto o problema afeta você e seus objetivos vitais.' },
  6: { name: 'Decidir', category: 'construtivo', desc: 'Define referências sobre seu envolvimento com a solução e consequências das escolhas.' },
  7: { name: 'Propor', category: 'executivo', desc: 'Mapeia ações específicas que irão resolver o problema e atingir os resultados desejados.' },
  8: { name: 'Experimentar', category: 'executivo', desc: 'Testa e valida as referências de solução, entendendo capacidades e efeitos colaterais.' },
  9: { name: 'Adaptar', category: 'executivo', desc: 'Executa a solução, observa resultados, aprende com os efeitos e ajusta até alcançar o alvo.' },
  10: { name: 'Consolidar', category: 'maestria', desc: 'Estabelece a solução como parte da rotina, sustenta e evolui continuamente.' },
};

/**
 * Helper para executar chamadas ao motor de IA ativo (Gemini Cloud / Híbrido / VPS LynxHub) com fallback seguro
 */
async function callGeminiSafe(prompt, systemInstruction = '') {
  const { text } = await generateUnifiedText({
    systemInstruction: systemInstruction || '',
    message: prompt,
    temperature: 0.6,
    maxOutputTokens: 2048,
    purpose: 'chat',
  });
  if (text && text.trim()) return text.trim();
  throw new Error('Não foi possível obter resposta dos modelos de IA.');
}

/**
 * 1. Descontaminação de Fatos (IA Socrática)
 * Auxilia o usuário a separar "Fato Concreto" de "Interpretações / Julgamentos"
 * POST /api/creative-troubles/analyze-fact
 */
export async function analyzeFactSocratic(req, res) {
  try {
    const { rawDescription } = req.body;
    if (!rawDescription || !rawDescription.trim()) {
      return res.status(400).json({ error: 'Descrição inicial é obrigatória.' });
    }

    const systemPrompt = `Você é ISAAC, o mentor e orquestrador do app, aplicando a metodologia do Incômodo Criativo do mentor Thiago Prata.
Sua missão nesta etapa é CIRÚRGICA: ajudar o usuário a separar o FATO CONCRETO das interpretações, suposições ou julgamentos emocionais.
A regra metodológica é:
- Registrar apenas aquilo que se percebe (ações, dados, fatos concretos observáveis por uma câmera).
- Não tentar explicar ainda por que acontece nem sugerir soluções antecipadas.
- Descrever fatos e não a visão/interpretação da situação.

Responda SEMPRE em formato JSON estrito no seguinte formato:
{
  "cleanFact": "Uma frase clara, objetiva e desprovida de adjetivos acusatórios resumindo o FATO cru.",
  "perceivedJudgments": "Quais sentimentos/julgamentos foram colocados na fala que são interpretações e não fatos.",
  "socraticQuestion": "Uma pergunta reflexiva curta e acolhedora para o usuário validar se o fato está preciso."
}`;

    const userPrompt = `O usuário descreveu o seguinte incômodo:\n"${rawDescription.trim()}"\n\nExtraia o fato concreto de acordo com a metodologia.`;

    const aiResponse = await callGeminiSafe(userPrompt, systemPrompt);

    // Tenta fazer o parse JSON
    let parsed;
    try {
      const cleanJson = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch (e) {
      parsed = {
        cleanFact: rawDescription.trim(),
        perceivedJudgments: 'Avalie se há interpretações pessoais misturadas aos acontecimentos concretos.',
        socraticQuestion: 'Se uma câmera estivesse gravando, exatamente quais ações concretas teriam sido registradas?',
      };
    }

    res.status(200).json(parsed);
  } catch (error) {
    console.error('❌ Erro na análise socrática de fato:', error);
    res.status(500).json({ error: 'Erro ao analisar fato: ' + error.message });
  }
}

/**
 * 2. Gerar Diagnóstico Clínico do Incômodo (Dossiê da Virada)
 * Cruza Fato, Postura (1 a 10), Hawkins, Matriz IRRI (Intensidade, Relevância, Responsabilidade, Influência)
 * POST /api/creative-troubles/diagnose
 */
export async function generateDiagnosis(req, res) {
  try {
    const {
      fact_description,
      posture_level = 1,
      trouble_type = 'mental',
      cause_aspects = '',
      effect_aspects = '',
      internal_state = 'medo',
      context = 'pessoal',
      parties_involved = [],
      intensity_score = 3,
      intensity_notes = '',
      relevance_score = 3,
      relevance_notes = '',
      responsibility_score = 3,
      responsibility_notes = '',
      influence_score = 3,
      influence_notes = '',
      attention_reason = '',
      additional_notes = '',
    } = req.body;

    const postureInfo = POSTURE_LEVELS[posture_level] || POSTURE_LEVELS[1];

    // Cálculo do Quadrante IRRI pela Metodologia
    // Alta Intensidade vs Baixa Responsabilidade/Influência = Desapego / Limites
    // Alta Relevância + Alta Responsabilidade + Alta Influência = Alavanca de Liderança / Ação Direta
    // Alta Relevância + Baixa Influência = Estratégia de Diálogo / Alianças
    let quadrantType = 'Alavanca de Ação Direta';
    let quadrantAdvice = '';

    if (responsibility_score <= 2 && influence_score <= 2) {
      quadrantType = 'Desapego & Proteção Emocional';
      quadrantAdvice = 'Você está drenando energia intensa em algo onde não tem controle nem responsabilidade direta. A saída aqui não é lutar contra a correnteza, mas aceitar limites e proteger sua serenidade.';
    } else if (relevance_score >= 4 && influence_score <= 2) {
      quadrantType = 'Estratégia de Diálogo & Construção de Alianças';
      quadrantAdvice = 'O tema é crucial para sua vida, mas sua capacidade de mudança unilateral é baixa. O foco deve ser diálogo aberto, acordos transparentes e mobilização de terceiros, e não desgaste isolado.';
    } else if (relevance_score >= 4 && responsibility_score >= 4 && influence_score >= 4) {
      quadrantType = 'Alavanca de Liderança & Ação Imediata';
      quadrantAdvice = 'Total convergência de prioridade e controle. Qualquer hesitação aqui é autossabotagem. Exige transição rápida para atitude executiva de Propor, Experimentar e Consolidar.';
    } else {
      quadrantType = 'Investigação & Amadurecimento';
      quadrantAdvice = 'Situação com variáveis equilibradas que exige clareza de causas antes de tomar medidas bruscas. Aprofunde em hipóteses concretas.';
    }

    const systemPrompt = `Você é ISAAC, o orquestrador e mentor do app, aplicando a metodologia do "Incômodo Criativo" criada pelo mentor Thiago Prata e na escala de consciência do Dr. David Hawkins.
Sua missão é gerar um DIAGNÓSTICO PROFUNDO, ACOLHEDOR E CIRÚRGICO para o usuário transformar esse incômodo em alavanca.

Diretrizes da Metodologia:
1. Postura Atual: O usuário está no nível [${posture_level}] ${postureInfo.name}. Explique honestamente o efeito dessa postura e qual deve ser o próximo degrau para desbloquear a situação.
2. Estado Interno (Hawkins): Ele se sente em "${internal_state}". Mostre como fazer a ponte para a CORAGEM (o divisor de águas) e para um estado construtivo (Neutralidade, Disposição, Aceitação).
3. Matriz IRRI: Intensidade=${intensity_score}/5, Relevância=${relevance_score}/5, Responsabilidade=${responsibility_score}/5, Influência=${influence_score}/5. Quadrante: ${quadrantType}.
4. Micro-Ação de 24 Horas: Formule uma ação simples, factual, que dependa 100% dele nas próximas 24 horas.

Responda ESTRITAMENTE em formato JSON com a seguinte estrutura:
{
  "summary": "Resumo clínico empático e direto da situação em 2 a 3 frases.",
  "quadrant": "${quadrantType}",
  "quadrantAdvice": "${quadrantAdvice}",
  "postureCritique": "Análise clara sobre a postura atual dele e a chave para subir de nível.",
  "hawkinsBridge": "A ponte emocional e consciente: como sair da reatividade de '${internal_state}' através da Coragem.",
  "recommendedNextPosture": ${Math.min(10, Number(posture_level) + 1)},
  "suggestedMicroAction": "Uma única micro-ação clara e aplicável nas próximas 24h."
}`;

    const userPrompt = `
DADOS DO INCÔMODO CRIATIVO DO USUÁRIO:
- Fato Concreto: ${fact_description}
- Postura Declarada: [${posture_level}] ${postureInfo.name} - ${postureInfo.desc}
- Gatilho: ${trouble_type}
- Causa Raiz Interna (Crenças/Pensamentos): ${cause_aspects || 'Não detalhado'}
- Efeito Observado: ${effect_aspects || 'Não detalhado'}
- Estado Interno (Hawkins): ${internal_state}
- Contexto: ${context} | Partes Envolvidas: ${Array.isArray(parties_involved) ? parties_involved.join(', ') : parties_involved}
- Matriz IRRI:
  * Intensidade: ${intensity_score}/5 (Notas: ${intensity_notes || 'Sem observações'})
  * Relevância: ${relevance_score}/5 (Notas: ${relevance_notes || 'Sem observações'})
  * Responsabilidade: ${responsibility_score}/5 (Notas: ${responsibility_notes || 'Sem observações'})
  * Influência: ${influence_score}/5 (Notas: ${influence_notes || 'Sem observações'})
- Motivo de Atenção: ${attention_reason || 'Não informado'}
- Desabafo Livre: ${additional_notes || 'Nenhum desabafo adicional'}
`;

    const aiResponse = await callGeminiSafe(userPrompt, systemPrompt);
    let parsed;
    try {
      const cleanJson = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch (e) {
      parsed = {
        summary: `Incômodo focado em ${trouble_type}, vivido atualmente na postura de [${postureInfo.name}].`,
        quadrant: quadrantType,
        quadrantAdvice,
        postureCritique: `Você marcou a postura ${postureInfo.name}. O próximo passo exige elevar a auto-responsabilidade.`,
        hawkinsBridge: `Transite da reação de ${internal_state} para a Coragem, assumindo ações sob seu controle.`,
        recommendedNextPosture: Math.min(10, Number(posture_level) + 1),
        suggestedMicroAction: 'Escreva um plano de 1 ação direta para executar ainda hoje.',
      };
    }

    res.status(200).json(parsed);
  } catch (error) {
    console.error('❌ Erro ao gerar diagnóstico do incômodo:', error);
    res.status(500).json({ error: 'Erro ao gerar diagnóstico: ' + error.message });
  }
}

/**
 * 3. Criar / Registrar novo Incômodo Criativo
 * POST /api/creative-troubles
 */
export async function createCreativeTrouble(req, res) {
  try {
    const userId = req.user?.id || req.body.user_id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const {
      title = 'Novo Incômodo Criativo',
      fact_description,
      posture_level = 1,
      trouble_type = 'mental',
      cause_aspects = '',
      effect_aspects = '',
      internal_state = 'coragem',
      context = 'pessoal',
      parties_involved = [],
      intensity_score = 3,
      intensity_notes = '',
      relevance_score = 3,
      relevance_notes = '',
      responsibility_score = 3,
      responsibility_notes = '',
      influence_score = 3,
      influence_notes = '',
      attention_reason = '',
      additional_notes = '',
      ai_diagnosis = null,
      micro_action_24h = '',
      status = 'ativo',
    } = req.body;

    if (!fact_description || !fact_description.trim()) {
      return res.status(400).json({ error: 'A descrição do fato concreto é obrigatória.' });
    }

    const { data, error } = await supabaseAdmin
      .from('izaque_creative_troubles')
      .insert({
        user_id: userId,
        title: title.trim(),
        fact_description: fact_description.trim(),
        posture_level: Number(posture_level) || 1,
        trouble_type,
        cause_aspects,
        effect_aspects,
        internal_state,
        context,
        parties_involved: Array.isArray(parties_involved) ? parties_involved : [],
        intensity_score: Number(intensity_score) || 3,
        intensity_notes,
        relevance_score: Number(relevance_score) || 3,
        relevance_notes,
        responsibility_score: Number(responsibility_score) || 3,
        responsibility_notes,
        influence_score: Number(influence_score) || 3,
        influence_notes,
        attention_reason,
        additional_notes,
        ai_diagnosis,
        micro_action_24h,
        status,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Incômodo Criativo registrado com sucesso!',
      trouble: data,
    });
  } catch (error) {
    console.error('❌ Erro ao criar incômodo criativo:', error);
    res.status(500).json({ error: 'Erro ao registrar incômodo: ' + error.message });
  }
}

/**
 * 4. Listar os incômodos criativos do usuário autenticado
 * GET /api/creative-troubles
 */
export async function getUserCreativeTroubles(req, res) {
  try {
    const userId = req.user?.id || req.query.user_id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const { data, error } = await supabaseAdmin
      .from('izaque_creative_troubles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('❌ Erro ao buscar incômodos do usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar incômodos: ' + error.message });
  }
}

/**
 * 5. Obter um incômodo por ID
 * GET /api/creative-troubles/:id
 */
export async function getCreativeTroubleById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.query.user_id;

    let query = supabaseAdmin.from('izaque_creative_troubles').select('*').eq('id', id);
    if (userId && req.user?.role !== 'master' && req.user?.role !== 'admin') {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Incômodo não encontrado.' });

    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Erro ao carregar incômodo:', error);
    res.status(500).json({ error: 'Erro ao carregar incômodo: ' + error.message });
  }
}

/**
 * 6. Atualizar status ou micro-ação do incômodo
 * PUT /api/creative-troubles/:id
 */
export async function updateCreativeTrouble(req, res) {
  try {
    const { id } = req.params;
    const updates = { ...req.body, updated_at: new Date().toISOString() };
    delete updates.id;
    delete updates.user_id;

    // Não permitir que o usuário comum edite notas do mentor ou incômodos de terceiros
    const isAdmin = req.user?.role === 'master' || req.user?.role === 'admin';
    if (!isAdmin) {
      delete updates.mentor_notes;
      delete updates.reviewed_by;
      delete updates.reviewed_at;
    }

    let query = supabaseAdmin
      .from('izaque_creative_troubles')
      .update(updates)
      .eq('id', id);

    if (req.user && !isAdmin) {
      query = query.eq('user_id', req.user.id);
    }

    const { data, error } = await query.select().maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Incômodo não encontrado ou acesso negado.' });
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Erro ao atualizar incômodo:', error);
    res.status(500).json({ error: 'Erro ao atualizar incômodo.' });
  }
}

/**
 * 7. Excluir incômodo
 * DELETE /api/creative-troubles/:id
 */
export async function deleteCreativeTrouble(req, res) {
  try {
    const { id } = req.params;
    const isAdmin = req.user?.role === 'master' || req.user?.role === 'admin';

    let query = supabaseAdmin
      .from('izaque_creative_troubles')
      .delete()
      .eq('id', id);

    if (req.user && !isAdmin) {
      query = query.eq('user_id', req.user.id);
    }

    const { error } = await query;

    if (error) throw error;
    res.status(200).json({ success: true, message: 'Incômodo removido com sucesso.' });
  } catch (error) {
    console.error('❌ Erro ao excluir incômodo:', error);
    res.status(500).json({ error: 'Erro ao excluir incômodo.' });
  }
}

/**
 * 8. EXCLUSIVO SUPER ADMIN: Listar todos os diagnósticos clínicos de todos os usuários
 * GET /api/admin/creative-troubles
 */
export async function getAdminCreativeTroubles(req, res) {
  try {
    // Busca todos os incômodos
    const { data: troubles, error } = await supabaseAdmin
      .from('izaque_creative_troubles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Busca perfis para enriquecer com nome, email, foto
    const { data: profiles } = await supabaseAdmin
      .from('izaque_profiles')
      .select('id, full_name, email, role, avatar_url');

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    const enriched = (troubles || []).map(t => ({
      ...t,
      user: profileMap.get(t.user_id) || { full_name: 'Usuário', email: 'Desconhecido' },
    }));

    // Métricas analíticas para o Super Admin
    const total = enriched.length;
    const reactiveCount = enriched.filter(t => t.posture_level <= 2).length;
    const executiveCount = enriched.filter(t => t.posture_level >= 7).length;
    const avgIntensity = total > 0 ? (enriched.reduce((acc, c) => acc + (c.intensity_score || 0), 0) / total).toFixed(1) : 0;
    const avgInfluence = total > 0 ? (enriched.reduce((acc, c) => acc + (c.influence_score || 0), 0) / total).toFixed(1) : 0;

    res.status(200).json({
      metrics: {
        total,
        reactiveCount,
        executiveCount,
        avgIntensity,
        avgInfluence,
      },
      troubles: enriched,
    });
  } catch (error) {
    console.error('❌ Erro ao listar incômodos admin:', error);
    res.status(500).json({ error: 'Erro ao buscar diagnósticos: ' + error.message });
  }
}

/**
 * 9. EXCLUSIVO SUPER ADMIN: Salvar anotações privadas do Mentor / Profissional Capacitado
 * PUT /api/admin/creative-troubles/:id/mentor-notes
 */
export async function updateAdminMentorNotes(req, res) {
  try {
    const { id } = req.params;
    const { mentor_notes } = req.body;
    const reviewerId = req.user?.id || null;

    const { data, error } = await supabaseAdmin
      .from('izaque_creative_troubles')
      .update({
        mentor_notes,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json({
      success: true,
      message: 'Anotações do Mentor salvas com sucesso!',
      trouble: data,
    });
  } catch (error) {
    console.error('❌ Erro ao salvar anotações do mentor:', error);
    res.status(500).json({ error: 'Erro ao salvar anotações: ' + error.message });
  }
}

/**
 * 10. Mentoria Guiada Dinâmica via Chat (Agente Isaac / Thiago Prata)
 * Conduz o usuário dinamicamente pelas 5 etapas do Incômodo Criativo com opções interativas
 * POST /api/creative-troubles/chat-step
 */
export async function handleChatStep(req, res) {
  try {
    const {
      step = 'welcome',
      userMessage = '',
      history = [],
      currentData = {},
    } = req.body;

    const data = { ...currentData };

    // 1. WELCOME STEP
    if (step === 'welcome') {
      return res.status(200).json({
        nextStep: 'fact',
        agentMessage: `Olá! Sou ISAAC. Seja muito bem-vindo ao Laboratório do Incômodo Criativo.\n\nAqui nós não vamos apenas desabafar: vamos dissecar cirurgicamente o que está acontecendo e transformar esse incômodo em alavanca de crescimento, guiados pela metodologia do mentor Thiago Prata.\n\nPara começarmos: **o que tem te incomodado ultimamente?** Pode me contar por áudio ou texto, focando no fato que aconteceu.`,
        suggestedOptions: [
          'Um atrito com sócio ou no ambiente de trabalho',
          'Um desafio de vendas, clientes ou financeiro',
          'Uma conversa difícil ou limite na família/relacionamento',
          'Uma procrastinação, hábito ou autossabotagem pessoal',
        ],
        extractedData: data,
      });
    }

    // 2. FATO CONCRETO -> POSTURA
    if (step === 'fact') {
      const systemPrompt = `Você é ISAAC, mentor de mentalidade e lucidez socrática aplicando a metodologia do Incômodo Criativo do mentor Thiago Prata.
O usuário respondeu à pergunta sobre o que está incomodando ele com o seguinte relato (que pode ser fala transcrita ou texto):
"${userMessage}"

Sua missão é compreender profundamente o relato e:
1. Separar o FATO CONCRETO (a ação observável, que uma câmera registraria, sem julgamentos acusatórios) das INTERPRETAÇÕES e julgamentos emocionais que a mente do usuário criou.
2. Identificar a provável esfera do gatilho (mental, comportamento, relacionamento ou acontecimento).
3. Explicar ao usuário de forma acolhedora, lúcida e didática onde a fala dele se encaixa no contexto metodológico, destacando claramente a diferença entre o fato cru e a interpretação.
4. Convidar o usuário para o segundo passo: avaliar a sua Postura Atual diante desse fato entre os 10 Níveis de Postura do Thiago Prata (orientando que, se houver mais de um comportamento, deve-se escolher o de menor número por ser o gargalo real).

Responda ESTRITAMENTE em formato JSON:
{
  "cleanFact": "resumo factual e objetivo em 1 ou 2 frases sem adjetivos",
  "perceivedJudgments": "resumo das interpretações e sentimentos misturados ao fato",
  "probableTrigger": "mental | comportamento | relacionamento | acontecimento",
  "agentFeedback": "Feedback acolhedor demonstrando que entendeu a dor, pontuando com clareza o fato real vs a interpretação.",
  "nextQuestion": "Pergunta reflexiva convidando o usuário a escolher sua postura atual (1 a 10) diante do fato."
}`;

      let cleanFact = userMessage.trim();
      let agentFeedback = 'Entendi perfeitamente o ocorrido e acolho o que você me trouxe.';
      let nextQuestion = 'Qual dessas posturas melhor descreve sua reação atual diante desse fato?';

      try {
        const aiText = await callGeminiSafe(`Analise socraticamente o incômodo: "${userMessage}"`, systemPrompt);
        const parsed = JSON.parse(aiText.replace(/```json/gi, '').replace(/```/g, '').trim());
        if (parsed.cleanFact) cleanFact = parsed.cleanFact;
        if (parsed.agentFeedback) agentFeedback = parsed.agentFeedback;
        if (parsed.nextQuestion) nextQuestion = parsed.nextQuestion;
        if (parsed.probableTrigger) data.trouble_type = parsed.probableTrigger;
      } catch (e) {
        cleanFact = userMessage.trim();
      }

      data.fact_description = cleanFact;
      data.title = cleanFact.slice(0, 50) + (cleanFact.length > 50 ? '...' : '');

      return res.status(200).json({
        nextStep: 'posture',
        agentMessage: `${agentFeedback}\n\nSeparando o fato da interpretação, a situação observável é:\n👉 **"${cleanFact}"**\n\nAgora vamos avaliar a sua reação prática. Na metodologia do Thiago Prata, temos 10 níveis de postura. Se você percebe mais de um comportamento, **selecione o de menor número** (o gargalo real):\n\n${nextQuestion}`,
        suggestedOptions: [
          '[1] Reclamar (focando em queixas e detalhes do problema)',
          '[2] Justificar (apontando motivos externos de porque não agiu)',
          '[3] Reconhecer (admitindo minha parcela e o que posso mudar)',
          '[4] Investigar (explorando hipóteses e causas profundas)',
          '[5] Analisar (avaliando o impacto nos meus objetivos)',
          '[6] Decidir (definindo limites e escolhas conscientes)',
        ],
        extractedData: data,
      });
    }

    // 3. POSTURA -> GATILHO
    if (step === 'posture') {
      const systemPrompt = `Você é ISAAC, mentor socrático. O usuário está na etapa de identificar sua Postura (de 1 a 10 no método Thiago Prata):
1: Reclamar | 2: Justificar | 3: Reconhecer | 4: Investigar | 5: Analisar | 6: Decidir | 7: Propor | 8: Experimentar | 9: Adaptar | 10: Consolidar.
Fato observado: "${data.fact_description}"
Resposta do usuário: "${userMessage}"

Analise a resposta e:
1. Determine o nível de postura (1 a 10). Se houver ambiguidade ou múltiplos comportamentos, escolha o menor número (gargalo).
2. Dê um feedback acolhedor e lúcido demonstrando que entendeu a fala e explicando por que ela se encaixa nessa postura e qual o efeito prático dela.
3. Formule a transição para a próxima pergunta sobre o GATILHO (Mental, Comportamento, Relacionamento, Acontecimento).

Responda em JSON:
{
  "postureLevel": 1 a 10,
  "postureName": "Nome da postura",
  "agentFeedback": "Feedback acolhedor explicando onde a fala se encaixa na escala de postura.",
  "nextQuestion": "Pergunta para identificar o gatilho gerador do incômodo."
}`;

      let level = 1;
      let agentFeedback = '';
      let nextQuestion = 'Agora, onde você percebe a principal origem ou gatilho gerador desse incômodo?';

      try {
        const aiText = await callGeminiSafe(`Classifique a postura em: "${userMessage}"`, systemPrompt);
        const parsed = JSON.parse(aiText.replace(/```json/gi, '').replace(/```/g, '').trim());
        if (parsed.postureLevel) level = Math.max(1, Math.min(10, parseInt(parsed.postureLevel, 10)));
        if (parsed.agentFeedback) agentFeedback = parsed.agentFeedback;
        if (parsed.nextQuestion) nextQuestion = parsed.nextQuestion;
      } catch (e) {
        const match = userMessage.match(/\b([1-9]|10)\b/);
        if (match) level = parseInt(match[1], 10);
        else {
          const lower = userMessage.toLowerCase();
          if (lower.includes('reclam')) level = 1;
          else if (lower.includes('justif')) level = 2;
          else if (lower.includes('reconhec')) level = 3;
          else if (lower.includes('investig')) level = 4;
          else if (lower.includes('analis')) level = 5;
          else if (lower.includes('decid')) level = 6;
          else if (lower.includes('prop')) level = 7;
          else if (lower.includes('experim')) level = 8;
          else if (lower.includes('adapt')) level = 9;
          else if (lower.includes('consolid')) level = 10;
        }
      }

      data.posture_level = level;
      const postureInfo = POSTURE_LEVELS[level] || POSTURE_LEVELS[1];
      const feedbackText = agentFeedback || `Excelente clareza e honestidade. Registrei sua postura atual como **[${level}] ${postureInfo.name}**.\n*${postureInfo.desc}*`;

      return res.status(200).json({
        nextStep: 'trigger',
        agentMessage: `${feedbackText}\n\n${nextQuestion}`,
        suggestedOptions: [
          'Mental (pensamentos, crenças, expectativas e autocrítica)',
          'Comportamento (hábitos, o que faço, evito ou adio)',
          'Relacionamento (comunicação, acordos e limites com terceiros)',
          'Acontecimento (eventos e imprevistos externos recorrentes)',
        ],
        extractedData: data,
      });
    }

    // 4. GATILHO -> ESCALA HAWKINS
    if (step === 'trigger') {
      const systemPrompt = `Você é ISAAC. O usuário está identificando o GATILHO de origem do incômodo.
Fato: "${data.fact_description}" | Postura: [${data.posture_level}]
Fala do usuário: "${userMessage}"

Sua tarefa:
1. Mapear a origem entre: 'mental', 'comportamento', 'relacionamento' ou 'acontecimento'.
2. Explicar de forma socrática por que o relato dele se encaixa nessa esfera de gatilho.
3. Conectar com a Escala de Consciência de David Hawkins: perguntar qual emoção predominante ele experimenta (Medo, Raiva, Culpa, Angústia, Apatia, ou Coragem para transformar).

Responda em JSON:
{
  "triggerType": "mental | comportamento | relacionamento | acontecimento",
  "agentFeedback": "Feedback demonstrando que entendeu a raiz do gatilho e contextualizando-o.",
  "nextQuestion": "Pergunta socrática sobre a emoção interna predominante segundo Hawkins."
}`;

      let trigger = 'mental';
      let agentFeedback = '';
      let nextQuestion = 'Olhando para dentro de você: qual emoção ou estado interno você sente com mais força ao encarar esse incômodo?';

      try {
        const aiText = await callGeminiSafe(`Identifique o gatilho em: "${userMessage}"`, systemPrompt);
        const parsed = JSON.parse(aiText.replace(/```json/gi, '').replace(/```/g, '').trim());
        if (parsed.triggerType) trigger = parsed.triggerType.toLowerCase();
        if (parsed.agentFeedback) agentFeedback = parsed.agentFeedback;
        if (parsed.nextQuestion) nextQuestion = parsed.nextQuestion;
      } catch (e) {
        const lower = userMessage.toLowerCase();
        if (lower.includes('comport')) trigger = 'comportamento';
        else if (lower.includes('relacion')) trigger = 'relacionamento';
        else if (lower.includes('acontec')) trigger = 'acontecimento';
      }

      data.trouble_type = trigger;
      const feedbackText = agentFeedback || `Gatilho classificado como **${trigger.toUpperCase()}**. Compreender a origem impede que você ataque o sintoma errado.`;

      return res.status(200).json({
        nextStep: 'hawkins',
        agentMessage: `${feedbackText}\n\nOlhando para a escala de consciência de David Hawkins e do Thiago Prata:\n${nextQuestion}`,
        suggestedOptions: [
          'Raiva (frustração, irritação e indignação com a situação)',
          'Medo (ansiedade, insegurança ou receio do futuro)',
          'Culpa (remorso, autoacusação e peso mental)',
          'Angústia (dor profunda e aperto no peito)',
          'Apatia (desânimo e sensação de impotência)',
          'Coragem (determinação de assumir e resolver)',
          'Disposição / Aceitação (abertura para aprender e avançar)',
        ],
        extractedData: data,
      });
    }

    // 5. ESCALA HAWKINS -> MATRIZ IRRI (INTENSIDADE)
    if (step === 'hawkins') {
      const systemPrompt = `Você é ISAAC. O usuário expressou a emoção interna sentida diante do incômodo.
Fala do usuário: "${userMessage}"

Tarefa:
1. Mapear o estado emocional central (ex: raiva, medo, culpa, angustia, apatia, orgulho, coragem, disposicao, aceitacao, paz).
2. Explicar onde essa resposta se encaixa na Escala de Hawkins (abaixo de 200 Hz = reativo/dreno de energia vital; acima de 200 Hz = proativo/alavanca construtiva).
3. Transitar para a Matriz de Impacto IRRI para calibrar a realidade factual, começando pela INTENSIDADE (1 a 5).

Responda em JSON:
{
  "internalState": "raiva | medo | culpa | angustia | apatia | orgulho | coragem | disposicao | aceitacao | paz",
  "agentFeedback": "Feedback empático explicando o nível de Hawkins onde a fala se encaixa.",
  "nextQuestion": "Pergunta para calibrar a INTENSIDADE (1 a 5) na Matriz IRRI."
}`;

      let state = 'medo';
      let agentFeedback = '';
      let nextQuestion = 'De 1 a 5, qual a INTENSIDADE com que esse incômodo afeta sua mente e suas emoções no dia a dia?';

      try {
        const aiText = await callGeminiSafe(`Mapeie o estado de Hawkins em: "${userMessage}"`, systemPrompt);
        const parsed = JSON.parse(aiText.replace(/```json/gi, '').replace(/```/g, '').trim());
        if (parsed.internalState) state = parsed.internalState.toLowerCase();
        if (parsed.agentFeedback) agentFeedback = parsed.agentFeedback;
        if (parsed.nextQuestion) nextQuestion = parsed.nextQuestion;
      } catch (e) {
        const lower = userMessage.toLowerCase();
        if (lower.includes('raiva')) state = 'raiva';
        else if (lower.includes('culpa')) state = 'culpa';
        else if (lower.includes('angust') || lower.includes('angúst')) state = 'angustia';
        else if (lower.includes('apatia')) state = 'apatia';
        else if (lower.includes('coragem')) state = 'coragem';
        else if (lower.includes('disposi')) state = 'disposicao';
        else if (lower.includes('aceita')) state = 'aceitacao';
        else if (lower.includes('paz')) state = 'paz';
      }

      data.internal_state = state;
      const feedbackText = agentFeedback || `Estado interno mapeado: **${state.toUpperCase()}**. Reconhecer o sentimento sem julgamento é a ponte para a lucidez.`;

      return res.status(200).json({
        nextStep: 'irri_intensity',
        agentMessage: `${feedbackText}\n\nAgora vamos entrar na **Matriz de Impacto IRRI** para trazer racionalidade e parar de perder energia no que não traz retorno.\n\n1️⃣ ${nextQuestion}`,
        suggestedOptions: [
          '1 - Muito baixa (raramente ocupa meus pensamentos)',
          '2 - Baixa (desconforto pontual que não paralisa)',
          '3 - Moderada (desconforto frequente que drena foco)',
          '4 - Alta (interfere diretamente na energia e nas relações)',
          '5 - Muito alta (domina a mente e tira o sono)',
        ],
        extractedData: data,
      });
    }

    // 6. IRRI INTENSIDADE -> IRRI RELEVÂNCIA
    if (step === 'irri_intensity') {
      const match = userMessage.match(/\b([1-5])\b/);
      let intensity = match ? parseInt(match[1], 10) : 3;
      if (!match) {
        const lower = userMessage.toLowerCase();
        if (lower.includes('muito alta') || lower.includes('máxima') || lower.includes('dormir') || lower.includes('sono') || lower.includes('todo dia')) intensity = 5;
        else if (lower.includes('alta') || lower.includes('muito')) intensity = 4;
        else if (lower.includes('moderada') || lower.includes('médio')) intensity = 3;
        else if (lower.includes('baixa') || lower.includes('pouco')) intensity = 2;
        else if (lower.includes('muito baixa') || lower.includes('quase nada')) intensity = 1;
      }

      data.intensity_score = intensity;
      data.intensity_notes = userMessage;

      return res.status(200).json({
        nextStep: 'irri_relevance',
        agentMessage: `Entendi o peso emocional: Intensidade calibrada em **${intensity}/5**.\n\n2️⃣ Agora, tirando o calor do momento: de 1 a 5, qual a **RELEVÂNCIA** real desse incômodo para os seus objetivos de longo prazo, seus valores e o que você está construindo?`,
        suggestedOptions: [
          '1 - Irrelevante (ruído passageiro sem impacto no futuro)',
          '2 - Baixa relevância (não compromete o que é vital)',
          '3 - Moderada (área que merece atenção e cuidado)',
          '4 - Alta relevância (diretamente ligado às minhas prioridades)',
          '5 - Vital / Máxima (fundamental para o meu destino e negócio)',
        ],
        extractedData: data,
      });
    }

    // 7. IRRI RELEVÂNCIA -> IRRI RESPONSABILIDADE
    if (step === 'irri_relevance') {
      const match = userMessage.match(/\b([1-5])\b/);
      let relevance = match ? parseInt(match[1], 10) : 3;
      if (!match) {
        const lower = userMessage.toLowerCase();
        if (lower.includes('vital') || lower.includes('máxima') || lower.includes('fundamental') || lower.includes('futuro')) relevance = 5;
        else if (lower.includes('alta') || lower.includes('prioridade')) relevance = 4;
        else if (lower.includes('moderada')) relevance = 3;
        else if (lower.includes('baixa')) relevance = 2;
        else if (lower.includes('irrelevante') || lower.includes('pouco')) relevance = 1;
      }

      data.relevance_score = relevance;
      data.relevance_notes = userMessage;

      return res.status(200).json({
        nextStep: 'irri_responsibility',
        agentMessage: `Relevância registrada como **${relevance}/5**.\n\n3️⃣ Agora vamos à virada metodológica: de 1 a 5, qual o seu grau de **RESPONSABILIDADE** pessoal sobre essa situação?\n*(Lembre-se: responsabilidade não é culpa. É sobre reconhecer a sua esfera de jurisdição e ação).*`,
        suggestedOptions: [
          '1 - Não é minha alçada (fora da minha governança)',
          '2 - Posso dialogar ou ouvir (papel de apoio)',
          '3 - Posso contribuir se for demandado',
          '4 - Responsabilidade compartilhada (tenho cota direta)',
          '5 - Responsabilidade total minha (sou o guardião do resultado)',
        ],
        extractedData: data,
      });
    }

    // 8. IRRI RESPONSABILIDADE -> IRRI INFLUÊNCIA
    if (step === 'irri_responsibility') {
      const match = userMessage.match(/\b([1-5])\b/);
      let resp = match ? parseInt(match[1], 10) : 3;
      if (!match) {
        const lower = userMessage.toLowerCase();
        if (lower.includes('total') || lower.includes('guardião') || lower.includes('tudo meu')) resp = 5;
        else if (lower.includes('compartilhada') || lower.includes('cota direta')) resp = 4;
        else if (lower.includes('contribuir') || lower.includes('apoio')) resp = 3;
        else if (lower.includes('ouvir') || lower.includes('dialogar')) resp = 2;
        else if (lower.includes('não é minha') || lower.includes('fora')) resp = 1;
      }

      data.responsibility_score = resp;
      data.responsibility_notes = userMessage;

      return res.status(200).json({
        nextStep: 'irri_influence',
        agentMessage: `Responsabilidade fixada em **${resp}/5**.\n\n4️⃣ Última variável da matriz: de 1 a 5, qual a sua capacidade real de **INFLUÊNCIA**? Quanto as SUAS ações diretas têm o poder de alterar o desfecho?`,
        suggestedOptions: [
          '1 - Muito baixa (depende quase 100% de terceiros ou fatores externos)',
          '2 - Baixa (posso opinar mas não controlo a decisão final)',
          '3 - Moderada (posso produzir impacto considerável)',
          '4 - Alta (minhas escolhas mudam a rota do problema)',
          '5 - Decisiva / Total (tenho condições diretas de resolver)',
        ],
        extractedData: data,
      });
    }

    // 9. IRRI INFLUÊNCIA -> GERAÇÃO DO DOSSIÊ DA VIRADA
    if (step === 'irri_influence') {
      const match = userMessage.match(/\b([1-5])\b/);
      let influence = match ? parseInt(match[1], 10) : 3;
      if (!match) {
        const lower = userMessage.toLowerCase();
        if (lower.includes('decisiva') || lower.includes('total') || lower.includes('resolver')) influence = 5;
        else if (lower.includes('alta') || lower.includes('mudam')) influence = 4;
        else if (lower.includes('moderada')) influence = 3;
        else if (lower.includes('baixa')) influence = 2;
        else if (lower.includes('muito baixa') || lower.includes('terceiros')) influence = 1;
      }

      data.influence_score = influence;
      data.influence_notes = userMessage;

      // Classificação do Quadrante IRRI
      let quadrantType = 'Alavanca de Ação Imediata';
      let quadrantAdvice = 'Convergência de relevância e capacidade de agir. Exige transição rápida para atitude executiva.';
      if (data.responsibility_score <= 2 && influence <= 2) {
        quadrantType = 'Desapego & Proteção Emocional';
        quadrantAdvice = 'Você está drenando energia intensa em algo onde não tem governança. A saída lúcida é aceitação, entrega e imposição de limites.';
      } else if (data.relevance_score >= 4 && influence <= 2) {
        quadrantType = 'Estratégia de Diálogo & Alianças';
        quadrantAdvice = 'Crucial para sua vida, mas capacidade de mudança unilateral é baixa. O foco deve ser diálogo aberto, empatia e alinhamento de acordos.';
      } else if (data.relevance_score <= 2 && influence >= 4) {
        quadrantType = 'Otimização & Descarte';
        quadrantAdvice = 'Você tem facilidade para resolver, mas o impacto no seu futuro é baixo. Resolva rápido ou delegue sem perder o foco do que importa.';
      }

      // Chamada Gemini para o Dossiê Completo
      const posture = POSTURE_LEVELS[data.posture_level] || POSTURE_LEVELS[1];
      const diagPrompt = `Gere o Dossiê da Virada para o usuário aplicando a metodologia do mentor Thiago Prata:
Fato: "${data.fact_description}"
Postura: [${data.posture_level}] ${posture.name}
Gatilho: ${data.trouble_type} | Hawkins: ${data.internal_state}
IRRI: Intensidade=${data.intensity_score}/5, Relevância=${data.relevance_score}/5, Responsabilidade=${data.responsibility_score}/5, Influência=${data.influence_score}/5.
Quadrante IRRI: ${quadrantType}

Responda ESTRITAMENTE em JSON:
{
  "summary": "Resumo clínico empático e direto da situação em 2 a 3 frases.",
  "quadrant": "${quadrantType}",
  "quadrantAdvice": "${quadrantAdvice}",
  "postureCritique": "Análise clara sobre a postura atual dele e a chave para subir para o próximo degrau.",
  "hawkinsBridge": "A ponte emocional e consciente: como sair da reatividade de '${data.internal_state}' através da Coragem.",
  "suggestedMicroAction": "Uma micro-ação precisa, concreta e realizável nas próximas 24h que dependa 100% dele."
}`;

      let diagnosis = {
        summary: `Incômodo em ${data.trouble_type} classificado no quadrante ${quadrantType}.`,
        quadrant: quadrantType,
        quadrantAdvice,
        postureCritique: `Você está na postura [${data.posture_level}] ${posture.name}. O próximo passo é subir para [${Math.min(10, data.posture_level + 1)}].`,
        hawkinsBridge: `Use a insatisfação de ${data.internal_state} como combustível para acessar a Coragem.`,
        suggestedMicroAction: 'Definir uma conversa calma de alinhamento com os envolvidos nas próximas 24 horas.',
      };

      try {
        const diagText = await callGeminiSafe(diagPrompt);
        const parsedDiag = JSON.parse(diagText.replace(/```json/gi, '').replace(/```/g, '').trim());
        diagnosis = { ...diagnosis, ...parsedDiag };
      } catch (e) { }

      data.ai_diagnosis = diagnosis;

      return res.status(200).json({
        nextStep: 'micro_action',
        agentMessage: `✨ **Dossiê da Virada Concluído!**\n\n📊 **Quadrante IRRI:** ${diagnosis.quadrant}\n💡 **Direcionamento:** ${diagnosis.quadrantAdvice}\n\n🪜 **Postura Atual:** [${data.posture_level}] ${posture.name}\n${diagnosis.postureCritique}\n\n⚡ **Ponte de Hawkins:** ${diagnosis.hawkinsBridge}\n\n🎯 **Para selarmos o compromisso:** qual é a única micro-ação concreta que depende 100% de você nas próximas 24 horas para dar o primeiro passo?`,
        suggestedOptions: [
          diagnosis.suggestedMicroAction,
          'Fazer um alinhamento direto e transparente hoje',
          'Traçar um plano de execução com prazo inegociável',
          'Aceitar os limites da situação e proteger meu foco',
        ],
        extractedData: data,
        diagnosis,
      });
    }

    // 10. MICRO-AÇÃO FINAL -> CONCLUÍDO
    if (step === 'micro_action') {
      data.micro_action_24h = userMessage.trim();

      return res.status(200).json({
        nextStep: 'completed',
        agentMessage: `🤝 **Compromisso Selado com Sucesso!**\n\nSua micro-ação de 24h foi registrada:\n👉 *"${data.micro_action_24h}"*\n\nTodos os dados da metodologia foram consolidados. Clique no botão abaixo para **Salvar o Incômodo Criativo** no seu histórico e disponibilizar o prontuário para acompanhamento do seu mentor.`,
        suggestedOptions: ['Salvar Incômodo & Selar Compromisso'],
        extractedData: data,
        isCompleted: true,
      });
    }

    // Default fallback
    return res.status(200).json({
      nextStep: 'welcome',
      agentMessage: 'Como posso te ajudar a refletir sobre o seu incômodo hoje?',
      suggestedOptions: ['Começar a dissecar meu incômodo'],
      extractedData: data,
    });
  } catch (error) {
    console.error('❌ Erro no passo do chat guiado:', error);
    res.status(500).json({ error: 'Erro no chat do incômodo criativo: ' + error.message });
  }
}

/**
 * 11. Cruzamento Metodológico de Múltiplos Incômodos (Raio-X de Padrões Inconscientes)
 * Analisa todos os incômodos criativos do usuário, cruzando posturas, Hawkins e matriz IRRI
 * GET /api/creative-troubles/cross-analysis
 */
export async function generateCrossAnalysis(req, res) {
  try {
    const userId = req.user?.id || req.query.userId || req.body?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const { data: troubles, error } = await supabaseAdmin
      .from('izaque_creative_troubles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!troubles || troubles.length === 0) {
      return res.status(200).json({
        total: 0,
        message: 'Nenhum incômodo cadastrado para realizar o cruzamento de dados.',
        analysis: null,
      });
    }

    const total = troubles.length;
    const avgPosture = (troubles.reduce((acc, t) => acc + (t.posture_level || 1), 0) / total).toFixed(1);

    const triggersCount = {};
    const hawkinsCount = {};
    const postureLevels = {};
    const quadrantsCount = {};
    let reactiveCount = 0;

    troubles.forEach((t) => {
      triggersCount[t.trouble_type] = (triggersCount[t.trouble_type] || 0) + 1;
      hawkinsCount[t.internal_state] = (hawkinsCount[t.internal_state] || 0) + 1;
      postureLevels[t.posture_level] = (postureLevels[t.posture_level] || 0) + 1;

      const state = (t.internal_state || '').toLowerCase();
      if (['medo', 'raiva', 'culpa', 'angustia', 'apatia', 'tristeza', 'vergonha', 'orgulho', 'desejo'].includes(state)) {
        reactiveCount++;
      }

      const quad = t.ai_diagnosis?.quadrant || 'Em Análise';
      quadrantsCount[quad] = (quadrantsCount[quad] || 0) + 1;
    });

    const reactivePercentage = Math.round((reactiveCount / total) * 100);

    const systemPrompt = `Você é ISAAC, orquestrador de mentalidade de alta performance e mestre na metodologia do Incômodo Criativo do mentor Thiago Prata e David Hawkins.
Analise o CRUZAMENTO DE DADOS de múltiplos incômodos criativos deste usuário.
Sua missão é identificar os PADRÕES INCONSCIENTES REPETITIVOS dele:
1. Padrão Central: onde ele tende a se travar ou entrar em reatividade nas diferentes esferas.
2. Ralo de Energia: onde ele está drenando força vital inutilmente.
3. Alavanca Mestra: a mudança de postura ou consciência que destravará múltiplos problemas de uma só vez.
4. Conselho Cirúrgico do Mentor Isaac em tom humano, lúcido e acolhedor.

Responda ESTRITAMENTE em formato JSON:
{
  "corePattern": "Descrição clínica do padrão repetitivo identificado através dos múltiplos incômodos.",
  "energyDrain": "O principal ralo de energia e tempo detectado no cruzamento.",
  "masterLever": "A alavanca mestra de postura e consciência que produzirá efeito dominó positivo.",
  "mentorInsight": "Mensagem cirúrgica e inspiradora do mentor Isaac em 3 a 4 frases profundas."
}`;

    const userPrompt = `
DADOS DO CRUZAMENTO DE ${total} INCÔMODOS DO USUÁRIO:
- Postura Média: ${avgPosture} / 10
- Distribuição de Posturas: ${JSON.stringify(postureLevels)}
- Gatilhos Frequentes: ${JSON.stringify(triggersCount)}
- Frequência de Hawkins: ${JSON.stringify(hawkinsCount)} (${reactivePercentage}% dos incômodos iniciados em frequências reativas < 200 Hz)
- Distribuição de Quadrantes IRRI: ${JSON.stringify(quadrantsCount)}
- Amostra dos Fatos Concretos dos Incômodos:
${troubles.slice(0, 5).map((t, idx) => `${idx + 1}. [${t.trouble_type}] Postura [${t.posture_level}]: "${t.fact_description}" (Hawkins: ${t.internal_state}, IRRI: I=${t.intensity_score}, R=${t.relevance_score}, Resp=${t.responsibility_score}, Inf=${t.influence_score})`).join('\n')}
`;

    let aiAnalysis = {
      corePattern: `Você registrou ${total} incômodos com postura média em nível [${avgPosture}]. Há uma tendência a gastar energia em situações de alta intensidade emocional.`,
      energyDrain: `${reactivePercentage}% dos seus incômodos estão ancorados em estados reativos na escala de Hawkins, drenando sua clareza de decisão.`,
      masterLever: `Subir a postura nas áreas de relacionamento e canalizar a energia da insatisfação para a Coragem executiva.`,
      mentorInsight: `Seu crescimento exige parar de justificar o comportamento alheio e focar 100% no que está sob sua governança direta.`,
    };

    try {
      const aiResponse = await callGeminiSafe(userPrompt, systemPrompt);
      const cleanJson = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      aiAnalysis = { ...aiAnalysis, ...JSON.parse(cleanJson) };
    } catch (err) {
      console.warn('⚠️ Fallback no cruzamento de incômodos:', err.message);
    }

    res.status(200).json({
      total,
      avgPosture,
      reactivePercentage,
      triggersCount,
      hawkinsCount,
      quadrantsCount,
      troublesSummary: troubles.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        posture_level: t.posture_level,
        internal_state: t.internal_state,
        quadrant: t.ai_diagnosis?.quadrant,
        created_at: t.created_at,
      })),
      analysis: aiAnalysis,
    });
  } catch (error) {
    console.error('❌ Erro no cruzamento de dados de incômodos:', error);
    res.status(500).json({ error: 'Erro ao gerar cruzamento: ' + error.message });
  }
}
