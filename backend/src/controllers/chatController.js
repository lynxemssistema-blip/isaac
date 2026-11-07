import { genAI, CHAT_MODEL, FALLBACK_CHAT_MODELS } from '../config/gemini.js';
import { supabaseAdmin } from '../config/supabase.js';
import { generateEmbedding, searchMemories, formatMemoriesForPrompt } from '../services/memoryService.js';
import { searchAgentKnowledge, formatAgentKnowledgeForPrompt } from '../services/agentKnowledgeService.js';
import { extractAndSaveMemoryAsync } from '../services/extractionService.js';
import { transcribeAudioWithGemini } from '../services/audioService.js';
import { getCached, setCached } from '../utils/memoryCache.js';

const ACTIVE_AGENTS_CACHE_KEY = 'agents:active_full';
const ACTIVE_AGENTS_TTL_MS = 60_000;

async function fetchCachedActiveAgents() {
  const cached = getCached(ACTIVE_AGENTS_CACHE_KEY);
  if (cached) return cached;

  const { data, error } = await supabaseAdmin
    .from('izaque_agents')
    .select('id, name, slug, type, temperature, system_prompt, is_active, starter_questions')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return setCached(ACTIVE_AGENTS_CACHE_KEY, data || [], ACTIVE_AGENTS_TTL_MS);
}

/**
 * Retorna todos os agentes especialistas ativos para o seletor da interface
 * (Omite system_prompt na rota pública para proteger propriedade intelectual dos prompts)
 */
export async function getActiveAgents(req, res) {
  try {
    const agents = await fetchCachedActiveAgents();
    const publicAgents = agents.map(({ system_prompt, ...publicFields }) => publicFields);
    res.status(200).json(publicAgents);
  } catch (error) {
    console.error('❌ Erro ao listar agentes ativos:', error);
    res.status(500).json({ error: 'Erro ao listar agentes.' });
  }
}

/**
 * Função interna para orquestrar a seleção de agente (Auto-Routing)
 * Permite ao Orquestrador Central alternar dinamicamente entre os especialistas
 * de acordo com o contexto e intenção da conversa do usuário.
 */
