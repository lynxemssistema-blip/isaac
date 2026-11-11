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
  HelpCircle,
  MessageCircle,
  Mic,
  CreditCard,
  X,
  ExternalLink,
} from 'lucide-react';
import { fetchPublicCreator } from '../services/api';
import { HOME_FAQS, CORE_TOPICS_PREVIEW } from '../data/seoContent';
import LandingEbooksShowcase from './LandingEbooksShowcase';

const OFFICIAL_ASAAS_MONTHLY_URL = 'https://www.asaas.com/000/c/ak85n2ouw2z6j6xv';

export default function LandingPage({ onStartChat, onOpenPlans, user, systemSettings, onOpenTopic, onOpenEbookStore }) {
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
            href="#planos"
            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/50 hover:bg-emerald-100/90 dark:hover:bg-emerald-900/50 border border-emerald-300/80 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-200 font-medium text-sm transition flex items-center justify-center gap-2 shadow-sm active:scale-95"
          >
            <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Ver Planos (Grátis &amp; WhatsApp)</span>
          </a>

          <a
            href="#biblioteca-ebooks"
            className="w-full sm:w-auto px-6 sm:px-7 py-3.5 sm:py-4 rounded-2xl bg-amber-50/95 dark:bg-amber-950/50 hover:bg-amber-100/95 dark:hover:bg-amber-900/50 border border-amber-300/80 dark:border-amber-700/60 text-amber-950 dark:text-amber-200 font-medium text-sm transition flex items-center justify-center gap-2 shadow-sm active:scale-95"
          >
            <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>eBooks por Thiago Prata</span>
          </a>
        </div>
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
                      alt={creator?.name || 'Idealizador da Mentoria ISAAC'}
                      width="176"
                      height="176"
                      loading="lazy"
                      decoding="async"
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

                <h2 className="text-xl sm:text-3xl font-serif font-normal text-stone-900 dark:text-stone-50 leading-snug">
                  Por que este refúgio de clareza foi concebido para você
                </h2>

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
                <h3 className="text-base sm:text-lg font-serif font-medium text-stone-900 dark:text-stone-100">
                  Nosso Compromisso com a sua Serenidade
                </h3>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/60 flex items-start gap-4 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-teal-700/10 dark:bg-teal-500/15 flex items-center justify-center text-teal-800 dark:text-teal-400 font-serif font-semibold shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-100">
                    Sem formulários cansativos
                  </h3>
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
                  <h3 className="text-base font-serif font-medium text-stone-900 dark:text-stone-100">
                    Reflexão acolhedora e confronto respeitoso
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-serif mt-1 leading-relaxed">
                    Isaac não oferece clichês motivacionais vazios. Ele traz perguntas que fazem você enxergar as justificativas automáticas que você vinha contando a si mesmo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4.5 TRILHAS DE CLAREZA & LABORATÓRIO DO INCÔMODO CRIATIVO (SEO & GEO TOPICAL HUB) */}
      <section id="trilhas-de-clareza" className="py-20 bg-stone-100/60 dark:bg-slate-800/30 border-y border-stone-200/80 dark:border-slate-800 px-4 sm:px-6 lg:px-8 scroll-mt-12">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-teal-800 dark:text-teal-400">
              Caminhos de Aprofundamento
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-normal text-stone-900 dark:text-stone-50 tracking-tight">
              Temas reais nos quais o Isaac caminha com você
            </h2>
            <p className="text-xs sm:text-base text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
              Da indecisão silenciosa ao exclusivo <strong>Laboratório do Incômodo Criativo</strong>: explore cada trilha temática e descubra como conduzir suas reflexões com método e serenidade.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {CORE_TOPICS_PREVIEW.map((topic) => (
              <a
                key={topic.slug}
                href={`/temas/${topic.slug}`}
                onClick={(e) => {
                  if (!onOpenTopic || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                  e.preventDefault();
                  onOpenTopic(topic.slug);
                }}
                className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700/80 hover:border-teal-600/50 shadow-sm hover:shadow-md transition group flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-400">
                    {topic.category}
                  </span>
                  <h3 className="text-base sm:text-lg font-serif font-medium text-stone-900 dark:text-stone-100 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition">
                    {topic.shortTitle}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
                    {topic.summary}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-800 dark:text-teal-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Explorar trilha</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 4.6 PLANOS DA MENTORIA ISAAC — CARD GRÁTIS VS CARD PAGO + OPÇÃO DE PAGAMENTO ASAAS */}
      <section id="planos" className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto scroll-mt-12">
        <div className="space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/40 text-xs font-serif text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Planos Transparentes • Escolha Como Caminhar</span>
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-normal text-stone-900 dark:text-stone-50 tracking-tight">
              Plano Gratuito vs Plano Pago no WhatsApp
            </h2>
            <p className="text-xs sm:text-base text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
              O acesso completo ao App Web é <strong>100% gratuito e livre de cobranças</strong>. Se você desejar conversar com o Agente Orquestrador ISAAC também pelo seu <strong>WhatsApp (em texto e áudio)</strong>, ative o plano mensal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
            {/* CARD 1: PLANO GRATUITO (LIVRE, SEM ASAAS) */}
            <div className="p-6 sm:p-8 rounded-3xl sm:rounded-4xl bg-white dark:bg-slate-800/85 border border-stone-200 dark:border-slate-700 shadow-md flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-lg sm:text-xl font-serif font-semibold text-stone-900 dark:text-stone-100">
                    Plano Gratuito
                  </span>
                  <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    Sempre Livre • Sem Asaas
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-stone-50">
                      R$ 0,00
                    </span>
                    <span className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-serif">
                      / gratuito para sempre
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-serif">
                    Sem cartão de crédito e sem qualquer cadastro financeiro.
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 dark:border-slate-700/70">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-400 mb-3">
                    O que está incluso no Plano Gratuito:
                  </p>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-stone-700 dark:text-stone-200 font-serif">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                      <span>Conversas ilimitadas em <strong>Texto e Voz</strong> dentro do App Web</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                      <span>Agente Orquestrador <strong>ISAAC</strong> + todos os Mentores Especialistas</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                      <span>Memória evolutiva de longo prazo (RAG) e Conversas Direcionadas</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                      <span><strong>Laboratório do Incômodo Criativo</strong> completo</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                      <span>Frequências sonoras relaxantes (432Hz, Chuva, Lareira)</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-stone-400 dark:text-stone-500 pt-2 border-t border-stone-100 dark:border-slate-700/60">
                      <X className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Não inclui atendimento com o agente pelo WhatsApp</span>
                    </li>
                  </ul>
                </div>
              </div>

              <button
                type="button"
                onClick={onStartChat}
                className="w-full py-3.5 px-6 rounded-2xl bg-stone-900 hover:bg-stone-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-medium text-xs sm:text-sm tracking-wide transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>{user ? 'Continuar no App Gratuito' : 'Começar Agora no Plano Gratuito'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* CARD 2: PLANO PAGO — ISAAC NO WHATSAPP (R$ 14,99 / VENCIMENTO MENSAL VIA ASAAS) */}
            <div className="p-6 sm:p-8 rounded-3xl sm:rounded-4xl bg-gradient-to-b from-emerald-50/95 via-white to-teal-50/60 dark:from-emerald-950/45 dark:via-slate-800/95 dark:to-slate-800/90 border-2 border-emerald-500/80 dark:border-emerald-500/60 shadow-xl flex flex-col justify-between gap-6 relative">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-lg sm:text-xl font-serif font-semibold text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    Plano Pago • ISAAC no WhatsApp
                  </span>
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-xs">
                    Mais Completo
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-serif font-bold text-emerald-900 dark:text-emerald-300">
                      R$ 14,99
                    </span>
                    <span className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-serif">
                      / vencimento mensal
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 font-serif">
                    Pagamento seguro via <strong>Asaas</strong> (PIX, Cartão de Crédito ou Boleto). Cancele quando quiser.
                  </p>
                </div>

                <div className="pt-3 border-t border-emerald-200/70 dark:border-emerald-800/50">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 mb-3">
                    O que está incluso no Plano Pago:
                  </p>
                  <ul className="space-y-2.5 text-xs sm:text-sm text-stone-800 dark:text-stone-100 font-serif">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Tudo do Plano Gratuito</strong> 100% liberado no App Web</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Conversa pelo WhatsApp em Texto</strong> com o Agente Orquestrador ISAAC</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Mic className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Envie e receba Áudios no WhatsApp</strong> com voz neural realista</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>Reconhecimento automático pelo seu número de telefone</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>Sincronização imediata da conversa no mesmo chat do App</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>Lembretes acolhedores de evolução (com opção de pausar quando quiser)</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenPlans) {
                      onOpenPlans();
                    } else {
                      window.open(OFFICIAL_ASAAS_MONTHLY_URL, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Assinar Plano Pago — R$ 14,99/mês (PIX ou Cartão)</span>
                </button>

                <a
                  href={OFFICIAL_ASAAS_MONTHLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl border border-emerald-600/40 bg-white/80 dark:bg-slate-900/60 hover:bg-emerald-50 dark:hover:bg-slate-900 text-emerald-800 dark:text-emerald-300 font-medium text-xs transition flex items-center justify-center gap-1.5"
                >
                  <span>Ir direto para o Painel de Pagamento Asaas</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4.7 BIBLIOTECA OFICIAL DE EBOOKS BILÍNGUES + CARRINHO INTERATIVO */}
      <LandingEbooksShowcase onOpenEbookStore={onOpenEbookStore} />

      {/* 4.8 PERGUNTAS FREQUENTES (AEO — RESPOSTAS DIRETAS E CITÁVEIS) */}
      <section id="perguntas-frequentes" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto scroll-mt-12">
        <div className="space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/40 text-xs font-serif text-teal-800 dark:text-teal-300">
              <HelpCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Transparência &amp; Clareza</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-serif font-normal text-stone-900 dark:text-stone-50 tracking-tight">
              Perguntas Frequentes sobre a Mentoria ISAAC
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
              Respostas claras sobre funcionamento, privacidade dos seus relatos, recursos de voz e escopo ético.
            </p>
          </div>

          <div className="space-y-3.5">
            {HOME_FAQS.map((faq, idx) => (
              <details
                key={idx}
                open={idx === 0}
                className="group p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700/80 shadow-xs transition"
              >
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-serif font-medium text-sm sm:text-base text-stone-900 dark:text-stone-100">
                  <h3>{faq.question}</h3>
                  <span className="w-7 h-7 rounded-full bg-stone-100 dark:bg-slate-700/80 flex items-center justify-center text-teal-800 dark:text-teal-300 text-lg leading-none shrink-0 group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <p className="mt-3.5 pt-3.5 border-t border-stone-100 dark:border-slate-700/60 text-xs sm:text-sm font-serif text-stone-600 dark:text-stone-300 leading-relaxed">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

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

      {/* RODAPÉ INSTITUCIONAL & NAVEGAÇÃO SEMÂNTICA */}
      <footer className="py-10 px-4 border-t border-stone-200/80 dark:border-slate-800 text-center space-y-3 text-xs text-stone-500 dark:text-stone-400 font-serif">
        <p className="font-medium text-stone-700 dark:text-stone-300">
          Mentoria ISAAC • Espaço Confidencial de Clareza, Escuta Atenta e Desenvolvimento Pessoal
        </p>
        <nav aria-label="Links úteis do rodapé" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px]">
          <a href="#quem-e-isaac" className="hover:text-teal-700 dark:hover:text-teal-400 transition">
            Sobre a Mentoria
          </a>
          <a href="#sigilo-seguranca" className="hover:text-teal-700 dark:hover:text-teal-400 transition">
            Sigilo &amp; Privacidade
          </a>
          <a href="#trilhas-de-clareza" className="hover:text-teal-700 dark:hover:text-teal-400 transition">
            Trilhas de Clareza
          </a>
          <a href="#planos" className="hover:text-teal-700 dark:hover:text-teal-400 transition font-semibold text-emerald-700 dark:text-emerald-400">
            Planos (Grátis &amp; Pago)
          </a>
          <a href="/loja/ebooks" className="hover:text-amber-700 dark:hover:text-amber-400 transition font-semibold text-amber-700 dark:text-amber-400">
            Biblioteca de eBooks (Thiago Prata)
          </a>
          <a href="#perguntas-frequentes" className="hover:text-teal-700 dark:hover:text-teal-400 transition">
            Perguntas Frequentes
          </a>
          <a href="/inscricao" className="hover:text-teal-700 dark:hover:text-teal-400 transition">
            Inscrição Oficial
          </a>
        </nav>
      </footer>
    </div>
  );
}
