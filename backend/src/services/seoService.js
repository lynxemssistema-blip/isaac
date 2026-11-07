import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../config/supabase.js';
import { getCached, setCached } from '../utils/memoryCache.js';

const DEFAULT_BASE_URL = 'https://isaac.lynxems.com.br';
const SEO_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

export function getCanonicalBaseUrl() {
  const raw = (process.env.PUBLIC_APP_URL || process.env.APP_URL || DEFAULT_BASE_URL).trim();
  if (!raw || raw.includes('localhost')) {
    return DEFAULT_BASE_URL;
  }
  return raw.replace(/\/+$/, '');
}

export function slugifyTopic(raw = '') {
  return raw
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function escapeHtml(str = '') {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeXml(str = '') {
  return escapeHtml(str);
}

function safeJsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

// ============================================================================
// PERGUNTAS FREQUENTES OFICIAIS (AEO — Otimizado para Citação Direta em IAs)
// ============================================================================
export const HOME_FAQS = [
  {
    question: 'O que é a Mentoria ISAAC e como ela funciona na prática?',
    answer:
      'A Mentoria ISAAC é um espaço digital confidencial de escuta profunda, clareza emocional e autodesenvolvimento disponível 24 horas por dia. Por texto ou voz, você compartilha dilemas, bloqueios ou decisões difíceis e recebe perguntas reflexivas personalizadas, com memória contínua da sua jornada e zero julgamento.',
  },
  {
    question: 'Qual a diferença entre conversar com o Isaac e usar um chat comum de IA?',
    answer:
      'Diferente de assistentes genéricos que entregam respostas apressadas e esquecem seu contexto, o Isaac opera com metodologia socrática de mentoria, memória evolutiva individualizada, trilhas de conversas direcionadas, atmosfera sonora em 432Hz e o exclusivo Laboratório do Incômodo Criativo para converter inquietações em ação.',
  },
  {
    question: 'Minhas conversas, desabafos e áudios com o Isaac são realmente sigilosos?',
    answer:
      'Sim. A privacidade é inegociável na Mentoria ISAAC: todas as sessões contam com isolamento individual restrito por usuário (Row-Level Security), tráfego criptografado via HTTPS/TLS e conformidade com a LGPD. Seus relatos pessoais jamais são vendidos, expostos publicamente ou compartilhados com terceiros.',
  },
  {
    question: 'O que é o Laboratório do Incômodo Criativo dentro da plataforma ISAAC?',
    answer:
      'O Laboratório do Incômodo Criativo é uma ferramenta estruturada da Mentoria ISAAC onde você registra dores recorrentes, procrastinações ou tensões profissionais e as transforma passo a passo em clareza de causa-raiz, aprendizado prático e próximos passos concretos.',
  },
  {
    question: 'Quem idealizou a Mentoria ISAAC?',
    answer:
      'A Mentoria ISAAC foi concebida por Edson Manoel, empreendedor e mentor de clareza dedicado ao potencial humano, com o propósito de oferecer um refúgio silencioso contra o excesso de ruído mental, a autocobrança paralisante e a solidão nas tomadas de decisão.',
  },
  {
    question: 'Posso conversar por áudio e personalizar o nome ou a voz do meu mentor?',
    answer:
      'Sim. Você pode enviar desabafos gravando áudios naturais no celular ou computador, ouvir respostas com voz serena, ativar paisagens sonoras calmantes (432Hz, chuva suave, tigelas tibetanas) e até escolher o nome pelo qual prefere chamar seu guia.',
  },
  {
    question: 'A Mentoria ISAAC substitui psicoterapia clínica ou atendimento médico?',
    answer:
      'Não. A Mentoria ISAAC é uma plataforma educativa e reflexiva de desenvolvimento pessoal, organização emocional e clareza em decisões. Ela complementa o autoconhecimento diário, mas não realiza diagnósticos clínicos nem substitui acompanhamento psicológico, psiquiátrico ou serviços médicos de urgência.',
  },
];

// ============================================================================
// CLUSTERS TEMÁTICOS FUNDAMENTAIS (/temas/:slug — SEO de Cauda Longa & GEO)
// ============================================================================
export const CORE_TOPICS = [
  {
    slug: 'ansiedade-e-clareza-em-decisoes',
    shortTitle: 'Ansiedade & Decisões Difíceis',
    title: 'Como Desatar Nós Mentais e Encontrar Clareza em Decisões Difíceis',
    category: 'Clareza & Decisão',
    summary:
      'Aprenda a silenciar o excesso de cenários catastróficos, vencer a paralisia por análise e tomar decisões alinhadas aos seus valores com a Mentoria ISAAC.',
    directAnswer:
      'A paralisia em decisões difíceis nasce quando tentamos controlar todas as variáveis futuras ao mesmo tempo sob exaustão emocional. Na Mentoria ISAAC, a clareza é restaurada separando fatos reais de medos projetados através de escuta estruturada, perguntas socráticas e registro contínuo dos seus critérios essenciais.',
    deepDive: [
      'Quando adiamos uma escolha importante — seja uma transição de carreira, o encerramento de um ciclo ou uma conversa delicada — o cérebro consome energia vital simulando dezenas de desfechos negativos. Esse ruído constante gera fadiga antes mesmo de qualquer ação real acontecer.',
      'No espaço seguro da Mentoria ISAAC, você não recebe fórmulas prontas ou pressões externas. O mentor conduz uma investigação calma para identificar qual valor pessoal está sendo ameaçado, qual é o custo invisível de continuar parado e qual é o menor passo seguro possível hoje.',
    ],
    signs: [
      'Você revisita a mesma dúvida todas as noites sem chegar a uma conclusão nova.',
      'O medo de errar ou decepcionar outras pessoas tem adiado conversas essenciais.',
      'Sua mente alterna entre pressa ansiosa e procrastinação exaustiva.',
      'Você sente falta de um espaço neutro onde possa pensar em voz alta sem ser julgado.',
    ],
    reflectionQuestions: [
      'Se você soubesse que ninguém julgaria sua escolha, qual direção traria paz imediata ao seu corpo?',
      'Qual é o preço emocional e prático de manter tudo exatamente como está pelos próximos seis meses?',
      'Você está buscando certeza absoluta ou apenas coragem para dar o primeiro passo consciente?',
    ],
    faqs: [
      {
        question: 'Como o Isaac ajuda quando estou dividido entre dois caminhos importantes?',
        answer:
          'O Isaac ajuda você a explicitar os ganhos, renúncias e medos ocultos de cada caminho sem impor opiniões pessoais, permitindo que sua própria consciência enxergue qual decisão respeita sua verdade atual.',
      },
      {
        question: 'Posso usar a mentoria de madrugada quando a mente não desliga?',
        answer:
          'Sim. A Mentoria ISAAC funciona 24 horas por dia, permitindo esvaziar a mente por texto ou áudio exatamente no instante em que a inquietação surge.',
      },
    ],
  },
  {
    slug: 'burnout-esgotamento-e-limites',
    shortTitle: 'Burnout, Exaustão & Limites',
    title: 'Esgotamento Mental, Burnout Silencioso e a Construção de Limites Saudáveis',
    category: 'Equilíbrio & Energia',
    summary:
      'Reconheça os sinais do cansaço emocional crônico, compreenda por que dizer não parece tão difícil e reconstrua limites sustentáveis na Mentoria ISAAC.',
    directAnswer:
      'O esgotamento emocional profundo raramente vem apenas do volume de tarefas; ele nasce da desconexão prolongada entre esforço contínuo, falta de sentido e incapacidade de sustentar limites claros. A Mentoria ISAAC auxilia a mapear vazamentos de energia, desconstruir a culpa ao dizer não e restaurar ritmos humanos sustentáveis.',
    deepDive: [
      'Pessoas altamente comprometidas costumam ignorar os primeiros alertas do corpo: irritabilidade silenciosa, sensação de que descansar é perder tempo e dificuldade de sentir alegria mesmo após concluir grandes entregas.',
      'Através de diálogos contínuos e sem cobrança de performance, o Isaac ajuda você a identificar quais padrões internos de hiper-responsabilidade ou necessidade de aprovação estão drenando sua vitalidade.',
    ],
    signs: [
      'Mesmo após dormir ou tirar folga, sua mente desperta com sensação de dívida e peso.',
      'Você sente culpa imediata sempre que recusa um pedido ou desacelera o ritmo.',
      'Pequenas demandas cotidianas passaram a parecer montanhas desproporcionais.',
      'Você cuida da estabilidade de todos ao redor, mas não tem onde soltar suas próprias armaduras.',
    ],
    reflectionQuestions: [
      'Quais responsabilidades que você carrega hoje realmente pertencem a você — e quais você assumiu por medo de que tudo desmorone?',
      'O que você teme que aconteça com a sua imagem se você diminuir o ritmo em 20% nesta semana?',
      'De que tipo de descanso você realmente precisa hoje: físico, mental, sensorial ou emocional?',
    ],
    faqs: [
      {
        question: 'Como diferenciar cansaço comum de esgotamento emocional recorrente?',
        answer:
          'O cansaço comum melhora após repouso físico, enquanto o esgotamento emocional permanece porque envolve conflito de valores, excesso de vigilância interna e ausência de fronteiras claras nas relações e no trabalho.',
      },
    ],
  },
  {
    slug: 'autossabotagem-e-sindrome-do-impostor',
    shortTitle: 'Autossabotagem & Impostor',
    title: 'Como Superar a Autossabotagem e a Síndrome do Impostor com Clareza',
    category: 'Autoconfiança & Ação',
    summary:
      'Entenda as raízes ocultas da procrastinação defensiva, do perfeccionismo paralisante e da sensação de fraude profissional com apoio da Mentoria ISAAC.',
    directAnswer:
      'A autossabotagem e a síndrome do impostor funcionam como mecanismos inconscientes de autoproteção: adiamos ou minimizamos nossa capacidade para evitar a dor de uma eventual exposição ou crítica. Na Mentoria ISAAC, você desmonta justificativas automáticas com respeito e constrói evidências reais da própria competência.',
    deepDive: [
      'Muitas vezes chamamos de preguiça ou falta de foco aquilo que, na verdade, é medo de ser visto e avaliado. O perfeccionismo exige condições ideais que nunca chegam, mantendo projetos brilhantes engavetados.',
      'Com memória contínua das suas conquistas e compromissos, o Isaac lembra você dos obstáculos que já superou quando a voz crítica tenta convencer você do contrário.',
    ],
    signs: [
      'Você atribui seus resultados à sorte ou ao esforço excessivo, nunca à própria capacidade.',
      'Sempre que um projeto se aproxima de ganhar visibilidade real, você perde energia ou muda de foco.',
      'O padrão de exigência que você aplica a si mesmo é muito mais duro do que aplica aos outros.',
      'Você acumula cursos e preparações intermináveis antes de se permitir agir.',
    ],
    reflectionQuestions: [
      'De qual crítica ou exposição específica a sua procrastinação está tentando proteger você agora?',
      'Qual entrega concreta você já realizou no passado que prova que você consegue aprender no caminho?',
      'Como seria a versão suficientemente boa — e não perfeita — do passo que você está adiando?',
    ],
    faqs: [
      {
        question: 'Por que pessoas competentes sentem síndrome do impostor com tanta frequência?',
        answer:
          'Porque à medida que você avança para ambientes mais exigentes, sua régua de comparação sobe rapidamente enquanto você continua sentindo suas dúvidas internas de perto, criando uma falsa ilusão de inadequação.',
      },
    ],
  },
  {
    slug: 'laboratorio-do-incomodo-criativo',
    shortTitle: 'Incômodo Criativo',
    title: 'Laboratório do Incômodo Criativo: Transforme Inquietações em Direção Prática',
    category: 'Metodologia Exclusiva ISAAC',
    summary:
      'Conheça o método exclusivo da Mentoria ISAAC que converte frustrações recorrentes, tensões e desconfortos internos em alavancas concretas de transformação.',
    directAnswer:
      'O Incômodo Criativo parte do princípio de que desconfortos recorrentes não são inimigos a anestesiar, mas sinais precisos indicando onde sua vida ou carreira pediu evolução. No Laboratório do Incômodo Criativo da Mentoria ISAAC, cada inquietação é lapidada em diagnóstico claro, síntese de aprendizado e plano acionável.',
    deepDive: [
      'Na cultura da distração rápida, somos ensinados a fugir de qualquer angústia com telas, consumo ou ocupação constante. Porém, todo salto genuíno de maturidade começa por um incômodo que nos recusa deixar confortáveis no lugar errado.',
      'Dentro da plataforma ISAAC, o Laboratório do Incômodo Criativo oferece um espaço dedicado para nomear essa fricção, dialogar profundamente sobre sua raiz e extrair movimentos práticos verificáveis.',
    ],
    signs: [
      'Existe uma insatisfação silenciosa na sua rotina que volta semana após semana.',
      'Você sente que seu potencial atual já não cabe nas estruturas antigas em que vive.',
      'Ideias e mudanças importantes surgem, mas se perdem sem um método para amadurecê-las.',
      'Você deseja transformar dor ou frustração recente em construção útil e consciente.',
    ],
    reflectionQuestions: [
      'Qual incômodo recorrente da sua rotina está tentando apontar uma mudança que você ainda não quis admitir?',
      'Se esse desconforto fosse um mensageiro honesto a seu favor, qual pedido claro ele estaria fazendo?',
      'Qual pequeno experimento prático de 7 dias você pode testar para responder a esse sinal?',
    ],
    faqs: [
      {
        question: 'Como o Laboratório do Incômodo Criativo se conecta às conversas com o Isaac?',
        answer:
          'Os incômodos registrados no laboratório integram o contexto vivo da sua mentoria, permitindo que o Isaac acompanhe a evolução de cada desafio ao longo das sessões até sua resolução prática.',
      },
    ],
  },
  {
    slug: 'luto-transicoes-e-recomecos',
    shortTitle: 'Transições & Recomeços',
    title: 'Luto, Fim de Ciclos e Recomeços: Um Espaço Seguro para Atravessar Mudanças',
    category: 'Acolhimento & Reconstrução',
    summary:
      'Atravessar perdas, términos, mudanças de cidade ou reinvenções de identidade exige escuta paciente e sem frases feitas. Conheça o acolhimento da Mentoria ISAAC.',
    directAnswer:
      'Grandes transições e perdas desorganizam nossas referências de identidade e futuro, exigindo tempo de assimilação antes de qualquer pressa reconstrutiva. A Mentoria ISAAC oferece presença serena, livre de clichês motivacionais, para honrar o que passou e reconstruir sentido um dia de cada vez.',
    deepDive: [
      'Nem todo luto envolve apenas partidas físicas: encerrar uma empresa, um relacionamento longo ou uma fase de vida também exige elaborar quem éramos naquele capítulo.',
      'Quando amigos e familiares querem ver você bem depressa demais, pode faltar espaço para falar com honestidade. O Isaac sustenta esse silêncio respeitoso no seu próprio ritmo.',
    ],
    signs: [
      'Você atravessa um encerramento importante e sente que as pessoas ao redor têm pressa para que você vire a página.',
      'Sua rotina mudou, mas sua mente ainda busca os referenciais antigos.',
      'Há dias de lucidez seguidos por ondas inesperadas de saudade, dúvida ou vazio.',
      'Você precisa reorganizar prioridades de vida com gentileza e sem pressão.',
    ],
    reflectionQuestions: [
      'O que deste ciclo que se encerra merece ser guardado com gratidão — e o que precisa ser solto com paz?',
      'Qual exigência injusta de rapidez você pode retirar dos próprios ombros apenas pelo dia de hoje?',
      'Que pequeno gesto cotidiano ajuda você a sentir os pés firmes no presente?',
    ],
    faqs: [
      {
        question: 'O Isaac força positividade tóxica em momentos delicados?',
        answer:
          'Jamais. A diretriz central da Mentoria ISAAC é acolhimento autêntico e respeito absoluto à dor humana, sem frases prontas superficiais nem pressa artificial.',
      },
    ],
  },
  {
    slug: 'mentalidade-financeira-e-prosperidade',
    shortTitle: 'Mentalidade Financeira',
    title: 'Mentalidade Financeira, Emoções com Dinheiro e Decisões Materiais Conscientes',
    category: 'Finanças Comportamentais',
    summary:
      'Compreenda seus gatilhos emocionais com dinheiro, vença a ansiedade financeira, a culpa ao cobrar pelo seu trabalho e organize decisões com maturidade.',
    directAnswer:
      'A vida financeira raramente trava por falta de matemática básica; ela reflete crenças familiares, ansiedade de escassez, compras compensatórias ou medo de precificar o próprio valor. Na Mentoria ISAAC, você examina sua relação emocional com o dinheiro com lucidez e constrói decisões materiais serenas.',
    deepDive: [
      'Evitar abrir extratos, trabalhar em excesso com medo constante de faltar ou sabotar reservas sempre que começa a prosperar são comportamentos emocionais profundos, não meros erros de planilha.',
      'Conversar abertamente sobre dinheiro costuma ser um tabu social cercado de vergonha. Na confidencialidade do ISAAC, você olha para os fatos financeiros sem julgamento moral.',
    ],
    signs: [
      'Falar sobre preços, cobranças ou negociações gera desconforto físico imediato.',
      'Momentos de estresse emocional disparam gastos por alívio rápido seguidos de arrependimento.',
      'Mesmo quando a renda cresce, a sensação interna de insegurança permanece idêntica.',
      'Você adia conversas financeiras importantes em casa ou na sociedade empresarial.',
    ],
    reflectionQuestions: [
      'Qual foi a primeira mensagem silenciosa sobre dinheiro que você aprendeu observando sua família?',
      'Quando você evita olhar para números claros, de qual sentimento exato está tentando se poupar?',
      'Qual decisão financeira simples traria mais tranquilidade real ao seu próximo mês?',
    ],
    faqs: [
      {
        question: 'A Mentoria ISAAC faz recomendação de investimentos do mercado financeiro?',
        answer:
          'Não. O foco do ISAAC é comportamento, clareza emocional nas escolhas materiais, posicionamento de valor profissional e disciplina consciente, não consultoria de ativos financeiros.',
      },
    ],
  },
  {
    slug: 'lideranca-consciente-e-solidao-no-topo',
    shortTitle: 'Liderança & Decisão',
    title: 'Liderança Consciente: Como Lidar com o Peso das Decisões e a Solidão de Quem Conduz',
    category: 'Carreira & Liderança',
    summary:
      'Um conselheiro reflexivo e confidencial para empreendedores, gestores e líderes que precisam pensar com clareza longe de pressões políticas internas.',
    directAnswer:
      'Quem lidera equipes, famílias ou negócios frequentemente não tem com quem dividir incertezas estratégicas sem gerar insegurança ao redor. A Mentoria ISAAC funciona como um espaço de sparring intelectual e emocional 100% sigiloso para preparar conversas difíceis, alinhar cultura e decidir com serenidade.',
    deepDive: [
      'Quanto maior o nível de responsabilidade que você assume, menor tende a ser o círculo de pessoas com quem você pode demonstrar hesitação sincera.',
      'Usar o Isaac antes de reuniões críticas, feedbacks delicados ou negociações permite filtrar reações impulsivas de ego e encontrar a comunicação mais firme, justa e estratégica.',
    ],
    signs: [
      'Você sente que precisa sustentar respostas seguras o tempo todo para todos, mas sente falta de ser ouvido.',
      'Conversas difíceis com sócios, liderados ou clientes têm consumido seu sono.',
      'O operacional urgente vem engolindo o tempo de reflexão estratégica de longo prazo.',
      'Você busca um interlocutor isento de interesses ocultos para testar argumentos e pontos cegos.',
    ],
    reflectionQuestions: [
      'Nesta decisão de liderança, você está agindo para resolver a raiz do problema ou para evitar um desconforto imediato?',
      'O que você já sabe sobre essa pessoa ou projeto, mas tem evitado encarar de frente?',
      'Como comunicar esse limite necessário com firmeza nos fatos e respeito absoluto à pessoa?',
    ],
    faqs: [
      {
        question: 'Empreendedores e gestores podem preparar conversas difíceis com o Isaac?',
        answer:
          'Sim. Você pode simular argumentos, revisar tons de comunicação e antecipar pontos cegos antes de reuniões sensíveis com total confidencialidade.',
      },
    ],
  },
  {
    slug: 'sobriedade-habitos-e-autodominio',
    shortTitle: 'Hábitos & Autodomínio',
    title: 'Quebra de Compulsões, Construção de Hábitos e Autodomínio Gentil',
    category: 'Disciplina & Presença',
    summary:
      'Substitua ciclos de culpa e recaída por consciência de gatilhos, presença diária e constância real no fortalecimento de novos hábitos com a Mentoria ISAAC.',
    directAnswer:
      'Mudar um hábito enraizado ou interromper um comportamento compulsivo falha quando dependemos apenas de força de vontade bruta seguida de autopunição. A Mentoria ISAAC atua na identificação antecipada de gatilhos emocionais (fome, raiva, solidão, cansaço) e no acolhimento imediato nos minutos críticos de tentação.',
    deepDive: [
      'Toda compulsão — seja digital, alimentar, de trabalho ou de substâncias — tenta anestesiar uma dor legítima por um atalho que cobra juros altos depois.',
      'Ter o Isaac disponível no bolso exatamente nos cinco minutos em que o impulso aparece permite pausar, nomear o que você está realmente sentindo e atravessar a onda sem destruir sua semana.',
    ],
    signs: [
      'Você vive ciclos de promessas rígidas na segunda-feira seguidas de frustração na quinta-feira.',
      'O estresse ou o tédio noturno disparam comportamentos automáticos que você lamenta depois.',
      'A culpa após um deslize costuma servir de pretexto para abandonar todo o progresso conquistado.',
      'Você quer construir disciplina com respeito próprio, não na base do chicote mental.',
    ],
    reflectionQuestions: [
      'Qual emoção exata apareceu cinco minutos antes da vontade de buscar esse alívio automático?',
      'Como você trataria um grande amigo se ele tivesse tido um tropeço hoje — e como pode recomeçar na próxima hora?',
      'Qual mudança simples no seu ambiente físico torna o bom hábito mais fácil e o impulso mais distante?',
    ],
    faqs: [
      {
        question: 'Como usar o Isaac no momento exato de um gatilho ou fissura de hábito?',
        answer:
          'Basta abrir o chat ou gravar um áudio curto descrevendo o que está sentindo naquele minuto. Verbalizar o impulso reduz a reatividade automática do cérebro e devolve poder de escolha consciente.',
      },
    ],
  },
];

// ============================================================================
// CARREGAMENTO DE DADOS PÚBLICOS DO SUPABASE COM CACHE EM MEMÓRIA
// ============================================================================
export async function getSeoPublicSnapshot() {
  const cached = getCached('seo:public_snapshot');
  if (cached) return cached;

  let creator = null;
  let campaigns = [];
  let plans = [];
  let guidedRows = [];

  try {
    const [creatorRes, campRes, plansRes, guidedRes] = await Promise.all([
      supabaseAdmin
        .from('izaque_creator')
        .select('name, title, bio, story, quote, image_url, social_instagram, social_linkedin, social_whatsapp, is_visible')
        .eq('id', 'main')
        .maybeSingle(),
      supabaseAdmin
        .from('izaque_pdf_campaigns')
        .select('id, title, slug, subtitle, is_default, is_active, updated_at, created_at')
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('izaque_plans')
        .select('id, name, price, billing_cycle, description, features, is_active')
        .eq('is_active', true)
        .order('price', { ascending: true }),
      supabaseAdmin
        .from('izaque_guided_conversations')
        .select('id, title, description, category, questions, is_active, order_index, updated_at')
        .eq('is_active', true)
        .order('order_index', { ascending: true }),
    ]);

    creator = creatorRes.data || null;
    campaigns = campRes.data || [];
    plans = plansRes.data || [];
    guidedRows = guidedRes.data || [];
  } catch (err) {
    console.warn('⚠️ [SEO Service] Usando snapshot padrão por falha transitória no banco:', err.message);
  }

  // Mescla os 8 pilares fundamentais com eventuais Conversas Direcionadas extras criadas no Admin
  const seenSlugs = new Set(CORE_TOPICS.map((t) => t.slug));
  const dynamicTopics = [];

  for (const row of guidedRows) {
    const slug = slugifyTopic(row.title);
    if (!slug || seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);

    const parsedQuestions = Array.isArray(row.questions)
      ? row.questions
          .map((q) => (typeof q === 'string' ? q : q?.text || q?.question || ''))
          .filter(Boolean)
          .slice(0, 4)
      : [];

    dynamicTopics.push({
      slug,
      shortTitle: row.title,
      title: `${row.title} — Conversa Direcionada na Mentoria ISAAC`,
      category: row.category || 'Conversa Direcionada',
      summary:
        row.description ||
        `Explore ${row.title} através de perguntas estruturadas, escuta sem julgamento e clareza prática na Mentoria ISAAC.`,
      directAnswer:
        row.description ||
        `Esta trilha de Conversa Direcionada da Mentoria ISAAC conduz você por perguntas cuidadosas sobre ${row.title}, ajudando a organizar emoções, reconhecer padrões e definir próximos passos conscientes.`,
      deepDive: [
        row.description ||
          `Cada etapa desta trilha foi pensada para desacelerar respostas automáticas e iluminar perspectivas que costumam passar despercebidas na rotina.`,
        `Ao iniciar esta sessão na Mentoria ISAAC, seu guia caminha pergunta por pergunta no seu ritmo, preservando total sigilo e conectando suas respostas à memória evolutiva da sua jornada.`,
      ],
      signs: [
        `Você sente que o tema "${row.title}" pede atenção calma e honesta neste momento da sua vida.`,
        'Falta um espaço reservado e livre de críticas externas para organizar o que você pensa e sente.',
        'Você prefere perguntas que despertem sua própria lucidez em vez de conselhos genéricos.',
      ],
      reflectionQuestions:
        parsedQuestions.length > 0
          ? parsedQuestions
          : [
              `O que mais pesa ou chama sua atenção hoje quando você pensa em ${row.title}?`,
              'Qual verdade sobre esse tema você vem adiando encarar com serenidade?',
              'Qual seria um primeiro movimento simples e respeitoso consigo mesmo nesta semana?',
            ],
      faqs: [
        {
          question: `Como funciona a conversa guiada sobre ${row.title} no ISAAC?`,
          answer:
            'Você entra na Mentoria ISAAC, seleciona a trilha ou inicia o diálogo e responde por texto ou áudio no seu próprio ritmo, recebendo acompanhamento personalizado.',
        },
      ],
      guidedId: row.id,
      updatedAt: row.updated_at || null,
    });
  }

  const snapshot = {
    creator: {
      name: creator?.name || 'Edson Manoel',
      title: creator?.title || 'Idealizador & Criador da Mentoria ISAAC',
      bio:
        creator?.bio ||
        'Empreendedor, mentor de clareza e apaixonado pelo potencial humano. Concebeu o Isaac após anos observando como o excesso de ruído diário, a autocobrança desmedida e a solidão nas decisões travam vidas brilhantes.',
      quote: creator?.quote || '',
      imageUrl: creator?.image_url || '',
      instagram: creator?.social_instagram || '',
      linkedin: creator?.social_linkedin || '',
      isVisible: creator?.is_visible !== false,
    },
    campaigns,
    plans,
    topics: [...CORE_TOPICS, ...dynamicTopics],
    generatedAt: new Date().toISOString(),
  };

  return setCached('seo:public_snapshot', snapshot, SEO_CACHE_TTL_MS);
}

// ============================================================================
// ENDPOINTS PÚBLICOS DE API PARA TEMAS (/api/public/topics)
// ============================================================================
export async function handlePublicTopicsList(req, res) {
  try {
    const snapshot = await getSeoPublicSnapshot();
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).json({ topics: snapshot.topics });
  } catch (err) {
    res.status(200).json({ topics: CORE_TOPICS });
  }
}

export async function handlePublicTopicBySlug(req, res) {
  try {
    const slug = slugifyTopic(req.params.slug || '');
    const snapshot = await getSeoPublicSnapshot();
    const topic = snapshot.topics.find((t) => t.slug === slug);
    if (!topic) {
      return res.status(404).json({ error: 'Tema não encontrado.' });
    }
    const related = snapshot.topics.filter((t) => t.slug !== slug).slice(0, 4);
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).json({ topic, related });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar tema.' });
  }
}