async function resolveAgent(agentId, userMessage, allAgents, history = []) {
  const masterAgent = allAgents?.find(a => a.slug === 'izaque-master' || a.slug === 'isaac-master') || {
    id: 'default',
    name: 'ISAAC - Arquiteto da Mentalidade',
    slug: 'isaac-master',
    type: 'mindset',
    system_prompt: 'Você é ISAAC, mentor de alta performance especialista em reprogramação de mentalidade, identificação de bloqueios emocionais e superação de autossabotagem.',
    temperature: 0.70,
  };

  // Se o usuário especificou um especialista fixo diferente de 'auto'
  if (agentId && agentId !== 'auto') {
    const found = allAgents?.find(a => a.id === agentId || a.slug === agentId);
    if (found) return found;
  }

  // Heurística rápida de intenção direta para resposta ágil e certeira
  const lowerMsg = (userMessage || '').toLowerCase();

  // 0. Termos de Alcoolismo / Sobriedade / Vício / Fissura / Bebida (Renato)
  const sobrietyTerms = [
    'álcool', 'alcool', 'alcoolismo', 'alcoólatra', 'alcoolatra', 'bebida', 'beber',
    'cerveja', 'cervejinha', 'vinho', 'cachaça', 'cachaca', 'whisky', 'vodka',
    'ressaca', 'fissura', 'recaída', 'recaida', 'deslize', 'sobriedade', 'sóbrio', 'sobrio',
    'alcoólicos anônimos', 'alcoolicos anonimos', 'a.a.', 'aa', 'caps ad', 'caps',
    'parar de beber', 'vontade de beber', 'parando de beber', 'luta contra o álcool'
  ];
  const isSobrietyIntent = sobrietyTerms.some(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    return regex.test(lowerMsg);
  });

  if (isSobrietyIntent) {
    const sobrietyAgent = allAgents?.find(a => a.slug === 'renato-sobriedade' || a.type === 'sobriedade');
    if (sobrietyAgent) {
      console.log(`🧭 [ISAAC Router] Intenção de sobriedade/alcoolismo detectada -> Direcionado para: "${sobrietyAgent.name}"`);
      return sobrietyAgent;
    }
  }

  // 1. Termos Bíblicos / Fé / Deus / Espiritualidade (Pastor João)
  const biblicalTerms = [
    'deus', 'bíblia', 'biblia', 'versículo', 'versiculo', 'versículos', 'versiculos',
    'pastor', 'oração', 'oracao', 'orar', 'senhor', 'fé', 'jesus', 'cristão', 'evangélico',
    'salmo', 'escritura', 'palavra de deus', 'evangelho', 'joão ferreira de almeida', 'igreja'
  ];
  const isBiblicalIntent = biblicalTerms.some(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    return regex.test(lowerMsg);
  });

  if (isBiblicalIntent) {
    const biblicalAgent = allAgents?.find(a => a.slug === 'pastor-joao-biblico' || a.type === 'espiritualidade');
    if (biblicalAgent) {
      console.log(`🧭 [ISAAC Router] Intenção bíblica/espiritual detectada -> Direcionado para: "${biblicalAgent.name}"`);
      return biblicalAgent;
    }
  }

  // 2. Termos Financeiros / Escassez / Dinheiro (Dr. Marcus)
  const financeTerms = [
    'dinheiro', 'cobrar', 'preço', 'preco', 'precificar', 'precificação', 'escassez',
    'faturamento', 'financeiro', 'lucro', 'falência', 'falencia', 'enriquecer', 'rico', 'riqueza'
  ];
  const isFinanceIntent = financeTerms.some(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    return regex.test(lowerMsg);
  });

  if (isFinanceIntent) {
    const financeAgent = allAgents?.find(a => a.slug === 'mentor-financeiro' || a.type === 'financeiro');
    if (financeAgent) {
      console.log(`🧭 [ISAAC Router] Intenção financeira detectada -> Direcionado para: "${financeAgent.name}"`);
      return financeAgent;
    }
  }

  // 3. Termos de Liderança / Delegação / Centralização (Helena Vance)
  const leadershipTerms = [
    'delegar', 'delegação', 'delegacao', 'minha equipe', 'meus funcionários', 'funcionarios',
    'centralizar', 'centralizo', 'centralização', 'centralizacao', 'controlar tudo', 'liderança', 'lideranca'
  ];
  const isLeadershipIntent = leadershipTerms.some(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    return regex.test(lowerMsg);
  });

  if (isLeadershipIntent) {
    const leadershipAgent = allAgents?.find(a => a.slug === 'mentora-lideranca' || a.type === 'lideranca');
    if (leadershipAgent) {
      console.log(`🧭 [ISAAC Router] Intenção de liderança detectada -> Direcionado para: "${leadershipAgent.name}"`);
      return leadershipAgent;
    }
  }

  // 4. Termos de Burnout / Esgotamento / Sobrecarga / Limites (Dra. Sofia)
  const burnoutTerms = [
    'burnout', 'esgotamento', 'exaustão', 'exaustao', 'sobrecarga', 'sobrecarregado',
    'sobrecarregada', 'não sei dizer não', 'nao sei dizer nao', 'cansado de tudo',
    'cansada de tudo', 'trabalho demais', 'não aguento mais a pressão'
  ];
  const isBurnoutIntent = burnoutTerms.some(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    return regex.test(lowerMsg);
  });
  if (isBurnoutIntent) {
    const burnoutAgent = allAgents?.find(a => a.slug === 'dra-sofia-burnout' || a.type === 'burnout');
    if (burnoutAgent) {
      console.log(`🧭 [ISAAC Router] Intenção de burnout/limites detectada -> Direcionado para: "${burnoutAgent.name}"`);
      return burnoutAgent;
    }
  }

  // 5. Termos de Luto / Perda / Término / Reconstrução (Clara)
  const griefTerms = [
    'luto', 'perdi alguém', 'perdi alguem', 'perdi meu', 'perdi minha', 'término', 'termino',
    'divórcio', 'divorcio', 'fim de relacionamento', 'dor da perda', 'saudade que dói',
    'falecimento', 'morreu'
  ];
  const isGriefIntent = griefTerms.some(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    return regex.test(lowerMsg);
  });
  if (isGriefIntent) {
    const griefAgent = allAgents?.find(a => a.slug === 'clara-luto-recomeco' || a.type === 'luto');
    if (griefAgent) {
      console.log(`🧭 [ISAAC Router] Intenção de luto/término detectada -> Direcionado para: "${griefAgent.name}"`);
      return griefAgent;
    }
  }

  // 6. Termos de Estoicismo / Serenidade / Aceitação (Marco Aurélio)
  const stoicTerms = [
    'estoico', 'estoica', 'estoicismo', 'marco aurélio', 'marco aurelio', 'epicteto', 'sêneca',
    'seneca', 'amor fati', 'fora do meu controle', 'aceitação ativa', 'serenidade estoica'
  ];
  const isStoicIntent = stoicTerms.some(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    return regex.test(lowerMsg);
  });
  if (isStoicIntent) {
    const stoicAgent = allAgents?.find(a => a.slug === 'marco-aurelio-estoico' || a.type === 'estoicismo');
    if (stoicAgent) {
      console.log(`🧭 [ISAAC Router] Intenção estoica detectada -> Direcionado para: "${stoicAgent.name}"`);
      return stoicAgent;
    }
  }

  // 7. Termos de Síndrome do Impostor / Hesitação / Coragem (Caleb)
  const courageTerms = [
    'síndrome do impostor', 'sindrome do impostor', 'impostor', 'medo de arriscar',
    'não me sinto pronto', 'nao me sinto pronto', 'me diminuir', 'medo do julgamento',
    'hesitação', 'hesitacao', 'insegurança profissional', 'coragem para mudar'
  ];
  const isCourageIntent = courageTerms.some(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    return regex.test(lowerMsg);
  });
  if (isCourageIntent) {
    const courageAgent = allAgents?.find(a => a.slug === 'caleb-coragem' || a.type === 'coragem');
    if (courageAgent) {
      console.log(`🧭 [ISAAC Router] Intenção de coragem/impostor detectada -> Direcionado para: "${courageAgent.name}"`);
      return courageAgent;
    }
  }

  // 8. Auto-Roteamento Inteligente via Gemini (Contexto Multi-Turno)
  if (allAgents && allAgents.length > 1) {
    try {
      const recentTurns = (history || [])
        .slice(-3)
        .map(h => `${h.role === 'user' ? 'Usuário' : 'Guia'}: "${(h.content || '').slice(0, 140)}"`)
        .join('\n');

      const routerPrompt = `
Você é o Orquestrador Central da Mentoria "ISAAC".
Sua função é analisar a mensagem do usuário e o contexto da conversa para decidir qual Especialista é o mais indicado para responder e acolher o desabafo.

ESPECIALISTAS DA MENTORIA:
${allAgents.map(a => `- ID: ${a.id} | Slug: ${a.slug} | Nome: ${a.name} | Especialidade: ${a.type}
  Foco: ${
    a.slug === 'renato-sobriedade' ? 'Recuperação do alcoolismo, superação de fissura, prevenção de recaída e apoio de A.A./CAPS.' :
    a.slug === 'pastor-joao-biblico' ? 'Bíblia Sagrada (JFA), fé em Deus, oração, consolo espiritual.' :
    a.slug === 'mentor-financeiro' ? 'Mentalidade financeira, crenças de escassez, culpa com dinheiro e prosperidade.' :
    a.slug === 'mentora-lideranca' ? 'Liderança, delegação, cura da centralização e medo de confiar na equipe.' :
    a.slug === 'dra-sofia-burnout' ? 'Prevenção de Burnout, exaustão, aprender a dizer não e colocar limites saudáveis.' :
    a.slug === 'clara-luto-recomeco' ? 'Travessia do luto, términos dolorosos, separação, perda de entes queridos e reconstrução.' :
    a.slug === 'marco-aurelio-estoico' ? 'Estoicismo, discernimento entre o que se controla e o incontrolável, serenidade.' :
    a.slug === 'caleb-coragem' ? 'Superação da síndrome do impostor, coragem profissional e audácia para avançar.' :
    'Reprogramação de mentalidade geral, autossabotagem, desabafos emocionais e acolhimento amplo.'
  }`).join('\n')}

${recentTurns ? `HISTÓRICO RECENTE:\n${recentTurns}\n` : ''}
MENSAGEM DO USUÁRIO: "${userMessage}"

DIRETRIZES:
- Se envolver álcool, bebida, fissura, recaída: selecione o especialista em sobriedade.
- Se envolver fé, Deus, versículos bíblicos, oração: selecione o especialista bíblico.
- Se envolver dinheiro, preços, culpa por ter dinheiro: selecione o especialista financeiro.
- Se envolver delegar, controle, desconfiança de equipe: selecione a especialista de liderança.
- Se envolver exaustão, estresse crônico, burnout, dificuldade de dizer não: selecione a especialista em burnout.
- Se envolver perda, luto, término, morte, separação: selecione a especialista em luto e recomeço.
- Se envolver ansiedade com o incontrolável, estoicismo, controle emocional: selecione o mentor estoico.
- Se envolver síndrome do impostor, medo de avançar, insegurança profissional: selecione o mentor de coragem.
- Se for geral, autossabotagem, desabafo emocional amplo: selecione o ISAAC Master (${masterAgent.id}).

Retorne EXCLUSIVAMENTE o ID ou Slug do especialista escolhido. Não inclua explicações ou texto extra.`;

      let chosenText = '';
      const routerCandidateModels = [CHAT_MODEL, ...(FALLBACK_CHAT_MODELS || [])].filter((m, i, arr) => arr.indexOf(m) === i);
      for (const rModel of routerCandidateModels) {
        try {
          const routerModel = genAI.getGenerativeModel({
            model: rModel,
            generationConfig: { temperature: 0.1 },
          });
          const routerResult = await routerModel.generateContent(routerPrompt);
          chosenText = routerResult.response.text().trim();
          if (chosenText) break;
        } catch (rErr) {
          if (rErr.message && (rErr.message.includes('404') || rErr.message.includes('not found'))) {
            console.warn(`⚠️ [Router Fallback] Modelo ${rModel} não encontrado, tentando alternativa...`);
            continue;
          }
          break;
        }
      }

      // Busca por ID exato, slug exato, ou substring limpa
      let autoPicked = allAgents.find(a => a.id === chosenText || a.slug === chosenText);
      if (!autoPicked) {
        autoPicked = allAgents.find(a => chosenText.includes(a.id) || (a.slug && chosenText.includes(a.slug)));
      }

      if (autoPicked) {
        console.log(`🧭 [ISAAC Router] Direcionado via IA para: "${autoPicked.name}" (${autoPicked.slug})`);
        return autoPicked;
      }
    } catch (err) {
      console.warn('⚠️ Falha no auto-roteamento via IA, usando ISAAC Master:', err.message);
    }
  }

  return masterAgent;
}

