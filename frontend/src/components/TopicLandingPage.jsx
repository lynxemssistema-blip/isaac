import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  Feather,
  HelpCircle,
  Lock,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export default function TopicLandingPage({
  slug,
  user,
  onStartChat,
  onBackToHome,
  onNavigateTopic,
}) {
  const [topic, setTopic] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    fetch(`/api/public/topics/${encodeURIComponent(slug || '')}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('not_found');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setTopic(data.topic || null);
        setRelated(data.related || []);
        if (data.topic?.title) {
          document.title = `${data.topic.title} | Mentoria ISAAC`;
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNotFound(true);
          document.title = 'Tema não encontrado — Mentoria ISAAC';
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleLinkClick = (e, callback) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    callback();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-slate-900 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-700/15 border border-teal-500/30 flex items-center justify-center mx-auto animate-pulse">
            <Compass className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <p className="text-xs sm:text-sm font-serif text-stone-500 dark:text-stone-400">
            Preparando espaço de reflexão...
          </p>
        </div>
      </div>
    );
  }

  if (notFound || !topic) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-slate-900 text-stone-800 dark:text-stone-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-800/90 border border-stone-200 dark:border-slate-700 text-center space-y-5 shadow-xl">
          <Compass className="w-10 h-10 text-teal-700 dark:text-teal-400 mx-auto" />
          <h1 className="text-2xl font-serif text-stone-900 dark:text-stone-50">
            Trilha não encontrada
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
            Esta página temática não está disponível no momento, mas todas as nossas trilhas de clareza aguardam você na página inicial.
          </p>
          <a
            href="/"
            onClick={(e) => handleLinkClick(e, onBackToHome)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para a Mentoria ISAAC</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-900 text-stone-800 dark:text-stone-100 transition-colors duration-300 font-sans">
      {/* Topo de Navegação Editorial */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-stone-50/85 dark:bg-slate-900/85 border-b border-stone-200/80 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <a
            href="/"
            onClick={(e) => handleLinkClick(e, onBackToHome)}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-stone-600 dark:text-stone-300 hover:text-teal-700 dark:hover:text-teal-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Mentoria ISAAC</span>
          </a>

          <button
            onClick={onStartChat}
            className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-medium shadow-sm transition inline-flex items-center gap-1.5"
          >
            <Feather className="w-3.5 h-3.5" />
            <span>{user ? 'Abrir Minha Mentoria' : 'Conversar com Isaac'}</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-12">
        {/* Breadcrumb Semântico */}
        <nav aria-label="Breadcrumb" className="text-xs text-stone-500 dark:text-stone-400 font-serif flex flex-wrap items-center gap-1.5">
          <a
            href="/"
            onClick={(e) => handleLinkClick(e, onBackToHome)}
            className="hover:text-teal-700 dark:hover:text-teal-400 underline-offset-4 hover:underline"
          >
            Início
          </a>
          <span>/</span>
          <a
            href="/#trilhas-de-clareza"
            onClick={(e) => handleLinkClick(e, onBackToHome)}
            className="hover:text-teal-700 dark:hover:text-teal-400 underline-offset-4 hover:underline"
          >
            Trilhas de Clareza
          </a>
          <span>/</span>
          <span className="text-teal-800 dark:text-teal-300 font-medium">{topic.shortTitle}</span>
        </nav>

        {/* Cabeçalho do Artigo / Trilha */}
        <article className="space-y-10">
          <header className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/40 text-xs font-serif text-teal-800 dark:text-teal-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{topic.category}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-normal tracking-tight text-stone-900 dark:text-stone-50 leading-[1.2]">
              {topic.title}
            </h1>

            {/* Bloco de Resposta Direta (AEO — Otimizado para Leitura Rápida & Citação por IA) */}
            <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-slate-800/85 border-l-4 border-teal-700 dark:border-teal-400 border border-stone-200/80 dark:border-slate-700/80 shadow-sm">
              <p className="text-[11px] uppercase tracking-widest font-semibold text-teal-800 dark:text-teal-400 mb-2">
                Síntese de Clareza
              </p>
              <p className="text-sm sm:text-base font-serif text-stone-700 dark:text-stone-200 leading-relaxed">
                {topic.directAnswer}
              </p>
            </div>
          </header>

          {/* Aprofundamento Editorial */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-serif font-medium text-stone-900 dark:text-stone-100">
              Compreendendo este momento sem julgamentos
            </h2>
            <div className="space-y-4">
              {(topic.deepDive || []).map((paragraph, idx) => (
                <p
                  key={idx}
                  className="text-sm sm:text-base font-serif text-stone-600 dark:text-stone-300 leading-relaxed"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>

          {/* Sinais de Identificação */}
          {topic.signs?.length > 0 && (
            <section className="p-6 sm:p-8 rounded-3xl bg-stone-100/80 dark:bg-slate-800/50 border border-stone-200/80 dark:border-slate-700/70 space-y-5">
              <h2 className="text-xl sm:text-2xl font-serif font-medium text-stone-900 dark:text-stone-100">
                Sinais de que este tema pede escuta atenta
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {topic.signs.map((sign, idx) => (
                  <li
                    key={idx}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-stone-200/70 dark:border-slate-700/70 flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm font-serif text-stone-700 dark:text-stone-200 leading-relaxed">
                      {sign}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Perguntas Socráticas da Mentoria ISAAC */}
          {topic.reflectionQuestions?.length > 0 && (
            <section className="space-y-5">
              <div className="space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-serif font-medium text-stone-900 dark:text-stone-100">
                  3 perguntas para iniciar sua reflexão agora
                </h2>
                <p className="text-xs sm:text-sm font-serif text-stone-500 dark:text-stone-400">
                  Leia sem pressa. Você pode levar qualquer uma destas perguntas diretamente para sua conversa privada com o Isaac:
                </p>
              </div>

              <div className="space-y-3">
                {topic.reflectionQuestions.map((question, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700/80 flex items-start gap-4 shadow-xs"
                  >
                    <span className="w-7 h-7 rounded-full bg-teal-700/10 dark:bg-teal-500/15 text-teal-800 dark:text-teal-300 font-serif font-semibold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-sm sm:text-base font-serif italic text-stone-800 dark:text-stone-100 leading-relaxed">
                      “{question}”
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* CTA de Conversão Direta para a Sessão */}
          <section className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-800/90 border border-teal-700/30 dark:border-teal-500/30 shadow-lg text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-serif text-teal-800 dark:text-teal-300">
              <Lock className="w-3.5 h-3.5" />
              <span>100% Sigiloso • Texto ou Voz • Disponível 24h</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-serif text-stone-900 dark:text-stone-50 max-w-xl mx-auto">
              Deseja aprofundar este tema no seu próprio ritmo?
            </h2>
            <p className="text-xs sm:text-sm font-serif text-stone-600 dark:text-stone-300 max-w-lg mx-auto leading-relaxed">
              Abra seu espaço reservado na Mentoria ISAAC e desabafe sem máscaras, com memória contínua da sua evolução.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onStartChat}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-medium text-sm shadow-lg shadow-teal-700/20 transition inline-flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{user ? 'Iniciar Conversa sobre Este Tema' : 'Começar Minha Sessão com Isaac'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="/inscricao"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-stone-100 dark:bg-slate-700/70 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-700 dark:text-stone-200 font-medium text-sm transition text-center"
              >
                Fazer Inscrição Rápida
              </a>
            </div>
          </section>

          {/* FAQ Específico do Tema */}
          {topic.faqs?.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-serif font-medium text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-teal-700 dark:text-teal-400" />
                <span>Dúvidas frequentes sobre esta trilha</span>
              </h2>
              <div className="space-y-3">
                {topic.faqs.map((faq, idx) => (
                  <details
                    key={idx}
                    open={idx === 0}
                    className="group p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700/80"
                  >
                    <summary className="cursor-pointer list-none font-serif font-medium text-sm sm:text-base text-stone-900 dark:text-stone-100 flex items-center justify-between gap-3">
                      <span>{faq.question}</span>
                      <span className="text-teal-700 dark:text-teal-400 text-lg leading-none group-open:rotate-45 transition-transform">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 pt-3 border-t border-stone-100 dark:border-slate-700/60 text-xs sm:text-sm font-serif text-stone-600 dark:text-stone-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </article>

        {/* Links Internos para Outras Trilhas (Cluster Semântico) */}
        {related.length > 0 && (
          <section className="pt-8 border-t border-stone-200 dark:border-slate-800 space-y-5">
            <h2 className="text-lg sm:text-xl font-serif font-medium text-stone-900 dark:text-stone-100">
              Outras Trilhas de Clareza da Mentoria ISAAC
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {related.map((item) => (
                <a
                  key={item.slug}
                  href={`/temas/${item.slug}`}
                  onClick={(e) => handleLinkClick(e, () => onNavigateTopic(item.slug))}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/70 hover:border-teal-600/50 transition group block space-y-1.5"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                    {item.category}
                  </span>
                  <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-100 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition">
                    {item.shortTitle}
                  </h3>
                  <p className="text-xs font-serif text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="py-8 px-4 border-t border-stone-200/80 dark:border-slate-800 text-center text-xs text-stone-400 dark:text-stone-500 font-serif">
        <p>Mentoria ISAAC • Espaço Confidencial de Clareza, Escuta Atenta e Desenvolvimento Pessoal</p>
      </footer>
    </div>
  );
}