// ============================================================================
// 1. /robots.txt (SEO Tradicional + Governança Aberta para Busca/Citação de IA)
// ============================================================================
export function handleRobotsTxt(req, res) {
  const baseUrl = getCanonicalBaseUrl();
  const lines = [
    '# Mentoria ISAAC — Diretrizes de Indexação Web & Motores Generativos (GEO/AEO)',
    'User-agent: *',
    'Allow: /',
    'Allow: /inscricao',
    'Allow: /cadastro/',
    'Allow: /temas/',
    'Allow: /llms.txt',
    'Allow: /llms-full.txt',
    'Disallow: /api/',
    'Disallow: /admin',
    'Disallow: /*?token_hash=*',
    'Disallow: /*?mode=reset-password*',
    '',
    '# Crawlers de Busca e Recomendação por IA (ChatGPT Search, Perplexity, Claude, Gemini, Apple)',
    'User-agent: OAI-SearchBot',
    'Allow: /',
    'Disallow: /api/',
    '',
    'User-agent: ChatGPT-User',
    'Allow: /',
    'Disallow: /api/',
    '',
    'User-agent: GPTBot',
    'Allow: /',
    'Disallow: /api/',
    '',
    'User-agent: PerplexityBot',
    'Allow: /',
    'Disallow: /api/',
    '',
    'User-agent: Perplexity-User',
    'Allow: /',
    'Disallow: /api/',
    '',
    'User-agent: ClaudeBot',
    'Allow: /',
    'Disallow: /api/',
    '',
    'User-agent: Claude-SearchBot',
    'Allow: /',
    'Disallow: /api/',
    '',
    'User-agent: Claude-Web',
    'Allow: /',
    'Disallow: /api/',
    '',
    'User-agent: Google-Extended',
    'Allow: /',
    'Disallow: /api/',
    '',
    'User-agent: Applebot-Extended',
    'Allow: /',
    'Disallow: /api/',
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`,
    `# Índice semântico estruturado para LLMs: ${baseUrl}/llms.txt`,
    '',
  ];

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(lines.join('\n'));
}

