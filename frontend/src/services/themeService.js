/**
 * Serviço de Gerenciamento de Temas Visuais & Tipografia
 * Plataforma ISAAC — Estilo Único Ativo: 'gold' (Refúgio Ouro & Obsidiana)
 *
 * Para reativar a escolha entre os 4 estilos posteriormente, basta alterar
 * `MULTI_THEME_ENABLED` para `true`.
 */

export const MULTI_THEME_ENABLED = false;
export const LOCKED_ACTIVE_THEME_ID = 'gold';

export const ALL_THEMES = [
  {
    id: 'indigo',
    name: 'Brisa Índigo & Oceano',
    tagline: 'Clareza Profunda & Foco Mental',
    description: 'Azul marinho profundo, noites oceânicas e ciano elétrico.',
    fontName: 'Outfit Moderna',
    fontStyle: 'Sans Tecnológica',
    accent: '#0284c7',
    accentText: '#38bdf8',
    surface: '#060d1b',
    card: '#0d172e',
    colors: ['#0284c7', '#38bdf8', '#060d1b'],
    previewIcon: '🌊',
    badge: 'Clássico Oceano',
  },
  {
    id: 'emerald',
    name: 'Santuário Esmeralda',
    tagline: 'Cura Serena & Equilíbrio',
    description: 'Verde sálvia, ardósia serena e estética zen restauradora.',
    fontName: 'Playfair Display + Plus Jakarta',
    fontStyle: 'Serif Clássica',
    accent: '#0f766e',
    accentText: '#2dd4bf',
    surface: '#0f172a',
    card: '#1e293b',
    colors: ['#0f766e', '#14b8a6', '#0f172a'],
    previewIcon: '🌿',
    badge: 'Zen & Cura',
  },
  {
    id: 'gold',
    name: 'Refúgio Ouro & Obsidiana',
    tagline: 'Sabedoria Nobre & Meditação',
    description: 'Obsidiana estelar com toques quentes e radiantes de ouro champanhe.',
    fontName: 'Cormorant Garamond',
    fontStyle: 'Serif Imperial',
    accent: '#d4af37',
    accentText: '#e5c358',
    surface: '#090a0f',
    card: '#121622',
    colors: ['#d4af37', '#e5c358', '#090a0f'],
    previewIcon: '🕯️',
    badge: 'Estilo Oficial Ativo',
  },
  {
    id: 'terracotta',
    name: 'Areia de Seda & Terracota',
    tagline: 'Acolhimento Humano & Terra',
    description: 'Argila suave, linho natural e tons acolhedores de café e terra.',
    fontName: 'Lora Editorial',
    fontStyle: 'Serif Literária',
    accent: '#c86a50',
    accentText: '#e88d74',
    surface: '#13100e',
    card: '#1e1815',
    colors: ['#c86a50', '#e88d74', '#13100e'],
    previewIcon: '🍂',
    badge: 'Acolhimento Orgânico',
  },
];

export const THEMES = MULTI_THEME_ENABLED
  ? ALL_THEMES
  : ALL_THEMES.filter((t) => t.id === LOCKED_ACTIVE_THEME_ID);

const ALL_THEME_IDS = ALL_THEMES.map((t) => t.id);
const VALID_THEME_IDS = THEMES.map((t) => t.id);

/**
 * Aplica as classes do tema no elemento HTML raiz
 */
export function applyAppTheme(themeId) {
  if (typeof document === 'undefined') return LOCKED_ACTIVE_THEME_ID;
  const root = document.documentElement;

  // Remove classes anteriores de todos os temas catalogados
  ALL_THEME_IDS.forEach((id) => {
    root.classList.remove(`theme-${id}`);
  });

  const targetTheme = !MULTI_THEME_ENABLED
    ? LOCKED_ACTIVE_THEME_ID
    : VALID_THEME_IDS.includes(themeId)
      ? themeId
      : LOCKED_ACTIVE_THEME_ID;

  root.classList.add('dark');
  root.classList.add(`theme-${targetTheme}`);
  return targetTheme;
}

/**
 * Obtém o tema atual salvo localmente (Padrão Oficial: 'gold' - Refúgio Ouro & Obsidiana)
 */
export function getCurrentTheme() {
  if (!MULTI_THEME_ENABLED) return LOCKED_ACTIVE_THEME_ID;
  if (typeof window === 'undefined') return LOCKED_ACTIVE_THEME_ID;
  const saved = localStorage.getItem('isaac_app_theme') || localStorage.getItem('izaque_app_theme');
  return VALID_THEME_IDS.includes(saved) ? saved : LOCKED_ACTIVE_THEME_ID;
}

/**
 * Salva e aplica o tema no dispositivo do usuário
 */
export function saveAppTheme(themeId) {
  const targetTheme = !MULTI_THEME_ENABLED
    ? LOCKED_ACTIVE_THEME_ID
    : VALID_THEME_IDS.includes(themeId)
      ? themeId
      : LOCKED_ACTIVE_THEME_ID;
  applyAppTheme(targetTheme);
  try {
    localStorage.setItem('isaac_app_theme', targetTheme);
    localStorage.setItem('izaque_app_theme', targetTheme);
    window.dispatchEvent(new CustomEvent('app-theme-changed', { detail: targetTheme }));
  } catch (err) {
    console.warn('Não foi possível persistir tema no localStorage:', err);
  }
  return targetTheme;
}