/**
 * Executa a orquestração completa: RAG de memórias, super-prompt e Gemini
 */
export async function processChatMessageCore({ message, userId, agentId, history = [], sessionId = null, guidedConversationId = null }) {
  const allActiveAgents = await fetchCachedActiveAgents().catch(() => []);

  // Etapa 1 Paralelizada: Roteamento + Embedding (768d) + Conversa Direcionada + Incômodos Criativos Ativos
  const [selectedAgent, userEmbedding, guidedConversation, activeTroubles] = await Promise.all([
    resolveAgent(agentId, message, allActiveAgents, history),
    generateEmbedding(message).catch((e) => {
      console.warn('⚠️ Falha ao gerar embedding:', e.message);
      return null;
    }),
    getGuidedConversationContext(guidedConversationId, sessionId).catch((gErr) => {
      console.warn('⚠️ Falha ao carregar contexto de conversa direcionada:', gErr.message);
      return null;
    }),
    userId
      ? supabaseAdmin
          .from('izaque_creative_troubles')
          .select('title, fact_description, posture_level, internal_state, intensity_score, relevance_score, responsibility_score, influence_score, micro_action_24h, status, created_at')
          .eq('user_id', userId)
          .eq('status', 'ativo')
          .order('created_at', { ascending: false })
          .limit(3)
          .then(({ data }) => data || [])
          .catch((ctErr) => {
            console.warn('⚠️ Falha ao buscar incômodos criativos para o contexto do chat:', ctErr.message);
            return [];
          })
      : Promise.resolve([]),
  ]);

  // Etapa 2 Paralelizada: Busca Vetorial no pgvector (Memórias do Usuário + Base de Estudos do Especialista)
  let relevantMemories = [];
  let relevantKnowledge = [];
  if (userEmbedding) {
    [relevantMemories, relevantKnowledge] = await Promise.all([
      searchMemories(userId, userEmbedding, {
        matchThreshold: 0.40,
        matchCount: 4,
      }).catch((mErr) => {
        console.warn('⚠️ Falha ao buscar memórias do usuário:', mErr.message);
        return [];
      }),
      searchAgentKnowledge(selectedAgent.id, userEmbedding, {
        matchThreshold: 0.38,
        matchCount: 3,
      }).catch((kErr) => {
        console.warn('⚠️ Falha ao buscar conhecimento de estudo do agente:', kErr.message);
        return [];
      }),
    ]);
  }

  const memoriesText = formatMemoriesForPrompt(relevantMemories);
  const knowledgeText = formatAgentKnowledgeForPrompt(relevantKnowledge);

  // 3. Monta protocolo de Conversa Direcionada se aplicável
  let guidedInstruction = '';
  if (guidedConversation) {
    let rawQuestions = [];
    if (Array.isArray(guidedConversation.questions)) {
      rawQuestions = guidedConversation.questions;
    } else if (typeof guidedConversation.questions === 'string') {
      try {
        rawQuestions = JSON.parse(guidedConversation.questions);
      } catch {}
    }

    if (rawQuestions.length > 0) {
      const formattedQuestions = rawQuestions
        .map((q, idx) => `   Pergunta ${idx + 1}: "${typeof q === 'string' ? q : (q.text || q.question || JSON.stringify(q))}"`)
        .join('\n');

      guidedInstruction = `
🎯 PROTOCOLO DE CONVERSA DIRECIONADA (PRIORIDADE MÁXIMA DEFINIDA PELO SUPERADMIN):
Esta sessão é uma CONVERSA DIRECIONADA com tema: "${guidedConversation.title}".
${guidedConversation.description ? `Propósito/Objetivo: "${guidedConversation.description}"` : ''}

ROTEIRO OBRIGATÓRIO DE PERGUNTAS DO SUPERADMIN:
${formattedQuestions}

SUA PRIORIDADE MÁXIMA E INEGOCIÁVEL NESTA INTERAÇÃO É DIRECIONAR A CONVERSA PARA AS PERGUNTAS DEFINIDAS PELO SUPERADMIN ACIMA:
1. DIRECIONAMENTO ATIVO DO DIÁLOGO: Seu papel principal não é apenas responder passivamente, mas conduzir deliberada e habilmente o usuário através desse roteiro de perguntas.
2. PONTE EMPÁTICA (ACOLHER E DIRECIONAR): Sempre acolha o que o usuário acabou de dizer com calor humano, empatia e validação emocional (1 a 2 parágrafos curtos). Em seguida, faça imediatamente uma transição natural, assertiva e conectada para a pergunta do roteiro que precisa ser trabalhada.
3. FIRMEZA CONTRA DISPERSÕES E EVASÕES: Se o usuário divagar, contar histórias paralelas que fujam do cerne, ou tentar mudar de assunto, acolha brevemente, mas não se perca na dispersão. Traga-o com carinho, autoridade de mentor e firmeza de volta ao tema central e à pergunta da vez.
4. UMA PERGUNTA POR VEZ: NUNCA faça mais de uma pergunta de uma só vez nem despeje o questionário inteiro. Avance ordenadamente, dando espaço para o usuário digerir e responder cada etapa.
5. CONSCIÊNCIA DE PROGRESSO NO HISTÓRICO: Examine o histórico recente da conversa para identificar quais perguntas das listadas acima o usuário já respondeu com substância. Direcione o seu foco para a PRÓXIMA pergunta ainda não respondida.
6. FECHAMENTO PRÁTICO: Quando todas as perguntas do roteiro forem respondidas, consolide os pontos fortes revelados pelo usuário e encerre a conversa com uma reflexão inspiradora e uma micro-ação prática para as próximas 24 horas.`;
    }
  }

  // 4. Formata Incômodos Criativos Ativos do Usuário (Metodologia do Mentor Thiago Prata)
  let creativeTroublesText = '';
  if (activeTroubles && activeTroubles.length > 0) {
    const troublesList = activeTroubles.map((t, idx) =>
      '[' + (idx + 1) + '] "' + t.title + '": Fato="' + (t.fact_description || '') + '" | Postura=[Nível ' + (t.posture_level || 1) + '] | Hawkins="' + (t.internal_state || '') + '" | IRRI (I:' + (t.intensity_score || 3) + ', R:' + (t.relevance_score || 3) + ', Resp:' + (t.responsibility_score || 3) + ', Inf:' + (t.influence_score || 3) + ') | Micro-ação 24h="' + (t.micro_action_24h || 'Pendente') + '"'
    ).join('\n');

    creativeTroublesText = '\n\nINCÔMODOS CRIATIVOS ATIVOS DO USUÁRIO (LABORATÓRIO DO INCÔMODO CRIATIVO):\nO usuário está trabalhando ativamente nas seguintes questões na metodologia do mentor Thiago Prata:\n' + troublesList + '\nIntegre essas informações com sensibilidade para apoiar o usuário, incentivar a postura ativa e acompanhar o compromisso da micro-ação de 24 horas.\n';
  }

  // 5. Monta o Super-Prompt com Persona + Conhecimento Técnico + Memórias Pessoais + Diretriz Direcionada + Incômodos
  const fullSystemInstruction = `${selectedAgent.system_prompt}

${knowledgeText}

${memoriesText}

${creativeTroublesText}

${guidedInstruction}

DIRETRIZES DO ISAAC (OTIMIZADO PARA FALA HUMANA E ACOLHIMENTO):
1. Sua resposta será lida em voz alta por uma voz humana empática. NUNCA use listas com marcadores (* ou -), tópicos enumerados, emojis ou formatação Markdown excessiva.
2. Escreva de forma conversacional, em parágrafos curtos, calorosos e fluidos.
3. USE RETICÊNCIAS (...) estrategicamente para forçar pausas respiratórias e dramáticas na fala. Aja como um mentor com voz mansa e acolhedora.
4. Confronte desculpas confortáveis, exponha o padrão de autossabotagem e acolha a dor real.
5. Aplique com autoridade os conceitos da sua base de estudos e integre memórias de longo prazo do usuário com naturalidade.
6. Conclua com uma reflexão profunda ou um passo prático para as próximas 24 horas.
7. Você mantém uma visão panorâmica e contínua de toda a história de vida deste usuário. Todas as conversas e reflexões passadas compõem uma jornada única: conecte temas, bloqueios e padrões anteriores com naturalidade e sabedoria mesmo em uma nova conversa ou tópico.
8. Se o usuário perguntar como deve usar o Isaac (por exemplo "Como devo usar o Isaac?" ou "Como usar o Isaac?"), acolha com calor humano e explique de forma fluida e simples, em parágrafos curtos, que ele pode desabafar sem filtros escrevendo ou gravando um áudio sobre qualquer dilema, hesitação, carreira, fé, finanças, relacionamentos ou sobriedade... que o Orquestrador aciona automaticamente o mentor ideal, guarda a memória evolutiva com total sigilo, oferece voz neural serena com som 432Hz e o Laboratório do Incômodo Criativo (tudo livre no Plano Gratuito do App), além da opção de conversar também pelo WhatsApp em texto e áudio no plano mensal... e convide-o ao final a contar o que está pesando no coração hoje.`;

  // 4. Sanitiza o histórico de chat para o Gemini:
  // Gemini exige estritamente que a primeira mensagem seja 'user' e que haja alternância de papéis
  const rawHistory = history.slice(-8).map((h) => ({
    role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user',
    parts: [{ text: h.content || h.parts?.[0]?.text || '' }],
  })).filter(h => h.parts[0].text && h.parts[0].text.trim().length > 0);

  const recentHistory = [];
  const firstUserIdx = rawHistory.findIndex(h => h.role === 'user');

  if (firstUserIdx !== -1) {
    for (let i = firstUserIdx; i < rawHistory.length; i++) {
      const current = rawHistory[i];
      const prev = recentHistory[recentHistory.length - 1];
      if (!prev || prev.role !== current.role) {
        recentHistory.push(current);
      }
    }
  }

  // 5. Gera a resposta com Gemini (com fallback resiliente para garantir 100% de disponibilidade)
  const modelsToTry = [CHAT_MODEL, ...(FALLBACK_CHAT_MODELS || [])].filter((m, i, arr) => arr.indexOf(m) === i);
  let replyText = '';
  let lastChatError = null;

  for (const modelCandidate of modelsToTry) {
    try {
      const maxOutputTokens = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS) || 8192;
      const model = genAI.getGenerativeModel({
        model: modelCandidate,
        systemInstruction: fullSystemInstruction,
        generationConfig: {
          temperature: Number(selectedAgent.temperature) || 0.7,
          maxOutputTokens,
        },
      });

      const chatSession = model.startChat({ history: recentHistory });
      const result = await chatSession.sendMessage(message);
      replyText = result.response.text();

      const candidate = result.response.candidates?.[0];
      if (candidate?.finishReason === 'MAX_TOKENS') {
        console.warn(`⚠️ [Gemini Chat] Aviso: Resposta atingiu o limite de tokens (${maxOutputTokens}).`);
      }

      lastChatError = null;
      if (replyText) break;
    } catch (err) {
      lastChatError = err;
      const isNotFound = err.message && (err.message.includes('404') || err.message.includes('not found'));
      if (isNotFound) {
        console.warn(`⚠️ [Gemini Chat Fallback] Modelo "${modelCandidate}" retornou 404. Tentando próximo modelo...`);
        continue;
      }
      throw err;
    }
  }

  if (lastChatError) {
    throw lastChatError;
  }

  // 6. Extração assíncrona de novos bloqueios em background
  extractAndSaveMemoryAsync(userId, message, replyText);

  return {
    reply: replyText,
    selectedAgent,
    relevantMemories,
    relevantKnowledge,
    guidedConversation,
  };
}