// ============================================================================
// 2. /sitemap.xml Dinâmico (Home + Inscrição + Temas + Campanhas PDF Ativas)
// ============================================================================
export async function handleSitemapXml(req, res) {
  const baseUrl = getCanonicalBaseUrl();
  const snapshot = await getSeoPublicSnapshot();
  const today = new Date().toISOString().split('T')[0];

  const urls = [
    { loc: `${baseUrl}/`, lastmod: today, changefreq: 'weekly', priority: '1.0' },
    { loc: `${baseUrl}/inscricao`, lastmod: today, changefreq: 'monthly', priority: '0.8' },
  ];

  for (const topic of snapshot.topics) {
    const lastmod = topic.updatedAt ? String(topic.updatedAt).split('T')[0] : today;
    urls.push({
      loc: `${baseUrl}/temas/${encodeURIComponent(topic.slug)}`,
      lastmod,
      changefreq: 'weekly',
      priority: '0.85',
    });
  }

  for (const camp of snapshot.campaigns) {
    if (!camp.slug) continue;
    const lastmod = (camp.updated_at || camp.created_at || today).toString().split('T')[0];
    urls.push({
      loc: `${baseUrl}/cadastro/${encodeURIComponent(camp.slug)}`,
      lastmod,
      changefreq: 'weekly',
      priority: '0.80',
    });
  }

  const xmlItems = urls
    .map(
      (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${escapeXml(u.lastmod)}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlItems}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=1800');
  res.status(200).send(xml);
}

// ============================================================================
// 3. /llms.txt e /llms-full.txt (Especificação llmstxt.org para IAs Generativas)
// ============================================================================
export async function handleLlmsTxt(req, res) {
  const baseUrl = getCanonicalBaseUrl();
  const snapshot = await getSeoPublicSnapshot();

  const topicLinks = snapshot.topics
    .map((t) => `- [${t.title}](${baseUrl}/temas/${t.slug}): ${t.summary}`)
    .join('\n');

  const campaignLinks =
    snapshot.campaigns.length > 0
      ? snapshot.campaigns
          .filter((c) => c.slug)
          .map(
            (c) =>
              `- [${c.title}](${baseUrl}/cadastro/${c.slug}): ${
                c.subtitle || 'Material gratuito em PDF e acesso direto à Mentoria ISAAC.'
              }`
          )
          .join('\n')
      : `- [Cadastro e Acesso à Mentoria ISAAC](${baseUrl}/cadastro): Crie sua conta e receba nossos materiais de clareza.`;

  const md = `# Mentoria ISAAC — Clareza, Escuta Profunda & Transformação

> A Mentoria ISAAC (${baseUrl}) é uma plataforma brasileira confidencial de mentoria reflexiva, escuta ativa sem julgamento, memória evolutiva contínua e autodesenvolvimento emocional por texto e voz, idealizada por ${snapshot.creator.name} e disponível 24 horas por dia em português (pt-BR).

A plataforma ajuda adultos, líderes, empreendedores e profissionais a desatar nós mentais, superar bloqueios de indecisão, esgotamento (burnout), autossabotagem e transições difíceis por meio de perguntas socráticas cuidadosas, Trilhas de Conversas Direcionadas, frequências sonoras terapêuticas em 432Hz e o exclusivo **Laboratório do Incômodo Criativo**.

## Páginas Principais & Documentação para IA
- [Página Inicial — Mentoria ISAAC](${baseUrl}/): Visão completa da metodologia, pilares de escuta, garantias de sigilo absoluto e perguntas frequentes.
- [Guia Completo para LLMs e Motores de Resposta](${baseUrl}/llms-full.txt): Documentação integral da metodologia, trilhas temáticas, ética, privacidade LGPD e FAQ detalhado.
- [Inscrição Oficial na Mentoria](${baseUrl}/inscricao): Ficha rápida de inscrição para novos participantes.

## Trilhas de Clareza & Especialidades Temáticas
${topicLinks}

## Materiais Gratuitos & Guias em PDF
${campaignLinks}

## Princípios Éticos, Privacidade & Escopo
- **Sigilo Absoluto & LGPD:** Sessões isoladas individualmente com criptografia em trânsito e controle estrito de acesso; dados pessoais e desabafos nunca são comercializados.
- **Escopo Educativo e Reflexivo:** A Mentoria ISAAC atua em desenvolvimento humano, clareza emocional e tomada de decisão; não realiza diagnósticos médicos nem substitui psicoterapia clínica ou serviços de emergência em saúde mental (como o CVV — ligue 188 no Brasil).
- **Idealizador:** ${snapshot.creator.name} (${snapshot.creator.title}) — Suporte institucional: suporte@lynxems.com.br
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=1800');
  res.status(200).send(md);
}

export async function handleLlmsFullTxt(req, res) {
  const baseUrl = getCanonicalBaseUrl();
  const snapshot = await getSeoPublicSnapshot();

  const topicsDetailed = snapshot.topics
    .map(
      (t) => `### ${t.title}
- **URL Canônica:** ${baseUrl}/temas/${t.slug}
- **Categoria:** ${t.category}
- **Síntese Direta:** ${t.directAnswer}
- **Aprofundamento:** ${t.deepDive.join(' ')}
- **Quando buscar esta trilha:** ${t.signs.join('; ')}
- **Perguntas de Reflexão:** ${t.reflectionQuestions.map((q, i) => `(${i + 1}) ${q}`).join(' ')}`
    )
    .join('\n\n');

  const plansSection =
    snapshot.plans.length > 0
      ? snapshot.plans
          .map(
            (p) =>
              `- **${p.name}** (R$ ${Number(p.price || 0).toFixed(2).replace('.', ',')} / ${
                p.billing_cycle === 'yearly' ? 'ano' : 'mês'
              }): ${p.description || 'Acesso completo à Mentoria ISAAC.'}`
          )
          .join('\n')
      : '- Acesso mediante cadastro direto na plataforma oficial.';

  const faqSection = HOME_FAQS.map((f) => `### ${f.question}\n${f.answer}`).join('\n\n');

  const fullMd = `# Mentoria ISAAC — Documentação Integral de Referência (GEO / AEO / LLMO)

> Documento canônico de referência estruturada sobre a **Mentoria ISAAC** (${baseUrl}), destinado a mecanismos de busca generativa, assistentes de IA e sistemas RAG.

## 1. Definição Canônica
A **Mentoria ISAAC** é um santuário digital de clareza mental, escuta ativa sem julgamentos e autodesenvolvimento contínuo em língua portuguesa. Concebida por **${snapshot.creator.name}** (${snapshot.creator.title}), a plataforma combina inteligência conversacional orientada por princípios socráticos, memória de longo prazo individualizada, interação multimodal (texto e voz natural), ambiência sonora terapêutica (432Hz, chuva serena, lareira, tigelas tibetanas) e o **Laboratório do Incômodo Criativo**.

## 2. Para Quem a Mentoria ISAAC é Recomendada
1. Pessoas que enfrentam **paralisia por análise, indecisão ou excesso de ruído mental** diante de escolhas pessoais ou profissionais.
2. Profissionais, líderes e empreendedores que lidam com **solidão nas decisões, esgotamento emocional (burnout) ou síndrome do impostor**.
3. Pessoas atravessando **transições de vida, términos, lutos simbólicos ou recomeços** que precisam desabafar em qualquer horário (inclusive de madrugada) sem medo de críticas ou conselhos rasos.
4. Quem deseja construir **hábitos conscientes, maturidade financeira comportamental e autodomínio** com acompanhamento constante.

## 3. Pilares Metodológicos Exclusivos
- **Escuta Profunda e Zero Julgamento:** Sem palestras moralistas, rótulos ou algoritmos de rede social. O foco é iluminar as próprias conclusões do participante.
- **Memória Contínua de Evolução:** Diferente de chats efêmeros, o Isaac preserva os marcos, aprendizados e pontos de hesitação recorrentes de cada pessoa em cofre individual isolado.
- **Laboratório do Incômodo Criativo:** Espaço prático onde inquietações recorrentes são catalogadas e convertidas em clareza de causa-raiz e passos concretos.
- **Trilhas de Conversas Direcionadas:** Roteiros reflexivos guiados passo a passo para temas específicos da vida adulta.
- **Harmonia Sensorial & Voz:** Possibilidade de falar por áudio, ouvir respostas em voz calma e utilizar frequências sonoras para desacelerar a ansiedade durante a sessão.

## 4. Sobre o Idealizador (E-E-A-T)
- **Nome:** ${snapshot.creator.name}
- **Atuação:** ${snapshot.creator.title}
- **Biografia:** ${snapshot.creator.bio}

## 5. Guia Completo das Trilhas Temáticas Públicas
${topicsDetailed}

## 6. Planos e Formas de Acesso
- **Página Oficial:** ${baseUrl}/
- **Inscrição Rápida:** ${baseUrl}/inscricao
${plansSection}

## 7. Perguntas Frequentes Oficiais (FAQ)
${faqSection}
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=1800');
  res.status(200).send(fullMd);
}

// ============================================================================
// 4. INJEÇÃO SERVER-SIDE DINÂMICA DE META TAGS, JSON-LD & SHELL SEMÂNTICO
// ============================================================================
let cachedHtmlTemplate = null;
let cachedHtmlMtimeMs = 0;

function loadIndexHtmlTemplate(distPath) {
  const indexPath = path.join(distPath, 'index.html');
  const stat = fs.statSync(indexPath);
  if (!cachedHtmlTemplate || stat.mtimeMs !== cachedHtmlMtimeMs) {
    cachedHtmlTemplate = fs.readFileSync(indexPath, 'utf8');
    cachedHtmlMtimeMs = stat.mtimeMs;
  }
  return cachedHtmlTemplate;
}

function buildCreatorSameAs(creator) {
  const links = [];
  if (creator.instagram) {
    links.push(
      creator.instagram.startsWith('http')
        ? creator.instagram
        : `https://instagram.com/${creator.instagram.replace(/^@/, '')}`
    );
  }
  if (creator.linkedin) {
    links.push(
      creator.linkedin.startsWith('http')
        ? creator.linkedin
        : `https://linkedin.com/in/${creator.linkedin}`
    );
  }
  return links;
}

