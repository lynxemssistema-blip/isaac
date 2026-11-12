import React, { useState } from 'react';
import { submitPublicInscriptionApi } from '../services/adminApi';
import { formatPhoneMask } from './DirectSignupPage';
import {
  Feather,
  User,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Heart,
  Lock,
  ArrowLeft,
} from 'lucide-react';

const EMAIL_CHECK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function SimpleInscriptionPage({ onBackToHome }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedName, setSubmittedName] = useState('');

  const trimmedEmail = email.trim();
  const phoneDigits = phone.replace(/\D/g, '');
  const hasValidEmail = EMAIL_CHECK.test(trimmedEmail);
  const hasValidPhone = phoneDigits.length >= 10 && phoneDigits.length <= 15;
  const hasAtLeastOneValidContact = hasValidEmail || hasValidPhone;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (fullName.trim().length < 2) {
      setErrorMsg('Por favor, informe o seu nome completo.');
      return;
    }

    if (trimmedEmail && !hasValidEmail) {
      setErrorMsg('O e-mail digitado não parece válido. Corrija o e-mail ou deixe-o em branco caso informe o celular.');
      return;
    }

    if (phone.trim() && !hasValidPhone) {
      setErrorMsg('Informe um número de celular/WhatsApp válido com DDD (ex.: (11) 99999-9999).');
      return;
    }

    if (!hasAtLeastOneValidContact) {
      setErrorMsg('Informe pelo menos um e-mail válido ou um número de celular/WhatsApp válido.');
      return;
    }

    try {
      setSubmitting(true);
      await submitPublicInscriptionApi({
        fullName: fullName.trim(),
        email: trimmedEmail || null,
        phone: phone.trim() || null,
      });

      setSubmittedName(fullName.trim().split(/\s+/)[0] || fullName.trim());
    } catch (err) {
      setErrorMsg(err.message || 'Não foi possível concluir sua inscrição agora. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForAnother = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setErrorMsg('');
    setSubmittedName('');
  };

  // ==========================================================================
  // PÁGINA DE AGRADECIMENTO & MENSAGEM DE CONFIANÇA
  // ==========================================================================
  if (submittedName) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4 sm:p-8 bg-stone-50 dark:bg-slate-900 text-stone-800 dark:text-stone-100 font-sans">
        <div className="w-full max-w-lg p-7 sm:p-10 rounded-4xl bg-white dark:bg-slate-900/95 border border-stone-200/90 dark:border-slate-800 shadow-2xl text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2.5">
            <h1 className="text-2xl sm:text-3xl font-serif font-medium text-stone-900 dark:text-stone-50">
              Muito obrigado, {submittedName}!
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
              Sua ficha de inscrição foi recebida com sucesso.
            </p>
          </div>

          {/* Bloco de Confiança, Sigilo e Cuidado */}
          <div className="p-5 rounded-3xl bg-teal-50/80 dark:bg-teal-950/35 border border-teal-200/80 dark:border-teal-800/50 text-left space-y-3">
            <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-semibold text-xs sm:text-sm">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Compromisso de Confiança, Respeito e Sigilo</span>
            </div>

            <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-200 leading-relaxed font-serif">
              Pode ficar completamente tranquilo(a): seus dados estão guardados em ambiente seguro e sob total confidencialidade com a nossa equipe.
            </p>

            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Valorizamos profundamente a sua confiança. Suas informações jamais são compartilhadas com terceiros, não praticamos spam e nosso contato com você será sempre pautado pelo cuidado, ética e respeito ao seu momento.
            </p>
          </div>

          <div className="pt-2 flex flex-col items-center gap-3">
            <div className="inline-flex items-center gap-1.5 text-xs text-teal-700 dark:text-teal-400 font-serif">
              <Heart className="w-3.5 h-3.5 fill-teal-600/20" />
              <span>Agradecemos por caminhar conosco.</span>
            </div>

            <a
              href="/"
              onClick={(e) => {
                if (onBackToHome) {
                  e.preventDefault();
                  onBackToHome();
                }
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-sm transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Conhecer a Plataforma ISAAC</span>
            </a>

            <button
              type="button"
              onClick={handleResetForAnother}
              className="text-[11px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 underline underline-offset-4 transition pt-1"
            >
              Preencher outra inscrição
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // FICHA DE INSCRIÇÃO SIMPLES (SEM SENHA)
  // ==========================================================================
  return (
    <div className="min-h-ios-dvh flex flex-col items-center justify-center py-8 px-4 sm:px-6 bg-stone-50 dark:bg-slate-900 text-stone-800 dark:text-stone-100 font-sans">
      <div className="w-full max-w-md mb-4 flex items-center justify-between px-1">
        <a
          href="/"
          onClick={(e) => {
            if (onBackToHome) {
              e.preventDefault();
              onBackToHome();
            }
          }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-teal-700 dark:text-stone-400 dark:hover:text-teal-300 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar para a Plataforma ISAAC</span>
        </a>
      </div>
      <div className="w-full max-w-md bg-white dark:bg-slate-900/95 border border-stone-200/90 dark:border-slate-800 rounded-4xl shadow-2xl p-6 sm:p-9 space-y-6 animate-fadeIn">
        {/* Cabeçalho */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 dark:border-teal-500/30 text-teal-800 dark:text-teal-400 shadow-sm mb-1">
            <Feather className="w-6 h-6 stroke-[1.75]" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-medium tracking-tight text-stone-900 dark:text-stone-50">
            Ficha de Inscrição
          </h1>

          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-serif leading-relaxed">
            Preencha seu nome e informe seu melhor <strong>e-mail</strong> ou <strong>celular/WhatsApp</strong> para registrarmos seu contato com segurança.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <label htmlFor="inscription-fullname" className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              Nome Completo *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
              <input
                id="inscription-fullname"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Digite seu nome completo"
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-stone-50/70 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm placeholder-stone-400 outline-none transition"
              />
            </div>
          </div>

          {/* Bloco de Contato (E-mail OU Celular) */}
          <div className="p-4 rounded-3xl bg-stone-50/80 dark:bg-slate-800/50 border border-stone-200/80 dark:border-slate-700/70 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-300">
                Informe E-mail ou Celular (ou ambos) *
              </span>
              {hasAtLeastOneValidContact && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Contato válido
                </span>
              )}
            </div>

            {/* E-mail */}
            <div>
              <label htmlFor="inscription-email" className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                <input
                  id="inscription-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm placeholder-stone-400 outline-none transition"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
              <div className="flex-1 h-px bg-stone-200 dark:bg-slate-700" />
              <span>ou / e</span>
              <div className="flex-1 h-px bg-stone-200 dark:bg-slate-700" />
            </div>

            {/* Celular / WhatsApp */}
            <div>
              <label htmlFor="inscription-phone" className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Celular / WhatsApp (com DDD)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                <input
                  id="inscription-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneMask(e.target.value))}
                  placeholder="(11) 99999-9999"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm placeholder-stone-400 outline-none transition"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 rounded-2xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-semibold text-sm tracking-wide shadow-md shadow-teal-700/20 transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 min-h-[48px]"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registrando sua inscrição...</span>
              </>
            ) : (
              <span>Confirmar Minha Inscrição</span>
            )}
          </button>
        </form>

        {/* Selo de Privacidade */}
        <div className="pt-3 border-t border-stone-200/80 dark:border-slate-800 flex items-center justify-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 text-center">
          <Lock className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
          <span>Seus dados são protegidos com sigilo absoluto e não geram cobranças nem spam.</span>
        </div>
      </div>
    </div>
  );
}

