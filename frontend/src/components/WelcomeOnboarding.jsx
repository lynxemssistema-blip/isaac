import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Feather, Heart, ArrowRight, Sparkles, Check } from 'lucide-react';

const SUGGESTIONS = ['Isaac', 'Guia', 'Mentor', 'Hermes', 'Sophia', 'Conselheiro'];

export default function WelcomeOnboarding({ userName = 'Viajante', onComplete }) {
  const [guideName, setGuideName] = useState('Isaac');
  const [customName, setCustomName] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectSuggestion = (name) => {
    setIsCustom(false);
    setGuideName(name);
  };

  const handleConfirm = () => {
    const finalName = (isCustom ? customName.trim() : guideName.trim()) || 'Isaac';
    setIsSaving(true);

    // Salva localmente e no estado
    localStorage.setItem('isaac_guide_name', finalName);
    localStorage.setItem('izaque_guide_name', finalName);
    localStorage.setItem('isaac_onboarding_completed', 'true');
    localStorage.setItem('izaque_onboarding_completed', 'true');

    setTimeout(() => {
      setIsSaving(false);
      if (onComplete) onComplete(finalName);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-md transition-all">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -16 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-4xl p-8 sm:p-12 shadow-2xl shadow-stone-900/20 text-stone-800 dark:text-stone-100 relative overflow-hidden"
      >
        {/* Halo sutil de iluminação ambiente relaxante */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-600/10 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-600/10 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-8">
          {/* Emblema acolhedor de boas-vindas */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 dark:border-teal-500/30 flex items-center justify-center text-teal-800 dark:text-teal-400">
              <Feather className="w-6 h-6 stroke-[1.75]" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest font-semibold text-teal-800/80 dark:text-teal-400">
                Plataforma Pessoal
              </span>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Um espaço seguro de escuta, clareza e desenvolvimento pessoal
              </p>
            </div>
          </div>

          {/* Mensagem de Apresentação Terapêutica */}
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-serif font-medium tracking-tight text-stone-900 dark:text-stone-50 leading-snug">
              Olá, {userName}.
            </h2>
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
              Eu serei o seu guia nesta jornada de clareza e desatamento de nós emocionais. Meu nome de origem é <strong className="font-semibold text-teal-800 dark:text-teal-300">Isaac</strong>, mas você pode me chamar como preferir.
            </p>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Como você gostaria de me chamar nos nossos momentos de conversa?
            </p>
          </div>

          {/* Seleção de Sugestões de Nomes */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2.5">
              {SUGGESTIONS.map((name) => {
                const isSelected = !isCustom && guideName === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleSelectSuggestion(name)}
                    className={`py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-medium transition-all duration-300 flex items-center justify-center gap-1.5 border ${
                      isSelected
                        ? 'bg-teal-700 text-white border-teal-700 shadow-md shadow-teal-700/20'
                        : 'bg-white/80 dark:bg-slate-800/60 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-slate-700 hover:border-teal-700/50 dark:hover:border-teal-500/50'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    <span>{name}</span>
                  </button>
                );
              })}
            </div>

            {/* Opção para digitar nome personalizado */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsCustom(true)}
                className={`text-xs font-medium transition-colors ${
                  isCustom
                    ? 'text-teal-800 dark:text-teal-400 font-semibold'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                + Prefiro escolher outro nome personalizado
              </button>

              <AnimatePresence>
                {isCustom && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-2.5"
                  >
                    <input
                      type="text"
                      autoFocus
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Digite o nome que ressoa com você (ex: Guardião, Amigo, Alma)..."
                      className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 dark:focus:border-teal-400 text-sm text-stone-800 dark:text-stone-100 placeholder-stone-400 outline-none transition"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Rodapé e Ação de Entrada */}
          <div className="pt-4 border-t border-stone-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-stone-400 dark:text-stone-500 flex items-center gap-1.5 order-2 sm:order-1">
              <Heart className="w-3.5 h-3.5 text-amber-700/60 dark:text-amber-500/60" />
              Você poderá mudar isso quando quiser no seu perfil.
            </span>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSaving || (isCustom && !customName.trim())}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-medium tracking-wide shadow-lg shadow-teal-700/25 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 order-1 sm:order-2"
            >
              <span>{isSaving ? 'Guardando...' : `Iniciar com ${isCustom ? customName || 'Guia' : guideName}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