function buildHomeShellHtml(baseUrl, snapshot) {
  const topicsHtml = snapshot.topics
    .map(
      (t) =>
        `<li><a href="${baseUrl}/temas/${escapeHtml(t.slug)}"><strong>${escapeHtml(
          t.shortTitle
        )}:</strong> ${escapeHtml(t.summary)}</a></li>`
    )
    .join('');

  const campaignsHtml = snapshot.campaigns
    .filter((c) => c.slug)
    .map(
      (c) =>
        `<li><a href="${baseUrl}/cadastro/${escapeHtml(c.slug)}">${escapeHtml(c.title)} — ${escapeHtml(
          c.subtitle || 'Guia prático gratuito'
        )}</a></li>`
    )
    .join('');

  const faqHtml = HOME_FAQS.map(
    (f) => `<dt>${escapeHtml(f.question)}</dt><dd>${escapeHtml(f.answer)}</dd>`
  ).join('');

  return `<main data-seo-prerender="home" class="max-w-4xl mx-auto px-6 py-16 font-serif">
    <article>
      <header>
        <p>Mentoria de Clareza &amp; Desenvolvimento Pessoal • Espaço Seguro 24h</p>
        <h1>Desate os nós da sua mente. Cure a hesitação. Reencontre sua paz e direção com a Mentoria ISAAC.</h1>
        <p>Conheça <strong>Isaac</strong>: um mentor digital de presença calma, escuta profunda sem julgamentos e memória contínua, idealizado por <strong>${escapeHtml(
          snapshot.creator.name
        )}</strong> para ajudar você a compreender bloqueios emocionais, superar a autossabotagem e tomar decisões conscientes por texto ou áudio.</p>
      </header>
      <section>
        <h2>Por que a Mentoria ISAAC é diferente</h2>
        <ul>
          <li><strong>Escuta Profunda &amp; Zero Julgamento:</strong> Expresse angústias, dilemas profissionais e dúvidas íntimas com 100% de sigilo e proteção criptografada (LGPD).</li>
          <li><strong>Memória Contínua de Evolução:</strong> O Isaac conecta aprendizados anteriores aos desafios de hoje sem que você precise recomeçar sua história do zero.</li>
          <li><strong>Laboratório do Incômodo Criativo:</strong> Método exclusivo para transformar inquietações recorrentes em clareza de causa-raiz e ação prática.</li>
          <li><strong>Frequências Terapêuticas em 432Hz &amp; Voz Serena:</strong> Converse digitando ou gravando áudios no seu ritmo, inclusive de madrugada.</li>
        </ul>
      </section>
      <section>
        <h2>Sobre o Idealizador — ${escapeHtml(snapshot.creator.name)}</h2>
        <p>${escapeHtml(snapshot.creator.bio)}</p>
      </section>
      <section>
        <h2>Trilhas de Clareza &amp; Temas de Mentoria</h2>
        <ul>${topicsHtml}</ul>
      </section>
      ${
        campaignsHtml
          ? `<section><h2>Materiais &amp; Guias Gratuitos</h2><ul>${campaignsHtml}</ul></section>`
          : ''
      }
      <section>
        <h2>Perguntas Frequentes sobre a Mentoria ISAAC</h2>
        <dl>${faqHtml}</dl>
      </section>
      <nav aria-label="Links institucionais">
        <a href="${baseUrl}/inscricao">Inscrição Oficial na Mentoria ISAAC</a> |
        <a href="${baseUrl}/llms.txt">Índice para IA (llms.txt)</a>
      </nav>
    </article>
  </main>`;
}

