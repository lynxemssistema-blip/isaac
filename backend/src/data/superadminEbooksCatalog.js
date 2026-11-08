/**
 * ACERVO EDITORIAL EXCLUSIVO SUPERADMIN — COLEÇÃO ISAAC® ESSENTIAL
 * Mapeado integralmente a partir do Mapa Mental Oficial no Trello:
 * https://trello.com/b/squXZ3Yq/isaac-essential-mind-map
 * (10 Listas Abertas • 49 Cartões • 83 Checklists • 81 Notas Autorais)
 */

import { AUTHOR_PROFILE, COLLECTION_META_EN, EBOOKS_EN_GB } from './ebooksBritishEnglish.js';
import { VOLUME_VISUAL_SPEC, CHAPTER_DEEP_ENRICHMENT } from './ebooksDeepEnrichment.js';

export { AUTHOR_PROFILE, COLLECTION_META_EN };

export const EBOOK_STORE_PRICING = {
  individualPrice: 19.90,
  bundleDiscountPercent: 30,
  fullRetailTotal: Number((19.90 * 8).toFixed(2)), // 159.20
  bundlePrice: Number((19.90 * 8 * 0.70).toFixed(2)), // 111.44 (30% OFF exato)
  bundleSavings: Number((19.90 * 8 * 0.30).toFixed(2)), // 47.76
  currency: 'BRL',
};

export const EBOOK_COLLECTION_META = {
  collectionTitle: 'Coleção ISAAC® Essential — Clareza, Liderança & Negócios com Propósito',
  collectionSubtitle:
    '8 eBooks Bilíngues (Português + Inglês Britânico no mesmo PDF) por Thiago Prata — explicações detalhadas, ilustrações, ferramentas práticas e linhas de anotações.',
  sourceBoardName: 'ISAAC - Essential (Mind Map)',
  sourceBoardUrl: 'https://trello.com/b/squXZ3Yq/isaac-essential-mind-map',
  acronymMeaning: 'Inovação • Sustentabilidade • Amor • Atitude • Conhecimento',
  communityVision:
    'CISCO — Comunidades Inteligentes, Sustentáveis, Colaborativas e Otimizadas ("Fazer do bem um bom negócio" / "A liberdade de ser você!")',
  author: AUTHOR_PROFILE,
  pricing: EBOOK_STORE_PRICING,
  commercialStrategy: {
    individualTicketRange: 'R$ 19,90 por volume avulso (Edição Bilíngue PT-BR + EN-GB)',
    trilogyTicketRange: 'Monte seu carrinho livremente na página principal do App',
    fullPassTicketRange: 'R$ 111,44 com 30% OFF (de R$ 159,20) — Arquivo Único em PDF com todos os 8 eBooks Bilíngues',
    upsellBridge:
      'Cada eBook atua como porta de entrada acessível que entrega clareza imediata e prepara o leitor para a Mentoria ISAAC® com Thiago Prata.',
  },
};