/**
 * Recupera o contexto e roteiro de perguntas de uma Conversa Direcionada
 */
async function getGuidedConversationContext(guidedConversationId, sessionId) {
  const isUuid = (val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val || '');

  let targetGuidedId = isUuid(guidedConversationId) ? guidedConversationId : null;
  let sessionTitle = null;

  if (!targetGuidedId && isUuid(sessionId)) {
    try {
      const { data: sess } = await supabaseAdmin
        .from('izaque_chat_sessions')
        .select('guided_conversation_id, title')
        .eq('id', sessionId)
        .maybeSingle();

      if (sess) {
        if (isUuid(sess.guided_conversation_id)) {
          targetGuidedId = sess.guided_conversation_id;
        }
        sessionTitle = sess.title;
      }
    } catch (e) {
      console.warn('⚠️ Falha ao verificar sessão para conversa direcionada:', e.message);
    }
  }

  // 1. Busca por ID da conversa direcionada
  if (targetGuidedId) {
    try {
      const { data: guided } = await supabaseAdmin
        .from('izaque_guided_conversations')
        .select('id, title, description, category, questions, agent_slug')
        .eq('id', targetGuidedId)
        .maybeSingle();

      if (guided) return guided;
    } catch (e) {
      console.warn('⚠️ Falha ao buscar conversa direcionada por ID:', e.message);
    }
  }

  // 2. Fallback: Busca por título se o nome da sessão coincidir com conversa direcionada ativa
  if (sessionTitle && sessionTitle.trim()) {
    try {
      const { data: guidedByTitle } = await supabaseAdmin
        .from('izaque_guided_conversations')
        .select('id, title, description, category, questions, agent_slug')
        .ilike('title', sessionTitle.trim())
        .eq('is_active', true)
        .maybeSingle();

      if (guidedByTitle) return guidedByTitle;
    } catch (e) {
      console.warn('⚠️ Falha ao buscar conversa direcionada por título:', e.message);
    }
  }

  return null;
}