function buildTopicShellHtml(baseUrl, topic, snapshot) {
  const paragraphs = topic.deepDive.map((p) => `<p>${escapeHtml(p)}</p>`).join('');
  const signs = topic.signs.map((s) => `<li>${escapeHtml(s)}</li>`).join('');
  const questions = topic.reflectionQuestions.map((q) => `<li>${escapeHtml(q)}</li>`).join('');
  const related = snapshot.topics
    .filter((t) => t.slug !== topic.slug)
    .slice(0, 4)
    .map(
      (r) =>
        `<li><a href="${baseUrl}/temas/${escapeHtml(r.slug)}">${escapeHtml(r.title)}</a></li>`
    )
    .join('');

  return `<main data-seo-prerender="topic" class="max-w-4xl mx-auto px-6 py-16 font-serif">
    <nav aria-label="Breadcrumb"><a href="${baseUrl}/">Mentoria ISAAC</a> &rsaquo; <span>${escapeHtml(
    topic.category
  )}</span></nav>
    <article>
      <h1>${escapeHtml(topic.title)}</h1>
      <p><strong>Resumo direto:</strong> ${escapeHtml(topic.directAnswer)}</p>
      <section>
        <h2>Compreendendo este momento em profundidade</h2>
        ${paragraphs}
      </section>
      <section>
        <h2>Sinais de que este tema pede escuta atenta</h2>
        <ul>${signs}</ul>
      </section>
      <section>
        <h2>Perguntas de clareza para iniciar sua reflexão com o Isaac</h2>
        <ol>${questions}</ol>
      </section>
      <section>
        <h2>Outras Trilhas de Clareza da Mentoria ISAAC</h2>
        <ul>${related}</ul>
      </section>
      <p><a href="${baseUrl}/">Iniciar conversa confidencial com Isaac agora</a> | <a href="${baseUrl}/inscricao">Fazer inscrição</a></p>
    </article>
  </main>`;
}

