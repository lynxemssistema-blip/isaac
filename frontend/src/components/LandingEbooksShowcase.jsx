import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  ShoppingBag,
  CreditCard,
  Sparkles,
  Plus,
  Check,
  ArrowRight,
  Globe,
  Gift,
  ExternalLink,
} from 'lucide-react';
import { fetchPublicEbooksStore } from '../services/ebookStoreApi';
import { useEbookCart } from '../services/ebookCartStore';

export default function LandingEbooksShowcase({ onOpenEbookStore }) {
  const [store, setStore] = useState(null);
  const {
    cart,
    itemCount,
    totalAmount,
    hasSlug,
    addEbookToCart,
    removeEbookFromCart,
    activateCompleteBundleInCart,
    openEbookCartDrawer,
  } = useEbookCart();

  useEffect(() => {
    fetchPublicEbooksStore()
      .then((res) => setStore(res))
      .catch(() => {});
  }, []);

  if (!store?.ebooks?.length) return null;

  const { ebooks, bundle, author } = store;

  return (
    <section
      id="biblioteca-ebooks"
      className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-14"
    >
      <div className="space-y-10">
        {/* CABEÇALHO DA SEÇÃO NA PÁGINA PRINCIPAL */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-300/80 dark:border-amber-700/60 text-xs font-serif font-semibold text-amber-900 dark:text-amber-300">
            <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Biblioteca Oficial ISAAC® Essential • Edição Bilíngue (PT-BR &amp; EN-GB)</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-serif font-normal text-stone-900 dark:text-stone-50 tracking-tight">
            eBooks Segmentados por <strong>{author?.name || 'Thiago Prata'}</strong>
          </h2>

          <p className="text-xs sm:text-base text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
            Monte seu carrinho abaixo por <strong>R$ 19,90 cada volume</strong> ou leve a{' '}
            <strong>Coleção Completa em 1 Arquivo Único PDF com 30% OFF (R$ 111,44)</strong>. Cada PDF traz Português + Inglês Britânico no mesmo exemplar, ilustrações, linhas de anotações e <strong>dedicatória com o seu nome na margem inferior</strong>!
          </p>
        </div>

        {/* BARRA INTERATIVA DO CARRINHO + PROMOÇÃO 30% OFF */}
        <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 text-white border-2 border-amber-400/70 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            {bundle?.coverUrl && (
              <img
                src={bundle.coverUrl}
                alt={bundle.title}
                onClick={() => onOpenEbookStore?.('colecao-completa')}
                className="w-24 sm:w-28 aspect-[960/1360] object-cover rounded-xl border-2 border-amber-400 shadow-xl cursor-pointer shrink-0"
              />
            )}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-extrabold uppercase tracking-wider">
                <Gift className="w-3.5 h-3.5" />
                <span>Promoção 30% de Desconto • Arquivo Único em PDF</span>
              </div>
              <h3 className="text-lg sm:text-2xl font-serif font-bold">
                Todos os 8 eBooks Bilíngues em 1 Único PDF por R$ 111,44
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 font-serif max-w-xl">
                De <span className="line-through text-slate-400">R$ 159,20</span> por{' '}
                <strong className="text-amber-300">R$ 111,44</strong>. Pagamento confirmado no Asaas envia o link de download imediatamente para o seu <strong>E-mail</strong> e <strong>Celular (WhatsApp)</strong>!
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto shrink-0">
            <button
              type="button"
              onClick={() => openEbookCartDrawer({ directBuySlug: 'colecao-completa' })}
              className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Comprar Todos (30% OFF — R$ 111,44)</span>
            </button>

            <button
              type="button"
              onClick={() => openEbookCartDrawer({ step: 'cart' })}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-amber-300" />
              <span>
                Abrir Meu Carrinho ({cart.isBundle ? 'Pacote Completo' : `${itemCount} item(ns)`} •{' '}
                {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
              </span>
            </button>
          </div>
        </div>

        {/* GRADE DOS 8 VOLUMES PARA MONTAR O CARRINHO NA HOME */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {ebooks.map((eb) => {
            const selected = hasSlug(eb.slug);
            return (
              <div
                key={eb.slug}
                className={`rounded-3xl bg-white dark:bg-slate-800/90 border transition flex flex-col overflow-hidden shadow-sm hover:shadow-xl ${
                  selected
                    ? 'border-2 border-teal-600 dark:border-teal-400'
                    : 'border-stone-200/90 dark:border-slate-700'
                }`}
              >
                <div
                  onClick={() => onOpenEbookStore?.(eb.slug)}
                  className="relative bg-slate-950 p-4 flex justify-center cursor-pointer group"
                >
                  <img
                    src={eb.coverUrl}
                    alt={eb.title}
                    className="w-40 aspect-[960/1360] object-cover rounded-xl border border-amber-400/50 shadow-lg group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-slate-950/90 border border-amber-400/40 text-amber-300 text-[10px] font-bold">
                    Vol. 0{eb.volumeNumber}
                  </span>
                  <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold">
                    R$ 19,90
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                      <Globe className="w-3 h-3" />
                      <span>PT-BR + Inglês Britânico</span>
                    </div>
                    <h3
                      onClick={() => onOpenEbookStore?.(eb.slug)}
                      className="text-sm font-serif font-bold text-stone-900 dark:text-white leading-snug cursor-pointer hover:text-teal-700 dark:hover:text-teal-300 line-clamp-2"
                    >
                      {eb.title}
                    </h3>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 font-serif line-clamp-2">
                      {eb.subtitle}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-slate-700/70">
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (selected && !cart.isBundle) {
                            removeEbookFromCart(eb.slug);
                          } else {
                            addEbookToCart(eb.slug);
                          }
                        }}
                        className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                          selected
                            ? 'bg-teal-700 text-white'
                            : 'bg-stone-100 dark:bg-slate-700 text-stone-800 dark:text-stone-100 hover:bg-stone-200'
                        }`}
                      >
                        {selected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>{selected ? 'Selecionado' : '+ Carrinho'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openEbookCartDrawer({ directBuySlug: eb.slug })}
                        className="py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>Comprar</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenEbookStore?.(eb.slug)}
                      className="w-full py-1.5 rounded-lg text-[11px] font-medium text-teal-700 dark:text-teal-300 hover:underline flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Página de Venda Dedicada</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => onOpenEbookStore?.('')}
            className="px-6 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 hover:border-teal-600 text-stone-800 dark:text-stone-100 text-xs sm:text-sm font-semibold inline-flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-teal-700 dark:text-teal-400" />
            <span>Acessar Página Oficial Completa da Loja de eBooks</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

