import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { requestPasswordReset } from '../services/api';
import {
  fetchPublicDefaultCampaign,
  completeSignupAndDeliverPdfApi,
} from '../services/adminApi';
import TermsOfUseModal, { TERMS_VERSION } from './TermsOfUseModal';
import {
  BRAZIL_STATES,
  MAIN_GOAL_OPTIONS,
  formatPhoneMask,
} from './DirectSignupPage';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  Compass,
  FileText,
  Feather,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  LifeBuoy,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  initialEmail = '',
}) {
  // 'login' | 'signup' | 'forgot'
  const [mode, setMode] = useState(initialMode || 'login');
  const [email, setEmail] = useState(initialEmail || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Campos completos de cadastro
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [city, setCity] = useState('');
  const [stateUf, setStateUf] = useState('');
  const [occupation, setOccupation] = useState('');
  const [mainGoal, setMainGoal] = useState('');

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [defaultCampaign, setDefaultCampaign] = useState(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');

  // Confirmação pós-cadastro (mensagem + botão para entrar no app)
  const [signupSuccessState, setSignupSuccessState] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'login');
      if (initialEmail) setEmail(initialEmail);
      setErrorMsg('');
      setForgotSuccessMsg('');
      setSignupSuccessState(null);

      fetchPublicDefaultCampaign()
        .then((res) => setDefaultCampaign(res?.campaign || null))
        .catch(() => {});
    } else if (typeof window !== 'undefined') {
      window.__izaqueSignupFlowActive = false;
    }
  }, [isOpen, initialMode, initialEmail]);

  if (!isOpen) return null;

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setErrorMsg('');
    setForgotSuccessMsg('');
    setTermsAccepted(false);
  };

  const handleEnterAfterSignup = () => {
    if (typeof window !== 'undefined') {
      window.__izaqueSignupFlowActive = false;
    }
    const createdUser = signupSuccessState?.user;
    const savedProfile = signupSuccessState?.profile;
    setSignupSuccessState(null);
    onSuccess(createdUser, savedProfile);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setForgotSuccessMsg('');

    if (mode === 'signup') {
      const cleanDigits = phone.replace(/\D/g, '');
      if (fullName.trim().length < 2) {
        setErrorMsg('Por favor, informe seu nome completo.');
        return;
      }
      if (cleanDigits.length < 10) {
        setErrorMsg('Informe um número de WhatsApp/celular válido com DDD.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('A confirmação de senha não confere.');
        return;
      }
      if (!termsAccepted) {
        setErrorMsg('É necessário concordar com os Termos e Condições de Uso para criar sua conta.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        onSuccess(data.user);
        onClose();
      } else if (mode === 'signup') {
        if (typeof window !== 'undefined') {
          window.__izaqueSignupFlowActive = true;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              phone: phone.trim(),
            },
          },
        });
        if (error) {
          if (typeof window !== 'undefined') window.__izaqueSignupFlowActive = false;
          throw error;
        }

        let completeRes = null;
        if (data?.user) {
          try {
            completeRes = await completeSignupAndDeliverPdfApi({
              userId: data.user.id,
              email: email.trim().toLowerCase(),
              fullName: fullName.trim(),
              phone: phone.trim(),
              birthDate: birthDate || null,
              city: city.trim() || null,
              state: stateUf || null,
              occupation: occupation.trim() || null,
              mainGoal: mainGoal || null,
              termsVersion: TERMS_VERSION,
              campaignSlug: '',
              signupOrigin: 'landing_modal',
              appUrl: typeof window !== 'undefined' ? window.location.origin : '',
            });
          } catch (completeErr) {
            console.warn('Aviso ao concluir perfil/envio de PDF:', completeErr);
          }
        }

        setSignupSuccessState({
          user: data.user,
          profile: completeRes?.profile || null,
          recipientEmail: email.trim().toLowerCase(),
          campaign: completeRes?.campaign || defaultCampaign,
          hasCampaign: Boolean(completeRes?.hasCampaign || defaultCampaign),
          pdfDelivered: Boolean(completeRes?.pdfDelivered),
          deliveryError: completeRes?.deliveryError || null,
        });
      } else if (mode === 'forgot') {
        if (!email || !email.includes('@')) {
          setErrorMsg('Por favor, digite um e-mail válido.');
          setLoading(false);
          return;
        }
        const res = await requestPasswordReset(email.trim());
        setForgotSuccessMsg(
          res.message || 'Link de recuperação enviado com sucesso para o seu e-mail!'
        );
      }
    } catch (err) {
      if (typeof window !== 'undefined') window.__izaqueSignupFlowActive = false;
      console.error('Erro no fluxo de autenticação:', err);
      setErrorMsg(err.message || 'Ocorreu um erro ao processar sua solicitação.');
    } finally {
      setLoading(false);
    }
  };

  // Tela interna de confirmação pós-cadastro com mensagem + botão para entrar no app
  if (signupSuccessState) {
    const campTitle = signupSuccessState.campaign?.title || 'Material Exclusivo';
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-md pt-safe animate-fadeIn">
        <div className="relative w-full max-w-md p-6 sm:p-9 bg-stone-50 dark:bg-slate-900 border-t sm:border border-stone-200 dark:border-slate-800 rounded-t-3xl sm:rounded-4xl shadow-2xl text-stone-800 dark:text-stone-100 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-serif font-medium text-stone-900 dark:text-stone-50">
              Cadastro Realizado com Sucesso!
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-serif leading-relaxed">
              Seu espaço pessoal na Plataforma ISAAC já está pronto.
            </p>
          </div>

          {signupSuccessState.hasCampaign && (
            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-left space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 dark:text-teal-300">
                <FileText className="w-4 h-4 shrink-0" />
                <span>
                  {signupSuccessState.pdfDelivered
                    ? 'Seu PDF foi enviado para o seu e-mail!'
                    : 'Aviso sobre o envio do PDF'}
                </span>
              </div>
              {signupSuccessState.pdfDelivered ? (
                <p className="text-xs text-teal-900/85 dark:text-teal-200/85 leading-relaxed">
                  Enviamos <strong>{campTitle}</strong> em anexo para{' '}
                  <strong>{signupSuccessState.recipientEmail}</strong>. Confira também as pastas Spam ou Promoções caso não localize em instantes.
                </p>
              ) : (
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  Sua conta foi criada normalmente, mas houve uma oscilação ao enviar o e-mail ({signupSuccessState.deliveryError || 'tente novamente depois'}).
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleEnterAfterSignup}
            className="w-full py-3.5 px-6 rounded-2xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-semibold text-sm tracking-wide shadow-md shadow-teal-700/20 transition flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Entrar no App Agora</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-md pt-safe animate-fadeIn">
      <div
        className={`relative w-full ${
          mode === 'signup' ? 'max-w-xl' : 'max-w-md'
        } p-6 sm:p-8 bg-stone-50 dark:bg-slate-900 border-t sm:border border-stone-200 dark:border-slate-800 rounded-t-3xl sm:rounded-4xl shadow-2xl text-stone-800 dark:text-stone-100 max-h-[92dvh] overflow-y-auto overscroll-contain pb-safe sm:pb-8 transition-all`}
      >
        {/* Barra de Arraste visual (Mobile Native Pull-bar) */}
        <div className="w-12 h-1 bg-stone-300 dark:bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full hover:bg-stone-200/50 dark:hover:bg-slate-800 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 dark:border-teal-500/30 mb-2.5 text-teal-800 dark:text-teal-400 shadow-sm">
            <Feather className="w-6 h-6 stroke-[1.75]" />
          </div>

          {mode === 'signup' && defaultCampaign && (
            <div className="mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/50 text-teal-800 dark:text-teal-300 text-[11px] font-medium">
                <FileText className="w-3.5 h-3.5" />
                <span>Receba por e-mail: {defaultCampaign.title}</span>
              </span>
            </div>
          )}

          <h2 className="text-xl sm:text-2xl font-serif font-medium tracking-tight text-stone-900 dark:text-stone-50">
            {mode === 'login' && 'Acessar Plataforma'}
            {mode === 'signup' && 'Iniciar Sua Jornada'}
            {mode === 'forgot' && 'Recuperar Acesso'}
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-serif leading-relaxed">
            {mode === 'login' && 'Conecte-se para continuar seus momentos de reflexão e escuta'}
            {mode === 'signup' &&
              (defaultCampaign
                ? 'Preencha seu cadastro completo para entrar no app e receber o PDF gratuito no seu e-mail'
                : 'Dê o primeiro passo para desatar bloqueios com tranquilidade')}
            {mode === 'forgot' && 'Enviaremos um link seguro para o seu e-mail redefinir a senha'}
          </p>
        </div>

        {/* Mensagem de Erro */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Mensagem de Sucesso na Recuperação */}
        {forgotSuccessMsg && (
          <div className="mb-4 p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs space-y-2 animate-fadeIn">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400" />
              <span>Link Enviado com Sucesso!</span>
            </div>
            <p className="leading-relaxed">
              Verifique a caixa de entrada (e a pasta de spam) de <strong>{email}</strong> para redefinir sua senha com um clique.
            </p>
            <p className="text-[11px] text-teal-700/80 dark:text-teal-400/80 pt-1 border-t border-teal-200/60 dark:border-teal-800/60">
              Canal de suporte oficial: <strong>suporte@lynxems.com.br</strong>
            </p>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Nome Completo */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Como você gostaria de ser chamado?"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm placeholder-stone-400 outline-none transition"
                  />
                </div>
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Seu E-mail *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm placeholder-stone-400 outline-none transition"
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  WhatsApp / Celular (DDD) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneMask(e.target.value))}
                    placeholder="(11) 99999-9999"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm placeholder-stone-400 outline-none transition"
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Senha de Acesso *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm placeholder-stone-400 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 p-0.5"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Senha */}
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Confirmar Senha *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita sua senha"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm placeholder-stone-400 outline-none transition"
                  />
                </div>
              </div>

              {/* Data de Nascimento */}
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Data de Nascimento
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400 pointer-events-none" />
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm text-stone-700 dark:text-stone-200 outline-none transition"
                  />
                </div>
              </div>

              {/* Profissão */}
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Profissão / Ocupação
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="Sua área de atuação"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm placeholder-stone-400 outline-none transition"
                  />
                </div>
              </div>

              {/* Cidade */}
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Cidade
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Sua cidade"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm placeholder-stone-400 outline-none transition"
                  />
                </div>
              </div>

              {/* Estado / UF */}
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Estado (UF)
                </label>
                <select
                  value={stateUf}
                  onChange={(e) => setStateUf(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm text-stone-700 dark:text-stone-200 outline-none transition"
                >
                  <option value="">Selecione...</option>
                  {BRAZIL_STATES.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </div>

              {/* Objetivo Principal */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Principal Momento / Objetivo
                </label>
                <div className="relative">
                  <Compass className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400 pointer-events-none" />
                  <select
                    value={mainGoal}
                    onChange={(e) => setMainGoal(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm text-stone-700 dark:text-stone-200 outline-none transition"
                  >
                    <option value="">Selecione o que mais busca hoje...</option>
                    {MAIN_GOAL_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Seu E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm placeholder-stone-400 outline-none transition"
                  />
                </div>
              </div>

              {mode === 'login' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                      Senha de Acesso
                    </label>
                    <button
                      type="button"
                      onClick={() => handleModeChange('forgot')}
                      className="text-xs text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 hover:underline transition"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm placeholder-stone-400 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 p-0.5"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {mode === 'signup' && (
            <div className="pt-1 pb-1">
              <label className="flex items-start gap-2.5 text-xs text-stone-600 dark:text-stone-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-teal-700 focus:ring-teal-500 border-stone-300 dark:border-slate-600 dark:bg-slate-800"
                />
                <span className="leading-snug">
                  Li e concordo expressamente com os{' '}
                  <button
                    type="button"
                    onClick={() => setIsTermsModalOpen(true)}
                    className="font-semibold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
                  >
                    Termos e Condições de Uso (Versão Beta)
                  </button>
                  .
                </span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (mode === 'signup' && !termsAccepted)}
            className="w-full mt-2 py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-medium text-sm tracking-wide shadow-md shadow-teal-700/20 transition duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 min-h-[44px]"
          >
            {loading ? (
              <span>
                {mode === 'forgot'
                  ? 'Enviando link seguro...'
                  : mode === 'signup'
                  ? 'Concluindo cadastro...'
                  : 'Processando com cuidado...'}
              </span>
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Acessar Plataforma'}
                  {mode === 'signup' &&
                    (defaultCampaign
                      ? 'Concluir Cadastro e Receber PDF'
                      : 'Iniciar Minha Jornada')}
                  {mode === 'forgot' && 'Enviar Link de Recuperação'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Alternância de Telas */}
        <div className="mt-5 pt-4 border-t border-stone-200 dark:border-slate-800 flex flex-col items-center gap-2 text-xs">
          {mode === 'login' && (
            <button
              type="button"
              onClick={() => handleModeChange('signup')}
              className="text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 py-1"
            >
              Não tem conta? <span className="font-semibold text-teal-700 dark:text-teal-400">Crie aqui</span>
            </button>
          )}

          {mode === 'signup' && (
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className="text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 py-1"
            >
              Já tem refúgio? <span className="font-semibold text-teal-700 dark:text-teal-400">Entrar</span>
            </button>
          )}

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className="text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 py-1"
            >
              Lembrou sua senha? <span className="font-semibold text-teal-700 dark:text-teal-400">Voltar ao Login</span>
            </button>
          )}

          {/* Rodapé de Suporte Oficial */}
          <div className="pt-3 flex items-center justify-center gap-1.5 text-[11px] text-stone-400 dark:text-slate-500">
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Suporte oficial:</span>
            <a
              href="mailto:suporte@lynxems.com.br"
              className="text-teal-700 dark:text-teal-400 hover:underline font-medium"
            >
              suporte@lynxems.com.br
            </a>
          </div>
        </div>
      </div>

      {/* MODAL JURÍDICO DOS TERMOS DE USO */}
      <TermsOfUseModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        onAccept={() => setTermsAccepted(true)}
      />
    </div>
  );
}