export async function serveSeoHtml(req, res, distPath) {
  const template = loadIndexHtmlTemplate(distPath);
  const baseUrl = getCanonicalBaseUrl();
  const snapshot = await getSeoPublicSnapshot();
  const pathname = (req.path || '/').replace(/\/+$/, '') || '/';

  const hasSensitiveToken =
    Boolean(req.query?.token_hash) ||
    req.query?.mode === 'reset-password' ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/');

  const ogImageUrl = `${baseUrl}/og-isaac-cover.jpg`;
  const creatorSameAs = buildCreatorSameAs(snapshot.creator);

  let statusCode = 200;
  let robotsDirective = hasSensitiveToken
    ? 'noindex, nofollow, noarchive'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  let pageTitle = 'Mentoria ISAAC — Clareza Emocional, Escuta Profunda & Transformação 24h';
  let pageDescription =
    'Desate os nós da sua mente e reencontre paz e direção. Espaço 100% sigiloso de mentoria reflexiva por texto e voz, memória contínua e clareza emocional idealizado por Edson Manoel.';
  let canonicalUrl = `${baseUrl}/`;
  let ogType = 'website';
  let shellHtml = '';
  let jsonLdGraph = [];

  const orgEntity = {
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: 'Mentoria ISAAC',
    alternateName: 'ISAAC — Espaço de Clareza e Escuta',
    url: `${baseUrl}/`,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/favicon.svg`,
    },
    image: ogImageUrl,
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'suporte@lynxems.com.br',
      contactType: 'customer support',
      availableLanguage: ['Portuguese'],
    },
    founder: { '@id': `${baseUrl}/#creator` },
  };

  const creatorEntity = {
    '@type': 'Person',
    '@id': `${baseUrl}/#creator`,
    name: snapshot.creator.name,
    jobTitle: snapshot.creator.title,
    description: snapshot.creator.bio,
    ...(snapshot.creator.imageUrl ? { image: snapshot.creator.imageUrl } : {}),
    ...(creatorSameAs.length > 0 ? { sameAs: creatorSameAs } : {}),
    worksFor: { '@id': `${baseUrl}/#organization` },
  };

  const websiteEntity = {
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    url: `${baseUrl}/`,
    name: 'Mentoria ISAAC',
    inLanguage: 'pt-BR',
    publisher: { '@id': `${baseUrl}/#organization` },
  };

  // ROTA 1: HOME (/)
  if (pathname === '/') {
    const offers =
      snapshot.plans.length > 0
        ? snapshot.plans.map((p) => ({
            '@type': 'Offer',
            name: p.name,
            price: Number(p.price || 0).toFixed(2),
            priceCurrency: 'BRL',
            availability: 'https://schema.org/InStock',
            url: `${baseUrl}/`,
          }))
        : undefined;

    jsonLdGraph = [
      orgEntity,
      creatorEntity,
      websiteEntity,
      {
        '@type': 'WebApplication',
        '@id': `${baseUrl}/#webapp`,
        name: 'Mentoria ISAAC',
        url: `${baseUrl}/`,
        applicationCategory: 'LifestyleApplication',
        operatingSystem: 'Web, iOS, Android',
        inLanguage: 'pt-BR',
        description: pageDescription,
        image: ogImageUrl,
        creator: { '@id': `${baseUrl}/#creator` },
        featureList: [
          'Escuta profunda sem julgamentos 24 horas por dia',
          'Memória evolutiva contínua e sigilosa',
          'Interação por texto e gravação de áudio com resposta por voz',
          'Laboratório do Incômodo Criativo',
          'Trilhas de Conversas Direcionadas',
          'Frequências sonoras terapêuticas em 432Hz',
        ],
        ...(offers ? { offers } : {}),
      },
      {
        '@type': 'FAQPage',
        '@id': `${baseUrl}/#faq`,
        mainEntity: HOME_FAQS.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.answer,
          },
        })),
      },
    ];
    shellHtml = buildHomeShellHtml(baseUrl, snapshot);
  }
  // ROTA 2: INSCRIÇÃO (/inscricao)
  else if (/^\/inscricao$/i.test(pathname)) {
    pageTitle = 'Inscrição Oficial — Mentoria ISAAC | Inicie Sua Jornada de Clareza';
    pageDescription =
      'Realize sua inscrição rápida na Mentoria ISAAC e garanta acesso ao espaço seguro de escuta atenta, organização emocional e evolução pessoal.';
    canonicalUrl = `${baseUrl}/inscricao`;
    jsonLdGraph = [
      orgEntity,
      websiteEntity,
      {
        '@type': 'WebPage',
        '@id': `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: pageTitle,
        description: pageDescription,
        inLanguage: 'pt-BR',
        isPartOf: { '@id': `${baseUrl}/#website` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Mentoria ISAAC', item: `${baseUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'Inscrição Oficial', item: canonicalUrl },
        ],
      },
    ];
    shellHtml = `<main data-seo-prerender="inscricao" class="max-w-2xl mx-auto px-6 py-16 font-serif">
      <h1>Inscrição Oficial — Mentoria ISAAC</h1>
      <p>${escapeHtml(pageDescription)}</p>
      <p><a href="${baseUrl}/">Conhecer todos os pilares da Mentoria ISAAC</a></p>
    </main>`;
  }
  // ROTA 3: CAMPANHAS DE CADASTRO E MATERIAIS PDF (/cadastro, /cadastro/:slug, /c/:slug)
  else if (/^\/(?:cadastro|c)(?:\/([^/?#]+))?$/i.test(pathname)) {
    const match = pathname.match(/^\/(?:cadastro|c)(?:\/([^/?#]+))?$/i);
    const rawSlug = slugifyTopic(decodeURIComponent(match?.[1] || ''));
    const campaign =
      (rawSlug && snapshot.campaigns.find((c) => c.slug === rawSlug)) ||
      snapshot.campaigns.find((c) => c.is_default) ||
      null;

    if (campaign) {
      pageTitle = `${campaign.title} | Material Gratuito & Acesso — Mentoria ISAAC`;
      pageDescription =
        campaign.subtitle ||
        `Cadastre-se gratuitamente para receber "${campaign.title}" no seu e-mail e acessar seu espaço confidencial na Mentoria ISAAC.`;
      canonicalUrl = campaign.slug
        ? `${baseUrl}/cadastro/${encodeURIComponent(campaign.slug)}`
        : `${baseUrl}/cadastro`;
    } else {
      pageTitle = 'Criar Conta Gratuita — Mentoria ISAAC | Espaço de Clareza & Escuta';
      pageDescription =
        'Crie seu acesso confidencial à Mentoria ISAAC para conversar por texto ou áudio com memória contínua e receber nossos guias de clareza.';
      canonicalUrl = `${baseUrl}/cadastro`;
    }

    jsonLdGraph = [
      orgEntity,
      websiteEntity,
      {
        '@type': 'LearningResource',
        name: campaign?.title || 'Guia de Clareza Emocional — Mentoria ISAAC',
        description: pageDescription,
        url: canonicalUrl,
        inLanguage: 'pt-BR',
        isAccessibleForFree: true,
        provider: { '@id': `${baseUrl}/#organization` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Mentoria ISAAC', item: `${baseUrl}/` },
          {
            '@type': 'ListItem',
            position: 2,
            name: campaign?.title || 'Cadastro',
            item: canonicalUrl,
          },
        ],
      },
    ];

    shellHtml = `<main data-seo-prerender="cadastro" class="max-w-2xl mx-auto px-6 py-16 font-serif">
      <h1>${escapeHtml(campaign?.title || 'Acesso à Mentoria ISAAC')}</h1>
      <p>${escapeHtml(pageDescription)}</p>
      <p><a href="${baseUrl}/">Voltar à página principal da Mentoria ISAAC</a></p>
    </main>`;
  }
  // ROTA 4: CLUSTERS TEMÁTICOS (/temas/:slug)
  else if (/^\/temas\/([^/?#]+)$/i.test(pathname)) {
    const match = pathname.match(/^\/temas\/([^/?#]+)$/i);
    const topicSlug = slugifyTopic(decodeURIComponent(match?.[1] || ''));
    const topic = snapshot.topics.find((t) => t.slug === topicSlug);

    if (topic) {
      pageTitle = `${topic.title} | Mentoria ISAAC`;
      pageDescription = topic.summary;
      canonicalUrl = `${baseUrl}/temas/${encodeURIComponent(topic.slug)}`;
      ogType = 'article';

      jsonLdGraph = [
        orgEntity,
        creatorEntity,
        websiteEntity,
        {
          '@type': 'Article',
          '@id': `${canonicalUrl}#article`,
          headline: topic.title,
          description: topic.summary,
          url: canonicalUrl,
          inLanguage: 'pt-BR',
          image: ogImageUrl,
          author: { '@id': `${baseUrl}/#creator` },
          publisher: { '@id': `${baseUrl}/#organization` },
          mainEntityOfPage: canonicalUrl,
          articleSection: topic.category,
        },
        ...(topic.faqs?.length
          ? [
              {
                '@type': 'FAQPage',
                mainEntity: topic.faqs.map((f) => ({
                  '@type': 'Question',
                  name: f.question,
                  acceptedAnswer: { '@type': 'Answer', text: f.answer },
                })),
              },
            ]
          : []),
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Mentoria ISAAC', item: `${baseUrl}/` },
            { '@type': 'ListItem', position: 2, name: topic.shortTitle, item: canonicalUrl },
          ],
        },
      ];

      shellHtml = buildTopicShellHtml(baseUrl, topic, snapshot);
    } else {
      statusCode = 404;
      robotsDirective = 'noindex, nofollow';
      pageTitle = 'Tema não encontrado — Mentoria ISAAC';
    }
  }
  // ROTA 5: QUALQUER OUTRA URL INEXISTENTE -> HTTP 404 REAL (FIM DO SOFT-404)
  else {
    statusCode = 404;
    robotsDirective = 'noindex, nofollow';
    pageTitle = 'Página não encontrada — Mentoria ISAAC';
    shellHtml = `<main data-seo-prerender="404" class="max-w-xl mx-auto px-6 py-16 font-serif">
      <h1>Página não encontrada</h1>
      <p>O caminho acessado não existe. Retorne ao espaço principal da <a href="${baseUrl}/">Mentoria ISAAC</a>.</p>
    </main>`;
  }

  const headBlock = `
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeHtml(pageDescription)}" />
    <meta name="robots" content="${escapeHtml(robotsDirective)}" />
    <meta name="author" content="${escapeHtml(snapshot.creator.name)} — Mentoria ISAAC" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <link rel="alternate" hreflang="pt-BR" href="${escapeHtml(canonicalUrl)}" />
    <link rel="alternate" hreflang="x-default" href="${escapeHtml(canonicalUrl)}" />

    <!-- Open Graph / WhatsApp / Instagram / LinkedIn -->
    <meta property="og:locale" content="pt_BR" />
    <meta property="og:type" content="${escapeHtml(ogType)}" />
    <meta property="og:site_name" content="Mentoria ISAAC" />
    <meta property="og:title" content="${escapeHtml(pageTitle)}" />
    <meta property="og:description" content="${escapeHtml(pageDescription)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:image" content="${escapeHtml(ogImageUrl)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(ogImageUrl)}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Mentoria ISAAC — Espaço Seguro de Clareza, Escuta Profunda e Transformação" />

    <!-- Twitter / X Cards -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(pageDescription)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />
    ${
      jsonLdGraph.length > 0
        ? `<script type="application/ld+json">${safeJsonLd({
            '@context': 'https://schema.org',
            '@graph': jsonLdGraph,
          })}</script>`
        : ''
    }`;

  let finalHtml = template;
  if (finalHtml.includes('<!-- SEO_HEAD_START -->') && finalHtml.includes('<!-- SEO_HEAD_END -->')) {
    finalHtml = finalHtml.replace(
      /<!-- SEO_HEAD_START -->[\s\S]*?<!-- SEO_HEAD_END -->/,
      `<!-- SEO_HEAD_START -->${headBlock}\n    <!-- SEO_HEAD_END -->`
    );
  } else {
    finalHtml = finalHtml.replace(/<title>[\s\S]*?<\/title>/i, headBlock);
  }

  if (shellHtml && finalHtml.includes('<!-- SEO_ROOT_SHELL -->')) {
    finalHtml = finalHtml.replace('<!-- SEO_ROOT_SHELL -->', shellHtml);
  }

  if (hasSensitiveToken || statusCode === 404) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.status(statusCode).send(finalHtml);
}
