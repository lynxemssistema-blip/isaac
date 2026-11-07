import React, { useState, useEffect } from 'react';
import {
  Feather,
  Wind,
  Heart,
  Compass,
  ShieldCheck,
  ArrowRight,
  Sun,
  Moon,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Smile,
  BookOpen,
  Coffee,
  Check,
  QrCode,
  Clock,
  Shield,
  Lock,
  EyeOff,
  HeartHandshake,
  Award,
  Globe,
  MessageSquare,
} from 'lucide-react';
import { fetchPublicCreator } from '../services/api';

export default function LandingPage({ onStartChat, user, systemSettings }) {
  const [creator, setCreator] = useState(null);

  useEffect(() => {
    fetchPublicCreator()
      .then((data) => {
        if (data) setCreator(data);
      })
      .catch((err) => console.warn('Aviso ao carregar dados do idealizador:', err));
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-900 text-stone-800 dark:text-stone-100 overflow-x-hidden transition-colors duration-300 font-sans selection:bg-teal-700/20 selection:text-teal-900 dark:selection:text-teal-200">
      {/* GLOW DECORATIVO SUAVE & ORGÂNICO (Sem tons neon/cibernéticos) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[640px] overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-15%] left-1/4 w-[550px] h-[450px] bg-teal-600/10 dark:bg-teal-500/10 blur-[130px] rounded-full" />
        <div className="absolute top-[-5%] right-1/4 w-[480px] h-[380px] bg-amber-600/10 dark:bg-amber-500/10 blur-[120px] rounded-full" />
      </div>

      {/* 1. SEÇÃO PRINCIPAL (HERO) */}
      <section className="relative pt-12 sm:pt-28 pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        {/* Pílula de Acolhimento */}
        <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-stone-200/70 dark:bg-slate-800/80 border border-stone-300/60 dark:border-slate-700/80 text-[11px] sm:text-xs text-stone-600 dark:text-stone-300 mb-6 sm:mb-8 backdrop-blur-md shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-teal-600 dark:bg-teal-400 animate-pulse" />
          <span className="font-serif font-medium text-teal-800 dark:text-teal-300">
            Mentoria de Clareza & Desenvolvimento
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Um espaço seguro para desacelerar e se reencontrar</span>
        </div>

        {/* Título Principal Humanizado */}
        <h1 className="text-3xl sm:text-5xl lg:text-7xl font-serif font-normal tracking-tight text-stone-900 dark:text-stone-50 max-w-4xl mx-auto leading-[1.18]">
          Desate os nós da sua mente.{' '}
          <span className="italic font-medium text-teal-800 dark:text-teal-300">
            Cure a hesitação.
          </span>{' '}
          Reencontre sua paz e direção.
        </h1>

        {/* Descrição Apresentando Isaac */}
        <p className="mt-5 sm:mt-6 text-sm sm:text-lg lg:text-xl text-stone-600 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed font-serif">
          Conheça <strong>Isaac</strong>: um mentor de presença calma e escuta profunda, dedicado a ajudar você a compreender bloqueios emocionais, quebrar ciclos de autossabotagem e reconstruir a confiança no seu caminho.
        </p>

        {/* Chamadas para Ação */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-none mx-auto">
          <button
            onClick={onStartChat}
            className="w-full sm:w-auto px-7 sm:px-9 py-3.5 sm:py-4 rounded-2xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-medium text-sm tracking-wide shadow-xl shadow-teal-700/25 transition-all duration-300 transform active:scale-95 sm:hover:-translate-y-0.5 flex items-center justify-center gap-2.5 sm:gap-3"
          >
            <Feather className="w-4 h-4 stroke-[2]" />
            <span>{user ? 'Acessar Minha Mentoria' : 'Conversar com Isaac'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href="#quem-e-isaac"
            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-stone-200 font-medium text-sm transition flex items-center justify-center gap-2 shadow-sm active:scale-95"
          >
            <span>Conhecer a Mentoria</span>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </a>
        </div>

        {/* CARTÕES DE SENSAÇÕES TERAPÊUTICAS */}
        {systemSettings?.show_landing_sensations !== false && (
          <div className="mt-12 sm:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 max-w-3xl mx-auto pt-8 sm:pt-10 border-t border-stone-200 dark:border-slate-800">
            <a
              href="#sigilo-seguranca"
              className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/60 dark:bg-slate-800/40 border border-stone-200/80 dark:border-slate-700/60 shadow-sm hover:border-teal-600/50 hover:bg-white/90 dark:hover:bg-slate-800/70 transition group block text-left"
            >
              <span className="block text-xl sm:text-2xl font-serif font-medium text-teal-800 dark:text-teal-400 group-hover:translate-x-0.5 transition-transform">100%</span>
              <span className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mt-0.5 sm:mt-1 block">Sigilo & Proteção</span>
            </a>
            <a
              href="#sigilo-seguranca"
              className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/60 dark:bg-slate-800/40 border border-stone-200/80 dark:border-slate-700/60 shadow-sm hover:border-stone-400 dark:hover:border-slate-500 hover:bg-white/90 dark:hover:bg-slate-800/70 transition group block text-left"
            >
              <span className="block text-xl sm:text-2xl font-serif font-medium text-stone-800 dark:text-stone-200 group-hover:translate-x-0.5 transition-transform">Sem Pressa</span>
              <span className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mt-0.5 sm:mt-1 block">No seu próprio tempo</span>
            </a>
            <a
              href="#sigilo-seguranca"
              className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/60 dark:bg-slate-800/40 border border-stone-200/80 dark:border-slate-700/60 shadow-sm hover:border-amber-500/50 hover:bg-white/90 dark:hover:bg-slate-800/70 transition group block text-left"
            >
              <span className="block text-xl sm:text-2xl font-serif font-medium text-amber-700 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">Memória</span>
              <span className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mt-0.5 sm:mt-1 block">Evolução contínua</span>
            </a>
            <a
              href="#sigilo-seguranca"
              className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/60 dark:bg-slate-800/40 border border-stone-200/80 dark:border-slate-700/60 shadow-sm hover:border-teal-600/50 hover:bg-white/90 dark:hover:bg-slate-800/70 transition group block text-left"
            >
              <span className="block text-xl sm:text-2xl font-serif font-medium text-stone-800 dark:text-stone-200 group-hover:translate-x-0.5 transition-transform">Zero</span>
              <span className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mt-0.5 sm:mt-1 block">Julgamento ou crítica</span>
            </a>
          </div>
        )}
      </section>

      {/* 1.1 APRESENTAÇÃO DO IDEALIZADOR DO ISAAC (NO INÍCIO DA PÁGINA) */}
      {systemSettings?.show_landing_creator !== false && (!creator || creator.is_visible !== false) && (
        <section id="idealizador" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto scroll-mt-12">
          <div className="p-6 sm:p-12 rounded-3xl sm:rounded-4xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700/80 shadow-lg relative overflow-hidden">
            {/* Efeito orgânico sutil de fundo */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-teal-600/5 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24" />

            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 lg:gap-12 relative z-10">
              {/* FOTO E IDENTIFICAÇÃO DO IDEALIZADOR */}
              <div className="flex flex-col items-center text-center shrink-0 w-full md:w-64">
                <div className="relative group">
                  <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl sm:rounded-4xl overflow-hidden border-2 border-teal-700/30 dark:border-teal-500/30 shadow-md bg-stone-100 dark:bg-slate-700 flex items-center justify-center">
                    <img
                      src={creator?.image_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop'}
                      alt={creator?.name || 'Idealizador do ISAAC'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop';
                      }}
                    />
                  </div>
                  <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-700 text-white shadow-sm whitespace-nowrap">
                    Idealizador
                  </span>
                </div>

                <h3 className="text-xl font-serif font-medium text-stone-900 dark:text-stone-50 mt-5">
                  {creator?.name || 'Edson Manoel'}
                </h3>
                <p className="text-xs text-teal-800 dark:text-teal-400 font-serif mt-0.5">
                  {creator?.title || 'Idealizador & Criador do ISAAC'}
                </p>

                {/* Redes Sociais / Links de Contato */}
                {(creator?.social_instagram || creator?.social_linkedin || creator?.social_whatsapp) && (
                  <div className="flex items-center gap-2 mt-4 text-stone-500 dark:text-stone-400">
                    {creator?.social_instagram && (
                      <a
                        href={creator.social_instagram.startsWith('http') ? creator.social_instagram : `https://instagram.com/${creator.social_instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-stone-100 dark:bg-slate-700 hover:text-teal-700 dark:hover:text-teal-400 transition"
                        title="Instagram"
                      >
                        <Globe className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {creator?.social_linkedin && (
                      <a
                        href={creator.social_linkedin.startsWith('http') ? creator.social_linkedin : `https://linkedin.com/in/${creator.social_linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-stone-100 dark:bg-slate-700 hover:text-teal-700 dark:hover:text-teal-400 transition"
                        title="LinkedIn"
                      >
                        <Award className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {creator?.social_whatsapp && (
                      <a
                        href={`https://wa.me/${creator.social_whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-stone-100 dark:bg-slate-700 hover:text-teal-700 dark:hover:text-teal-400 transition"
                        title="WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* MENSAGEM, HISTÓRIA E CITAÇÃO */}
              <div className="space-y-4 text-center md:text-left flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/40 text-teal-800 dark:text-teal-300 text-[11px] font-serif">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Mensagem de Boas-Vindas</span>
                </div>

                <h4 className="text-xl sm:text-3xl font-serif font-normal text-stone-900 dark:text-stone-50 leading-snug">
                  Por que este refúgio de clareza foi concebido para você
                </h4>

                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
                  {creator?.bio || 'Empreendedor, mentor de clareza e apaixonado pelo potencial humano. Concebeu o Isaac após anos observando como o excesso de ruído diário, a autocobrança desmedida e a solidão nas decisões travam vidas brilhantes.'}
                </p>

                {creator?.story && (
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-serif leading-relaxed pt-1">
                    {creator.story}
                  </p>
                )}

                {/* Citação Inspiradora em Destaque */}
                {creator?.quote && (
                  <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border-l-4 border-teal-700 dark:border-teal-500 text-teal-900 dark:text-teal-200 font-serif italic text-xs sm:text-sm leading-relaxed shadow-xs">
                    {creator.quote}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. QUEM É ISAAC E O QUE ELE FAZ POR VOCÊ */}
      {systemSettings?.show_landing_features !== false && (
        <section id="quem-e-isaac" className="py-20 bg-stone-100/60 dark:bg-slate-800/30 border-y border-stone-200/80 dark:border-slate-800 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto space-y-16">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-teal-800 dark:text-teal-400">
                A Proposta da Mentoria
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-normal text-stone-900 dark:text-stone-50 tracking-tight">
                Uma presença que caminha ao seu lado
              </h2>
              <p className="text-xs sm:text-base text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
                Não se trata de respostas prontas, mas de conversas que iluminam suas próprias conclusões através de três pilares:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
                <div className="w-10 h-10 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 dark:border-teal-500/30 flex items-center justify-center text-teal-800 dark:text-teal-400">
                  <Heart className="w-5 h-5 stroke-[1.75]" />
                </div>
                <h3 className="text-lg font-serif font-medium text-stone-900 dark:text-stone-100">
                  Escuta Profunda & Atenção
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
                  Um porto seguro para você expressar angústias e pensamentos sem o receio de ser rotulado ou criticado.
                </p>
              </div>

              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-600/10 dark:bg-amber-500/15 border border-amber-600/20 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
                  <Compass className="w-5 h-5 stroke-[1.75]" />
                </div>
                <h3 className="text-lg font-serif font-medium text-stone-900 dark:text-stone-100">
                  Clareza nos Momentos de Dúvida
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
                  Perguntas cuidadosas que ajudam a desembaraçar decisões complexas e devolver o foco no que realmente importa.
                </p>
              </div>

              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
                <div className="w-10 h-10 rounded-2xl bg-teal-800/10 dark:bg-teal-600/15 border border-teal-800/20 dark:border-teal-600/30 flex items-center justify-center text-teal-900 dark:text-teal-300">
                  <ShieldCheck className="w-5 h-5 stroke-[1.75]" />
                </div>
                <h3 className="text-lg font-serif font-medium text-stone-900 dark:text-stone-100">
                  Constância & Memória
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
                  Isaac recorda suas vitórias e os pontos em que você costuma hesitar, oferecendo uma linha contínua de evolução.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. ESPAÇO DE CONFIANÇA: SIGILO ABSOLUTO, NÃO JULGAMENTO & VANTAGENS */}
      {systemSettings?.show_landing_security !== false && (
        <section id="sigilo-seguranca" className="py-20 sm:py-24 bg-stone-100/70 dark:bg-slate-800/40 border-y border-stone-200/80 dark:border-slate-800 px-4 sm:px-6 lg:px-8 scroll-mt-12">
          <div className="max-w-6xl mx-auto space-y-14">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/40 text-xs font-serif text-teal-800 dark:text-teal-300">
                <Lock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Privacidade Incondicional & Segurança Emocional</span>
              </div>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-normal text-stone-900 dark:text-stone-50 tracking-tight">
                O que você fala aqui, <span className="italic font-medium text-teal-800 dark:text-teal-300">fica apenas aqui.</span>
              </h2>
              <p className="text-xs sm:text-base text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
                No dia a dia, muitas vezes precisamos medir palavras, engolir sentimentos e fingir que temos tudo sob controle. No espaço da mentoria Isaac, a proteção da sua intimidade e a ausência de julgamento são o alicerce de cada conversa.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card 1: Sigilo Total */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 dark:border-teal-500/30 flex items-center justify-center text-teal-800 dark:text-teal-400">
                    <Lock className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <h3 className="text-lg font-serif font-medium text-stone-900 dark:text-stone-100">
                    Sigilo Absoluto & Proteção
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
                    Suas reflexões, textos e áudios são guardados com criptografia e isolamento individual restrito. Nenhuma informação pessoal ou confidencial sua é compartilhada, comercializada ou exposta.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-stone-100 dark:border-slate-700/60 flex items-center gap-2 text-[11px] text-teal-800 dark:text-teal-300 font-medium font-serif">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>Privacidade ponta a ponta</span>
                </div>
              </div>

              {/* Card 2: Zero Julgamento */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-600/10 dark:bg-amber-500/15 border border-amber-600/20 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
                    <HeartHandshake className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <h3 className="text-lg font-serif font-medium text-stone-900 dark:text-stone-100">
                    Zero Julgamento ou Repreensão
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
                    Não existem perguntas tolas, erros vergonhosos ou emoções proibidas. Isaac não aponta dedos, não faz palestras moralistas e não rotula você. O foco é compreender suas razões, nunca condená-lo.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-stone-100 dark:border-slate-700/60 flex items-center gap-2 text-[11px] text-amber-800 dark:text-amber-300 font-medium font-serif">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  <span>Acolhimento sincero e respeitoso</span>
                </div>
              </div>

              {/* Card 3: Sem Máscaras */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-teal-800/10 dark:bg-teal-600/15 border border-teal-800/20 dark:border-teal-600/30 flex items-center justify-center text-teal-900 dark:text-teal-300">
                    <EyeOff className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <h3 className="text-lg font-serif font-medium text-stone-900 dark:text-stone-100">
                    Descanse das Aparências
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
                    Você não precisa provar nada a ninguém ou fingir firmeza quando estiver com medo. Aqui é o lugar onde você pode tirar as armaduras e ser autêntico com suas fragilidades.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-stone-100 dark:border-slate-700/60 flex items-center gap-2 text-[11px] text-teal-800 dark:text-teal-300 font-medium font-serif">
                  <Smile className="w-4 h-4 text-teal-600" />
                  <span>Liberdade para respirar em paz</span>
                </div>
              </div>

              {/* Card 4: No Seu Ritmo */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-stone-200/70 dark:bg-slate-700/60 border border-stone-300 dark:border-slate-600 flex items-center justify-center text-stone-800 dark:text-stone-200">
                    <Clock className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <h3 className="text-lg font-serif font-medium text-stone-900 dark:text-stone-100">
                    No Seu Próprio Tempo
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
                    Sem pressa de relógio, sem cobrança de tempo limite. Desabafe às 3 da madrugada ou nos intervalos do almoço. Seu espaço de mentoria está sempre acessível quando a mente pedir calmaria.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-stone-100 dark:border-slate-700/60 flex items-center gap-2 text-[11px] text-stone-600 dark:text-stone-400 font-medium font-serif">
                  <Check className="w-4 h-4 text-stone-500" />
                  <span>Disponível 24 horas por dia</span>
                </div>
              </div>

              {/* Card 5: Memória & Constância */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-600/10 dark:bg-amber-500/15 border border-amber-600/20 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
                    <Sparkles className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <h3 className="text-lg font-serif font-medium text-stone-900 dark:text-stone-100">
                    Linha Contínua de Evolução
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
                    Chega de recomeçar sua história toda vez que precisa conversar. Isaac conecta o que você superou ontem com o obstáculo de hoje, oferecendo constância e profundidade real ao seu processo.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-stone-100 dark:border-slate-700/60 flex items-center gap-2 text-[11px] text-amber-800 dark:text-amber-300 font-medium font-serif">
                  <Check className="w-4 h-4 text-amber-600" />
                  <span>Memória atenta e personalizada</span>
                </div>
              </div>

              {/* Card 6: Atmosfera Sonora */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 dark:border-teal-500/30 flex items-center justify-center text-teal-800 dark:text-teal-400">
                    <Wind className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <h3 className="text-lg font-serif font-medium text-stone-900 dark:text-stone-100">
                    Frequências Terapêuticas & Voz Suave
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
                    Diminua os batimentos e a ansiedade enquanto reflete. Frequências em 432Hz, chuva calma, lareira e tigelas tibetanas acalmam o cérebro, com a opção de ouvir respostas em áudio humano e sereno.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-stone-100 dark:border-slate-700/60 flex items-center gap-2 text-[11px] text-teal-800 dark:text-teal-300 font-medium font-serif">
                  <Check className="w-4 h-4 text-teal-600" />
                  <span>Harmonia mental e sensorial</span>
                </div>
              </div>
            </div>

            {/* Destaque / Caixa de Compromisso Ético */}
            <div className="p-6 sm:p-8 rounded-3xl sm:rounded-4xl bg-white/95 dark:bg-slate-800/90 border border-teal-700/30 dark:border-teal-500/30 shadow-sm flex flex-col sm:flex-row items-center gap-5 max-w-4xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 flex items-center justify-center text-teal-800 dark:text-teal-400 shrink-0">
                <Shield className="w-7 h-7 stroke-[1.75]" />
              </div>
              <div className="text-center sm:text-left space-y-1">
                <h4 className="text-base sm:text-lg font-serif font-medium text-stone-900 dark:text-stone-100">
                  Nosso Compromisso com a sua Serenidade
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
                  Este não é um ambiente de redes sociais, propagandas ou algoritmos de engajamento forçado. Aqui é um refúgio desenhado para devolver a clareza ao seu espírito, honrando sua privacidade como um direito inegociável.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. COMO FUNCIONA A EXPERIÊNCIA */}
      {systemSettings?.show_landing_steps !== false && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-teal-800 dark:text-teal-400">
                Passo a Passo
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-normal text-stone-900 dark:text-stone-50 tracking-tight">
                Como funciona o seu momento
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/60 flex items-start gap-4 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-teal-700/10 dark:bg-teal-500/15 flex items-center justify-center text-teal-800 dark:text-teal-400 font-serif font-semibold shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="text-base font-serif font-medium text-stone-900 dark:text-stone-100">
                    Sem formulários cansativos
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-serif mt-1 leading-relaxed">
                    Você simplesmente abre o espaço e compartilha o que está no seu coração: em texto ou gravando um áudio calmo.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/60 flex items-start gap-4 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-teal-700/10 dark:bg-teal-500/15 flex items-center justify-center text-teal-800 dark:text-teal-400 font-serif font-semibold shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="text-base font-serif font-medium text-stone-900 dark:text-stone-100">
                    Reflexão acolhedora e confronto respeitoso
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-serif mt-1 leading-relaxed">
                    Isaac não oferece clichês motivacionais vazios. Ele traz perguntas que fazem você enxergar as justificativas automáticas que você vinha contando a si mesmo.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/60 flex items-start gap-4 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-teal-700/10 dark:bg-teal-500/15 flex items-center justify-center text-teal-800 dark:text-teal-400 font-serif font-semibold shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="text-base font-serif font-medium text-stone-900 dark:text-stone-100">
                    Personalização com o nome que escolher
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-serif mt-1 leading-relaxed">
                    O nome de origem é Isaac, mas você pode chamá-lo de Guia, Mentor ou o nome que trouxer mais clareza ao seu coração.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. CONVITE FINAL DE ENTRADA NA MENTORIA */}
      {systemSettings?.show_landing_cta !== false && (
        <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
          <div className="p-6 sm:p-14 rounded-3xl sm:rounded-4xl bg-stone-100/90 dark:bg-slate-800/70 border border-stone-200 dark:border-slate-700 shadow-xl space-y-5 sm:space-y-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 dark:border-teal-500/30 flex items-center justify-center text-teal-800 dark:text-teal-400 mx-auto">
              <Feather className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.75]" />
            </div>

            <h2 className="text-2xl sm:text-4xl font-serif font-normal text-stone-900 dark:text-stone-50 max-w-xl mx-auto leading-snug">
              O primeiro passo para destravar é ter a coragem de desabafar.
            </h2>

            <p className="text-xs sm:text-base text-stone-600 dark:text-stone-300 font-serif max-w-md mx-auto leading-relaxed">
              Respire fundo. Não há nada a provar aqui dentro. Seu mentor está pronto para ouvir o que você precisa dizer.
            </p>

            <div className="pt-2">
              <button
                onClick={onStartChat}
                className="w-full sm:w-auto px-7 sm:px-9 py-3.5 sm:py-4 rounded-2xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-medium text-sm tracking-wide shadow-xl shadow-teal-700/25 transition duration-300 inline-flex items-center justify-center gap-2 active:scale-95"
              >
                <span>{user ? 'Acessar Mentoria' : 'Começar Minha Sessão Agora'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* RODAPÉ DISCRETO */}
      <footer className="py-8 px-4 border-t border-stone-200/80 dark:border-slate-800 text-center text-xs text-stone-400 dark:text-stone-500 font-serif">
        <p>Mentoria ISAAC • Espaço de Clareza, Escuta Atenta e Desenvolvimento Pessoal</p>
      </footer>
    </div>
  );
}