/**
 * Garante que uma mensagem pertença a uma sessão válida do usuário.
 * Se nenhuma sessão for informada, associa à sessão mais recente ou cria uma nova com título contextual.
 */
export async function ensureUserSession(userId, sessionId, firstMessage = '', guidedConversationId = null) {
  const isUuid = (val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val || '');

  if (isUuid(sessionId)) {
    const { data: existing } = await supabaseAdmin
      .from('izaque_chat_sessions')
      .select('id, guided_conversation_id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      const updatePayload = { updated_at: new Date().toISOString() };
      if (!existing.guided_conversation_id && isUuid(guidedConversationId)) {
        updatePayload.guided_conversation_id = guidedConversationId;
      }
      await supabaseAdmin
        .from('izaque_chat_sessions')
        .update(updatePayload)
        .eq('id', existing.id);
      return existing.id;
    }
  }

  if (isUuid(userId)) {
    const { data: latest } = await supabaseAdmin
      .from('izaque_chat_sessions')
      .select('id, guided_conversation_id')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latest) {
      const updatePayload = { updated_at: new Date().toISOString() };
      if (!latest.guided_conversation_id && isUuid(guidedConversationId)) {
        updatePayload.guided_conversation_id = guidedConversationId;
      }
      await supabaseAdmin
        .from('izaque_chat_sessions')
        .update(updatePayload)
        .eq('id', latest.id);
      return latest.id;
    }

    // Se o usuário não tem nenhuma sessão, cria a primeira
    let cleanTitle = (firstMessage || '').replace(/\n/g, ' ').trim().slice(0, 36);
    if (!cleanTitle) cleanTitle = 'Reflexão Inicial';
    else if (cleanTitle.length === 36) cleanTitle += '...';

    const { data: created } = await supabaseAdmin
      .from('izaque_chat_sessions')
      .insert({
        user_id: userId,
        title: cleanTitle,
        guided_conversation_id: isUuid(guidedConversationId) ? guidedConversationId : null,
      })
      .select('id')
      .single();

    return created?.id || null;
  }

  return null;
}