export const SUPERADMIN_EBOOKS = [
  // =========================================================================
  // VOLUME 01 — FUNDAMENTOS & NOSSA LEI
  // =========================================================================
  {
    id: 'vol-01',
    volumeNumber: 1,
    slug: 'fundamentos-nossa-lei',
    segmentBadge: '0. Fundamentos & Nossa LEI',
    accentColor: 'teal',
    title: 'O Despertar da Clareza: Nossa LEI, Projeto de Vida & Comunidades Inteligentes',
    subtitle:
      'Como sair do piloto automático, alinhar seus 6 horizontes de planejamento e priorizar o que realmente transforma sua realidade.',
    trelloSources: [
      'Gestão Geral: #26 Fundamentos Gerais - Nossa LEI, #55 Mapa Mental, #66 Missão do ISAAC',
      '0. FUNDAMENTOS: #62 Alinhamento Inicial, #70 Roda ISAAC, #45 Introdução, #19 Planos, #22 Comunidade, #58 Evolução, #65 Matriz GUT',
    ],
    readingTimeMin: 28,
    suggestedPrice: 'R$ 37,00',
    salesKit: {
      targetAudience:
        'Profissionais, autônomos e empreendedores que sentem ter potencial, mas vivem dispersos entre urgências sem um plano claro de vida e carreira.',
      corePain:
        'Trabalhar muito sem direção de longo prazo, acumular tarefas sem saber o que priorizar e carregar crenças confusas sobre dinheiro e propósito.',
      transformationPromise:
        'Construir um diagnóstico fiel do momento atual (Roda ISAAC), estruturar metas de 4 semanas até 10 anos e dominar a Matriz GUT para decidir com precisão em minutos.',
      headline:
        'Pare de correr em círculos: descubra o método prático para zerar o caos mental e transformar propósito em plano de ação.',
      whatsappCopy:
        'Você sente que trabalha o dia inteiro, mas continua distante da vida que realmente gostaria de construir? No eBook *"O Despertar da Clareza: Nossa LEI & Projeto de Vida"*, você recebe de forma direta e sem rodeios a Roda de Diagnóstico ISAAC, os 6 Níveis de Planejamento (de 4 semanas a 10 anos) e a Matriz GUT prática para saber exatamente onde colocar sua energia hoje.',
      deliverables: [
        'Guia completo e direto dos 5 valores ISAAC® e da tríade LEI (Liderança, Estratégia e Inovação)',
        'Autoavaliação Roda ISAAC (Tangível vs. Intangível de 1 a 10)',
        'Arquitetura dos 6 Planos (Vida, Diretor, Estratégico, Tático, Operacional e Ação)',
        'Calculadora prática da Matriz GUT com régua oficial de 1 a 5',
      ],
    },
    executiveSummary:
      'Toda construção sólida começa limpando o terreno. Este primeiro volume traduz a espinha dorsal da Metodologia ISAAC®: como alinhar quem você é (Ser), como você executa (Fazer) e o que você constrói (Ter) dentro de uma visão que conecta o indivíduo, os negócios e a comunidade.',
    chapters: [
      {
        number: 1,
        title: 'A Essência ISAAC® e a Nossa LEI (Liderança, Estratégia e Inovação)',
        coreExplanation:
          'ISAAC® é o acrônimo de Inovação, Sustentabilidade, Amor, Atitude e Conhecimento. Nascido originalmente da escuta genuína de pessoas, o método parte de uma premissa simples: fazer do bem um bom negócio. Para que boas intenções não morram na teoria, toda evolução se apoia em Nossa LEI — Liderança (servir e dar direção pelo exemplo), Estratégia (unir um Objetivo claro + um Caminho estruturado + uma Abordagem humana) e Inovação ("nascer de novo", isto é, renovar continuamente o que já não atende o presente).',
        clarityKey:
          'Estratégia sem liderança vira papel frio; liderança sem estratégia vira entusiasmo sem destino; e ambos sem inovação envelhecem rápido.',
        frameworkTitle: 'A Tríade Operacional da Nossa LEI',
        frameworkItems: [
          'Liderança Servidora: Governar a si mesmo primeiro para inspirar autonomia, nunca dependência.',
          'Estratégia em 3 Pontas: (1) Objetivo claro, (2) Caminho/processo definido e (3) Abordagem coerente.',
          'Inovação Contínua: Desapegar do "sempre foi assim" para aperfeiçoar entregas a cada ciclo.',
          'Visão CISCO: Construir Comunidades Inteligentes, Sustentáveis, Colaborativas e Otimizadas.',
        ],
        practicalExercise:
          'Escreva em uma frase: (1) Qual objetivo você persegue hoje? (2) Qual é o caminho prático até ele? (3) Qual atitude diária mostra que você lidera a si mesmo nesse processo?',
      },
      {
        number: 2,
        title: 'Vamos Zerar as Coisas: O Ponto Neutro e a Roda ISAAC',
        coreExplanation:
          'Antes de acelerar, é preciso "zerar as coisas" — não no sentido de apagar sua história, mas de encontrar o ponto neutro de equilíbrio, sem euforia ilusória e sem autossabotagem. A Roda ISAAC faz essa fotografia avaliando 6 módulos fundamentais da vida e do negócio em duas metades complementares: a face Tangível (objetiva, mensurável em números) e a face Intangível (subjetiva, percebida em sentido, energia e confiança).',
        clarityKey:
          'Uma roda com pontas nota 10 e outras nota 2 não gira: ela trepida. Evoluir com consistência exige enxergar os desníveis antes de pisar no acelerador.',
        frameworkTitle: 'Diagnóstico Radar ISAAC (Escala de 1 a 10)',
        frameworkItems: [
          'Core (Identidade & Entrega): Clareza de propósito (intangível) + portfólio real funcionando (tangível).',
          'Recursos (Tempo, Finanças, Pessoas, Materiais): Paz mental no ritmo (intangível) + caixa positivo (tangível).',
          'Mercado (Público & Vendas): Reputação e confiança (intangível) + conversões previsíveis (tangível).',
          'Logística (Entrega & Processos): Satisfação do cliente (intangível) + operação organizada (tangível).',
          'Aprendizado (CHACRAS & SINA): Abertura para evoluir (intangível) + competências aplicadas (tangível).',
          'Alinhamento (Negócio & Cultura): Coerência entre propósito, rotina diária e resultado financeiro.',
        ],
        practicalExercise:
          'Dê uma nota sincera de 1 a 10 para cada um dos 6 eixos acima hoje. Circule os 2 menores números: eles mostram exatamente onde está o freio invisível do seu crescimento.',
      },
      {
        number: 3,
        title: 'Os 6 Horizontes de Planejamento: Do Legado de Vida às Próximas 4 Semanas',
        coreExplanation:
          'Quem não tem um propósito claro acaba alugando a própria vida para cumprir o propósito de outra pessoa. Mas um sonho de longo prazo só fica de pé quando é quebrado em degraus temporais que conversam entre si — exatamente como cidades bem planejadas e empresas sólidas fazem.',
        clarityKey:
          'O longo prazo dá sentido ao esforço de hoje; o plano de 4 semanas dá tração real ao sonho de 10 anos.',
        frameworkTitle: 'A Escada dos 6 Planos Alinhados',
        frameworkItems: [
          '1. Plano de Vida (Legado): Expectativa de vida, missão central e a marca pessoal que você deseja deixar.',
          '2. Plano Diretor (10 Anos): Grandes marcos concretos de realização pessoal, familiar e patrimonial.',
          '3. Plano Estratégico (4 Anos): Leitura de cenários, antecipação de riscos e preparação de estrutura.',
          '4. Plano Tático (1 Ano): Metas anuais claras, orçamento do ano e plano de contingência.',
          '5. Plano Operacional (3 Meses): Ciclo trimestral de monitoramento, correção de rota e controle.',
          '6. Plano de Ação (4 Semanas): Entregáveis curtos, práticos e verificáveis a cada mês.',
        ],
        practicalExercise:
          'Liste as 5 coisas essenciais que você quer viver todos os dias pelo resto da vida e defina 1 entregável concreto para concluir nas próximas 4 semanas na direção delas.',
      },
      {
        number: 4,
        title: 'Dinheiro Sem Tabus, Economia Viva & O Elástico do Desenvolvimento',
        coreExplanation:
          'Economia nada mais é do que a ciência da troca humana em comunidade. Do escambo às moedas digitais, o dinheiro cumpre 3 funções objetivas: facilitar trocas, reservar valor e servir de unidade de medida. Crenças como "dinheiro corrompe" ou "dinheiro é sujo" sabotam justamente as pessoas éticas que deveriam prosperar para ampliar o bem. Ao mesmo tempo, prosperar isolado em um entorno miserável é insustentável: quando a corda arrebenta para o lado mais fraco, o elástico do desenvolvimento chicoteia quem está em cima em forma de insegurança, instabilidade e perda de liberdade.',
        clarityKey:
          'Dinheiro é um amplificador de intenção e um recibo social de valor gerado. Negócios saudáveis prosperam melhor quando fortalecem a comunidade ao redor.',
        frameworkTitle: 'As 3 Funções do Dinheiro & Consciência de Ciclo',
        frameworkItems: [
          'Facilitação de Trocas: Receber de forma justa pelo problema real que você ajuda a solucionar.',
          'Reserva de Valor: Construir margem e fôlego para atravessar as retrações naturais dos ciclos econômicos.',
          'Unidade Central de Valor: Medir com clareza esforço, preço, custo e retorno.',
          'Empresa como Família Escolhida: No passado trabalhava-se por herança sanguínea; hoje escolhemos com quem edificar um ideal comum.',
        ],
        practicalExercise:
          'Identifique uma frase negativa sobre dinheiro que você ouviu na infância e reescreva-a sob a ótica do dinheiro como ferramenta justa de troca e liberdade.',
      },
      {
        number: 5,
        title: 'Priorização Cirúrgica com a Matriz GUT',
        coreExplanation:
          'Quando tudo parece urgente, você trava ou apaga incêndios irrelevantes. A Matriz GUT elimina o achismo multiplicando três notas de 1 a 5 para cada problema ou pendência: Gravidade (qual o tamanho do impacto se nada for feito?), Urgência (quanto tempo pode esperar?) e Tendência (vai cicatrizar sozinho ou piorar rápido?). Pense em dois cortes superficiais no dedo: um com faca limpa (2 × 1 × 1 = 2) cicatriza naturalmente; outro com faca enferrujada (4 × 5 × 5 = 100) exige ação imediata para evitar infecção generalizada.',
        clarityKey:
          'Não trate corte de faca limpa como emergência nem ignore ferrugem silenciosa. Multiplique G × U × T e ataque primeiro a maior pontuação.',
        frameworkTitle: 'Régua Rápida GUT (Pontuação de 1 a 125)',
        frameworkItems: [
          'Gravidade (1 a 5): De [1] sem efeito real até [5] dano severo ou irreversível às pessoas/negócio.',
          'Urgência (1 a 5): De [1] pode esperar indefinidamente até [5] exige ação imediata em horas.',
          'Tendência (1 a 5): De [1] resolve-se sozinho até [5] agrava-se rapidamente se ignorado.',
          'Fórmula Decisória: Pontuação = G × U × T. Ordene do maior para o menor e execute o topo da lista.',
        ],
        practicalExercise:
          'Liste seus 5 maiores problemas atuais, atribua notas de 1 a 5 para Gravidade, Urgência e Tendência, multiplique-as e dedique seu primeiro bloco de amanhã exclusivamente ao item nº 1.',
      },
    ],
  },

  // =========================================================================
  // VOLUME 02 — MENTE, SUBJETIVIDADE & DECISÃO NA ERA DA IA
  // =========================================================================
  {
    id: 'vol-02',
    volumeNumber: 2,
    slug: 'mente-subjetividade-decisao-ia',
    accentColor: 'indigo',
    segmentBadge: 'Overview • Cérebro, Subjetividade & IA',
    title: 'Mente, Subjetividade & Decisão na Era da IA: Como Mensurar o Invisível e Não Ser Substituído',
    subtitle:
      'Entenda seus 3 sistemas cerebrais, equalize emoções difíceis, tome decisões sem névoa e desenvolva a Competência Consciente.',
    trelloSources: [
      'Overview: #72 Fundamentos da Subjetividade, #73 Fundamentos da Objetividade, #74 Mensurando a Subjetividade, #75 Entendendo seu Cérebro, #76 Equalizações, #77 Consciência vs Competência',
      'Gestão Geral: #26 Coeficiente de Inteligência & Alinhamento dos 4 Pilares da Decisão',
    ],
    readingTimeMin: 26,
    suggestedPrice: 'R$ 39,90',
    salesKit: {
      targetAudience:
        'Líderes, especialistas, terapeutas, gestores e profissionais do conhecimento que tomam decisões sob pressão e querem se tornar insubstituíveis diante da Inteligência Artificial.',
      corePain:
        'Oscilar entre decisões impulsivas e paralisia por excesso de análise, confundir medo ou cansaço com intuição e temer a obsolescência profissional na era da automação.',
      transformationPromise:
        'Dominar o protocolo de Equalização Emocional, aplicar o método de bifurcação IF/ELSE nas decisões difíceis e operar em estado de Competência Consciente.',
      headline:
        'A Inteligência Artificial só substitui quem estacionou no automático: aprenda a usar consciência, emoção equalizada e decisão lúcida a seu favor.',
      whatsappCopy:
        'Você já teve dúvida se um aperto no peito antes de decidir algo era *intuição real* ou apenas *medo e cansaço disfarçados*? No eBook *"Mente, Subjetividade & Decisão na Era da IA"*, você aprende a equalizar emoções, separar intuição de autossabotagem com um teste prático e desenvolver o único perfil profissional que nenhuma IA substitui.',
      deliverables: [
        'Mapa das 3 Camadas do Conhecimento (Crença, Conceito e Comprovação)',
        'Guia prático dos 3 sistemas cerebrais (Reptiliano, Límbico e Neocórtex)',
        'Protocolo dos 4 Pilares da Decisão (Intuição + Emoção + Adaptação + Razão IF/ELSE)',
        'Matriz Competência vs. Consciência na Era da IA',
      ],
    },
    executiveSummary:
      'O mundo corporativo adora números objetivos, mas quase todas as quebras de sociedades, travas de vendas e desistências nascem na subjetividade mal compreendida. Este volume entrega instrumentos claros para ler padrões emocionais, decidir com lucidez sob risco e manter a consciência sempre desperta.',
    chapters: [
      {
        number: 1,
        title: 'Subjetividade Mensurável e as 3 Camadas do Conhecimento',
        coreExplanation:
          'Subjetividade é tudo aquilo que é intangível, qualitativo e sentido internamente — confiança, medo, entusiasmo, propósito. Ignorá-la porque "não aparece na planilha" é um erro primário; tratá-la como névoa impossível de medir é outro. Medimos a subjetividade observando padrões repetidos de comportamento e seus desvios, atravessando as 3 Camadas do Conhecimento: aquilo em que apenas acreditamos (Crença), aquilo que estruturamos logicamente (Conceito) e aquilo que validamos na realidade prática (Comprovação).',
        clarityKey:
          'Quando você confunde uma crença não testada com uma comprovação real, passa a defender ilusões como se fossem verdades absolutas.',
        frameworkTitle: 'As 3 Camadas do Conhecimento',
        frameworkItems: [
          '1. Crença: Percepção herdada ou intuída que molda expectativas antes dos fatos.',
          '2. Conceito: Hipótese organizada e explicável que permite diálogo e teste.',
          '3. Comprovação: Resultado experimentado e verificado na prática com evidências.',
          'Leitura de Padrões: Se uma emoção subjetiva gera atraso ou conflito toda semana, ela já deixou um rastro objetivo mensurável.',
        ],
        practicalExercise:
          'Escolha uma certeza atual sobre seu mercado ou sobre você mesmo e classifique com honestidade: ela hoje é apenas uma Crença, um Conceito lógico ou já tem Comprovação prática?',
      },
      {
        number: 2,
        title: 'Seu Cérebro na Hora H & A Arte das Equalizações',
        coreExplanation:
          'Dentro da sua cabeça coexistem três centros de comando: o Reptiliano (instinto imediato de sobrevivência e economia de energia), o Límbico (memórias afetivas, busca de pertencimento e aversão à dor) e o Neocórtex (análise lógica, linguagem e visão de futuro). Reprimir o que você sente só aumenta a pressão límbica; agir no calor do impulso entrega o volante ao reptiliano. A saída madura são as Equalizações: ouvir a emoção, acolhê-la sem culpa e racionalizar as referências.',
        clarityKey:
          'Equalizar não é sufocar o sentimento nem obedecer cegamente a ele: é escutar o recado da emoção antes de entregar a caneta para a razão.',
        frameworkTitle: 'Três Passos da Equalização Emocional',
        frameworkItems: [
          'Passo 1 — Ouvir a Emoção: Perceber no corpo e na mente o que disparou desconforto, raiva, ansiedade ou euforia.',
          'Passo 2 — Acolher sem Julgar: Reconhecer que toda emoção tenta proteger algo importante para você.',
          'Passo 3 — Racionalizar Referências: Contrastar o sentimento com dados reais, contexto e proporção para estabelecer a razão.',
        ],
        practicalExercise:
          'Diante de uma situação tensa hoje, faça uma pausa de 90 segundos e nomeie no papel: (1) O que estou sentindo no corpo? (2) Do que essa emoção tenta me proteger? (3) Qual é o dado objetivo real?',
      },
      {
        number: 3,
        title: 'Os 4 Pilares da Tomada de Decisão & O Teste da Bifurcação IF/ELSE',
        coreExplanation:
          'Como saber se um pressentimento para desistir de algo é uma intuição verdadeira de perigo ou apenas seu cérebro inventando uma desculpa nobre para descansar e fugir do esforço? O método ISAAC une 4 pilares: Intuição (impulso instintivo), Emoção (medos e alívios envolvidos), Adaptabilidade (disposição real de encarar o desconforto) e Razão (uma condição objetiva SE/ENTÃO). No caso real vivido em um ponto de táxi à noite, ao sentir calafrios de perigo misturados a alívio por ir descansar em casa, a razão estabeleceu um teste claro: permanecer na fila observando a própria mente e só sair vazio se, diante de um passageiro real, o sinal físico de alerta voltasse a disparar.',
        clarityKey:
          'Toda vez que uma "intuição" vier acompanhada de preguiça ou alívio por evitar esforço, crie uma condição objetiva IF/ELSE para separar instinto de sobrevivência de zona de conforto.',
        frameworkTitle: 'Protocolo ISAAC de Decisão em 4 Pilares',
        frameworkItems: [
          '1. Intuição: Qual foi o primeiro sinal espontâneo antes de pensar demais?',
          '2. Emoção: Há medo legítimo ou há ganho secundário de acomodação/apego?',
          '3. Adaptabilidade: Quais vícios, resistências ou limites meus estão pesando na escolha?',
          '4. Razão (Condição IF/ELSE): Defina um critério observável — "Se ocorrer o sinal X na prática, executo A; senão, sigo firme em B".',
        ],
        practicalExercise:
          'Aplique os 4 pilares a uma decisão que você vem adiando nesta semana e escreva sua regra objetiva "SE acontecer X, ENTÃO farei Y".',
      },
      {
        number: 4,
        title: 'Por Que a IA Só Substitui a Competência Inconsciente',
        coreExplanation:
          'A pedagogia tradicional ensinou que o auge do aprendizado era a "Competência Inconsciente" — fazer algo tão bem que vira automático, sem precisar pensar. O problema é que tudo o que vira repetição automática e padronizada é exatamente o que a Inteligência Artificial executa mais rápido e mais barato. Quando um profissional estaciona na competência automática, entra em um platô invisível e só se move quando leva um choque externo. O novo paradigma ISAAC coloca o topo na Competência Consciente: dominar a técnica mantendo atenção plena às nuances humanas, aos limites de cada método e à renovação constante.',
        clarityKey:
          'O automático pode ser copiado por algoritmos; a consciência presente, crítica e empática continua sendo exclusivamente humana.',
        frameworkTitle: 'Do Platô Automático ao Perfil Alinhado',
        frameworkItems: [
          'Modelo Antigo (Foco só na Competência): Automatiza, repete fórmulas prontas, estaciona no platô e sofre ruptura.',
          'Novo Modelo ISAAC (Foco na Consciência): Usa a técnica com lucidez, percebe cedo quando o contexto mudou e antecipa o próximo ciclo.',
          'Ritmo Saudável: Respeita momentos conscientes de ativação intensa e momentos conscientes de descanso reparador.',
        ],
        practicalExercise:
          'Identifique uma tarefa central do seu trabalho que você faz no "modo robô" há meses e anote 2 melhorias conscientes que um olhar humano atento pode acrescentar a ela hoje.',
      },
    ],
  },

  // =========================================================================
  // VOLUME 03 — PILAR 1: CORE (IDENTIDADE, OFERTA & PORTFÓLIO)
  // =========================================================================
  {
    id: 'vol-03',
    volumeNumber: 3,
    slug: 'pilar-1-core-identidade-oferta-portfolio',
    accentColor: 'amber',
    segmentBadge: '1. CORE • Marca, 3 Níveis da Oferta & Portfólio',
    title: 'Pilar 1 — CORE: Identidade, Os 3 Níveis da Oferta & Portfólio de Transformação',
    subtitle:
      'Como transformar seu propósito em uma oferta irresistível, escolher seu tamanho ideal de negócio e estruturar produtos de alto valor.',
    trelloSources: [
      'Níveis da Oferta: #67 Incondicional, #68 Semi Condicional, #69 Condicional',
      '1. CORE: #2 Identidade [Marca / Branding], #63 Oferta Irresistível, #1 Produto [Portfólio], #59 Projetos & Programas',
    ],
    readingTimeMin: 30,
    suggestedPrice: 'R$ 47,00',
    salesKit: {
      targetAudience:
        'Empreendedores, mentores, consultores, prestadores de serviço e criadores que precisam empacotar seu conhecimento em produtos claros e lucrativos.',
      corePain:
        'Dificuldade de explicar o valor do que faz, competir apenas por preço baixo, atrair clientes errados que dão dor de cabeça e não saber organizar ideias em um portfólio coerente.',
      transformationPromise:
        'Estruturar sua Marca de Transformação, desenhar a escada dos 3 Níveis da Oferta, blindar sua oferta contra clientes desconectados e organizar Projetos, Programas e Produtos.',
      headline:
        'Pare de vender horas avulsas: construa uma Oferta de Transformação que atrai as pessoas certas e sustenta seu crescimento.',
      whatsappCopy:
        'Seu trabalho entrega muito, mas na hora de apresentar parece difícil fazer o cliente enxergar o real valor? No eBook *"Pilar 1 — CORE: Identidade, Os 3 Níveis da Oferta & Portfólio"*, você aprende a estruturar sua oferta Incondicional, Semi-Condicional e Condicional, diferenciar Preço de Custo de Oportunidade e organizar seus produtos com clareza profissional.',
      deliverables: [
        'Mapa de Posicionamento e Marca (Transformação Subjetiva + Objetiva)',
        'Escala Roma ISAAC: os 4 níveis conscientes de tamanho empresarial (do Pequeno Príncipe à Multiunidade)',
        'Arquitetura prática dos 3 Níveis da Oferta + Filtro Anti-Cliente Desconectado',
        'Matriz de Viabilidade em 4 Perspectivas (Pessoal, Social, Econômica e Longevidade)',
      ],
    },
    executiveSummary:
      'O CORE é o coração do seu trabalho no mundo. Antes de falar em anúncios ou planilhas, você precisa responder com nitidez: qual transformação eu prometo, qual tamanho de operação combina com a minha liberdade e como organizo minhas entregas para gerar impacto real e receita sustentável.',
    chapters: [
      {
        number: 1,
        title: 'Marca com Alma & Roma ISAAC: Escolhendo Seu Tamanho de Liberdade',
        coreExplanation:
          'Construir marca não é apenas desenhar um logotipo bonito ou registrar domínio e propriedade no INPI (embora proteger seu ativo seja indispensável). Branding é declarar como você quer ser lembrado e qual transformação entrega em duas dimensões: subjetiva (alívio, confiança, clareza) e objetiva (tempo poupado, receita gerada, meta cumprida). Mais importante ainda: na "Roma ISAAC", sucesso não tem um formato único imposto pelo mercado — você tem a liberdade de escolher qual dos 4 tamanhos de negócio faz sentido para a sua vida.',
        clarityKey:
          'Sucesso não é crescer até perder a própria paz: é escolher conscientemente o nível de operação que honra sua missão e seu estilo de vida.',
        frameworkTitle: 'Os 4 Níveis Empresariais da Roma ISAAC',
        frameworkItems: [
          'Nível 1 — Pequeno Príncipe: Empreender autoliderando com leveza e autonomia (profissional solo / MEI).',
          'Nível 2 — Líder de Equipe: Empreender em parceria e colaboração direta com uma equipe enxuta.',
          'Nível 3 — Unidade Estruturada: Liderar múltiplas equipes coordenadas dentro de uma empresa única.',
          'Nível 4 — Ecossistema / Multiunidades: Liderar matriz, filiais ou múltiplas empresas sinérgicas.',
        ],
        practicalExercise:
          'Defina com clareza em qual dos 4 níveis da Roma ISAAC você está hoje e em qual deseja estar nos próximos 4 anos — sem copiar a ambição alheia.',
      },
      {
        number: 2,
        title: 'A Espiral dos 3 Níveis da Oferta',
        coreExplanation:
          'Querendo ou não, estamos ofertando algo o tempo inteiro. Inspirado na convergência entre Marketing, Tipos de Amor e economia colaborativa, o modelo ISAAC organiza sua relação com o mercado em um ciclo vivo de 3 degraus de amadurecimento: Incondicional (o que você planta no mundo sem exigir retorno imediato, gerando conexão genuína), Semi-Condicional (o que você entrega gratuitamente mediante comprometimento, ação ou troca mútua, gerando engajamento real) e Condicional (seu produto ou serviço pago, que garante recursos financeiros para sustentar e expandir a missão).',
        clarityKey:
          'Quem só faz oferta condicional parece mercenário; quem só faz oferta incondicional quebra por exaustão. O segredo da escala saudável é girar os 3 níveis em harmonia.',
        frameworkTitle: 'Como Estruturar Seus 3 Níveis da Oferta',
        frameworkItems: [
          '1. Oferta Incondicional (Conexão): Conteúdos abertos, encontros gratuitos, pílulas de clareza que ajudam de verdade.',
          '2. Oferta Semi-Condicional (Engajamento): Diagnósticos, desafios práticos ou projetos-piloto para quem cumpre tarefas combinadas.',
          '3. Oferta Condicional (Sustentação): Produtos, mentorias, assinaturas e serviços pagos com entrega estruturada.',
        ],
        practicalExercise:
          'Escreva hoje 1 entrega concreta para cada nível do seu negócio: o que é aberto a todos, o que premia os comprometidos e o que compõe sua oferta paga principal.',
      },
      {
        number: 3,
        title: 'Oferta Irresistível & O Filtro Contra Clientes Desconectados',
        coreExplanation:
          'Uma Oferta Irresistível não existe para empurrar produto em quem não precisa — tentar convencer quem não quer sempre custa caro depois. Ela serve para remover o adiamento de quem já precisa da solução, mas procrastina por insegurança ou falta de clareza. Porém, toda oferta muito boa traz um efeito colateral perigoso: ela também desperta o desejo de pessoas desconectadas dos seus valores. Por isso, comunicar quem NÃO deve comprar é tão estratégico quanto atrair o cliente certo.',
        clarityKey:
          'Uma grande oferta abre a porta para quem está pronto e coloca um filtro claro na entrada para proteger sua reputação, sua energia e seus clientes ideais.',
        frameworkTitle: 'Escopo 5W2H + Filtro de Qualificação',
        frameworkItems: [
          'What & Why: Qual transformação exata entrego e por que ela importa agora?',
          'Who (Com Filtro): Quem ganha muito com isso — e qual perfil não deve entrar neste momento?',
          'When, Where & How: Prazo, ambiente de entrega e método passo a passo.',
          'How Much: Investimento claro diante do custo de continuar com o problema.',
        ],
        practicalExercise:
          'Adicione à apresentação do seu produto 3 critérios claros de "Para quem é" e 3 alertas honestos de "Para quem NÃO é".',
      },
      {
        number: 4,
        title: 'Preço vs. Valor, Viabilidade em 4 Lentes & Portfólio',
        coreExplanation:
          'Preço olha para trás (custo de operação + lista de características); Valor e Impacto olham para frente (custo de oportunidade economizado + resultados destravados na vida do cliente). Pense na compra de um carro: o preço mede aço e motor; o valor mede não chegar exausto às reuniões e ganhar duas horas produtivas por dia. Para organizar todas as suas frentes sem dispersão, valide cada produto em 4 perspectivas (Pessoal, Social, Econômica e Longevidade) e separe claramente Projetos (início, meio e fim nas 5 etapas PMBOK), Programas (projetos coordenados) e Portfólio (a carteira estratégica do negócio).',
        clarityKey:
          'Clientes discutem preço quando só enxergam seu esforço operacional; clientes agradecem o investimento quando enxergam o custo de oportunidade que você resolve.',
        frameworkTitle: 'As 4 Perspectivas de Viabilidade de um Produto',
        frameworkItems: [
          '1. Viabilidade Pessoal: Você tem interesse genuíno e energia para sustentar essa entrega?',
          '2. Viabilidade Social: Gera benefício concreto para o cliente e impacto positivo ao redor?',
          '3. Viabilidade Econômica: A margem paga todos os custos e remunera o crescimento?',
          '4. Longevidade: Continua relevante no médio e longo prazo ou depende de uma modinha passageira?',
        ],
        practicalExercise:
          'Avalie seu produto principal nas 4 perspectivas acima e liste 3 "custos invisíveis" que seu cliente economiza ao contratar você.',
      },
    ],
  },

  // =========================================================================
  // VOLUME 04 — PILAR 2: RECURSOS (TEMPO, FINANÇAS, PRECIFICAÇÃO & PESSOAS)
  // =========================================================================
  {
    id: 'vol-04',
    volumeNumber: 4,
    slug: 'pilar-2-recursos-tempo-financas-precificacao-equipes',
    accentColor: 'emerald',
    segmentBadge: '2. RECURSOS • Tempo, Finanças, Precificação & Equipes',
    title: 'Pilar 2 — RECURSOS: Domínio do Tempo, Finanças Escaláveis & Precificação Inteligente',
    subtitle:
      'Abandone a correria cega, domine seus pontos de equilíbrio, precifique pelo valor intangível e forme equipes autônomas.',
    trelloSources: [
      '2. RECURSOS: #3 Gestão do Tempo, #38 Gestão das Finanças, #5 Gestão de Pessoas, #6 Gestão dos Materiais',
    ],
    readingTimeMin: 32,
    suggestedPrice: 'R$ 47,00',
    salesKit: {
      targetAudience:
        'Donos de pequenos negócios, profissionais liberais e gestores que faturam mas não veem sobra de caixa, vivem sem agenda própria e cobram menos do que valem.',
      corePain:
        'Agenda engolida por urgências alheias, mistura entre contas pessoais e empresariais, medo de reajustar preços e dificuldade de delegar com confiança.',
      transformationPromise:
        'Organizar a Matriz de Agenda por blocos alinhados à vida, dominar os 3 horizontes de Ponto de Equilíbrio, aplicar os 3 Parâmetros da Precificação Eficiente e liderar pelos 5 Pilares de Pessoas.',
      headline:
        'Não vence quem corre mais rápido, vence quem domina o próprio ritmo e sabe precificar o valor que entrega.',
      whatsappCopy:
        'Agenda lotada e conta bancária apertada são sinais clássicos de recursos desalinhados. No eBook *"Pilar 2 — RECURSOS: Tempo, Finanças Escaláveis & Precificação"*, você aprende a sair da correria improdutiva, calcular seu ponto de equilíbrio real, criar receitas em segundo plano e cobrar de forma justa combinando custos tangíveis e valor intangível.',
      deliverables: [
        'Método Blocos de Tempo & Sprints alinhados ao Projeto de Vida',
        'Painel Financeiro de Ponto de Equilíbrio (3 meses, 1 ano e 4 anos) + Receita em 2º Plano',
        'Fórmula dos 3 Parâmetros da Precificação Eficiente (Custo + Comparáveis + Perspectiva de Valor)',
        'Guia dos 5 Pilares da Gestão de Pessoas e Mapa de Materiais/Insumos',
      ],
    },
    executiveSummary:
      'Ideias brilhantes naufragam todos os dias por falta de gestão sobre os quatro recursos vitais: Tempo, Finanças, Pessoas e Materiais. Este volume traduz conceitos contábeis, econômicos e humanos em regras simples de bolso para dar fôlego e escala à sua jornada.',
    chapters: [
      {
        number: 1,
        title: 'O Verdadeiro Conceito de Tempo & A Lição do MasterChef',
        coreExplanation:
          'Repetimos no automático que precisamos "ganhar tempo", sem perceber que ninguém fabrica horas extras: o tempo é o tecido da própria vida. Sem tempo, nem dinheiro nem patrimônio podem ser desfrutados. O vício moderno em correria faz as pessoas responderem apenas "o quê" precisam entregar, ficando mudas diante do "por quê". Em uma prova emblemática de culinária onde venceria o melhor prato entregue dentro do prazo, quem correu desesperado para terminar primeiro errou o ponto; venceu quem usou todo o tempo disponível com calma, presença e precisão.',
        clarityKey:
          'Eficiência não é terminar correndo antes de todo mundo: é manter seu ritmo consciente para entregar excelência dentro do ciclo combinado.',
        frameworkTitle: 'Matriz de Agenda ISAAC',
        frameworkItems: [
          'Blocos de Tempo Intencionais: Separar janelas de criação profunda, operação, relacionamento, descanso e estudo.',
          'Alinhamento com a Roda da Vida: Se um objetivo é prioritário no seu Plano de Vida, ele precisa morar na sua agenda semanal.',
          'Ciclos de Sprint: Trabalhar entregas focadas com início e revisão claros em vez de listas infinitas.',
          'Valorização da Própria Hora: Questionar contratos ou rotinas que compram 100% do seu tempo vital sem espaço de autonomia.',
        ],
        practicalExercise:
          'Audite sua última semana: quantas horas foram gastas em "correria reativa" e quantas foram dedicadas em blocos protegidos ao projeto que constrói sua liberdade futura?',
      },
      {
        number: 2,
        title: 'Finanças Claras, Receita em 2º Plano, Efeito Cantillon & Consciência Fiscal',
        coreExplanation:
          'Para escalar sem sufoco, separe duas naturezas de faturamento: a Receita de Serviço Direto (que exige sua presença hora a hora) e a Receita em Segundo Plano (produtos digitais, assinaturas, royalties ou ativos já construídos que continuam gerando caixa). Acompanhe seu Ponto de Equilíbrio em três escalas: Operacional (3 meses), Tático (1 ano) e Estratégico (4 anos). Nos investimentos e na economia real, compreenda que na Renda Fixa alguém gerencia a volatilidade por você e fica com a maior fatia, e que a expansão monetária desordenada gera o Efeito Cantillon — corroendo silenciosamente o poder de compra de quem está na ponta final. Já nos impostos, jamais confunda Sonegação (negar/esconder obrigação e viver vulnerável) com Elisão e Negociação inteligente dentro da lei.',
        clarityKey:
          'Faturamento mostra movimento; despesa mostra eficiência; margem e receita em segundo plano mostram liberdade.',
        frameworkTitle: 'Indicadores Essenciais de Saúde Financeira',
        frameworkItems: [
          'Custos Fixos, Variáveis e Margem de Contribuição: Saber exatamente quanto sobra de cada venda para pagar a estrutura.',
          'Pontos de Equilíbrio (3m / 1a / 4a) & Payback: Clareza do tempo de retorno de cada investimento.',
          'Receita Direta + Receita em 2º Plano: Construir ativos recorrentes que não travem no limite físico da sua agenda.',
          'Política Fiscal Inteligente: Calendário tributário organizado, enquadramento legal correto e negociação transparente.',
        ],
        practicalExercise:
          'Some todas as suas receitas atuais e calcule qual percentual depende 100% da sua presença física hoje versus qual percentual vem de receitas recorrentes ou em segundo plano.',
      },
      {
        number: 3,
        title: 'Os 3 Parâmetros da Precificação Eficiente',
        coreExplanation:
          'Cobrar apenas somando custos te prende na guerra de preços; cobrar chutando o valor do concorrente ignora sua realidade. A precificação madura equilibra 3 parâmetros: [1] Custo Operacional (o piso tangível para nunca pagar para trabalhar), [2] Comparáveis Diretos e Indiretos (o quanto custam alternativas iguais ou diferentes que atendem à mesma finalidade, como um livro, um jantar ou um perfume na hora de presentear) e [3] Perspectiva de Valor (a conexão intangível entre sua solução e aquilo que o cliente mais valoriza — por exemplo, mostrar a um executivo que resolver conflitos conjugais impacta diretamente sua performance e ascensão na carreira).',
        clarityKey:
          'Mude o enquadramento da proposta ("aprenda receitas" vs. "domine a arte de receber quem você ama") e a percepção de valor muda instantaneamente.',
        frameworkTitle: 'Tríade da Precificação ISAAC',
        frameworkItems: [
          '1. Parâmetro Tangível (Piso): Investimento inicial + custos fixos/variáveis + margem saudável.',
          '2. Comparáveis de Mercado (Referência): Substitutos diretos (mesmo formato) e indiretos (mesmo objetivo final).',
          '3. Perspectiva de Valor (Teto): Abordagem da proposta + Nível de confiança da marca + Probabilidade real de impacto.',
        ],
        practicalExercise:
          'Reescreva a apresentação do seu serviço principal conectando o resultado dele a um ganho financeiro, emocional ou profissional de alto valor para o seu cliente.',
      },
      {
        number: 4,
        title: 'Os 5 Pilares da Gestão de Pessoas & Estrutura de Materiais',
        coreExplanation:
          'Ninguém constrói algo duradouro sozinho, mas contratar sem alinhamento só multiplica problemas. Equipes autônomas nascem quando você conecta o sonho individual de cada colaborador ao propósito do projeto e sustenta o dia a dia nos 5 Pilares da Gestão de Pessoas: Motivação, Competências (mapeadas do nível Elementar ao Domínio), Desenvolvimento contínuo, Colaboração e Comunicação clara. Na base física e digital, mantenha uma lista enxuta e atualizada de Materiais: patrimônio/equipamentos essenciais de um lado e insumos/fornecedores críticos do outro.',
        clarityKey:
          'Microgerenciamento nasce da falta de clareza. Quando propósito, competência esperada e comunicação estão alinhados, a autogestão floresce.',
        frameworkTitle: 'Os 5 Pilares de Equipes Engajadas',
        frameworkItems: [
          '1. Motivação: Conectar metas pessoais legítimas de cada integrante ao avanço do negócio.',
          '2. Competências: Equilibrar Hard Skills (técnica) e Soft Skills (comportamento e ética) em matriz clara.',
          '3. Desenvolvimento: Trilhas práticas para evoluir do nível Elementar/Básico até Avançado/Domínio.',
          '4. Colaboração & 5. Comunicação: Cultura de cooperação, acordos claros e zero ruído.',
        ],
        practicalExercise:
          'Se você já tem equipe ou parceiros, pergunte individualmente qual é o principal objetivo pessoal de cada um para os próximos 12 meses e conecte-o a uma meta do projeto.',
      },
    ],
  },

  // =========================================================================
  // VOLUME 05 — PILAR 3: MERCADO (PÚBLICO, FUNIL JARDIM & PARÁBOLAS DA VENDA)
  // =========================================================================
  {
    id: 'vol-05',
    volumeNumber: 5,
    slug: 'pilar-3-mercado-publico-funil-parabolas-venda',
    accentColor: 'rose',
    segmentBadge: '3. MERCADO • Público, Lista, Funil & Vendas Éticas',
    title: 'Pilar 3 — MERCADO: O Jardim da Atração, Funil de Vendas & As 3 Parábolas da Conversão',
    subtitle:
      'Como atrair pessoas que querem conhecer você, estruturar campanhas enxutas e vender com alta conversão sem perder sua essência.',
    trelloSources: [
      '3. MERCADO: #7 Público [Stakeholders e Abrangência], #8 Funil de Venda, #9 Canal de Comunicação, #64 Plano de Comunicação e Mídia',
    ],
    readingTimeMin: 34,
    suggestedPrice: 'R$ 47,00',
    salesKit: {
      targetAudience:
        'Empreendedores, profissionais autônomos, equipes comerciais e criadores que querem vender com constância sem recorrer a apelação agressiva.',
      corePain:
        'Depender apenas de indicação esporádica, postar conteúdo sem gerar vendas, sofrer emocionalmente ao ouvir um "não" e investir nos canais errados.',
      transformationPromise:
        'Dominar os 6 Passos do Funil Jardim, a tríade [Oferta + Lista + Evento], os 3 tipos estratégicos de conteúdo, a resiliência comercial 100→60→20→10 e o planejamento inteligente de canais.',
      headline:
        'Quem você conhece ajuda a começar; quem quer conhecer você é o que sustenta e escala o seu negócio.',
      whatsappCopy:
        'Cansado de abordagens de venda forçadas que afastam bons clientes? No eBook *"Pilar 3 — MERCADO: O Jardim da Atração & As 3 Parábolas da Conversão"*, você descobre como criar um ambiente onde o cliente ideal vem até você, estruturar campanhas com Oferta + Lista + Evento e vender com técnica, verdade e inteligência emocional.',
      deliverables: [
        'Mapa de Abrangência Geográfica e Radiografia Comportamental do Avatar (Empolgados vs. Escaldados)',
        'Os 6 Passos do Funil Jardim + Tríade de Campanha [Oferta, Lista e Evento]',
        'Matriz de Conteúdos de Funil (CoA • ContE • CIM) e Headlines Chamativas',
        'As 3 Parábolas Aplicadas às Vendas + Channel Planning (Uso vs. Confiança)',
      ],
    },
    executiveSummary:
      'Vender não é empurrar algo para bater meta a qualquer custo: vender é o instrumento de independência que leva uma solução honesta a quem precisa dela. Este volume entrega o mapa completo de mercado do ecossistema ISAAC, unindo estratégia de funil, psicologia do comprador e sabedoria milenar.',
    chapters: [
      {
        number: 1,
        title: 'Radiografia do Público, Abrangência & A Lei de Ouro do Networking',
        coreExplanation:
          'Antes de anunciar, defina sua abrangência real (do bairro e município até o nacional ou internacional) e compreenda todas as partes interessadas (clientes, parceiros, fornecedores e realizadores). Na leitura comportamental do mercado, reconheça dois grandes perfis: os Empolgados (desbravadores e curiosos que aderem cedo) e os Escaldados (pragmáticos, conservadores e céticos que exigem prova e consistência). Acima de tudo, grave o princípio central do relacionamento ISAAC: o número de pessoas que você conhece é fundamental para começar o seu negócio; mas o número de pessoas que querem conhecer você é o que sustenta e faz o seu negócio crescer.',
        clarityKey:
          'Não persiga borboletas com rede na mão: cuide do jardim para que as pessoas certas queiram entrar e permanecer.',
        frameworkTitle: 'Os 6 Passos do Funil Jardim',
        frameworkItems: [
          'Passo 1 — Avatar Profundo: Dores externas, sonhos reais, renda, contexto familiar e visão de mundo.',
          'Passo 2 — Recompensa de Valor: Material útil que resolve uma primeira dúvida e cria lembrança imediata.',
          'Passo 3 — Ambiente / Showroom (O Jardim): Página, canal ou espaço acolhedor onde o cliente se conecta.',
          'Passo 4 — Tráfego (Estratégia → Teste → Otimização): Fluxo orgânico e pago trazendo visitantes qualificados.',
          'Passo 5 — Relacionamento: Nutrir confiança aplicando as 5 Linguagens do Amor à jornada do cliente.',
          'Passo 6 — Melhoria Contínua: Medir conversão de cada etapa para ajustar o que trava e escalar o que funciona.',
        ],
        practicalExercise:
          'Classifique seus clientes atuais: a maioria deles é do perfil "Empolgado" ou "Escaldado"? Ajuste sua argumentação para responder às dúvidas reais desse grupo.',
      },
      {
        number: 2,
        title: 'Campanha Enxuta [Oferta + Lista + Evento] & Conteúdos CoA, ContE e CIM',
        coreExplanation:
          'Toda campanha comercial vencedora se apoia em apenas 3 pilares: uma OFERTA clara de transformação, uma LISTA aquecida e qualificada, e um EVENTO catalisador de decisão (aula aberta, desafio, diagnóstico ou condição especial). Para conduzir o público sem ruído, fuja das headlines polêmicas vazias (que atraem curiosos tóxicos) e das convencionais sem sal: use Headlines Chamativas que despertam consciência imediata, distribuindo seu conteúdo em três funções exatas.',
        clarityKey:
          'Conteúdo sem função no funil vira entretenimento gratuito; conteúdo intencional educa, aproxima e prepara a decisão de compra.',
        frameworkTitle: 'Os 3 Tipos Estratégicos de Conteúdo',
        frameworkItems: [
          '[CoA] Conteúdo para Atrair: Desperta a consciência de um problema oculto ou de uma oportunidade real.',
          '[ContE] Conteúdo de Engajamento: Dá clareza de causa e efeito, mostra o caminho e entrega uma amostra de transformação.',
          '[CIM] Conteúdo para Motivar a Seguir: Desafios práticos e pequenas vitórias que dão coragem para dar o próximo passo.',
        ],
        practicalExercise:
          'Planeje seus próximos 3 conteúdos na ordem exata: 1 post/vídeo CoA (atração), 1 ContE (aprofundamento) e 1 CIM (convite à ação).',
      },
      {
        number: 3,
        title: 'As 3 Parábolas Aplicadas às Vendas & Os 3 Ingredientes do Fechamento',
        coreExplanation:
          'Longe de qualquer dogmatismo religioso, três parábolas clássicas resumem com perfeição a maturidade comercial: (1) O Semeador ensina a espalhar sua mensagem com constância, identificar terrenos férteis e, com método educativo ("conteúdo adubo"), tornar férteis terrenos antes áridos; (2) O Joio e o Trigo ensina a não arrancar precipitadamente críticas ou perfis difíceis no meio do crescimento quando isso feriria a lavoura inteira, sabendo separar na hora madura da colheita; (3) O Filho Pródigo ensina o desapego elegante com quem parte e a alegria genuína ao acolher quem retorna no momento certo. Somado a isso, todo grande vendedor une Inconformidade (fome de evolução), Técnica (processo) e Inteligência Emocional.',
        clarityKey:
          'O "não" para quem vende é como a graxa na mão do mecânico: faz parte natural do ofício. Jamais confunda uma objeção de momento com rejeição pessoal.',
        frameworkTitle: 'A Estatística Realista da Conversão (100 → 60 → 20 → 10)',
        frameworkItems: [
          'De 100 apresentações claras: cerca de 60 demonstram interesse inicial em saber mais.',
          'Desses 60 interessados: cerca de 20 avançam para conversa real de negociação.',
          'Desses 20 em negociação: cerca de 10 fecham a compra imediata (e os demais seguem nutridos no jardim).',
          'Rede de Afiliados em Camadas: Escale alcance com Afiliados Árbitros, Autoridades e Masters alinhados aos valores da marca.',
        ],
        practicalExercise:
          'Calcule quantas apresentações qualificadas você fez nos últimos 30 dias. Se foram poucas, aumente o plantio do Semeador antes de culpar o produto.',
      },
      {
        number: 4,
        title: 'Channel Planning: Diferenciando Onde o Público Usa de Onde Ele Confia',
        coreExplanation:
          'Um erro caríssimo no marketing é investir verba apenas onde há audiência bruta sem medir confiança. As pessoas usam certas plataformas por distração, mas só clicam e compram em ambientes nos quais confiam. Um planejamento de canais inteligente separa claramente Canais de Descoberta/Atenção (redes abertas, vídeos curtos, mídia de alcance) de Canais de Relacionamento e Conversão Profunda (WhatsApp estruturado, comunidades, busca ativa no Google/SEO, e-mail e indicação direta).',
        clarityKey:
          'Use canais de alto alcance para ser descoberto e canais de alta confiança para conversar, acolher e fechar negócios.',
        frameworkTitle: 'Arquitetura Integrada de Canais',
        frameworkItems: [
          'Canais de Atenção: YouTube, Instagram, artigos otimizados (SEO/IA) e mídia paga segmentada.',
          'Canais de Confiança e Conversão: WhatsApp consultivo, Landing Pages enxutas, Comunidade e E-mail.',
          'Modalidades de Venda: Direta (você → cliente), Intermediada (parceiros/afiliados) ou Dual (ambas integradas).',
        ],
        practicalExercise:
          'Mapeie 1 canal principal de descoberta e 1 canal principal de fechamento para concentrar 80% da sua energia comercial neste trimestre.',
      },
    ],
  },

  // =========================================================================
  // VOLUME 06 — PILAR 4: LOGÍSTICA, AMPULHETA DA ENTREGA & PROCESSOS
  // =========================================================================
  {
    id: 'vol-06',
    volumeNumber: 6,
    slug: 'pilar-4-logistica-ampulheta-entrega-processos',
    accentColor: 'sky',
    segmentBadge: '4. LOGÍSTICA • Ampulheta, Funil de Entrega & BPM',
    title: 'Pilar 4 — LOGÍSTICA & PROCESSOS: A Ampulheta da Transformação & Operação Enxuta',
    subtitle:
      'Como encantar depois da venda, conduzir o cliente até o resultado real e desenhar processos que libertam o fundador.',
    trelloSources: [
      '4. LOGÍSTICA: #12 Atendimento e Suporte, #11 Funil de Entrega, #79 Canal de Distribuição, #10 Gestão de Processos de Negócio, #80 Logística Reversa',
      '0. FUNDAMENTOS & Gestão Geral: #61 Checklist Processos de Negócio, #60 Checklist Novo Cliente, #50 Escopo de Reuniões',
    ],
    readingTimeMin: 27,
    suggestedPrice: 'R$ 39,90',
    salesKit: {
      targetAudience:
        'Empresários, consultores, infoprodutores e gestores operacionais que já vendem, mas sentem a entrega pesada, artesanal demais ou dependente de apagar incêndios.',
      corePain:
        'Clientes perdidos após a compra por falta de onboarding, reuniões longas e improdutivas, processos guardados só na cabeça do dono e baixa taxa de renovação/indicação.',
      transformationPromise:
        'Implantar a Estratégia da Ampulheta (Funil de Venda + Funil de Entrega), padronizar o onboarding e reuniões de 30/60 min e mapear os 12 macroprocessos do negócio.',
      headline:
        'A venda fecha o contrato; o Funil de Entrega constrói sua reputação, suas renovações e suas indicações espontâneas.',
      whatsappCopy:
        'Sua empresa vende bem, mas na hora de entregar tudo depende de você lembrar de cada detalhe? No eBook *"Pilar 4 — LOGÍSTICA & PROCESSOS: A Ampulheta da Transformação"*, você recebe o modelo prático do Funil de Entrega, o Checklist de Onboarding de Novo Cliente, o roteiro de reuniões produtivas e o mapa dos 12 macroprocessos empresariais.',
      deliverables: [
        'Modelo da Ampulheta ISAAC (Conexão entre Funil de Venda e Funil de Entrega)',
        'Checklist completo de Assinatura e Abertura de Novo Cliente (Onboarding)',
        'Roteiro enxuto para Reuniões de 30 e 60 minutos com pauta e entregáveis',
        'Mapa dos 12 Macroprocessos Internos + Fluxo de Suprimentos e Logística Reversa',
      ],
    },
    executiveSummary:
      'Muitos negócios desenham um funil impecável até o pagamento e abandonam o cliente em um deserto logo depois. No método ISAAC, o formato real de um negócio sustentável não é um funil, e sim uma Ampulheta: ao passar pelo gargalo da compra, abre-se o Funil de Entrega para garantir transformação mensurável.',
    chapters: [
      {
        number: 1,
        title: 'A Estratégia da Ampulheta & O Funil de Entrega',
        coreExplanation:
          'A venda não termina no pagamento — é ali que a promessa começa a ser julgada. Na Ampulheta ISAAC, a metade superior atrai e converte (Funil de Venda), enquanto a metade inferior acolhe, guia e transforma (Funil de Entrega). Para saber se sua entrega realmente funciona, meça dois tipos distintos de retorno: o Depoimento de Processo (o cliente se sente seguro, orientado e bem atendido durante a caminhada?) e o Depoimento de Transformação (o cliente chegou concretamente ao resultado prometido e em quanto tempo?).',
        clarityKey:
          'Marketing brilhante com entrega confusa acelera o fim de uma marca; entrega transformadora transforma cada cliente em um canal vivo de novas vendas.',
        frameworkTitle: 'Pilares do Funil de Entrega',
        frameworkItems: [
          'Clareza dos Realizáveis: O cliente sabe exatamente o que fazer em cada etapa e por quê.',
          'Métrica de Tempo de Transformação: Quanto tempo leva, em média, para o cliente colher a primeira vitória visível?',
          'Suporte Pré e Pós-Compra: Canais claros, tempo de resposta definido (SLA) e acompanhamento humano.',
        ],
        practicalExercise:
          'Desenhe os primeiros 7 dias do seu cliente após pagar: o que ele recebe na primeira hora, no 3º dia e no 7º dia para sentir segurança imediata?',
      },
      {
        number: 2,
        title: 'Onboarding Sem Falhas & Reuniões que Resolvem em 30 ou 60 Minutos',
        coreExplanation:
          'Metade dos atritos em serviços e consultorias nasce de combinados frouxos na largada. O Checklist de Novo Cliente divide a entrada em dois rituais simples: Fechamento (datas, regras de agenda, escopo de etapas, confidencialidade e diagnóstico SWOT inicial) e Abertura (termo de início, coleta estruturada de dados e relatório de prioridades). Já os encontros seguem sempre 3 blocos cronometrados: Preparação (pauta e objetivo claros antes de abrir a sala), Contextualização (alinhamento rápido de dados) e Desenvolvimento (decisões, tarefas, responsáveis e prazos).',
        clarityKey:
          'Reunião que termina sem ação definida, responsável nominal e prazo acordado não foi trabalho: foi apenas conversa.',
        frameworkTitle: 'Checklist Rápido de Onboarding + Reunião Eficiente',
        frameworkItems: [
          '1. Assinatura & Regras do Jogo: Entregáveis por etapa, metas do cliente e regras claras de reagendamento.',
          '2. Relatório Inicial de Prioridades: O que será atacado primeiro para gerar resultado tangível.',
          '3. Estrutura 3 Blocos de Reunião: Pauta prévia → Alinhamento de contexto → Plano de ação com donos e datas.',
        ],
        practicalExercise:
          'Adote o modelo de 3 blocos na sua próxima reunião e reserve obrigatoriamente os últimos 10 minutos para confirmar quem faz o quê e até quando.',
      },
      {
        number: 3,
        title: 'Os 12 Macroprocessos de Negócio, Suprimentos & Logística Reversa',
        coreExplanation:
          'Processos não existem para engessar pessoas com burocracia: existem para dar liberdade, previsibilidade e escala. Modelar processos (fluxogramas simples ou BPMN) significa desenhar sua Cadeia de Valor interna — cobrindo Planos, Comunidade, Branding, Portfólio, Produtos, Tempo, Finanças, Precificação, Liderança, Equipe, Materiais e Público — junto com a Cadeia de Suprimentos externa (do fornecedor até o cliente) e a Logística Reversa (tratar trocas, cancelamentos ou devoluções com respeito, agilidade e aprendizado sobre onde o processo falhou).',
        clarityKey:
          'Se um resultado bom só acontece quando você faz pessoalmente, você ainda não tem um processo: tem apenas um talento individual sobrecarregado.',
        frameworkTitle: 'Como Mapear um Processo sem Complicação',
        frameworkItems: [
          'Entrada (Gatilho): O que inicia esta atividade?',
          'Sequência Enxuta de Passos: Quais são as 5 a 7 ações essenciais na ordem certa?',
          'Saída (Entregável Padrão): Qual padrão de qualidade confirma que a tarefa está pronta?',
          'Logística Reversa Inteligente: Transformar cada reclamação ou devolução em ajuste definitivo na causa-raiz.',
        ],
        practicalExercise:
          'Escolha a tarefa operacional que mais toma seu tempo hoje e documente-a em no máximo 7 passos claros que outra pessoa consiga seguir.',
      },
    ],
  },

  // =========================================================================
  // VOLUME 07 — PILAR 5: APRENDIZADO (CHACRAS, SINA, TÉCNICA TESÃO & CADERNETA)
  // =========================================================================
  {
    id: 'vol-07',
    volumeNumber: 7,
    slug: 'pilar-5-aprendizado-sina-tecnica-tesao-chacras',
    accentColor: 'violet',
    segmentBadge: '5. APRENDIZADO • CHACRAS, SINA & Técnica Tesão',
    title: 'Pilar 5 — APRENDIZADO: Os 7 CHACRAS do Líder, Método SINA & Caderneta ISAAC',
    subtitle:
      'Como resgatar o prazer genuíno em aprender, ler os sinais do corpo e do ambiente e converter incômodos em evolução acelerada.',
    trelloSources: [
      '5. APRENDIZADO: #43 CHACRAS - Competências, #41 SINA - Aprendizagem, #71 Técnica Tesão - Estabelecendo o Prazer em Aprender',
    ],
    readingTimeMin: 29,
    suggestedPrice: 'R$ 39,90',
    salesKit: {
      targetAudience:
        'Estudantes adultos, líderes, autodidatas, empreendedores e pessoas que compram cursos/livros mas procrastinam ou sentem bloqueio para colocar o aprendizado em prática.',
      corePain:
        'Acúmulo de informação sem aplicação (obesidade mental), procrastinação recorrente, dificuldade de sintetizar temas complexos e repetição dos mesmos conflitos emocionais.',
      transformationPromise:
        'Mapear e desenvolver os 7 CHACRAS da Liderança, dominar a Técnica Tesão de leitura abrangente/profunda e aplicar a Caderneta ISAAC para transformar incômodos diários em ações renovadoras.',
      headline:
        'Você não procrastina por preguiça — você trava porque foi adestrado a decorar em vez de sentir prazer real em compreender.',
      whatsappCopy:
        'Quantos livros ou cursos você já começou animado e deixou pela metade? No eBook *"Pilar 5 — APRENDIZADO: Os 7 CHACRAS, Método SINA & Caderneta ISAAC"*, você descobre a diferença entre adestramento e aprendizado real, aprende a Técnica de Visão Abrangente + Profunda e recebe o passo a passo da Caderneta ISAAC para transformar qualquer incômodo em evolução prática.',
      deliverables: [
        'Mapa completo dos 7 CHACRAS (Conhecimento, Habilidade, Atitude, Caráter, Respeito, Amor e Superação)',
        'Guia das 4 famílias de Skills (Hard, Soft, Power e Change Skills) + 3 Visões do Líder',
        'Protocolo da Técnica Tesão (Turn-On Technique): Visão Abrangente, Profunda e Multifocal',
        'Modelo prático da Caderneta ISAAC em 6 etapas + Sistema de Biofeedback',
      ],
    },
    executiveSummary:
      'O mercado tradicional fala em CHA (Conhecimento, Habilidade e Atitude), mas gente tecnicamente brilhante e sem caráter destrói empresas e comunidades todos os dias. Este volume apresenta a evolução ética e neuropsicológica da aprendizagem acelerada dentro do ecossistema ISAAC.',
    chapters: [
      {
        number: 1,
        title: 'Os 7 CHACRAS das Competências Humanas & As 3 Visões do Líder',
        coreExplanation:
          'No método ISAAC, competência integral vai muito além de saber apertar botões. O acrônimo CHACRAS expande o antigo CHA somando quatro virtudes sustentadoras: Conhecimento (compreender a realidade), Habilidade (gerar resultado útil com o que sabe), Atitude (querer executar e aprender o que desconhece), Caráter (coerência entre discurso e prática), Respeito (aceitar o tempo e a escolha do outro), Amor (fazer ao outro o que gostaria de receber) e Superação (vencer a si mesmo a cada dia). Essas virtudes se desdobram em Hard Skills (técnicas), Soft Skills (comportamentais), Power Skills (liderança, influência e negociação) e Change Skills (adaptabilidade contextual).',
        clarityKey:
          'Talento técnico abre portas; caráter, respeito e capacidade de adaptação mantêm as portas abertas no longo prazo.',
        frameworkTitle: 'As 3 Visões Mestras do Líder ISAAC',
        frameworkItems: [
          '1. Visão Sistêmica: Enxergar como cada parte impacta o todo e como o todo molda cada parte.',
          '2. Visão Antecipatória: Ler consequências futuras antes de agir, preparando decisões com antecedência.',
          '3. Visão Normativa: Compreender as regras jurídicas do jogo e, acima delas, as leis universais de causa e efeito.',
        ],
        practicalExercise:
          'Dê uma nota de 1 a 10 para si mesmo em cada uma das 7 letras de CHACRAS e escolha 1 atitude concreta para fortalecer seu ponto mais baixo nesta semana.',
      },
      {
        number: 2,
        title: 'Técnica Tesão (Turn-On Technique): Do Adestramento ao Prazer de Aprender',
        coreExplanation:
          'Boa parte do ensino convencional funciona como o experimento do cão de Pavlov: sinal toca, aluno repete, ganha nota — isso é adestramento, não aprendizado. Muitas vezes o que chamamos de "procrastinação" é apenas nossa inteligência recusando tarefas que parecem mecânicas e sem sentido. A Técnica Tesão resgata a energia vital de descobrir a essência das coisas combinando três movimentos de estudo: Visão Abrangente (mapear títulos, estrutura e panorama geral como generalista), Visão Profunda (mergulhar rápido nos detalhes decisivos como especialista) e Síntese Multifocal (cruzar disciplinas diferentes para criar soluções próprias).',
        clarityKey:
          'Quando você entende o "porquê" e conecta o tema à sua própria liberdade, a obrigação pesada vira curiosidade magnética.',
        frameworkTitle: 'O Ciclo de Estudo Acelerado em 3 Lentes',
        frameworkItems: [
          'Lente 1 — Panorama Geral (Generalista): Ler índice, subtítulos e estrutura inteira antes de travar na página 1.',
          'Lente 2 — Mergulho Seletivo (Especialista): Aprofundar com foco total nos pontos que resolvem seu desafio real.',
          'Lente 3 — Poder da Síntese (Multifocal): Explicar o que aprendeu em poucas linhas com suas próprias palavras e aplicar em 24h.',
        ],
        practicalExercise:
          'Pegue um livro ou tema que estava parado, gaste 10 minutos mapeando apenas seus títulos centrais e extraia 1 única ideia aplicável ainda hoje.',
      },
      {
        number: 3,
        title: 'Método SINA, Biofeedback & A Caderneta ISAAC',
        coreExplanation:
          'A vida conversa conosco o tempo inteiro por meio de um Feedback System contínuo: feedbacks ativos (alguém te diz claramente), feedbacks passivos (silêncios, clientes que somem) e biofeedbacks (sintomas, tensões e dores do próprio corpo sinalizando emoções reprimidas ou desalinhamento). Em vez de brigar no raso — lembre-se da águia, que simplesmente sobe a uma altitude onde o corvo perde o oxigênio e solta — use cada atrito como espelho: o que me incomoda revela exatamente o que preciso trabalhar. A ferramenta prática para isso é a Caderneta ISAAC.',
        clarityKey:
          'Todo incômodo recorrente é um professor disfarçado ou a semente de um novo projeto esperando investigação lúcida.',
        frameworkTitle: 'Passo a Passo da Caderneta ISAAC (6 Colunas)',
        frameworkItems: [
          '1. Data: Registro temporal para enxergar ciclos e repetições.',
          '2. Fato: O que aconteceu objetivamente, sem adjetivos nem drama.',
          '3. Reação: Qual foi seu impulso imediato (fala, silêncio, explosão ou fuga).',
          '4. Emoção: O sentimento real por baixo da reação (medo, frustração, rejeição, orgulho).',
          '5. Investigação: Qual crença ou expectativa minha foi ferida aqui? O que isso ensina sobre mim?',
          '6. Ação Renovadora: Qual nova postura prática e construtiva escolho adotar a partir de agora?',
        ],
        practicalExercise:
          'Preencha hoje mesmo 1 linha completa das 6 colunas da Caderneta ISAAC sobre o episódio que mais tirou sua paz nos últimos 7 dias.',
      },
    ],
  },

  // =========================================================================
  // VOLUME 08 — PILAR 6: ALINHAMENTO (MODELO DE NEGÓCIO & CULTURA VIVA)
  // =========================================================================
  {
    id: 'vol-08',
    volumeNumber: 8,
    slug: 'pilar-6-alinhamento-modelo-negocio-cultura',
    accentColor: 'stone',
    segmentBadge: '6. ALINHAMENTO • Modelo de Negócio, 17 Perguntas & Cultura',
    title: 'Pilar 6 — ALINHAMENTO: Negócios com Propósito, As 17 Perguntas de Ouro & Cultura Viva',
    subtitle:
      'Como unir atividade econômica, missão de vida e estilo de vida em uma operação coerente, lucrativa e em paz.',
    trelloSources: [
      '6. ALINHAMENTO: #15 Modelo de Negócio, #16 Cultura Organizacional',
      'Gestão Geral: #55 As 17 Perguntas Diagnósticas, Camadas de Consciência, Roteiro Executivo de Consultoria, #54 Salas Temáticas, #52 Parcerias',
    ],
    readingTimeMin: 31,
    suggestedPrice: 'R$ 47,00',
    salesKit: {
      targetAudience:
        'Fundadores, sócios de empresas, consultores empresariais e líderes que precisam alinhar sócios, operação e qualidade de vida sem sacrificar resultados.',
      corePain:
        'Ter um negócio que até fatura, mas rouba a saúde e o convívio familiar ("Pseudo-Alinhado"), divergências entre sócios e cultura organizacional que só existe em quadro na parede.',
      transformationPromise:
        'Alinhar Modelo de Negócio (missão) + Cultura Organizacional (estilo de vida), aplicar o Raio-X das 17 Perguntas Estratégicas ISAAC e conduzir diagnósticos executivos de alto nível.',
      headline:
        'De nada adianta um negócio financeiramente rico que constrói uma rotina miserável: descubra a fórmula do Alinhamento Integral.',
      whatsappCopy:
        'Seu negócio hoje sustenta o estilo de vida que você sonhou ou virou uma prisão elegante? No eBook de fechamento *"Pilar 6 — ALINHAMENTO: Modelo de Negócio, As 17 Perguntas de Ouro & Cultura Viva"*, você aplica o diagnóstico executivo completo do método ISAAC para alinhar propósito, lucro, sócios e rotina diária.',
      deliverables: [
        'Equação Dupla do Alinhamento (Modelo de Negócio = Missão • Cultura = Estilo de Vida)',
        'Diagnóstico das 4 Camadas de Consciência (Bloqueado, Desalinhado, Pseudo-Alinhado e Alinhado)',
        'O Questionário Mestre das 17 Perguntas Estratégicas ISAAC',
        'Roteiro Executivo de Consultoria e Mediação de Sócios + Dinâmica de Salas Temáticas',
      ],
    },
    executiveSummary:
      'Chegamos ao fecho da abóbada do Mapa Mental ISAAC®. Todos os cinco pilares anteriores convergem para uma única pergunta decisiva: sua atividade econômica está a serviço da sua missão e do estilo de vida que você escolheu viver, ou você se tornou refém da própria engrenagem?',
    chapters: [
      {
        number: 1,
        title: 'A Equação Dupla: Modelo de Negócio + Cultura Organizacional',
        coreExplanation:
          'No vocabulário ISAAC, duas expressões ganham definições cristalinas que mudam tudo: (1) Modelo de Negócio é a sua atividade econômica alinhada com seu propósito e missão de vida — o impacto que justifica sua empresa existir; (2) Cultura Organizacional é a sua atividade econômica alinhada com o seu estilo de vida — o ritmo, os valores praticados, os horários, o ambiente humano e as relações reais de segunda a sexta-feira. Quando você copia o modelo de mercado de outra pessoa, pode até ganhar dinheiro, mas constrói uma cultura incompatível com quem você é.',
        clarityKey:
          'Modelo de Negócio alinha o lucro à sua Missão; Cultura Organizacional alinha a operação diária ao seu Estilo de Vida.',
        frameworkTitle: 'As 4 Camadas de Consciência de uma Pessoa ou Empresa',
        frameworkItems: [
          '1. Bloqueado: Sente a dor, mas está paralisado por medo, crença limitante ou exaustão.',
          '2. Desalinhado: Corre em várias direções com muito esforço e baixa coerência entre metas e ações.',
          '3. Pseudo-Alinhado: Aparenta sucesso externo, mas sustenta resultados à custa de saúde, ética ou paz interna.',
          '4. Alinhado: Consciente das próprias escolhas, une propósito, resultado financeiro, aprendizado contínuo e qualidade de vida.',
        ],
        practicalExercise:
          'Com total transparência consigo mesmo, em qual das 4 camadas acima sua vida profissional ou empresa se encontra hoje? O que falta para subir um degrau?',
      },
      {
        number: 2,
        title: 'O Raio-X Mestre: As 17 Perguntas Estratégicas do Ecossistema ISAAC',
        coreExplanation:
          'Para diagnosticar qualquer projeto, carreira ou empresa em menos de uma hora sem deixar pontos cegos, percorra na ordem exata as 17 perguntas-guia que conectam todos os módulos do Mapa Mental ISAAC.',
        clarityKey:
          'Boas respostas dependem de perguntas completas: uma única pergunta ignorada costuma esconder exatamente o gargalo que trava todo o resto.',
        frameworkTitle: 'Checklist Executivo das 17 Perguntas ISAAC',
        frameworkItems: [
          '1 [Produto] Já tem produto/serviço claro? • 2 [Projeto] Qual problema real resolve? • 3 [Marca] Qual transformação humana e social entrega?',
          '4 [Finanças] Gera receita para o estilo de vida desejado? • 5 [Tempo] Dedica o tempo ideal? • 6 [Pessoas] Tem a equipe certa para atender e crescer? • 7 [Materiais] Possui as ferramentas necessárias?',
          '8 [Público] Seu público valoriza e admira seu trabalho? • 9 [Venda] Qual sua taxa e tempo de conversão sem desgaste excessivo? • 10 [Comunicação] Domina tráfego e canais?',
          '11 [Experiência] A transformação é medida e percebida? • 12 [Entrega] Quantos já saíram transformados e em quanto tempo? • 13 [Distribuição] Seu canal de entrega é fluido?',
          '14 [CHACRAS] Sabe quais competências e valores precisa lapidar? • 15 [SINA] Tem trilha clara de aprendizado? • 16 [Plano 10 Anos] Metas de longo prazo estão definidas? • 17 [Cultura] Os valores são vividos na prática diária?',
        ],
        practicalExercise:
          'Responda SIM, PARCIAL ou NÃO para cada uma das 17 perguntas acima. Todo "NÃO" aponta diretamente qual volume desta coleção você deve aplicar em seguida.',
      },
      {
        number: 3,
        title: 'Consultoria, Mediação de Sócios & Força de Comunidade',
        coreExplanation:
          'Quando aplicar este alinhamento em equipes, consultorias ou salas temáticas de cocriação, comece ouvindo individualmente a visão dos decisores e gestores antes de propor ferramentas. Onde houver divergência entre sócios, exponha cenários claros de causa e efeito, prós e contras, mediando um acordo maduro. Lembre sempre de uma lei sistêmica fundamental: cada boa solução implantada inaugura um novo nível de problema mais sofisticado (crescer vendas exige mais entrega; crescer equipe exige mais liderança). Por fim, acelere sua jornada conectando parceiros estratégicos — de proteção de marca a tecnologia e educação — para crescer em rede colaborativa.',
        clarityKey:
          'Problemas nunca acabam; eles mudam de patamar. O objetivo do alinhamento não é uma vida sem desafios, mas escolher conscientemente desafios que valem a pena resolver.',
        frameworkTitle: 'Roteiro de Alinhamento Coletivo em 4 Atos',
        frameworkItems: [
          '1. Escuta Multiperspectiva: Levantar objetivos e dores reais dos sócios, líderes e equipe.',
          '2. Análise Estratégica Integrada: Cruzar SWOT, cenário externo (PESTEL) e priorização GUT.',
          '3. Dinâmica de Sala Temática: Fala objetiva (máx. 2 min por pessoa) encerrada sempre com uma pergunta construtiva.',
          '4. Compromisso em Ciclos: Transformar o consenso em Plano de 4 Semanas com indicadores vivos.',
        ],
        practicalExercise:
          'Defina hoje os 3 acordos inegociáveis da sua Cultura Pessoal ou Organizacional — aquilo de que você não abre mão em nenhuma negociação.',
      },
    ],
  },
];

