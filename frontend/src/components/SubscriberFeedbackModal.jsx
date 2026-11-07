import React, { useState } from 'react';
import {
  X,
  Send,
  MessageSquare,
  AlertTriangle,
  Lightbulb,
  Heart,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  LifeBuoy,
} from 'lucide-react';
import { sendSubscriberFeedback } from '../services/api';

export default function SubscriberFeedbackModal({ isOpen, onClose, user, profile }) {
  const [type, setType] = useState('suggestion');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setErrorMessage('Por favor, preencha o assunto e a sua mensagem.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      await sendSubscriberFeedback({
        userId: user?.id,
        userEmail: user?.email,
        userName: profile?.full_name || user?.email?.split('@')[0],
        type,
        subject: subject.trim(),
        message: message.trim(),
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSubject('');
        setMessage('');
        onClose();
      }, 3000);
    } catch (err) {
      console.error('Erro ao enviar feedback:', err);
      setErrorMessage(err.message || 'Falha ao enviar mensagem. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-md pt-safe animate-fadeIn">
      <div className="relative w-full max-w-lg p-6 sm:p-9 bg-stone-50 dark:bg-slate-900 border-t sm:border border-stone-200 dark:border-slate-800 rounded-t-3xl sm:rounded-4xl shadow-2xl text-stone-800 dark:text-stone-100 max-h-[92dvh] overflow-y-auto overscroll-contain pb-safe sm:pb-9">
        {/* Barra de Arraste visual (Mobile Native Pull-bar) */}
        <div className="w-12 h-1 bg-stone-300 dark:bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full hover:bg-stone-200/50 dark:hover:bg-slate-800 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* CABEÇALHO */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 dark:border-teal-500/30 mb-3 text-teal-800 dark:text-teal-400 shadow-sm">
            <LifeBuoy className="w-6 h-6 stroke-[1.75]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-medium tracking-tight text-stone-900 dark:text-stone-50">
            Suporte Oficial Lynx
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-serif leading-relaxed">
            Canal direto para envio de sugestões, relatos ou dúvidas para a equipe responsável pelo ISAAC.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {success ? (
          <div className="p-6 rounded-3xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-center space-y-3 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-teal-700 text-white flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-serif font-semibold text-teal-900 dark:text-teal-200">
              Mensagem Entregue ao Suporte!
            </h3>
            <p className="text-xs text-teal-800/90 dark:text-teal-300/90 leading-relaxed">
              Nossa equipe já recebeu sua mensagem e uma cópia de confirmação foi enviada para <strong>{user?.email}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* SELETOR DE CATEGORIA */}
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Motivo do Contato
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setType('suggestion')}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition text-left ${
                    type === 'suggestion'
                      ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                      : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                  <span>Sugestão</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('complaint')}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition text-left ${
                    type === 'complaint'
                      ? 'bg-amber-700 text-white border-amber-700 shadow-sm'
                      : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Reclamação</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('support')}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition text-left ${
                    type === 'support'
                      ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                      : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Dúvida Técnica</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('praise')}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition text-left ${
                    type === 'praise'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                      : 'bg-white dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 shrink-0" />
                  <span>Elogio</span>
                </button>
              </div>
            </div>

            {/* ASSUNTO */}
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Assunto Resumido
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Sugestão para novas faixas sonoras ou melhorias"
                className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 outline-none transition"
              />
            </div>

            {/* MENSAGEM */}
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Sua Mensagem Detalhada
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escreva com calma tudo o que gostaria de compartilhar com a equipe..."
                className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 outline-none transition resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs tracking-wide shadow-md shadow-teal-700/20 transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 min-h-[44px]"
            >
              <span>{submitting ? 'Enviando ao suporte...' : 'Enviar para suporte@lynxems.com.br'}</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