/**
 * Controller do Chat de Texto Padrão (Suporta múltiplas sessões com RAG global)
 */
export async function handleChatMessage(req, res) {
  try {
    const { message, userId, agentId, history = [], sessionId, guidedConversationId } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: 'O campo "message" é obrigatório.' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'O campo "userId" é obrigatório.' });
    }

    const { reply, selectedAgent, relevantMemories, relevantKnowledge, guidedConversation } = await processChatMessageCore({
      message,
      userId,
      agentId,
      history,
      sessionId,
      guidedConversationId,
    });

    // Garante que a mensagem pertença a uma sessão de conversa do usuário
    let resolvedSessionId = null;
    try {
      resolvedSessionId = await ensureUserSession(userId, sessionId, message, guidedConversationId || guidedConversation?.id);
    } catch (sErr) {
      console.warn('⚠️ Aviso ao resolver sessão do chat:', sErr.message);
    }

    // Salva mensagem de texto no banco de dados (histórico em izaque_messages)
    try {
      const isAgentUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedAgent?.id || '');
      const safeAgentId = isAgentUuid ? selectedAgent.id : null;

      await supabaseAdmin.from('izaque_messages').insert([
        { user_id: userId, agent_id: safeAgentId, session_id: resolvedSessionId, role: 'user', content: message, is_audio: false },
        { user_id: userId, agent_id: safeAgentId, session_id: resolvedSessionId, role: 'assistant', content: reply, is_audio: false },
      ]);
    } catch (dbErr) {
      console.warn('⚠️ Aviso ao persistir mensagens em izaque_messages:', dbErr.message);
    }

    res.status(200).json({
      reply,
      sessionId: resolvedSessionId,
      agentUsed: {
        id: selectedAgent.id,
        name: selectedAgent.name,
        slug: selectedAgent.slug,
        type: selectedAgent.type,
      },
      guidedConversation: guidedConversation ? {
        id: guidedConversation.id,
        title: guidedConversation.title,
        questionsCount: Array.isArray(guidedConversation.questions) ? guidedConversation.questions.length : 0,
      } : null,
      memoriesUsed: (relevantMemories || []).map(m => ({
        content: m.content,
        category: m.category,
        similarity: m.similarity,
      })),
      knowledgeUsed: (relevantKnowledge || []).map(k => ({
        content: k.content,
        similarity: k.similarity,
      })),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ [ISAAC Chat] Erro ao processar mensagem:');
    console.error('   message:', error.message);
    console.error('   status:', error.status);
    console.error('   stack:', error.stack?.split('\n')[1]);
    if (error.errorDetails) console.error('   details:', JSON.stringify(error.errorDetails));
    res.status(500).json({ error: 'Erro ao processar mensagem.', details: error.message });
  }
}

