import React, { useState } from 'react';
import {
  HelpCircle,
  Users,
  Heart,
  Compass,
  BookOpen,
  Sliders,
  Volume2,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Feather,
  Info,
  Layers,
  FileText,
  Lock,
  Radio,
  Mic,
  MessageSquare,
  History,
  FolderKanban,
  Upload,
  Cpu,
} from 'lucide-react';

export default function AdminHelpGuide() {
  const [copiedCmd, setCopiedCmd] = useState('');
  const [openSections, setOpenSections] = useState({
    users: true,
    memories: true,
    sessions: true,
    guided: true,
    groups: true,
    broadcast: true,
    agents: false,
    knowledge: false,
    voice: false,
    vps: false,
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(''), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* CABEÇALHO DO GUIA */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-stone-900 via-slate-900 to-stone-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-serif">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Painel de Governança & Manual Operacional do Administrador</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-medium text-stone-100">
              Manual Completo do Superadmin
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 font-serif max-w-3xl leading-relaxed">
              Documentação técnica e operacional detalhada da Mentoria ISAAC. Abrange a gestão de usuários e níveis de acesso, sessões com memória unificada, conversas direcionadas com roteiro de perguntas, grupos com classificação N:N, disparos de áudio e texto, mentores especialistas e infraestrutura de produção.
            </p>
          </div>
          <div className="w-16 h-16 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <Feather className="w-8 h-8 text-teal-300 stroke-[1.5]" />
          </div>
        </div>
      </div>

      {/* ÍNDICE RÁPIDO EM CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { id: 'users', label: '1. Usuários & Níveis', icon: Users, color: 'text-teal-700 dark:text-teal-400' },
          { id: 'memories', label: '2. Memória Psicológica', icon: Heart, color: 'text-rose-700 dark:text-rose-400' },
          { id: 'sessions', label: '3. Múltiplas Sessões', icon: History, color: 'text-emerald-700 dark:text-emerald-400' },
          { id: 'guided', label: '4. Conversas Direcionadas', icon: Compass, color: 'text-amber-700 dark:text-amber-400' },
          { id: 'groups', label: '5. Grupos de Usuários', icon: Layers, color: 'text-indigo-700 dark:text-indigo-400' },
          { id: 'broadcast', label: '6. Disparos de Áudio & Texto', icon: Radio, color: 'text-pink-700 dark:text-pink-400' },
          { id: 'agents', label: '7. Multi-Agentes', icon: Sliders, color: 'text-teal-700 dark:text-teal-400' },
          { id: 'knowledge', label: '8. Base de Conhecimento', icon: BookOpen, color: 'text-blue-700 dark:text-blue-400' },
          { id: 'voice', label: '9. Voz & Áudio Ducking', icon: Volume2, color: 'text-violet-700 dark:text-violet-400' },
          { id: 'vps', label: '10. Deploy & Easypanel', icon: Terminal, color: 'text-stone-700 dark:text-stone-300' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                setOpenSections((prev) => ({ ...prev, [item.id]: true }));
                document.getElementById(`section-${item.id}`)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 text-left hover:border-teal-600 transition shadow-sm flex flex-col gap-2 cursor-pointer active:scale-98"
            >
              <Icon className={`w-4 h-4 ${item.color}`} />
              <span className="text-xs font-serif font-medium text-stone-800 dark:text-stone-200">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* SEÇÃO 1: GESTÃO DE USUÁRIOS E PAPÉIS */}
      <div id="section-users" className="rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('users')}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-slate-750 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 text-teal-800 dark:text-teal-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-50">
                1. Gestão de Usuários e Níveis de Acesso
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Estrutura de papéis (RBAC) e segurança por linha no banco de dados (Row Level Security)
              </p>
            </div>
          </div>
          {openSections.users ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
        </button>

        {openSections.users && (
          <div className="p-5 sm:p-6 pt-0 space-y-4 border-t border-stone-100 dark:border-slate-700/60 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-serif leading-relaxed">
            <p>
              A Mentoria ISAAC implementa três papéis de usuário com isolamento garantido por políticas de RLS no PostgreSQL (Supabase):
            </p>

            <div className="grid sm:grid-cols-3 gap-3 my-3">
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
                <span className="font-semibold text-teal-800 dark:text-teal-400 text-xs uppercase tracking-wider block">
                  Papel: user
                </span>
                <p className="text-xs mt-1 text-stone-600 dark:text-stone-300">
                  <strong>Usuário Comum:</strong> Acessa o app, conversa com os mentores por texto ou áudio, participa de conversas direcionadas e visualiza apenas suas próprias sessões e notificações. <em>Não acessa o painel admin.</em>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
                <span className="font-semibold text-teal-800 dark:text-teal-400 text-xs uppercase tracking-wider block">
                  Papel: admin
                </span>
                <p className="text-xs mt-1 text-stone-600 dark:text-stone-300">
                  <strong>Gerente de Mentoria:</strong> Acessa a rota <code>/admin</code>. Visualiza lista de membros, acompanha memórias de sessões, cria novos mentores e anexa materiais de estudo técnicos.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
                <span className="font-semibold text-amber-700 dark:text-amber-400 text-xs uppercase tracking-wider block">
                  Papel: superadmin / master
                </span>
                <p className="text-xs mt-1 text-stone-600 dark:text-stone-300">
                  <strong>Super Administrador:</strong> Acesso total irrevogável. Pode criar e editar grupos de usuários, realizar disparos de texto e áudio, publicar conversas direcionadas e alterar permissões de outros administradores.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-800/40 text-xs text-teal-900 dark:text-teal-200">
              <strong>💡 Como alterar o papel de um usuário:</strong> Na aba <em>"Usuários"</em>, utilize a caixa seletora na coluna de Papel correspondente ao usuário. A alteração no Supabase entra em vigor no mesmo instante.
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO 2: MEMÓRIA PSICOLÓGICA DE LONGO PRAZO */}
      <div id="section-memories" className="rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('memories')}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-slate-750 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-rose-700/10 dark:bg-rose-500/15 border border-rose-700/20 text-rose-800 dark:text-rose-400 flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-50">
                2. Sistema de Memória Psicológica & RAG (pgvector 768d)
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Extração autônoma de bloqueios, crenças e metas com busca vetorial por similaridade de cosseno
              </p>
            </div>
          </div>
          {openSections.memories ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
        </button>

        {openSections.memories && (
          <div className="p-5 sm:p-6 pt-0 space-y-4 border-t border-stone-100 dark:border-slate-700/60 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-serif leading-relaxed">
            <p>
              O ecossistema ISAAC possui uma <strong>Arquitetura Cognitiva em Background</strong> com retenção duradoura:
            </p>

            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <strong>Extração Desacoplada:</strong> O backend responde prontamente à mensagem do usuário para não gerar latência no chat. Em seguida, um processo em segundo plano analisa a mensagem e isola dados psicológicos profundos.
              </li>
              <li>
                <strong>Vetorização em 768 Dimensões:</strong> O fato psicológico é transformado em vetor semântico através do modelo <code>text-embedding-004</code> (ou <code>gemini-embedding-001</code>) e armazenado na tabela <code>izaque_user_memories</code> via extensão <code>pgvector</code>.
              </li>
              <li>
                <strong>Resgate por Cosseno:</strong> Em qualquer nova conversa, a procedure <code>izaque_match_memories</code> consulta o repositório vetorial filtrando pelo <code>user_id</code> e injeta as lembranças mais pertinentes no contexto do mentor.
              </li>
            </ol>

            <h4 className="font-semibold text-stone-900 dark:text-stone-100 pt-2">
              As 4 Categorias de Memória Extraídas:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40">
                <span className="font-semibold text-red-800 dark:text-red-300 block">bloqueio (blocker)</span>
                <span className="text-[11px] text-stone-600 dark:text-stone-400">Medo paralisante ou trava emocional</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                <span className="font-semibold text-amber-800 dark:text-amber-300 block">crença (belief)</span>
                <span className="text-[11px] text-stone-600 dark:text-stone-400">Ideia limitante sobre capacidade ou valor</span>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40">
                <span className="font-semibold text-indigo-800 dark:text-indigo-300 block">padrão (pattern)</span>
                <span className="text-[11px] text-stone-600 dark:text-stone-400">Ciclo repetitivo ou autossabotagem</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                <span className="font-semibold text-emerald-800 dark:text-emerald-300 block">meta (goal)</span>
                <span className="text-[11px] text-stone-600 dark:text-stone-400">Objetivo autêntico e prioridade de vida</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO 3: MÚLTIPLAS SESSÕES COM MEMÓRIA GLOBAL UNIFICADA */}
      <div id="section-sessions" className="rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('sessions')}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-slate-750 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-700/10 dark:bg-emerald-500/15 border border-emerald-700/20 text-emerald-800 dark:text-emerald-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-50">
                3. Múltiplas Sessões & Memória Unificada dos Mentores
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Organização visual em tópicos para o usuário mantendo a onisciência contínua dos mentores
              </p>
            </div>
          </div>
          {openSections.sessions ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
        </button>

        {openSections.sessions && (
          <div className="p-5 sm:p-6 pt-0 space-y-4 border-t border-stone-100 dark:border-slate-700/60 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-serif leading-relaxed">
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-955/30 border border-emerald-200/80 dark:border-emerald-800/40 text-xs text-emerald-950 dark:text-emerald-200">
              <strong>Princípio Arquitetural Fundamental:</strong> A separação em sessões/conversas existe <em>estritamente sob a perspectiva do usuário</em> para que ele possa organizar seus desabafos e tópicos (ex.: "Finanças de Janeiro", "Superação de Ansiedade", "Família"). Do ponto de vista dos mentores (Isaac, Renato, Marcus, Helena, Pastor João), a memória é <strong>global, contínua e indivisível</strong>.
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
                <strong className="text-stone-900 dark:text-stone-100 block mb-1">
                  1. Gaveta Lateral de Conversas (Drawer)
                </strong>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  O usuário pode abrir o histórico de conversas clicando no ícone de balão no topo da tela. Ele visualiza suas conversas anteriores, data de atualização, botão de iniciar nova reflexão em branco, opção de renomear títulos e exclusão com segurança.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
                <strong className="text-stone-900 dark:text-stone-100 block mb-1">
                  2. Auto-Titulação Inteligente
                </strong>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Ao criar uma sessão vazia ("Nova Reflexão"), assim que o usuário digita ou fala a primeira mensagem, o backend atualiza automaticamente o título da conversa com os primeiros 32 caracteres daquele assunto, dispensando digitação manual.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
                <strong className="text-stone-900 dark:text-stone-100 block mb-1">
                  3. Como a Memória Global Opera no Banco
                </strong>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  A tabela <code>public.izaque_messages</code> armazena a coluna <code>session_id</code> para carregar o histórico de tela da conversa ativa. No entanto, as memórias em <code>public.izaque_user_memories</code> e a procedure RAG <code>izaque_match_memories</code> são indexadas exclusivamente por <code>user_id</code>. Fatos compartilhados em uma sessão são instantaneamente lembrados pelo mentor em todas as demais sessões.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO 4: CONVERSAS DIRECIONADAS & ROTEIRO DE PERGUNTAS */}
      <div id="section-guided" className="rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('guided')}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-slate-750 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-700/10 dark:bg-amber-500/15 border border-amber-700/20 text-amber-800 dark:text-amber-400 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-50">
                4. Conversas Direcionadas Oficiais & Roteiro de Perguntas
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Criação de jornadas temáticas pelo Superadmin visíveis para todos os usuários do sistema
              </p>
            </div>
          </div>
          {openSections.guided ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
        </button>

        {openSections.guided && (
          <div className="p-5 sm:p-6 pt-0 space-y-4 border-t border-stone-100 dark:border-slate-700/60 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-serif leading-relaxed">
            <p>
              As <strong>Conversas Direcionadas</strong> são trilhas de reflexão estruturadas que o Superadmin cria na aba <em>"Conversas Direcionadas"</em> do painel e disponibiliza para toda a base de membros.
            </p>

            <div className="grid sm:grid-cols-2 gap-3 my-2">
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
                <span className="font-semibold text-stone-900 dark:text-stone-100 text-xs block mb-1">
                  O que compõe um Tema Direcionado:
                </span>
                <ul className="list-disc pl-4 space-y-1 text-xs text-stone-600 dark:text-stone-400">
                  <li><strong>Título do Tema:</strong> Ex.: <em>Superação da Procrastinação & Foco</em>.</li>
                  <li><strong>Descrição Orientadora:</strong> O objetivo ou acolhimento inicial.</li>
                  <li><strong>Categoria:</strong> Foco, Sobriedade, Finanças, Espiritualidade, etc.</li>
                  <li><strong>Mentor Recomendado:</strong> Seleção do especialista que conduzirá (Renato, Isaac, etc.).</li>
                  <li><strong>Ícone Visual:</strong> Bússola, Raio, Escudo, Coração, Gráfico, etc.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
                <span className="font-semibold text-stone-900 dark:text-stone-100 text-xs block mb-1">
                  Roteiro de Perguntas do Tema:
                </span>
                <p className="text-xs text-stone-600 dark:text-stone-400 mb-2">
                  O Superadmin cadastra a sequência exata de perguntas reflexivas para o tema.
                </p>
                <ul className="list-disc pl-4 space-y-1 text-xs text-stone-600 dark:text-stone-400">
                  <li>Adicionar, reordenar (subir/descer) e editar o texto das perguntas.</li>
                  <li>As perguntas aparecem para o usuário no chat como <strong>botões clicáveis</strong> acima do campo de envio.</li>
                  <li>Ao tocar na pergunta, ela é enviada imediatamente ao mentor responsável.</li>
                </ul>
              </div>
            </div>

            {/* DESTAQUE: PRIORIDADE MÁXIMA DE CONDUÇÃO DO AGENTE */}
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-semibold text-xs">
                <Compass className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span>Prioridade Absoluta de Direcionamento do Agente (Protocolo do Superadmin)</span>
              </div>
              <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                Nas conversas direcionadas, o agente de IA recebe uma instrução de sistema com <strong>prioridade máxima e inegociável</strong>: conduzir a interação com base nas perguntas cadastradas pelo Superadmin:
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-stone-700 dark:text-stone-300">
                <li>
                  <strong>Ponte Empática (Acolher & Direcionar):</strong> O mentor acolhe com calor humano a resposta ou desabafo do usuário (1 a 2 parágrafos empáticos) e, em seguida, realiza uma transição natural e imediata para a próxima pergunta do roteiro.
                </li>
                <li>
                  <strong>Firmeza contra Evasões e Dispersões:</strong> Se o usuário fugir do assunto ou divagar, o mentor não perde o foco. Valida o sentimento, mas gentilmente reconduz a atenção do usuário para a pergunta prioritária definida pelo Superadmin.
                </li>
                <li>
                  <strong>Condução Passo a Passo:</strong> O agente nunca despeja todas as perguntas de uma vez como um questionário frio. Ele conduz uma pergunta por vez, esperando o usuário aprofundar antes de avançar.
                </li>
                <li>
                  <strong>Leitura Contínua de Progresso:</strong> O motor analisa as mensagens anteriores para identificar quais perguntas do roteiro já foram respondidas e focar na próxima pendente.
                </li>
                <li>
                  <strong>Fechamento Prático:</strong> Ao contemplar todas as perguntas, o mentor sintetiza os aprendizados e define um compromisso prático para as próximas 24 horas.
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-800/40 text-xs text-teal-900 dark:text-teal-200">
              <strong>Como o usuário interage:</strong> No Espaço de Reflexão, os temas aparecem na seção superior da gaveta lateral. Ao selecionar um tema, o sistema instancia uma nova conversa vinculada àquele tema (com <code>guided_conversation_id</code>), seleciona o mentor recomendado, exibe a tarja de Conversa Direcionada e renderiza os botões das perguntas do Superadmin prontos para uso.
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO 5: GRUPOS DE USUÁRIOS & CLASSIFICAÇÃO N:N */}
      <div id="section-groups" className="rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('groups')}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-slate-750 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-700/10 dark:bg-indigo-500/15 border border-indigo-700/20 text-indigo-800 dark:text-indigo-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-50">
                5. Grupos de Usuários & Classificação (Relação N:N)
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Segmentação de usuários em múltiplos grupos com controle de membros e identificação visual
              </p>
            </div>
          </div>
          {openSections.groups ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
        </button>

        {openSections.groups && (
          <div className="p-5 sm:p-6 pt-0 space-y-4 border-t border-stone-100 dark:border-slate-700/60 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-serif leading-relaxed">
            <p>
              A aba <strong>"Grupos & Disparos"</strong> permite ao Superadmin criar grupos personalizados para direcionar comunicados e classificar a base de usuários.
            </p>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
                <strong className="text-stone-900 dark:text-stone-100 block mb-1">
                  1. Relação Muitos-para-Muitos (N:N)
                </strong>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Um mesmo usuário pode pertencer a <strong>quantos grupos você desejar simultaneamente</strong>. Por exemplo, o usuário Marcos pode fazer parte ao mesmo tempo dos grupos <em>"Sobriedade & Recuperação"</em>, <em>"Assinantes VIP Pro"</em> e <em>"Liderança"</em>. A tabela de junção <code>public.izaque_user_group_members</code> gerencia essa associação com unicidade (<code>group_id, user_id</code>).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
                <strong className="text-stone-900 dark:text-stone-100 block mb-1">
                  2. Duas Formas Práticas de Classificar Membros
                </strong>
                <ul className="list-disc pl-4 space-y-1 text-xs text-stone-600 dark:text-stone-400">
                  <li><strong>Pelo Card do Grupo:</strong> Clique em <em>"Gerenciar Membros"</em> dentro de qualquer grupo para ver quem já está nele e adicionar/remover outros usuários com busca por nome ou e-mail.</li>
                  <li><strong>Pela Lista Rápida de Usuários:</strong> Na seção inferior da aba de grupos, clique no botão <em>"Classificar Grupos"</em> ao lado de qualquer usuário para marcar com caixas de seleção todos os grupos aos quais ele deve pertencer.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
                <strong className="text-stone-900 dark:text-stone-100 block mb-1">
                  3. Identificação Visual com Paleta de Cores
                </strong>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Cada grupo pode ter uma cor exclusiva (Esmeralda, Azul, Roxo, Âmbar, Rosa, Índigo, etc.) que facilita o reconhecimento rápido dos segmentos no painel administrativo.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO 6: DISPARO DE TEXTO & ÁUDIO POR GRUPO */}
      <div id="section-broadcast" className="rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('broadcast')}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-slate-750 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-pink-700/10 dark:bg-pink-500/15 border border-pink-700/20 text-pink-800 dark:text-pink-400 flex items-center justify-center">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-50">
                6. Disparo de Texto e Áudios por Grupo (Com Deduplicação)
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Gravação de voz no navegador, upload de áudio, entrega in-app e garantia de recebimento único
              </p>
            </div>
          </div>
          {openSections.broadcast ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
        </button>

        {openSections.broadcast && (
          <div className="p-5 sm:p-6 pt-0 space-y-4 border-t border-stone-100 dark:border-slate-700/60 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-serif leading-relaxed">
            <p>
              O sistema de <strong>Disparo por Grupo</strong> permite ao mentor enviar orientações em texto e mensagens gravadas na sua própria voz diretamente aos seus grupos segmentados.
            </p>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
                <strong className="text-stone-900 dark:text-stone-100 block mb-1">
                  1. Gravação Direta pelo Microfone ou Upload de Arquivo
                </strong>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Você pode clicar em <em>"Gravar Voz com Microfone"</em> para registrar um áudio espontâneo com cronômetro em tempo real, ou fazer o upload de um arquivo de áudio pré-gravado (<code>.mp3</code>, <code>.wav</code>, <code>.m4a</code>, <code>.webm</code>). O áudio é armazenado automaticamente no bucket público <code>broadcasts</code> do Supabase Storage.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
                <strong className="text-stone-900 dark:text-stone-100 block mb-1">
                  2. Deduplicação Inteligente de Destinatários
                </strong>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Ao selecionar dois ou mais grupos de destino (ex.: <em>"Sobriedade"</em> e <em>"VIP Pro"</em>), se houver membros que pertençam a ambos os grupos, o backend executa uma consulta <code>DISTINCT</code> sobre os IDs dos membros. O usuário recebe a notificação <strong>apenas uma única vez</strong>, evitando mensagens duplicadas ou incômodas.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
                <strong className="text-stone-900 dark:text-stone-100 block mb-1">
                  3. Como o Usuário Ouve a Mensagem (In-App Player)
                </strong>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Os usuários dos grupos contemplados veem um indicador pulsante no ícone de sino (<code>Bell</code>) na barra superior do aplicativo. Ao abrir o mural de comunicados, ele pode ler a mensagem e <strong>dar Play diretamente no player de áudio integrado</strong>, ouvindo a voz do mentor com controle de reprodução e progresso.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO 7: MULTI-AGENTES E ORQUESTRADOR DINÂMICO */}
      <div id="section-agents" className="rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('agents')}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-slate-750 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 text-teal-800 dark:text-teal-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-50">
                7. Orquestrador Central Multi-Agente & Roteamento Inteligente
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Como o orquestrador Hermes escolhe o especialista certo sem quebrar a serenidade do usuário
              </p>
            </div>
          </div>
          {openSections.agents ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
        </button>

        {openSections.agents && (
          <div className="p-5 sm:p-6 pt-0 space-y-4 border-t border-stone-100 dark:border-slate-700/60 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-serif leading-relaxed">
            <p>
              O sistema conta com o orquestrador <strong>Hermes</strong>. Quando a seleção de mentor está no modo automático (<code>auto</code>), o Hermes analisa o sentimento da mensagem e direciona:
            </p>

            <div className="grid sm:grid-cols-2 gap-3 my-2">
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
                <span className="font-semibold text-stone-900 dark:text-stone-100 text-xs block">
                  Isaac Master (<code>izaque-master</code>)
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  Mentor principal. Foco em inteligência emocional, foco, superação da procrastinação e decisões estratégicas de vida.
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
                <span className="font-semibold text-stone-900 dark:text-stone-100 text-xs block">
                  Renato — Sobriedade (<code>renato-sobriedade</code>)
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  Especialista em manejo de fissura, prevenção de recaída, enfrentamento de gatilhos sociais e suporte para dependência química e alcoolismo.
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
                <span className="font-semibold text-stone-900 dark:text-stone-100 text-xs block">
                  Pastor João — Bíblico (<code>pastor-joao-biblico</code>)
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  Aconselhamento fundamentado nas Escrituras Sagradas, oração pastoral, consolação na aflição e direção pela fé.
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
                <span className="font-semibold text-stone-900 dark:text-stone-100 text-xs block">
                  Dr. Marcus — Financeiro (<code>mentor-financeiro</code>)
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  Quebra de crenças de escassez, valorização do trabalho, precificação e mentalidade de abundância prática.
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
              <strong className="text-stone-900 dark:text-stone-100 block mb-1">
                Ajuste de Temperatura (Criatividade vs Rigor)
              </strong>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Na aba <em>"Mentores & Estudos"</em> você pode calibrar a temperatura de cada agente:
              </p>
              <ul className="list-disc pl-4 mt-1 space-y-1 text-xs text-stone-600 dark:text-stone-400">
                <li><code>0.40 - 0.50</code>: Máxima precisão e rigor literal. Recomendado para teologia, normas financeiras e protocolos de sobriedade.</li>
                <li><code>0.60 - 0.70</code>: Equilíbrio humanizado ideal. Empatia conversacional, escuta atenta e autoridade acolhedora.</li>
                <li><code>0.80+</code>: Criatividade expandida e metáforas mais abertas.</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO 8: BASE DE CONHECIMENTO & ESTUDOS (RAG DE DOMÍNIO) */}
      <div id="section-knowledge" className="rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('knowledge')}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-slate-750 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-700/10 dark:bg-blue-500/15 border border-blue-700/20 text-blue-800 dark:text-blue-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-50">
                8. Base de Conhecimento & Estudos Técnicos (Documentos do Agente)
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Como ensinar metodologias e materiais técnicos aos mentores especialistas
              </p>
            </div>
          </div>
          {openSections.knowledge ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
        </button>

        {openSections.knowledge && (
          <div className="p-5 sm:p-6 pt-0 space-y-4 border-t border-stone-100 dark:border-slate-700/60 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-serif leading-relaxed">
            <p>
              Qualquer mentor pode receber materiais complementares de estudo para embasar suas respostas com profundidade técnica:
            </p>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
                <span><strong>Formatos Aceitos:</strong> Arquivos em <code>.pdf</code>, <code>.txt</code>, <code>.md</code> ou inserção direta via editor de texto.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
                <span><strong>Fragmentação e Vetorização:</strong> O backend divide o documento em fragmentos com sobreposição de contexto para garantir coerência semântica e gera os vetores no banco.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
                <span><strong>Injeção por Relevância:</strong> Quando o usuário aborda um tópico presente nos materiais de estudo, a procedure <code>izaque_match_agent_knowledge</code> recupera os trechos exatos e os anexa ao prompt do mentor.</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO 9: VOZ HUMANIZADA & CACHE DE ÁUDIO */}
      <div id="section-voice" className="rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('voice')}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-slate-750 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-violet-700/10 dark:bg-violet-500/15 border border-violet-700/20 text-violet-800 dark:text-violet-400 flex items-center justify-center">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-50">
                9. Voz Humanizada, Áudio Ducking & Cache no Supabase
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                O mecanismo de escuta terapêutica e como o cache reduz custos de síntese de voz a zero
              </p>
            </div>
          </div>
          {openSections.voice ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
        </button>

        {openSections.voice && (
          <div className="p-5 sm:p-6 pt-0 space-y-4 border-t border-stone-100 dark:border-slate-700/60 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-serif leading-relaxed">
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
                <strong className="text-stone-900 dark:text-stone-100 block mb-1">
                  1. A Mágica das Reticências (...)
                </strong>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Para que a voz não soe mecânica ou apressada, os prompts instruem o uso de reticências estratégicas. Os sintetizadores neurais interpretam as reticências como pausas respiratórias de ~1 segundo, simulando a escuta compassiva de um mentor de carne e osso.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
                <strong className="text-stone-900 dark:text-stone-100 block mb-1">
                  2. Cache Permanente no Supabase Storage (`audio_cache`)
                </strong>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Cada resposta sintetizada recebe uma assinatura SHA-256 e o arquivo MP3 é guardado no bucket <code>audio_cache</code>. Execuções repetidas da mesma fala são servidas diretamente da CDN do storage em milissegundos sem custo de API.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
                <strong className="text-stone-900 dark:text-stone-100 block mb-1">
                  3. Áudio Ducking Dinâmico (Web Audio API)
                </strong>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Quando a trilha sonora de 432 Hz ou o som de chuva estão ativos, a Web Audio API reduz suavemente o volume da música para 4% enquanto a voz do mentor ecoa, e restaura o volume original suavemente ao terminar.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SEÇÃO 10: DEPLOY NA VPS E EASYPANEL MONÓLITO */}
      <div id="section-vps" className="rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('vps')}
          className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-slate-750 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-stone-800 border border-stone-700 text-stone-200 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-50">
                10. Arquitetura de Deploy, Easypanel & Comandos de Servidor
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Como o aplicativo roda em produção como monólito Docker multi-estágio servindo API e Frontend
              </p>
            </div>
          </div>
          {openSections.vps ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
        </button>

        {openSections.vps && (
          <div className="p-5 sm:p-6 pt-0 space-y-4 border-t border-stone-100 dark:border-slate-700/60 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-serif leading-relaxed">
            <div className="p-4 rounded-2xl bg-stone-100 dark:bg-slate-850 border border-stone-200 dark:border-slate-700">
              <strong className="text-stone-900 dark:text-stone-100 block mb-1">
                Arquitetura Monólito Docker Multi-Estágio (`Dockerfile`)
              </strong>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Para eliminar problemas de CORS, certificados SSL múltiplos e portas abertas desnecessárias, a aplicação utiliza um <code>Dockerfile</code> multi-estágio:
              </p>
              <ul className="list-disc pl-4 mt-2 space-y-1 text-xs text-stone-600 dark:text-stone-400">
                <li><strong>Estágio 1 (Builder):</strong> Compila o Frontend React/Vite gerando a pasta estática <code>dist/</code> com rotas relativas (<code>/api/...</code>).</li>
                <li><strong>Estágio 2 (Produção):</strong> Instala apenas as dependências do Node.js backend, copia o <code>dist/</code> do frontend e serve tudo na porta unificada <code>3001</code>.</li>
                <li><strong>Roteador Nginx/Traefik:</strong> O Easypanel recebe a requisição externa em HTTPS no domínio <code>https://isaac.lynxems.com.br</code> e repassa para o container interno na porta 3001.</li>
              </ul>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-2xl bg-stone-900 text-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-stone-500 block text-[10px]"># URL Oficial de Produção</span>
                  <code>https://isaac.lynxems.com.br</code>
                </div>
                <button
                  onClick={() => copyToClipboard('https://isaac.lynxems.com.br', 'url-prod')}
                  className="p-2 text-stone-400 hover:text-white"
                >
                  {copiedCmd === 'url-prod' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-900 text-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-stone-500 block text-[10px]"># Painel do Easypanel para disparar novo Deploy</span>
                  <code>https://easypanel.lynxems.com.br</code>
                </div>
                <button
                  onClick={() => copyToClipboard('https://easypanel.lynxems.com.br', 'url-easy')}
                  className="p-2 text-stone-400 hover:text-white"
                >
                  {copiedCmd === 'url-easy' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-900 text-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-stone-500 block text-[10px]"># Repositório Git Principal (Branch main)</span>
                  <code>https://github.com/lynxemssistema-blip/isaac.git</code>
                </div>
                <button
                  onClick={() => copyToClipboard('https://github.com/lynxemssistema-blip/isaac.git', 'repo')}
                  className="p-2 text-stone-400 hover:text-white"
                >
                  {copiedCmd === 'repo' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-900 text-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-stone-500 block text-[10px]"># Health Check de Produção</span>
                  <code>curl -I https://isaac.lynxems.com.br/health</code>
                </div>
                <button
                  onClick={() => copyToClipboard('curl -I https://isaac.lynxems.com.br/health', 'health')}
                  className="p-2 text-stone-400 hover:text-white"
                >
                  {copiedCmd === 'health' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