// =========================================================================
// CONSTRUÇÃO UNIFICADA DO CATÁLOGO BILÍNGUE ENRIQUECIDO (PT-BR + EN-GB)
// =========================================================================
export const ENRICHED_EBOOKS_CATALOG = SUPERADMIN_EBOOKS.map((vol) => {
  const enVol = EBOOKS_EN_GB[vol.id] || {};
  const visual = VOLUME_VISUAL_SPEC[vol.id] || {};
  const chapDeepMap = CHAPTER_DEEP_ENRICHMENT[vol.id] || {};

  const enrichedChaptersPt = (vol.chapters || []).map((ch) => {
    const deep = chapDeepMap[ch.number] || {};
    return {
      ...ch,
      deepParagraphs: deep.deepPt || [],
      caseStudy: deep.casePt || '',
    };
  });

  const enrichedChaptersEn = (enVol.chapters || []).map((ch) => {
    const deep = chapDeepMap[ch.number] || {};
    return {
      ...ch,
      deepParagraphs: deep.deepEn || [],
      caseStudy: deep.caseEn || '',
    };
  });

  return {
    ...vol,
    price: EBOOK_STORE_PRICING.individualPrice,
    suggestedPrice: 'R$ 19,90',
    formattedPrice: 'R$ 19,90',
    bilingualBadge: 'Português + Inglês Britânico no mesmo PDF',
    authorName: AUTHOR_PROFILE.name,
    authorRole: AUTHOR_PROFILE.rolePt,
    coverUrl: `/ebooks/covers/${visual.coverFile || `${vol.id}.jpg`}`,
    illustrationUrl: `/ebooks/illustrations/${visual.illustrationFile || `ilus-0${vol.volumeNumber}.jpg`}`,
    salesPagePath: `/loja/ebooks/${vol.slug}`,
    visualSpec: visual,
    chapters: enrichedChaptersPt,
    enGb: {
      ...enVol,
      chapters: enrichedChaptersEn,
    },
  };
});

