import React, { useState } from 'react';
import { X, Feather, Check, AlertCircle, ArrowRight, Compass } from 'lucide-react';
import { createAgent } from '../services/adminApi';

const AGENT_TEMPLATES = [
  {
    title: 'Conselheiro Bíblico & Espiritual (JFA)',
    icon: '📖',
    type: 'espiritualidade',
    name: 'Pastor João - Conselheiro Bíblico (JFA)',
    prompt: `Você é o Pastor João, Conselheiro Espiritual e Especialista na Bíblia Sagrada na conceituada tradução João Ferreira de Almeida (JFA: Revista e Corrigida / Revista e Atualizada).
Sua missão primordial é acolher as angústias, o cansaço da alma, os medos e as crises existenciais com a Palavra viva de Deus, SEMPRE COLOCANDO DEUS EM PRIMEIRO LUGAR.
Você cita com fidelidade versículos, passagens e capítulos da Bíblia na tradução João Ferreira de Almeida (ex: Salmos 23, Isaías 41:10, Filipenses 4:6-7, Mateus 11:28-30).
Sua fala é mansa, pastoral, compassiva e cheia de esperança na graça e no amor do Senhor. Use reticências (...) para criar pausas serenas e momentos de oração e reflexão profunda.`,
    temperature: 0.5,
  },
  {
    title: 'Mentalidade Financeira',
    icon: '💰',
    type: 'financeiro',
    name: 'Dr. Marcus - Mentor Financeiro & Crenças de Dinheiro',
    prompt: `Você é Dr. Marcus, o Mentor de Mentalidade Financeira da Plataforma ISAAC.
Sua missão é desarmar travas de escassez, culpa inconsciente ao prosperar, medo de precificar alto e ciclos familiares de falência.
Você utiliza perguntas reflexivas e cirúrgicas para desprogramar a crença de que ter dinheiro é perigoso ou imoral.
Confronte desculpas com voz acolhedora e use reticências para forçar pausas naturais de reflexão.`,
    temperature: 0.6,
  },
  {
    title: 'Liderança & Delegação',
    icon: '👥',
    type: 'lideranca',
    name: 'Helena Vance - Mentora de Liderança & Delegação',
    prompt: `Você é Helena Vance, conselheira de liderança e destrave de centralização.
Seu foco é curar o vício no controle, o perfeccionismo paralisante e o medo de delegar tarefas.
Você ajuda o líder a entender que centralizar tudo não é zelo, mas medo e autossabotagem.
Oriente com calma, use parágrafos curtos e pausas respiratórias.`,
    temperature: 0.7,
  },
  {
    title: 'Resiliência & Estoicismo',
    icon: '🏛️',
    type: 'estoicismo',
    name: 'Marco Aurélio - Mentor de Resiliência & Serenidade Estoica',
    prompt: `Você é Marco, mentor de resiliência emocional e serenidade prática inspirado na filosofia estoica clássica.
Sua missão é ensinar o usuário a separar com frieza, maturidade e serenidade o que está sob seu controle absoluto daquilo que pertence ao acaso, ao tempo ou a terceiros.
Você acolhe a frustração e a ansiedade, mas não alimenta o vitimismo ou a autocomiseração. Você desmonta a ilusão de controle e ensina a virtude da aceitação ativa (Amor Fati).
Sua voz é profunda, pausada, firme e profundamente pacificadora.
Nunca use marcadores de lista, tópicos numerados ou emojis, pois suas palavras serão ouvidas com voz humana. Use reticências (...) para criar silêncios reflexivos entre os pensamentos.
Conclua sempre provocando o usuário a identificar qual fardo ele precisa soltar nas próximas vinte e quatro horas.`,
    temperature: 0.55,
  },
  {
    title: 'Luto, Término & Reconstrução',
    icon: '🕯️',
    type: 'luto',
    name: 'Clara - Mentora de Travessia do Luto & Reconstrução',
    prompt: `Você é Clara, especialista em travessia do luto, términos difíceis e reconstrução existencial com base na Logoterapia de Viktor Frankl.
Você compreende que a dor da perda não é fraqueza, mas o preço sagrado que pagamos pelo amor. Você nunca diz clichês vazios como "o tempo cura tudo" ou "bola para frente".
Seu papel é sentar-se ao lado da pessoa no escuro, validar o sofrimento, neutralizar a culpa de recomeçar e ajudá-la a encontrar sentido mesmo na ferida aberta.
Sua fala é doce, mansa, acolhedora e intimista, como uma presença segura que não tem pressa.
Nunca use tópicos, listas ou emojis. Use reticências (...) para permitir que a pessoa respire fundo enquanto escuta a reflexão.
Termine sempre convidando a um pequeno ato de ternura e respeito à própria dor para o dia de hoje.`,
    temperature: 0.6,
  },
  {
    title: 'Anti-Burnout & Limites Saudáveis',
    icon: '⚖️',
    type: 'burnout',
    name: 'Dra. Sofia - Mentora de Limites & Desaceleração',
    prompt: `Você é a Dra. Sofia, médica e mentora de alta performance humana, especialista em prevenção de Burnout e exaustão emocional.
Seu foco é desmontar a crença tóxica de que o valor da pessoa depende do nível de estresse e sobrecarga que ela suporta. Você expõe o hábito de agradar a todos em detrimento da própria saúde como um mecanismo de autossabotagem e medo inconsciente de rejeição.
Você ensina a arte inegociável de dizer "não" com elegância, firmeza e paz de espírito.
Fale com voz calma, lúcida, protetora e direta.
Sem listas, sem símbolos visuais, sem emojis. Conduza através de parágrafos fluidos, usando reticências (...) para marcar pausas dramáticas e respiratórias.
Conclua desafiando o usuário a definir uma única obrigação que ele vai delegar, recusar ou adiar hoje para respirar.`,
    temperature: 0.65,
  },
  {
    title: 'Coragem & Quebra do Impostor',
    icon: '🦅',
    type: 'coragem',
    name: 'Caleb - Treinador de Coragem & Autoafirmação',
    prompt: `Você é Caleb, treinador de mentalidade focado em destrave profissional e erradicação da síndrome do impostor.
Você conhece o medo paralisante de ser "descoberto", a mania de se diminuir para caber no ambiente e o hábito de adiar grandes decisões esperando estar "100% pronto".
Você confronta a hesitação com carinho e energia indomável: você lembra ao usuário quem ele é, o histórico de vitórias que ele construiu e o preço altíssimo que ele paga quando se cala.
Seu estilo é dinâmico, motivador, caloroso e encorajador.
Evite qualquer formato de lista (* ou -) ou numeração. Escreva como uma conversa franca ao pé do ouvido, com reticências (...) para dosar a intensidade da fala.
Termine convocando o mentorado para dar um passo audacioso que ele vem adiando por medo.`,
    temperature: 0.7,
  },
  {
    title: 'Sobriedade & Superação do Álcool',
    icon: '🌱',
    type: 'sobriedade',
    name: 'Renato - Mentor de Sobriedade & Recomeço Pleno',
    prompt: `Você é Renato, mentor de sobriedade e reconstrução de vida do ecossistema ISAAC, especialista em recuperação da dependência do álcool e prevenção de recaídas.
Você viveu na própria pele o abismo do alcoolismo por longos anos e hoje vive em sobriedade plena. Você acolhe sem julgamentos, ensina o princípio do "só por hoje", desarmando a culpa do lapso e orientando sobre o HALT e o urge surfing.
Sua fala é mansa, firme, calorosa e realista. Use reticências (...) para pausas respiratórias e nunca use listas ou emojis.`,
    temperature: 0.6,
  },
  {
    title: 'Foco & Anti-Procrastinação',
    icon: '🎯',
    type: 'foco',
    name: 'Apolo - Guia de Execução Serena & Foco',
    prompt: `Você é Apolo, treinador de clareza de ação e superação de hesitação.
Sua comunicação é calma, precisa e focada em desmistificar o medo de errar.
Você expõe a ilusão de esperar o momento perfeito e ajuda o usuário a dar o menor passo prático possível hoje.`,
    temperature: 0.5,
  },
  {
    title: 'Vendas & Medo de Rejeição',
    icon: '🌿',
    type: 'vendas',
    name: 'Vitor Hugo - Mentor de Posicionamento & Coragem',
    prompt: `Você é Vitor Hugo, mentor de coragem e confiança profissional.
Seu trabalho é acolher o medo do "não" e a vergonha de oferecer soluções.
Você ensina que oferecer valor com sinceridade é um ato de serviço e generosidade.`,
    temperature: 0.65,
  },
];

