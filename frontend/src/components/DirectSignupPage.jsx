import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import {
  fetchPublicCampaignBySlug,
  fetchPublicDefaultCampaign,
  completeSignupAndDeliverPdfApi,
  sendPdfToExistingUserApi,
} from '../services/adminApi';
import TermsOfUseModal, { TERMS_VERSION } from './TermsOfUseModal';
import {
  Feather,
  User,
  Mail,
  Lock,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  Compass,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  Send,
  LifeBuoy,
} from 'lucide-react';

export const BRAZIL_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO', 'EXTERIOR',
];

export const MAIN_GOAL_OPTIONS = [
  'Clareza Emocional & Paz Interior',
  'Carreira, Foco & Tomada de Decisão',
  'Superar Bloqueios & Autossabotagem',
  'Espiritualidade & Propósito de Vida',
  'Relacionamentos & Convivência',
  'Autoconhecimento & Evolução Pessoal',
];

import { formatPhoneMask } from '../utils/phoneUtils';
export { formatPhoneMask };

export default function DirectSignupPage({
  slug = '',
  currentUser = null,
  onEnterApp,
  onOpenLogin,
  onBackToHome,
}) {
  // 'signup' | 'existing'
  const [activeMode, setActiveMode] = useState('signup');
  const [campaign, setCampaign] = useState(null);
  const [loadingCampaign, setLoadingCampaign] = useState(true);

  // Campos do Cadastro Completo
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [city, setCity] = useState('');
  const [stateUf, setStateUf] = useState('');
  const [occupation, setOccupation] = useState('');
  const [mainGoal, setMainGoal] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  // Campo para "Já tenho conta, apenas envie o PDF"
  const [existingEmail, setExistingEmail] = useState(currentUser?.email || '');

  // Estados de envio e retorno
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoNotice, setInfoNotice] = useState('');
  const [alreadyRegisteredPrompt, setAlreadyRegisteredPrompt] = useState(false);

  // Estado da tela final de confirmação (mensagem + botão para entrar no app)
  const [completionData, setCompletionData] = useState(null);
  const [createdAuthUser, setCreatedAuthUser] = useState(null);
  const [createdProfile, setCreatedProfile] = useState(null);

  useEffect(() => {
    if (currentUser?.email && !existingEmail) {
      setExistingEmail(currentUser.email);
    }
  }, [currentUser]);

  useEffect(() => {
    let mounted = true;
    setLoadingCampaign(true);

    const loadCampaign = async () => {
      try {
        if (slug) {
          const res = await fetchPublicCampaignBySlug(slug);
          if (mounted) setCampaign(res?.campaign || null);
        } else {
          const res = await fetchPublicDefaultCampaign();
          if (mounted) setCampaign(res?.campaign || null);
        }
      } catch (err) {
        console.warn('Aviso ao consultar campanha pública:', err);
      } finally {
        if (mounted) setLoadingCampaign(false);
      }
    };

    loadCampaign();
    return () => {
      mounted = false;
      if (typeof window !== 'undefined') {
        window.__izaqueSignupFlowActive = false;
      }
    };
  }, [slug]);

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoNotice('');
    setAlreadyRegisteredPrompt(false);

    const cleanDigits = phone.replace(/\D/g, '');
    if (fullName.trim().length < 2) {
      setErrorMsg('Por favor, informe seu nome completo.');
      return;
    }
    if (!email.includes('@')) {
      setErrorMsg('Por favor, informe um e-mail válido.');
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
      setErrorMsg('A confirmação de senha não confere com a senha digitada.');
      return;
    }
    if (!termsAccepted) {
      setErrorMsg('É necessário concordar com os Termos e Condições de Uso para concluir o cadastro.');
      return;
    }

    setSubmitting(true);
    if (typeof window !== 'undefined') {
      window.__izaqueSignupFlowActive = true;
    }

    try {
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
        const msgLower = (error.message || '').toLowerCase();
        if (msgLower.includes('already registered') || msgLower.includes('already been registered')) {
          if (typeof window !== 'undefined') window.__izaqueSignupFlowActive = false;
          setAlreadyRegisteredPrompt(true);
          setExistingEmail(email.trim().toLowerCase());
          setErrorMsg('Este e-mail já possui cadastro no ISAAC.');
          setSubmitting(false);
          return;
        }
        throw error;
      }

      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        if (typeof window !== 'undefined') window.__izaqueSignupFlowActive = false;
        setAlreadyRegisteredPrompt(true);
        setExistingEmail(email.trim().toLowerCase());
        setErrorMsg('Este e-mail já possui cadastro no ISAAC.');
        setSubmitting(false);
        return;
      }

      const authUser = data?.user;
      if (!authUser?.id) {
        throw new Error('Não foi possível inicializar sua conta. Tente novamente.');
      }

      const completeRes = await completeSignupAndDeliverPdfApi({
        userId: authUser.id,
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        phone: phone.trim(),
        birthDate: birthDate || null,
        city: city.trim() || null,
        state: stateUf || null,
        occupation: occupation.trim() || null,
        mainGoal: mainGoal || null,
        termsVersion: TERMS_VERSION,
        campaignSlug: slug || '',
        signupOrigin: 'direct_link',
        appUrl: typeof window !== 'undefined' ? window.location.origin : '',
      });

      setCreatedAuthUser(authUser);
      setCreatedProfile(completeRes.profile || null);
      setCompletionData({
        mode: 'new_signup',
        recipientEmail: email.trim().toLowerCase(),
        campaign: completeRes.campaign || campaign,
        pdfDelivered: Boolean(completeRes.pdfDelivered),
        hasCampaign: Boolean(completeRes.hasCampaign),
        deliveryError: completeRes.deliveryError || null,
      });
    } catch (err) {
      if (typeof window !== 'undefined') window.__izaqueSignupFlowActive = false;
      console.error('Erro no cadastro direto:', err);
      setErrorMsg(err.message || 'Ocorreu um erro ao concluir o seu cadastro.');
    } finally {
      setSubmitting(false);
    }
  };

  const triggerExistingUserSend = async (targetEmail) => {
    const cleanTarget = (targetEmail || existingEmail || '').trim().toLowerCase();
    if (!cleanTarget || !cleanTarget.includes('@')) {
      setErrorMsg('Por favor, digite o e-mail da sua conta.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setInfoNotice('');
    setAlreadyRegisteredPrompt(false);

    try {
      const res = await sendPdfToExistingUserApi({
        email: cleanTarget,
        campaignSlug: slug || '',
        appUrl: typeof window !== 'undefined' ? window.location.origin : '',
      });

      setCompletionData({
        mode: 'existing_user',
        recipientEmail: res.recipientEmail || cleanTarget,
        campaign: res.campaign || campaign,
        pdfDelivered: true,
        hasCampaign: true,
      });
    } catch (err) {
      if (err.code === 'USER_NOT_FOUND') {
        setEmail(cleanTarget);
        setActiveMode('signup');
        setInfoNotice(
          'Ainda não encontramos uma conta com este e-mail. Preencha seu cadastro abaixo para liberar seu acesso no app e receber o PDF agora!'
        );
      } else {
        setErrorMsg(err.message || 'Não foi possível enviar o PDF no momento.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleExistingSubmit = async (e) => {
    e.preventDefault();
    await triggerExistingUserSend(existingEmail);
  };

  const handleEnterAppClick = () => {
    if (typeof window !== 'undefined') {
      window.__izaqueSignupFlowActive = false;
      window.history.replaceState({}, '', '/');
    }

    if (completionData?.mode === 'new_signup' && createdAuthUser) {
      onEnterApp(createdAuthUser, createdProfile);
      return;
    }

    if (currentUser) {
      onEnterApp(currentUser, null);
      return;
    }

    onOpenLogin(completionData?.recipientEmail || existingEmail || email);
  };

  // ==========================================================================
  // TELA DE CONFIRMAÇÃO PÓS-CADASTRO / ENVIO DO PDF + BOTÃO PARA ENTRAR NO APP
  // ==========================================================================
  if (completionData) {
    const pdfTitle = completionData.campaign?.title || 'Material Exclusivo';
    const pdfFile = completionData.campaign?.pdfFileName;

    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4 sm:p-8 bg-stone-50 dark:bg-slate-900 text-stone-800 dark:text-stone-100 font-sans">
        <div className="w-full max-w-lg p-7 sm:p-10 rounded-4xl bg-white dark:bg-slate-800/95 border border-stone-200 dark:border-slate-700 shadow-2xl text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-medium text-stone-900 dark:text-stone-50">
              {completionData.mode === 'new_signup'
                ? 'Cadastro Concluído com Sucesso!'
                : 'PDF Enviado com Sucesso!'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-serif leading-relaxed">
              {completionData.mode === 'new_signup'
                ? 'Seu acesso ao ecossistema da Plataforma ISAAC já está liberado.'
                : 'Identificamos sua conta no ISAAC e já disparamos o seu material.'}
            </p>
          </div>

          {completionData.hasCampaign && (
            <div className="p-4 sm:p-5 rounded-3xl bg-teal-50/90 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 text-left space-y-2">
              <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-semibold text-xs sm:text-sm">
                <FileText className="w-4 h-4 shrink-0" />
                <span>
                  {completionData.pdfDelivered
                    ? 'Seu PDF foi enviado por e-mail!'
                    : 'Conta criada (aviso sobre o envio do PDF)'}
                </span>
              </div>

              {completionData.pdfDelivered ? (
                <p className="text-xs text-teal-900/85 dark:text-teal-200/85 leading-relaxed">
                  Enviamos o material <strong>{pdfTitle}</strong>
                  {pdfFile ? ` (${pdfFile})` : ''} em anexo para{' '}
                  <strong>{completionData.recipientEmail}</strong>. Caso não apareça na caixa principal em até 2 minutos, verifique as abas <strong>Promoções</strong> ou <strong>Spam</strong>.
                </p>
              ) : (
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  Sua conta foi criada normalmente, mas houve uma oscilação momentânea no servidor de e-mail ({completionData.deliveryError || 'tente novamente em instantes'}). Nossa equipe pode reenviar o PDF a qualquer momento.
                </p>
              )}
            </div>
          )}

          <div className="pt-2 space-y-3">
            <button
              type="button"
              onClick={handleEnterAppClick}
              className="w-full py-4 px-6 rounded-2xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-semibold text-sm tracking-wide shadow-lg shadow-teal-700/25 transition flex items-center justify-center gap-2.5 active:scale-95"
            >
              <span>Entrar no App Agora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-stone-400 dark:text-slate-500">
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Suporte:</span>
            <a
              href="mailto:suporte@lynxems.com.br"
              className="text-teal-700 dark:text-teal-400 hover:underline font-medium"
            >
              suporte@lynxems.com.br
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // FORMULÁRIO PRINCIPAL DA PÁGINA SIMPLES DE CADASTRO DIRETO
  // ==========================================================================
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center py-6 px-4 sm:px-6 bg-stone-50 dark:bg-slate-900 text-stone-800 dark:text-stone-100 font-sans">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900/95 border border-stone-200/90 dark:border-slate-800 rounded-4xl shadow-2xl p-5 sm:p-9 space-y-6 animate-fadeIn">
        {/* CABEÇALHO DO LINK */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 dark:border-teal-500/30 text-teal-800 dark:text-teal-400 shadow-sm mb-1">
            <Feather className="w-6 h-6 stroke-[1.75]" />
          </div>

          {!loadingCampaign && campaign && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/50 text-teal-800 dark:text-teal-300 text-[11px] font-medium mx-auto">
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>Inclui envio do PDF por e-mail</span>
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl font-serif font-medium tracking-tight text-stone-900 dark:text-stone-50">
            {campaign?.title || 'Criar Seu Acesso no ISAAC'}
          </h1>

          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-serif leading-relaxed max-w-md mx-auto">
            {campaign?.subtitle ||
              (campaign
                ? 'Conclua seu cadastro abaixo para liberar seu acesso ao app e receber gratuitamente este material em PDF no seu e-mail.'
                : 'Preencha seus dados abaixo para iniciar sua jornada de clareza, escuta e transformação no ISAAC.')}
          </p>
        </div>

        {/* SELETOR: NOVO CADASTRO VS JÁ TENHO CONTA (QUANDO HÁ PDF ATIVO) */}
        {campaign && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-stone-100 dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setActiveMode('signup');
                setErrorMsg('');
                setInfoNotice('');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                activeMode === 'signup'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Criar Conta + Receber PDF</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMode('existing');
                setErrorMsg('');
                setInfoNotice('');
                setAlreadyRegisteredPrompt(false);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                activeMode === 'existing'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5 shrink-0" />
              <span>Já tenho conta, apenas envie o PDF</span>
            </button>
          </div>
        )}

        {/* AVISO INFORMATIVO */}
        {infoNotice && (
          <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs flex items-start gap-2.5 animate-fadeIn">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-teal-600 dark:text-teal-400" />
            <span className="leading-relaxed">{infoNotice}</span>
          </div>
        )}

        {/* MENSAGEM DE ERRO + ATALHO CASO E-MAIL JÁ EXISTA */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs space-y-2.5 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>

            {alreadyRegisteredPrompt && campaign && (
              <button
                type="button"
                disabled={submitting}
                onClick={() => triggerExistingUserSend(email)}
                className="w-full py-2.5 px-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Já tenho conta — Enviar apenas o PDF para {email}</span>
              </button>
            )}
          </div>
        )}

        {/* MODO 1: FORMULÁRIO DE CADASTRO COMPLETO */}
        {activeMode === 'signup' ? (
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                    placeholder="Seu nome e sobrenome"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-50/70 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm placeholder-stone-400 outline-none transition"
                  />
                </div>
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Seu Melhor E-mail *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-50/70 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm placeholder-stone-400 outline-none transition"
                  />
                </div>
              </div>

              {/* WhatsApp / Telefone */}
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  WhatsApp / Celular (com DDD) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneMask(e.target.value))}
                    placeholder="(11) 99999-9999"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-50/70 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm placeholder-stone-400 outline-none transition"
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Criar Senha de Acesso *
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
                    className="w-full pl-10 pr-10 py-3 rounded-2xl bg-stone-50/70 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm placeholder-stone-400 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5"
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
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-50/70 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm placeholder-stone-400 outline-none transition"
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
                    className="w-full pl-10 pr-3 py-3 rounded-2xl bg-stone-50/70 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm text-stone-700 dark:text-stone-200 outline-none transition"
                  />
                </div>
              </div>

              {/* Profissão / Ocupação */}
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Profissão / Área de Atuação
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="Ex.: Empresário, Professora..."
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-50/70 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm placeholder-stone-400 outline-none transition"
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
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-50/70 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm placeholder-stone-400 outline-none transition"
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
                  className="w-full px-4 py-3 rounded-2xl bg-stone-50/70 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm text-stone-700 dark:text-stone-200 outline-none transition"
                >
                  <option value="">Selecione...</option>
                  {BRAZIL_STATES.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </div>

              {/* Principal Momento / Objetivo */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Qual seu principal objetivo neste momento?
                </label>
                <div className="relative">
                  <Compass className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400 pointer-events-none" />
                  <select
                    value={mainGoal}
                    onChange={(e) => setMainGoal(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-50/70 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm text-stone-700 dark:text-stone-200 outline-none transition"
                  >
                    <option value="">Selecione o que mais faz sentido hoje...</option>
                    {MAIN_GOAL_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Aceite dos Termos de Uso */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 text-xs text-stone-600 dark:text-stone-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-teal-700 focus:ring-teal-500 border-stone-300 dark:border-slate-600 dark:bg-slate-800"
                />
                <span className="leading-snug">
                  Li e concordo com os{' '}
                  <button
                    type="button"
                    onClick={() => setIsTermsModalOpen(true)}
                    className="font-semibold text-teal-700 dark:text-teal-400 hover:underline"
                  >
                    Termos e Condições de Uso
                  </button>{' '}
                  e autorizo o envio do material solicitado para meu e-mail.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || !termsAccepted}
              className="w-full py-3.5 px-6 rounded-2xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-semibold text-sm tracking-wide shadow-md shadow-teal-700/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 min-h-[48px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Criando sua conta e enviando o PDF...</span>
                </>
              ) : (
                <>
                  <span>
                    {campaign ? 'Concluir Cadastro e Receber PDF' : 'Concluir Meu Cadastro'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* MODO 2: JÁ TENHO CONTA, APENAS ENVIE O PDF */
          <form onSubmit={handleExistingSubmit} className="space-y-4">
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/60 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              Se você já criou sua conta no <strong>ISAAC</strong> anteriormente, basta informar seu e-mail cadastrado abaixo e enviaremos o arquivo{' '}
              <strong>{campaign?.title || 'em PDF'}</strong> diretamente para sua caixa de entrada.
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                E-mail da Sua Conta no ISAAC *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                <input
                  type="email"
                  required
                  value={existingEmail}
                  onChange={(e) => setExistingEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-stone-50/70 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm placeholder-stone-400 outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-semibold text-sm tracking-wide shadow-md shadow-teal-700/20 transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 min-h-[48px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando PDF para seu e-mail...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar PDF para Meu E-mail</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* RODAPÉ COM OPÇÃO DE LOGIN / PÁGINA INICIAL */}
        <div className="pt-4 border-t border-stone-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
          <button
            type="button"
            onClick={() => onOpenLogin(email || existingEmail)}
            className="hover:text-teal-700 dark:hover:text-teal-400 transition"
          >
            Já tem conta e quer entrar agora?{' '}
            <span className="font-semibold text-teal-700 dark:text-teal-400">Fazer Login</span>
          </button>

          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition"
            >
              Conhecer a página inicial
            </button>
          )}
        </div>
      </div>

      <TermsOfUseModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        onAccept={() => setTermsAccepted(true)}
      />
    </div>
  );
}