export const COMPLETE_BUNDLE_PRODUCT = {
  id: 'bundle-all-8',
  isBundle: true,
  volumeNumber: 0,
  slug: 'colecao-completa',
  segmentBadge: 'Promoção Especial • 30% de Desconto',
  accentColor: 'amber',
  title: 'Coleção Completa ISAAC® Essential — Todos os 8 eBooks em 1 Arquivo Único PDF',
  subtitle:
    'A obra completa de Thiago Prata reunida em um único PDF Bilíngue (Português + Inglês Britânico): Fundamentos, Mente & IA, Core, Recursos, Mercado, Logística, Aprendizado e Alinhamento.',
  enTitle: 'Complete ISAAC® Essential Collection — All 8 Bilingual eBooks in a Single Master PDF',
  enSubtitle:
    'All 8 volumes by Thiago Prata united inside a single comprehensive Bilingual PDF (Portuguese + British English) with 30% instant savings.',
  price: EBOOK_STORE_PRICING.bundlePrice, // 111.44
  originalPrice: EBOOK_STORE_PRICING.fullRetailTotal, // 159.20
  discountPercent: EBOOK_STORE_PRICING.bundleDiscountPercent, // 30
  savingsAmount: EBOOK_STORE_PRICING.bundleSavings, // 47.76
  formattedPrice: 'R$ 111,44',
  formattedOriginalPrice: 'R$ 159,20',
  bilingualBadge: 'Edição Completa Bilíngue (PT-BR + EN-GB) • Arquivo Único PDF',
  authorName: AUTHOR_PROFILE.name,
  authorRole: AUTHOR_PROFILE.rolePt,
  coverUrl: '/ebooks/covers/colecao-completa.jpg',
  illustrationUrl: '/ebooks/illustrations/ilus-08.jpg',
  salesPagePath: '/loja/ebooks/colecao-completa',
  readingTimeMin: ENRICHED_EBOOKS_CATALOG.reduce((acc, v) => acc + (v.readingTimeMin || 28), 0),
  salesKit: {
    targetAudience:
      'Leitores, empreendedores, líderes e mentorados que desejam dominar toda a Metodologia ISAAC® de Thiago Prata de ponta a ponta economizando 30%.',
    corePain:
      'Ter peças soltas de conhecimento sem enxergar como vida pessoal, mente, posicionamento, finanças, vendas, processos e cultura se conectam em um único sistema.',
    transformationPromise:
      'Receber em um único arquivo PDF ricamente ilustrado e bilíngue todos os 8 volumes, 30 capítulos aprofundados, diagramas visuais, exercícios práticos e dedicatória personalizada.',
    headline:
      'Leve toda a sabedoria prática da Coleção ISAAC® Essential em um Arquivo Único PDF com 30% de desconto imediato.',
    whatsappCopy:
      'Quer ter em mãos a obra completa da *Metodologia ISAAC®* escrita pelo mentor *Thiago Prata*? Na *Coleção Completa (8 eBooks em 1 PDF Único Bilíngue PT-BR + Inglês Britânico)*, você garante todos os 8 volumes ilustrados com *30% de desconto* (de R$ 159,20 por *R$ 111,44*) e recebe seu exemplar dedicado automaticamente no e-mail e no WhatsApp!',
    enWhatsappCopy:
      'Would you like the complete *ISAAC® Methodology* authored by mentor *Thiago Prata* in one place? With the *Complete Collection (All 8 Bilingual eBooks in 1 Master PDF — Portuguese & British English)*, you unlock every illustrated volume with *30% OFF* and receive your personally dedicated edition straight to your email and WhatsApp!',
    deliverables: ENRICHED_EBOOKS_CATALOG.map(
      (v) => `Vol. 0${v.volumeNumber} — ${v.title} (PT-BR & British English)`
    ),
  },
};