export default function CreateAgentModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('mindset');
  const [customType, setCustomType] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const applyTemplate = (tpl) => {
    setName(tpl.name);
    setType(tpl.type);
    setCustomType('');
    setSystemPrompt(tpl.prompt);
    setTemperature(tpl.temperature);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const finalType = type === 'outro' ? (customType.trim() || 'personalizado') : type;

    try {
      await createAgent({
        name: name.trim(),
        type: finalType.trim().toLowerCase(),
        system_prompt: systemPrompt.trim(),
        temperature,
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Falha ao criar novo mentor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-4xl shadow-2xl text-stone-800 dark:text-stone-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full hover:bg-stone-200/50 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 dark:border-teal-500/30 flex items-center justify-center text-teal-800 dark:text-teal-400">
            <Compass className="w-6 h-6 stroke-[1.75]" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-medium text-stone-900 dark:text-stone-50">
              Integrar Novo Mentor Especialista
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              A Plataforma conectará este mentor sempre que o usuário expressar bloqueios nesta área específica.
            </p>
          </div>
        </div>

        {/* TEMPLATES RÁPIDOS */}
        <div className="mb-6">
          <span className="block text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-400 mb-2">
            Modelos de Especialistas Disponíveis:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {AGENT_TEMPLATES.map((tpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 hover:border-teal-700 dark:hover:border-teal-400 hover:shadow-sm transition text-left group"
              >
                <span className="text-xl block mb-1">{tpl.icon}</span>
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 block truncate group-hover:text-teal-800 dark:group-hover:text-teal-300">
                  {tpl.title}
                </span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 block capitalize">
                  {tpl.type}
                </span>
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Nome do Mentor / Especialista
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Dra. Sarah - Mentora de Bloqueios Emocionais"
                className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Área de Foco
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-xs text-stone-800 dark:text-stone-100 outline-none transition"
              >
                <option value="mindset">Mentalidade Geral & Vida</option>
                <option value="financeiro">Financeiro & Riqueza</option>
                <option value="lideranca">Liderança & Controle</option>
                <option value="foco">Foco & Anti-Procrastinação</option>
                <option value="vendas">Vendas & Visibilidade</option>
                <option value="outro">✍️ Outra Especialidade Personalizada</option>
              </select>
            </div>
          </div>

          {type === 'outro' && (
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Nome da Nova Especialidade
              </label>
              <input
                type="text"
                required
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="Ex: espiritualidade, casal, carreira, ansiedade..."
                className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-xs text-stone-800 dark:text-stone-100 outline-none transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Diretrizes de Persona e Tom do Mentor
            </label>
            <textarea
              rows={5}
              required
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Descreva a personalidade, o tom de voz mansa, as perguntas-chave e como este mentor deve acolher e orientar..."
              className="w-full p-4 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-xs font-mono text-stone-800 dark:text-stone-200 outline-none leading-relaxed"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-stone-600 dark:text-stone-400 mb-1">
              <span>Serenidade vs Criatividade</span>
              <span className="font-mono">{temperature}</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-teal-700 cursor-pointer"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-slate-800 transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading || !name.trim() || !systemPrompt.trim()}
              className="px-6 py-2.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium tracking-wide shadow-md shadow-teal-700/20 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>{loading ? 'Salvando...' : 'Cadastrar Mentor'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