/**
 * Controller de Mensagem de ÁUDIO:
 * 1. Ouve e transcreve o áudio com Gemini Multimodal
 * 2. Salva a transcrição no banco de dados vinculada à sessão
 * 3. Processa a resposta com RAG Global e Mentor Especialista
 * 4. Retorna a transcrição, resposta e sessionId para o frontend
 */
export async function handleAudioChatMessage(req, res) {
  try {
    const { audioBase64, mimeType = 'audio/webm', userId, agentId, history = [], durationSeconds, sessionId, guidedConversationId } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'O áudio em formato base64 é obrigatório.' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'O campo "userId" é obrigatório.' });
    }

    console.log(`\n🎙️ [Audio Chat] Novo áudio recebido do usuário [${userId}] (${mimeType}). Iniciando transcrição...`);

    // 1. OUVIR E TRANSCREVER O ÁUDIO COM O GEMINI
    const transcription = await transcribeAudioWithGemini(audioBase64, mimeType);

    if (!transcription || transcription === '[Áudio inaudível]') {
      return res.status(200).json({
        transcription: '[Áudio inaudível]',
        reply: 'Não consegui compreender nitidamente o que você disse no áudio. Pode gravar novamente ou digitar a sua mensagem?',
        agentUsed: { name: 'ISAAC - Arquiteto da Mentalidade', type: 'mindset' },
        memoriesUsed: [],
        knowledgeUsed: [],
        timestamp: new Date().toISOString(),
      });
    }

    // 2. PROCESSAR O CONTEÚDO TRANSCRITO NO PIPELINE DO MENTOR
    const { reply, selectedAgent, relevantMemories, relevantKnowledge, guidedConversation } = await processChatMessageCore({
      message: transcription,
      userId,
      agentId,
      history,
      sessionId,
      guidedConversationId,
    });

    // Garante que o áudio pertença à sessão de conversa ativa
    let resolvedSessionId = null;
    try {
      resolvedSessionId = await ensureUserSession(userId, sessionId, transcription, guidedConversationId || guidedConversation?.id);
    } catch (sErr) {
      console.warn('⚠️ Aviso ao resolver sessão do chat de áudio:', sErr.message);
    }

    // 3. SALVAR A TRANSCRIÇÃO E A RESPOSTA NO BANCO DE DADOS
    const isAgentUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedAgent?.id || '');
    const safeAgentId = isAgentUuid ? selectedAgent.id : null;

    const { error: msgErr } = await supabaseAdmin.from('izaque_messages').insert([
      {
        user_id: userId,
        agent_id: safeAgentId,
        session_id: resolvedSessionId,
        role: 'user',
        content: transcription,
        is_audio: true,
        audio_duration_seconds: durationSeconds || null,
      },
      {
        user_id: userId,
        agent_id: safeAgentId,
        session_id: resolvedSessionId,
        role: 'assistant',
        content: reply,
        is_audio: false,
      },
    ]);

    if (msgErr) {
      console.warn('⚠️ Aviso ao gravar transcrição em izaque_messages:', msgErr);
    } else {
      console.log(`💾 [Supabase] Transcrição e resposta salvas na tabela izaque_messages (Sessão: ${resolvedSessionId})!`);
    }

    // 4. RETORNAR RESPOSTA E TRANSCRIÇÃO PARA O FRONTEND
    res.status(200).json({
      transcription,
      reply,
      sessionId: resolvedSessionId,
      agentUsed: {
        id: selectedAgent.id,
        name: selectedAgent.name,
        slug: selectedAgent.slug,
        type: selectedAgent.type,
      },
      guidedConversation: guidedConversation ? {
        id: guidedConversation.id,
        title: guidedConversation.title,
        questionsCount: Array.isArray(guidedConversation.questions) ? guidedConversation.questions.length : 0,
      } : null,
      memoriesUsed: (relevantMemories || []).map(m => ({
        content: m.content,
        category: m.category,
        similarity: m.similarity,
      })),
      knowledgeUsed: (relevantKnowledge || []).map(k => ({
        content: k.content,
        similarity: k.similarity,
      })),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ [Audio Chat Error]:', error);
    res.status(500).json({ error: 'Erro ao processar mensagem de áudio.', details: error.message });
  }
}

