import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage, checkBackendHealth, fetchActiveAgents } from '../services/api';
import { Bot, Sparkles, ChevronDown, Check } from 'lucide-react';

export default function ChatHermes({ userId }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Olá. Eu sou o ISAAC. Estou aqui para mapear seus padrões, quebrar bloqueios emocionais e alinhar sua mentalidade com a sua melhor versão. Sobre o que você tem hesitado ultimamente?',
      memoriesUsed: [],
      agentUsed: { name: 'ISAAC - Arquiteto da Mentalidade', slug: 'isaac-master', type: 'mindset' },
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(true);
  const [activeAgents, setActiveAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('auto'); // 'auto' | agent.id
  const messagesEndRef = useRef(null);

  // Checagem de conectividade com o Backend e carga de agentes especialistas
  useEffect(() => {
    checkBackendHealth().then((status) => setIsBackendOnline(status));
    fetchActiveAgents().then((list) => setActiveAgents(list));

    const interval = setInterval(() => {
      checkBackendHealth().then((status) => setIsBackendOnline(status));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const activeAgent = selectedAgentId === 'auto'
    ? null
    : activeAgents.find((a) => a.id === selectedAgentId || a.slug === selectedAgentId);

  const currentStarterQuestions = React.useMemo(() => {
    if (activeAgent) {
      return Array.isArray(activeAgent.starter_questions) ? activeAgent.starter_questions : [];
    }
    const combined = [];
    (activeAgents || []).forEach((ag) => {
      if (Array.isArray(ag.starter_questions)) {
        ag.starter_questions.slice(0, 2).forEach((q) => {
          combined.push(q);
        });
      }
    });
    return combined;
  }, [activeAgent, activeAgents]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText || isLoading) return;

    const userMessageObj = {
      id: Date.now().toString(),
      role: 'user',
      content: cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessageObj]);
    setInputText('');
    setIsLoading(true);

    try {
      const historyForApi = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await sendChatMessage({
        message: cleanText,
        userId: userId || 'default_user_guest',
        agentId: selectedAgentId,
        history: historyForApi,
      });

      const assistantMessageObj = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply,
        agentUsed: response.agentUsed,
        memoriesUsed: response.memoriesUsed || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessageObj]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '⚠️ Não foi possível se conectar ao orquestrador no momento. Verifique a conexão com o servidor.',
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-neutral-950 text-neutral-100 shadow-2xl border-x border-neutral-800/80 font-sans">
      {/* HEADER DO CHAT COM SELETOR DE MENTOR */}
      <header className="px-6 py-3 border-b border-neutral-800 bg-neutral-900/70 backdrop-blur-md sticky top-0 z-10 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                IZ
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-neutral-950 ${
                  isBackendOnline ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
            </div>
            <div>
              <h1 className="font-semibold text-base tracking-wide flex items-center gap-2">
                ISAAC
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-indigo-950/80 text-indigo-300 border border-indigo-700/40 rounded-full">
                  Orquestrador
                </span>
              </h1>
              <p className="text-xs text-neutral-400">
                Reprogramação Mental & Quebra de Bloqueios Emocionais
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[11px] text-neutral-400 font-medium">Mentor Ativo:</span>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="bg-neutral-950 border border-neutral-700/80 text-xs rounded-xl px-3 py-1.5 text-neutral-200 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="auto">🧠 ISAAC Maestro (Auto-Roteamento)</option>
              {activeAgents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name} ({ag.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* MODO MOBILE: SELETOR DE MENTOR */}
        <div className="sm:hidden pt-1">
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 text-xs rounded-lg px-3 py-1.5 text-neutral-200 outline-none"
          >
            <option value="auto">🧠 ISAAC Maestro (Auto-Roteamento)</option>
            {activeAgents.map((ag) => (
              <option key={ag.id} value={ag.id}>
                {ag.name} ({ag.type})
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* FEED DE MENSAGENS */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 sm:p-5 shadow-md leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-none'
                  : msg.isError
                  ? 'bg-rose-950/40 border border-rose-800/50 text-rose-200 rounded-bl-none'
                  : 'bg-neutral-900 border border-neutral-800/90 text-neutral-200 rounded-bl-none'
              }`}
            >
              {/* Identificação do Agente que respondeu */}
              {msg.role === 'assistant' && msg.agentUsed && (
                <div className="mb-2.5 flex items-center justify-between border-b border-neutral-800/60 pb-2 text-[11px]">
                  <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    {msg.agentUsed.name}
                  </span>
                  <span className="text-[10px] uppercase font-mono text-neutral-500 bg-neutral-950/60 px-1.5 py-0.5 rounded">
                    {msg.agentUsed.type}
                  </span>
                </div>
              )}

              {/* Badge indicando se memórias prévias foram usadas na resposta */}
              {msg.memoriesUsed && msg.memoriesUsed.length > 0 && (
                <div className="mb-3">
                  <span className="text-[11px] font-medium text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                    ⚡ {msg.memoriesUsed.length} memória(s) de longo prazo integrada(s)
                  </span>
                </div>
              )}

              <p className="whitespace-pre-wrap text-sm sm:text-base selection:bg-indigo-500 selection:text-white">
                {msg.content}
              </p>
            </div>

            <span className="text-[11px] text-neutral-500 mt-1.5 px-1">
              {msg.timestamp}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-neutral-400 text-sm p-4 bg-neutral-900/40 border border-neutral-800/50 rounded-2xl w-fit">
            <div className="flex space-x-1.5">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-neutral-400 pl-1">
              {selectedAgentId === 'auto'
                ? 'ISAAC orquestrando o melhor especialista e recuperando memórias...'
                : 'Consultando especialista e memórias de longo prazo...'}
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* BARRA DE ENTRADA / INPUT */}
      <footer className="p-4 border-t border-neutral-800 bg-neutral-900/80 backdrop-blur-md">
        {currentStarterQuestions.length > 0 && (
          <div className="mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {currentStarterQuestions.map((q) => (
              <button
                key={q.id || q.text}
                type="button"
                onClick={() => setInputText(q.text)}
                className="shrink-0 text-left px-2.5 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/60 hover:border-indigo-500 text-xs transition flex items-center gap-1.5"
              >
                {q.category && (
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 font-semibold">
                    {q.category}
                  </span>
                )}
                <span className="truncate max-w-[240px]">{q.text}</span>
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Compartilhe seu bloqueio, dúvida ou situação..."
            disabled={isLoading}
            className="flex-1 bg-neutral-950 border border-neutral-700/70 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none transition disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-medium px-5 py-3 rounded-xl transition duration-150 flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20"
          >
            <span>Enviar</span>
            <svg
              className="w-4 h-4 transform rotate-45 -mr-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
}
