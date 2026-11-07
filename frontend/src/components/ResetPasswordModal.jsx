import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { authFetch, BACKEND_URL } from '../services/authFetch';
import { Lock, Check, AlertCircle, Feather, ArrowRight, X, Loader2 } from 'lucide-react';

export default function ResetPasswordModal({ isOpen, onClose, tokenHash, onOpenForgot }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [tokenVerified, setTokenVerified] = useState(!tokenHash);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && tokenHash && !tokenVerified) {
      setVerifying(true);
      setErrorMsg('');

      supabase.auth
        .verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        })
        .then(async ({ data, error }) => {
          setVerifying(false);
          if (error) {
            console.warn('Aviso na verificação client-side do token_hash:', error.message);
            // Mantemos como verificado para permitir que o backend valide via token_hash caso o client perca cookies
            setTokenVerified(true);
          } else {
            if (data?.session) {
              try {
                await supabase.auth.setSession(data.session);
              } catch (sessionErr) {
                console.warn('Aviso ao persistir sessão:', sessionErr);
              }
            }
            setTokenVerified(true);
          }
        })
        .catch((err) => {
          setVerifying(false);
          setTokenVerified(true);
        });
    } else if (isOpen && !tokenHash) {
      setTokenVerified(true);
    }
  }, [isOpen, tokenHash, tokenVerified]);

  if (!isOpen) return null;

  const handleReset = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('A nova senha deve conter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('As senhas não coincidem. Digite a mesma senha em ambos os campos.');
      return;
    }

    setLoading(true);
    try {
      let resetSuccessful = false;

      // 1. Tenta atualizar com a sessão ativa no Supabase Client
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          const { error } = await supabase.auth.updateUser({
            password: newPassword,
          });
          if (!error) {
            resetSuccessful = true;
          }
        }
      } catch (clientErr) {
        console.warn('Tentando fallback via backend após falha client-side:', clientErr?.message);
      }

      // 2. Se não tinha sessão (Auth session missing no mobile) ou deu erro, usa o endpoint oficial do backend
      if (!resetSuccessful) {
        const resp = await authFetch(`${BACKEND_URL}/api/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token_hash: tokenHash || null,
            password: newPassword,
          }),
        });

        const respData = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          throw new Error(respData.error || 'Falha ao redefinir senha. Por favor, solicite um novo link.');
        }
        resetSuccessful = true;
      }

      setSuccess(true);
      setTimeout(() => {
        // Limpa parâmetros de query e hash da URL
        if (typeof window !== 'undefined' && window.history?.replaceState) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Erro ao atualizar senha:', err);
      setErrorMsg(err.message || 'Erro ao redefinir senha. Tente solicitar um novo link.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md p-6 sm:p-9 bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl sm:rounded-4xl shadow-2xl text-stone-800 dark:text-stone-100">
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full hover:bg-stone-200/50 dark:hover:bg-slate-800 transition"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-700/10 dark:bg-teal-500/15 border border-teal-700/20 dark:border-teal-500/30 mb-3 text-teal-800 dark:text-teal-400 shadow-sm">
            <Feather className="w-6 h-6 stroke-[1.75]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-medium tracking-tight text-stone-900 dark:text-stone-50">
            Definir Nova Senha
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-serif">
            Crie sua nova credencial segura para acessar a mentoria ISAAC
          </p>
        </div>

        {verifying && (
          <div className="py-8 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-teal-700 animate-spin mx-auto" />
            <p className="text-xs text-stone-600 dark:text-stone-400 font-serif">
              Validando seu acesso seguro ao refúgio...
            </p>
          </div>
        )}

        {errorMsg && !verifying && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            {onOpenForgot && (
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  onOpenForgot();
                }}
                className="mt-1 text-xs font-semibold text-rose-800 dark:text-rose-200 underline text-left"
              >
                Solicitar um novo link de recuperação
              </button>
            )}
          </div>
        )}

        {success ? (
          <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-center space-y-2 animate-fadeIn">
            <div className="w-10 h-10 rounded-full bg-teal-700 text-white flex items-center justify-center mx-auto">
              <Check className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm">Senha Atualizada com Sucesso!</h3>
            <p className="text-xs text-teal-700/80 dark:text-teal-300/80">
              Você já está autenticado. Redirecionando para seu refúgio...
            </p>
          </div>
        ) : (
          !verifying &&
          tokenVerified && (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Nova Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm placeholder-stone-400 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 focus:border-teal-700 text-base sm:text-sm placeholder-stone-400 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-medium text-sm tracking-wide shadow-md shadow-teal-700/20 transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 min-h-[44px]"
              >
                <span>{loading ? 'Atualizando senha...' : 'Salvar Nova Senha'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )
        )}
      </div>
    </div>
  );
}