/**
 * Retorna as sessões de conversa do usuário
 */
export async function getUserSessions(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório.' });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUuid) {
      return res.status(200).json([]);
    }

    let { data: sessions, error } = await supabaseAdmin
      .from('izaque_chat_sessions')
      .select('id, user_id, title, guided_conversation_id, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Se o usuário ainda não tiver nenhuma sessão no banco, cria a primeira sessão padrão
    if (!sessions || sessions.length === 0) {
      const { data: newSession, error: createErr } = await supabaseAdmin
        .from('izaque_chat_sessions')
        .insert({
          user_id: userId,
          title: 'Conversa Principal',
        })
        .select()
        .single();

      if (!createErr && newSession) {
        sessions = [newSession];
      }
    }

    res.status(200).json(sessions || []);
  } catch (error) {
    console.error('❌ Erro ao listar sessões do usuário:', error);
    res.status(500).json({ error: 'Erro ao listar sessões de conversa.', details: error.message });
  }
}

/**
 * Cria uma nova sessão de conversa vazia para o usuário
 */
export async function createUserSession(req, res) {
  try {
    const { userId, title, guidedConversationId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório.' });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUuid) {
      return res.status(400).json({ error: 'UUID de usuário inválido.' });
    }

    const sessionTitle = (title && typeof title === 'string' && title.trim())
      ? title.trim().slice(0, 60)
      : 'Nova Reflexão';

    const { data: session, error } = await supabaseAdmin
      .from('izaque_chat_sessions')
      .insert({
        user_id: userId,
        title: sessionTitle,
        guided_conversation_id: isUuid(guidedConversationId) ? guidedConversationId : null,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(session);
  } catch (error) {
    console.error('❌ Erro ao criar nova sessão:', error);
    res.status(500).json({ error: 'Erro ao criar sessão.', details: error.message });
  }
}

/**
 * Atualiza o título de uma sessão de conversa
 */
export async function updateUserSession(req, res) {
  try {
    const { sessionId } = req.params;
    const { title } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId é obrigatório.' });
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Título inválido.' });
    }

    let query = supabaseAdmin
      .from('izaque_chat_sessions')
      .update({
        title: title.trim().slice(0, 60),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (req.user && req.user.role !== 'master' && req.user.role !== 'admin') {
      query = query.eq('user_id', req.user.id);
    }

    const { data: updated, error } = await query.select().maybeSingle();

    if (error) throw error;
    if (!updated) {
      return res.status(404).json({ error: 'Sessão não encontrada ou acesso negado.' });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error('❌ Erro ao atualizar sessão:', error);
    res.status(500).json({ error: 'Erro ao atualizar título da conversa.' });
  }
}

/**
 * Exclui uma sessão de conversa e suas respectivas mensagens
 */
export async function deleteUserSession(req, res) {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId é obrigatório.' });
    }

    let query = supabaseAdmin
      .from('izaque_chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (req.user && req.user.role !== 'master' && req.user.role !== 'admin') {
      query = query.eq('user_id', req.user.id);
    }

    const { error } = await query;

    if (error) throw error;

    res.status(200).json({ success: true, message: 'Sessão removida com sucesso.' });
  } catch (error) {
    console.error('❌ Erro ao remover sessão:', error);
    res.status(500).json({ error: 'Erro ao remover sessão.' });
  }
}

/**
 * Retorna o histórico de conversas do usuário (filtrado por sessionId se informado)
 */
export async function getChatHistory(req, res) {
  try {
    const { userId } = req.params;
    const { sessionId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório.' });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUuid) {
      return res.status(200).json([]);
    }

    let query = supabaseAdmin
      .from('izaque_messages')
      .select(`
        id,
        user_id,
        agent_id,
        session_id,
        role,
        content,
        is_audio,
        audio_duration_seconds,
        created_at,
        izaque_agents (
          id,
          name,
          slug,
          type
        )
      `)
      .eq('user_id', userId);

    const isSessionUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId || '');
    if (isSessionUuid) {
      query = query.eq('session_id', sessionId);
    }

    const { data, error } = await query
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) throw error;

    const formatted = (data || []).map((msg) => ({
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

    res.status(200).json(formatted);
  } catch (error) {
    console.error('❌ Erro ao buscar histórico de mensagens:', error);
    res.status(500).json({ error: 'Erro ao carregar histórico de mensagens.', details: error.message });
  }
}

/**
 * Limpa o histórico de conversas do usuário (ou de uma sessão específica)
 */
export async function clearChatHistory(req, res) {
  try {
    const { userId } = req.params;
    const { sessionId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório.' });
    }

    let query = supabaseAdmin.from('izaque_messages').delete().eq('user_id', userId);
    const isSessionUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId || '');
    if (isSessionUuid) {
      query = query.eq('session_id', sessionId);
    }

    const { error } = await query;
    if (error) throw error;

    res.status(200).json({ message: 'Histórico de conversas reiniciado com sucesso.' });
  } catch (error) {
    console.error('❌ Erro ao limpar histórico:', error);
    res.status(500).json({ error: 'Erro ao limpar histórico.', details: error.message });
  }
}
