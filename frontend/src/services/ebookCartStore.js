import { useState, useEffect, useCallback } from 'react';

const CART_STORAGE_KEY = 'isaac_ebook_cart_v1';
const CART_EVENT_NAME = 'isaac-ebook-cart-changed';
const CART_OPEN_EVENT = 'isaac-ebook-cart-open';

function readStoredCart() {
  if (typeof window === 'undefined') {
    return { slugs: [], isBundle: false };
  }
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return { slugs: [], isBundle: false };
    const parsed = JSON.parse(raw);
    return {
      slugs: Array.isArray(parsed?.slugs) ? Array.from(new Set(parsed.slugs.filter(Boolean))) : [],
      isBundle: Boolean(parsed?.isBundle),
    };
  } catch {
    return { slugs: [], isBundle: false };
  }
}

function writeStoredCart(nextState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextState));
    window.dispatchEvent(new CustomEvent(CART_EVENT_NAME, { detail: nextState }));
  } catch {}
}

export function addEbookToCart(slug) {
  const clean = String(slug || '').trim().toLowerCase();
  if (!clean) return;
  if (clean === 'colecao-completa' || clean === 'bundle-all-8' || clean === 'todos') {
    writeStoredCart({ slugs: [], isBundle: true });
    return;
  }
  const current = readStoredCart();
  if (current.isBundle) return; // Já está com a coleção completa
  const nextSlugs = Array.from(new Set([...current.slugs, clean]));
  if (nextSlugs.length >= 8) {
    writeStoredCart({ slugs: [], isBundle: true });
  } else {
    writeStoredCart({ slugs: nextSlugs, isBundle: false });
  }
}

export function removeEbookFromCart(slug) {
  const clean = String(slug || '').trim().toLowerCase();
  if (clean === 'colecao-completa' || clean === 'bundle-all-8') {
    writeStoredCart({ slugs: [], isBundle: false });
    return;
  }
  const current = readStoredCart();
  writeStoredCart({
    slugs: current.slugs.filter((s) => s !== clean),
    isBundle: false,
  });
}

export function activateCompleteBundleInCart() {
  writeStoredCart({ slugs: [], isBundle: true });
}

export function clearEbookCart() {
  writeStoredCart({ slugs: [], isBundle: false });
}

export function openEbookCartDrawer({ step = 'cart', directBuySlug = null } = {}) {
  if (directBuySlug) {
    const clean = String(directBuySlug).trim().toLowerCase();
    if (clean === 'colecao-completa' || clean === 'bundle-all-8' || clean === 'todos') {
      writeStoredCart({ slugs: [], isBundle: true });
    } else {
      writeStoredCart({ slugs: [clean], isBundle: false });
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(CART_OPEN_EVENT, {
        detail: { step: directBuySlug ? 'checkout' : step },
      })
    );
  }
}

export function useEbookCart() {
  const [cart, setCart] = useState(() => readStoredCart());

  useEffect(() => {
    const sync = () => setCart(readStoredCart());
    window.addEventListener(CART_EVENT_NAME, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CART_EVENT_NAME, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const itemCount = cart.isBundle ? 1 : cart.slugs.length;
  const individualSubtotal = Number((cart.slugs.length * 19.9).toFixed(2));
  const totalAmount = cart.isBundle ? 111.44 : individualSubtotal;
  const savingsAmount = cart.isBundle ? 47.76 : 0;

  const hasSlug = useCallback(
    (slug) => {
      const clean = String(slug || '').trim().toLowerCase();
      if (cart.isBundle) return true;
      return cart.slugs.includes(clean);
    },
    [cart]
  );

  return {
    cart,
    itemCount,
    totalAmount,
    savingsAmount,
    hasSlug,
    addEbookToCart,
    removeEbookFromCart,
    activateCompleteBundleInCart,
    clearEbookCart,
    openEbookCartDrawer,
  };
}

export { CART_OPEN_EVENT };