export function findEbookProductBySlug(slug = '') {
  const clean = String(slug || '').trim().toLowerCase();
  if (!clean) return null;
  if (clean === 'colecao-completa' || clean === 'bundle-all-8' || clean === 'todos') {
    return COMPLETE_BUNDLE_PRODUCT;
  }
  return (
    ENRICHED_EBOOKS_CATALOG.find(
      (v) => v.slug.toLowerCase() === clean || v.id.toLowerCase() === clean
    ) || null
  );
}

export function getPublicEbooksStorePayload(baseUrl = 'https://isaac.lynxems.com.br') {
  const cleanBase = String(baseUrl || 'https://isaac.lynxems.com.br').replace(/\/$/, '');
  return {
    meta: EBOOK_COLLECTION_META,
    author: {
      ...AUTHOR_PROFILE,
      photoUrl: `${cleanBase}/ebooks/thiago-prata.jpg`,
    },
    pricing: EBOOK_STORE_PRICING,
    bundle: {
      ...COMPLETE_BUNDLE_PRODUCT,
      fullCoverUrl: `${cleanBase}${COMPLETE_BUNDLE_PRODUCT.coverUrl}`,
      fullSalesUrl: `${cleanBase}${COMPLETE_BUNDLE_PRODUCT.salesPagePath}`,
    },
    ebooks: ENRICHED_EBOOKS_CATALOG.map((v) => ({
      id: v.id,
      volumeNumber: v.volumeNumber,
      slug: v.slug,
      segmentBadge: v.segmentBadge,
      accentColor: v.accentColor,
      title: v.title,
      subtitle: v.subtitle,
      enTitle: v.enGb?.title || '',
      enSubtitle: v.enGb?.subtitle || '',
      price: v.price,
      formattedPrice: v.formattedPrice,
      bilingualBadge: v.bilingualBadge,
      readingTimeMin: v.readingTimeMin,
      authorName: v.authorName,
      authorRole: v.authorRole,
      coverUrl: v.coverUrl,
      fullCoverUrl: `${cleanBase}${v.coverUrl}`,
      illustrationUrl: v.illustrationUrl,
      fullIllustrationUrl: `${cleanBase}${v.illustrationUrl}`,
      salesPagePath: v.salesPagePath,
      fullSalesUrl: `${cleanBase}${v.salesPagePath}`,
      executiveSummary: v.executiveSummary,
      enExecutiveSummary: v.enGb?.executiveSummary || '',
      salesKit: {
        ...v.salesKit,
        enWhatsappCopy: v.enGb?.salesKit?.whatsappCopy || '',
        enHeadline: v.enGb?.salesKit?.headline || '',
      },
      chaptersPreview: v.chapters.map((c) => ({
        number: c.number,
        title: c.title,
        frameworkTitle: c.frameworkTitle,
      })),
      enChaptersPreview: (v.enGb?.chapters || []).map((c) => ({
        number: c.number,
        title: c.title,
        frameworkTitle: c.frameworkTitle,
      })),
      chapterCount: v.chapters.length,
    })),
  };
}


