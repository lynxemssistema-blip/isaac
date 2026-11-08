import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Lock,
  ShieldAlert,
  ArrowLeft,
  Download,
  Printer,
  Copy,
  Check,
  Sparkles,
  Tag,
  Target,
  Compass,
  Lightbulb,
  CheckCircle2,
  ExternalLink,
  FileText,
  Layers,
  Loader2,
  Search,
  DollarSign,
} from 'lucide-react';
import { fetchSuperAdminEbooksApi } from '../services/adminApi';

const ACCENT_STYLES = {
  teal: {
    badge: 'bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30',
    ring: 'border-teal-600 dark:border-teal-400 bg-teal-50/70 dark:bg-teal-950/30',
    cover: 'from-teal-900 via-teal-800 to-slate-900',
    hex: '#0f766e',
  },
  indigo: {
    badge: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/30',
    ring: 'border-indigo-600 dark:border-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/30',
    cover: 'from-indigo-950 via-indigo-800 to-slate-900',
    hex: '#3730a3',
  },
  amber: {
    badge: 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-500/30',
    ring: 'border-amber-600 dark:border-amber-400 bg-amber-50/70 dark:bg-amber-950/30',
    cover: 'from-amber-900 via-amber-800 to-stone-900',
    hex: '#b45309',
  },
  emerald: {
    badge: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
    ring: 'border-emerald-600 dark:border-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/30',
    cover: 'from-emerald-950 via-emerald-800 to-slate-900',
    hex: '#047857',
  },
  rose: {
    badge: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30',
    ring: 'border-rose-600 dark:border-rose-400 bg-rose-50/70 dark:bg-rose-950/30',
    cover: 'from-rose-950 via-rose-800 to-slate-900',
    hex: '#be123c',
  },
  sky: {
    badge: 'bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30',
    ring: 'border-sky-600 dark:border-sky-400 bg-sky-50/70 dark:bg-sky-950/30',
    cover: 'from-sky-950 via-sky-800 to-slate-900',
    hex: '#0369a1',
  },
  violet: {
    badge: 'bg-violet-500/15 text-violet-800 dark:text-violet-300 border-violet-500/30',
    ring: 'border-violet-600 dark:border-violet-400 bg-violet-50/70 dark:bg-violet-950/30',
    cover: 'from-violet-950 via-violet-800 to-slate-900',
    hex: '#6d28d9',
  },
  stone: {
    badge: 'bg-stone-500/15 text-stone-800 dark:text-stone-300 border-stone-500/30',
    ring: 'border-stone-700 dark:border-stone-400 bg-stone-100 dark:bg-slate-800',
    cover: 'from-stone-900 via-stone-800 to-slate-950',
    hex: '#44403c',
  },
};

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildPrintableBookHtml(ebooksArray, collectionMeta) {
  const volumesHtml = ebooksArray
    .map((book) => {
      const style = ACCENT_STYLES[book.accentColor] || ACCENT_STYLES.teal;
      const tocRows = (book.chapters || [])
        .map(
          (ch) => `
          <div class="toc-item">
            <span class="toc-num">Capítulo ${String(ch.number).padStart(2, '0')}</span>
            <span class="toc-title">${escapeHtml(ch.title)}</span>
          </div>`
        )
        .join('');

      const chaptersHtml = (book.chapters || [])
        .map(
          (ch) => `
          <section class="chapter">
            <div class="chapter-kicker" style="color:${style.hex}">CAPÍTULO ${String(ch.number).padStart(2, '0')}</div>
            <h2 class="chapter-title">${escapeHtml(ch.title)}</h2>
            <p class="chapter-body">${escapeHtml(ch.coreExplanation)}</p>

            <div class="clarity-box" style="border-left-color:${style.hex}">
              <div class="clarity-label" style="color:${style.hex}">CHAVE DE CLAREZA</div>
              <p class="clarity-text">&ldquo;${escapeHtml(ch.clarityKey)}&rdquo;</p>
            </div>

            <div class="framework-box">
              <div class="framework-title">${escapeHtml(ch.frameworkTitle)}</div>
              <ul class="framework-list">
                ${(ch.frameworkItems || [])
                  .map((item) => `<li>${escapeHtml(item)}</li>`)
                  .join('')}
              </ul>
            </div>

            <div class="exercise-box">
              <div class="exercise-label">APLICAÇÃO IMEDIATA (CADERNO PRÁTICO)</div>
              <p class="exercise-text">${escapeHtml(ch.practicalExercise)}</p>
              <div class="notes-lines">
                <div></div><div></div><div></div>
              </div>
            </div>
          </section>`
        )
        .join('');

      return `
        <article class="ebook-volume">
          <!-- CAPA EDITORIAL -->
          <section class="cover-page" style="background: linear-gradient(145deg, ${style.hex} 0%, #0f172a 100%);">
            <div class="cover-top">
              <span class="cover-collection">${escapeHtml(collectionMeta?.collectionTitle || 'COLEÇÃO ISAAC® ESSENTIAL')}</span>
              <span class="cover-vol">VOLUME ${String(book.volumeNumber).padStart(2, '0')}</span>
            </div>
            <div class="cover-center">
              <div class="cover-segment">${escapeHtml(book.segmentBadge)}</div>
              <h1 class="cover-title">${escapeHtml(book.title)}</h1>
              <p class="cover-subtitle">${escapeHtml(book.subtitle)}</p>
            </div>
            <div class="cover-footer">
              <div>ISAAC® — Inovação • Sustentabilidade • Amor • Atitude • Conhecimento</div>
              <div>isaac.lynxems.com.br</div>
            </div>
          </section>

          <!-- APRESENTAÇÃO & SUMÁRIO -->
          <section class="intro-page">
            <div class="intro-kicker" style="color:${style.hex}">VISÃO EXECUTIVA DO VOLUME</div>
            <h2 class="intro-heading">Por que este guia foi escrito</h2>
            <p class="intro-summary">${escapeHtml(book.executiveSummary)}</p>

            <div class="toc-box">
              <div class="toc-header">Sumário Estruturado</div>
              ${tocRows}
            </div>
          </section>

          ${chaptersHtml}

          <!-- CONTRACAPA DE CONVERSÃO -->
          <section class="back-cover">
            <div class="back-badge" style="color:${style.hex}">PRÓXIMO PASSO DA SUA JORNADA</div>
            <h3>Continue sua evolução com a Mentoria ISAAC®</h3>
            <p>Aplique os exercícios deste volume e leve suas decisões, reflexões e desafios para o espaço confidencial de mentoria 24h em texto e voz.</p>
            <div class="back-url">https://isaac.lynxems.com.br</div>
          </section>
        </article>
      `;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(
    ebooksArray.length === 1 ? ebooksArray[0].title : collectionMeta?.collectionTitle || 'Coleção ISAAC Essential'
  )}</title>
  <style>
    @page { size: A4; margin: 18mm 18mm 20mm 18mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Georgia, 'Times New Roman', serif;
      color: #1c1917;
      line-height: 1.68;
      background: #fafaf9;
    }
    .print-toolbar {
      position: sticky;
      top: 0;
      z-index: 50;
      background: #0f172a;
      color: #fff;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
    }
    .print-btn {
      background: #0d9488;
      color: #fff;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
    }
    .ebook-volume {
      max-width: 780px;
      margin: 24px auto;
      background: #fff;
      box-shadow: 0 10px 35px rgba(0,0,0,0.08);
    }
    .cover-page {
      min-height: 255mm;
      color: #fff;
      padding: 48px 44px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      border-radius: 4px;
    }
    .cover-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: system-ui, sans-serif;
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      opacity: 0.9;
    }
    .cover-vol {
      background: rgba(255,255,255,0.16);
      padding: 5px 12px;
      border-radius: 999px;
      font-weight: 700;
    }
    .cover-center { margin: auto 0; }
    .cover-segment {
      font-family: system-ui, sans-serif;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      opacity: 0.85;
      margin-bottom: 16px;
    }
    .cover-title {
      font-size: 34px;
      line-height: 1.2;
      margin: 0 0 18px 0;
      font-weight: 700;
    }
    .cover-subtitle {
      font-size: 17px;
      line-height: 1.55;
      opacity: 0.92;
      margin: 0;
      max-width: 620px;
    }
    .cover-footer {
      border-top: 1px solid rgba(255,255,255,0.22);
      padding-top: 18px;
      display: flex;
      justify-content: space-between;
      font-family: system-ui, sans-serif;
      font-size: 11px;
      opacity: 0.85;
    }
    .intro-page, .chapter, .back-cover {
      padding: 40px 44px;
      page-break-after: always;
    }
    .intro-kicker, .chapter-kicker, .back-badge {
      font-family: system-ui, sans-serif;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .intro-heading, .chapter-title {
      font-size: 25px;
      line-height: 1.3;
      margin: 0 0 16px 0;
      color: #0f172a;
    }
    .intro-summary, .chapter-body {
      font-size: 15px;
      color: #292524;
      margin: 0 0 22px 0;
      text-align: justify;
    }
    .toc-box {
      margin-top: 28px;
      border: 1px solid #e7e5e4;
      border-radius: 12px;
      padding: 22px 24px;
      background: #fafaf9;
    }
    .toc-header {
      font-family: system-ui, sans-serif;
      font-weight: 700;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 14px;
      color: #44403c;
    }
    .toc-item {
      display: flex;
      gap: 14px;
      padding: 8px 0;
      border-bottom: 1px dashed #d6d3d1;
      font-size: 14px;
    }
    .toc-item:last-child { border-bottom: none; }
    .toc-num {
      font-family: system-ui, sans-serif;
      font-weight: 700;
      color: #57534e;
      min-width: 92px;
    }
    .clarity-box {
      border-left: 4px solid #0f766e;
      background: #f5f5f4;
      padding: 16px 20px;
      border-radius: 0 10px 10px 0;
      margin: 22px 0;
    }
    .clarity-label {
      font-family: system-ui, sans-serif;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.12em;
      margin-bottom: 4px;
    }
    .clarity-text {
      margin: 0;
      font-style: italic;
      font-size: 15px;
      color: #1c1917;
      font-weight: 600;
    }
    .framework-box {
      border: 1px solid #e7e5e4;
      border-radius: 12px;
      padding: 18px 22px;
      margin: 22px 0;
    }
    .framework-title {
      font-family: system-ui, sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 10px;
    }
    .framework-list {
      margin: 0;
      padding-left: 18px;
      font-size: 14px;
      color: #292524;
    }
    .framework-list li { margin-bottom: 8px; }
    .exercise-box {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 12px;
      padding: 18px 22px;
      margin-top: 22px;
    }
    .exercise-label {
      font-family: system-ui, sans-serif;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.12em;
      color: #92400e;
      margin-bottom: 6px;
    }
    .exercise-text {
      margin: 0 0 14px 0;
      font-size: 14px;
      color: #451a03;
    }
    .notes-lines div {
      border-bottom: 1px dashed #d6d3d1;
      height: 22px;
    }
    .back-cover {
      text-align: center;
      background: #f8fafc;
      border-top: 2px solid #e2e8f0;
    }
    .back-url {
      margin-top: 16px;
      font-family: system-ui, sans-serif;
      font-weight: 700;
      font-size: 14px;
      color: #0f766e;
    }
    @media print {
      body { background: #fff; }
      .print-toolbar { display: none !important; }
      .ebook-volume { box-shadow: none; margin: 0; max-width: none; }
    }
  </style>
</head>
<body>
  <div class="print-toolbar">
    <span><strong>Estúdio Editorial ISAAC®</strong> — Selecione o destino <strong>"Salvar como PDF"</strong> na janela de impressão.</span>
    <button class="print-btn" onclick="window.print()">Salvar / Imprimir PDF Agora</button>
  </div>
  ${volumesHtml}
</body>
</html>`;
}

function buildMarkdownFromEbooks(ebooksArray, collectionMeta, customPrices = {}) {
  const header = `# ${collectionMeta?.collectionTitle || 'Coleção ISAAC® Essential'}\n> ${
    collectionMeta?.collectionSubtitle || ''
  }\n\n---\n\n`;

  const body = ebooksArray
    .map((book) => {
      const price = customPrices[book.id] || book.suggestedPrice;
      const chaptersMd = (book.chapters || [])
        .map(
          (ch) => `### Capítulo ${ch.number}: ${ch.title}\n\n${ch.coreExplanation}\n\n> **Chave de Clareza:** "${
            ch.clarityKey
          }"\n\n**${ch.frameworkTitle}:**\n${(ch.frameworkItems || [])
            .map((it) => `- ${it}`)
            .join('\n')}\n\n**Aplicação Imediata:** ${ch.practicalExercise}\n`
        )
        .join('\n---\n\n');

      return `## Volume ${String(book.volumeNumber).padStart(2, '0')} — ${book.title}\n*${
        book.subtitle
      }*\n\n- **Segmento:** ${book.segmentBadge}\n- **Preço Sugerido de Venda:** ${price}\n- **Headline Comercial:** ${
        book.salesKit?.headline || ''
      }\n- **Copy WhatsApp:** ${book.salesKit?.whatsappCopy || ''}\n\n### Visão Executiva\n${
        book.executiveSummary
      }\n\n${chaptersMd}`;
    })
    .join('\n\n================================================================================\n\n');

  return header + body;
}

export default function SuperAdminEbooksPage({
  user,
  profile,
  loadingProfile,
  onOpenLogin,
  onBackToApp,
}) {
  const isSuperAdmin =
    Boolean(user) &&
    (profile?.role === 'master' ||
      String(user?.email || profile?.email || '').trim().toLowerCase() === 'edsonmanoel2012@gmail.com');

  const [loadingData, setLoadingData] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [collectionMeta, setCollectionMeta] = useState(null);
  const [ebooks, setEbooks] = useState([]);
  const [selectedId, setSelectedId] = useState('vol-01');
  const [innerTab, setInnerTab] = useState('read'); // 'read' | 'sales' | 'export'
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedKey, setCopiedKey] = useState('');
  const [customPrices, setCustomPrices] = useState({});

  useEffect(() => {
    document.title = 'Acervo de eBooks p/ Venda (Superadmin) — ISAAC';
  }, []);

  useEffect(() => {
    if (!isSuperAdmin) return;
    let active = true;
    setLoadingData(true);
    setErrorMsg('');

    fetchSuperAdminEbooksApi()
      .then((data) => {
        if (!active) return;
        setCollectionMeta(data.collection || null);
        const list = data.ebooks || [];
        setEbooks(list);
        if (list.length > 0) {
          setSelectedId(list[0].id);
        }
      })
      .catch((err) => {
        if (!active) return;
        setErrorMsg(err.message || 'Não foi possível carregar o acervo do Superadmin.');
      })
      .finally(() => {
        if (active) setLoadingData(false);
      });

    return () => {
      active = false;
    };
  }, [isSuperAdmin]);

  const filteredEbooks = useMemo(() => {
    if (!searchTerm.trim()) return ebooks;
    const q = searchTerm.toLowerCase();
    return ebooks.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.subtitle.toLowerCase().includes(q) ||
        b.segmentBadge.toLowerCase().includes(q) ||
        (b.chapters || []).some(
          (c) => c.title.toLowerCase().includes(q) || c.coreExplanation.toLowerCase().includes(q)
        )
    );
  }, [ebooks, searchTerm]);

  const activeEbook = useMemo(
    () => ebooks.find((b) => b.id === selectedId) || filteredEbooks[0] || null,
    [ebooks, selectedId, filteredEbooks]
  );

  const handleCopy = async (key, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 2500);
    } catch {}
  };

  const handleOpenPrintPdf = (targetBooks) => {
    const html = buildPrintableBookHtml(targetBooks, collectionMeta);
    const win = window.open('', '_blank');
    if (!win) {
      alert('Permita pop-ups no navegador para abrir a visualização de impressão/PDF.');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
    }, 350);
  };

  const handleDownloadFile = (filename, content, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 1. CARREGANDO SESSÃO
  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <p className="text-xs text-stone-500 dark:text-stone-400">Verificando credenciais Superadmin...</p>
        </div>
      </div>
    );
  }

  // 2. NÃO AUTENTICADO -> TELA DE BLOQUEIO COM LOGIN SUPERADMIN
  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-serif font-bold text-stone-900 dark:text-white">
            Área Editorial Exclusiva Superadmin
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            Esta página contém os eBooks comerciais segmentados do Mapa Mental ISAAC® e é acessível unicamente pelo usuário <strong>Superadmin Master</strong>.
          </p>
          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              onClick={onOpenLogin}
              className="w-full py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-md transition cursor-pointer"
            >
              Entrar como Superadmin
            </button>
            <button
              type="button"
              onClick={onBackToApp}
              className="w-full py-2.5 rounded-2xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 text-xs font-medium text-stone-600 dark:text-stone-300 transition cursor-pointer"
            >
              Voltar ao App
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. AUTENTICADO MAS NÃO É SUPERADMIN MASTER -> ACESSO NEGADO (403)
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-serif font-bold text-stone-900 dark:text-white">
            Acesso Estritamente Restrito
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            Esta página é exclusiva para o perfil <strong>Superadmin Master</strong>. Sua conta atual ({user.email}) não possui permissão para visualizar este acervo.
          </p>
          <button
            type="button"
            onClick={onBackToApp}
            className="w-full py-3 rounded-2xl bg-stone-900 dark:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
          >
            Voltar para a Mentoria ISAAC
          </button>
        </div>
      </div>
    );
  }

  // 4. ESTÚDIO EDITORIAL COMPLETO (EXCLUSIVO SUPERADMIN)
  const activeStyle = ACCENT_STYLES[activeEbook?.accentColor] || ACCENT_STYLES.teal;
  const activePrice = activeEbook ? customPrices[activeEbook.id] ?? activeEbook.suggestedPrice : '';

  return (
    <div className="min-h-screen bg-stone-100/80 dark:bg-slate-950 text-stone-900 dark:text-stone-100">
      {/* TOPBAR EXCLUSIVA SUPERADMIN */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-stone-200 dark:border-slate-800 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToApp}
              className="p-2 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-700 dark:text-stone-200 transition cursor-pointer"
              title="Voltar ao App ISAAC"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Acesso Exclusivo Superadmin
                </span>
                <a
                  href="https://trello.com/b/squXZ3Yq/isaac-essential-mind-map"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-medium text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1"
                >
                  <span>Fonte: Trello ISAAC Essential Mind Map</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <h1 className="text-base sm:text-lg font-serif font-bold text-stone-900 dark:text-white mt-0.5">
                {collectionMeta?.collectionTitle || 'Coleção ISAAC® Essential — Acervo de eBooks para Venda'}
              </h1>
            </div>
          </div>

          {ebooks.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenPrintPdf(ebooks)}
                className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Gerar PDF da Coleção Completa (8 eBooks)</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleDownloadFile(
                    'colecao-completa-isaac-essential-8-ebooks.md',
                    buildMarkdownFromEbooks(ebooks, collectionMeta, customPrices),
                    'text/markdown;charset=utf-8'
                  )
                }
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 hover:bg-stone-50 text-xs font-semibold text-stone-700 dark:text-stone-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Todos (.md)</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
            {errorMsg}
          </div>
        )}

        {loadingData ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-3" />
            <p className="text-xs text-stone-500">Carregando os 8 volumes segmentados e kits de venda...</p>
          </div>
        ) : (
          <>
            {/* ESTRATÉGIA COMERCIAL DA COLEÇÃO */}
            {collectionMeta && (
              <section className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white shadow-lg border border-teal-800/50">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
                  <div className="lg:col-span-2 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-teal-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Arquitetura de Monetização • 49 Cartões do Trello Mapeados
                    </div>
                    <h2 className="text-base sm:text-lg font-serif font-bold">
                      {collectionMeta.acronymMeaning}
                    </h2>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {collectionMeta.commercialStrategy?.upsellBridge}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10">
                    <span className="block text-[10px] uppercase tracking-wider text-teal-300 font-bold">
                      Venda Individual
                    </span>
                    <span className="block text-sm font-bold mt-0.5">
                      {collectionMeta.commercialStrategy?.individualTicketRange}
                    </span>
                    <span className="block text-[11px] text-slate-300 mt-0.5">
                      Porta de entrada por dor específica
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-400/30">
                    <span className="block text-[10px] uppercase tracking-wider text-amber-300 font-bold">
                      Passaporte Coleção Completa
                    </span>
                    <span className="block text-sm font-bold mt-0.5">
                      {collectionMeta.commercialStrategy?.fullPassTicketRange}
                    </span>
                    <span className="block text-[11px] text-amber-100/90 mt-0.5">
                      Os 8 Volumes + Exercícios Práticos
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* LAYOUT MESTRE: NAVEGADOR DE VOLUMES À ESQUERDA + LEITOR/VENDAS À DIREITA */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* COLUNA ESQUERDA: OS 8 EBOOKS SEGMENTADOS */}
              <aside className="lg:col-span-4 space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar tema, pilar ou ferramenta..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-xs text-stone-900 dark:text-white outline-none focus:border-teal-600"
                  />
                </div>

                <div className="space-y-2.5">
                  {filteredEbooks.map((book) => {
                    const isSelected = activeEbook?.id === book.id;
                    const st = ACCENT_STYLES[book.accentColor] || ACCENT_STYLES.teal;
                    const priceLabel = customPrices[book.id] ?? book.suggestedPrice;
                    return (
                      <button
                        key={book.id}
                        type="button"
                        onClick={() => setSelectedId(book.id)}
                        className={`w-full text-left p-4 rounded-2xl border transition cursor-pointer ${
                          isSelected
                            ? `${st.ring} border-2 shadow-sm`
                            : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-800 hover:border-stone-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${st.badge}`}>
                            Vol. {String(book.volumeNumber).padStart(2, '0')} • {book.segmentBadge}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                            {priceLabel}
                          </span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-serif font-bold text-stone-900 dark:text-white leading-snug">
                          {book.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-500 dark:text-stone-400">
                          <span>{book.chapters?.length || 0} capítulos</span>
                          <span>•</span>
                          <span>~{book.readingTimeMin} min leitura</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>

              {/* COLUNA DIREITA: CONTEÚDO COMPLETO DO EBOOK + KIT DE VENDAS + EXPORTAÇÃO */}
              {activeEbook && (
                <section className="lg:col-span-8 space-y-5">
                  {/* CAPA INTERATIVA DO VOLUME SELECIONADO */}
                  <div
                    className={`p-6 sm:p-8 rounded-3xl bg-gradient-to-br ${activeStyle.cover} text-white shadow-xl space-y-4`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 backdrop-blur-xs">
                        VOLUME {String(activeEbook.volumeNumber).padStart(2, '0')} — {activeEbook.segmentBadge}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/25 border border-emerald-300/30">
                        Ticket Sugerido: {activePrice}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-xl sm:text-2xl font-serif font-bold leading-snug">
                        {activeEbook.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                        {activeEbook.subtitle}
                      </p>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/15">
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          { id: 'read', label: 'Leitura do eBook Completo', icon: BookOpen },
                          { id: 'sales', label: 'Copy & Material de Venda', icon: DollarSign },
                          { id: 'export', label: 'Baixar PDF / Arquivos p/ Venda', icon: Download },
                        ].map((t) => {
                          const Icon = t.icon;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setInnerTab(t.id)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                                innerTab === t.id
                                  ? 'bg-white text-slate-900 shadow-sm'
                                  : 'bg-white/10 hover:bg-white/20 text-white'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              <span>{t.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenPrintPdf([activeEbook])}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Gerar PDF Deste eBook</span>
                      </button>
                    </div>
                  </div>

                  {/* ABA 1: LEITURA COMPLETA DO EBOOK */}
                  {innerTab === 'read' && (
                    <div className="space-y-5">
                      {/* VISÃO EXECUTIVA + RASTREABILIDADE TRELLO */}
                      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-3">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" /> Síntese Executiva do Volume
                        </div>
                        <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-serif">
                          {activeEbook.executiveSummary}
                        </p>
                        <div className="pt-2 border-t border-stone-100 dark:border-slate-800">
                          <span className="block text-[10px] font-bold uppercase text-stone-400 mb-1">
                            Módulos e Cartões do Trello Condensados Neste eBook:
                          </span>
                          <ul className="space-y-1">
                            {(activeEbook.trelloSources || []).map((src, i) => (
                              <li key={i} className="text-[11px] text-stone-500 dark:text-stone-400">
                                • {src}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* CAPÍTULOS SUCINTOS E DE ALTA CLAREZA */}
                      {(activeEbook.chapters || []).map((ch) => (
                        <article
                          key={ch.number}
                          className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xs space-y-4"
                        >
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-widest text-teal-700 dark:text-teal-400">
                              Capítulo {String(ch.number).padStart(2, '0')}
                            </span>
                            <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-900 dark:text-white mt-0.5">
                              {ch.title}
                            </h3>
                          </div>

                          <p className="text-sm text-stone-700 dark:text-stone-200 leading-relaxed">
                            {ch.coreExplanation}
                          </p>

                          {/* CHAVE DE CLAREZA */}
                          <div className="p-4 rounded-2xl bg-teal-50/80 dark:bg-teal-950/30 border-l-4 border-teal-600 space-y-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                              <Lightbulb className="w-3.5 h-3.5" /> Chave de Clareza
                            </div>
                            <p className="text-xs sm:text-sm font-serif italic font-semibold text-stone-900 dark:text-stone-100">
                              &ldquo;{ch.clarityKey}&rdquo;
                            </p>
                          </div>

                          {/* ESTRUTURA PRÁTICA */}
                          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700 space-y-2">
                            <div className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                              <Compass className="w-4 h-4 text-teal-600" />
                              <span>{ch.frameworkTitle}</span>
                            </div>
                            <ul className="space-y-1.5">
                              {(ch.frameworkItems || []).map((item, idx) => (
                                <li
                                  key={idx}
                                  className="text-xs text-stone-700 dark:text-stone-300 flex items-start gap-2 leading-relaxed"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* EXERCÍCIO PRÁTICO */}
                          <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/50 space-y-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                              ✍️ Exercício Prático de Aplicação Imediata
                            </div>
                            <p className="text-xs text-amber-950 dark:text-amber-100 leading-relaxed">
                              {ch.practicalExercise}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  {/* ABA 2: MATERIAL DE VENDA & COPY PRONTA */}
                  {innerTab === 'sales' && (
                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200 dark:border-slate-800">
                        <div>
                          <h3 className="text-base font-serif font-bold text-stone-900 dark:text-white">
                            Kit Comercial Pronto para Venda — Volume {activeEbook.volumeNumber}
                          </h3>
                          <p className="text-xs text-stone-500 dark:text-stone-400">
                            Argumentos persuasivos, público-alvo, promessa e textos prontos para página de vendas ou disparo no WhatsApp.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-stone-500">Preço:</label>
                          <input
                            type="text"
                            value={activePrice}
                            onChange={(e) =>
                              setCustomPrices((prev) => ({ ...prev, [activeEbook.id]: e.target.value }))
                            }
                            className="w-28 px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 text-xs font-bold text-emerald-700 dark:text-emerald-400"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700 space-y-1.5">
                          <div className="text-[11px] font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5" /> Público-Alvo Ideal
                          </div>
                          <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                            {activeEbook.salesKit?.targetAudience}
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/50 space-y-1.5">
                          <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" /> Dor Principal Resolvida
                          </div>
                          <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                            {activeEbook.salesKit?.corePain}
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/50 space-y-1.5">
                          <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> Promessa de Transformação
                          </div>
                          <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                            {activeEbook.salesKit?.transformationPromise}
                          </p>
                        </div>
                      </div>

                      {/* HEADLINE DE PÁGINA DE VENDAS */}
                      <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/70 border border-stone-200 dark:border-slate-700 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-900 dark:text-white">
                            Headline Principal (Página de Vendas / Anúncio)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy('headline', activeEbook.salesKit?.headline || '')}
                            className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === 'headline' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedKey === 'headline' ? 'Copiado!' : 'Copiar Headline'}</span>
                          </button>
                        </div>
                        <p className="text-sm font-serif font-semibold text-stone-800 dark:text-stone-100">
                          {activeEbook.salesKit?.headline}
                        </p>
                      </div>

                      {/* COPY PRONTA PARA WHATSAPP */}
                      <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                            Mensagem Pronta de Oferta para WhatsApp / Direct ({activePrice})
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                'whatsapp',
                                `${activeEbook.salesKit?.whatsappCopy}\n\n📘 Investimento especial: *${activePrice}*`
                              )
                            }
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === 'whatsapp' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedKey === 'whatsapp' ? 'Copiada!' : 'Copiar Mensagem WhatsApp'}</span>
                          </button>
                        </div>
                        <p className="text-xs text-stone-800 dark:text-stone-200 whitespace-pre-wrap leading-relaxed">
                          {activeEbook.salesKit?.whatsappCopy}
                          {'\n\n'}📘 Investimento especial: *{activePrice}*
                        </p>
                      </div>

                      {/* BULLETS DE ENTREGÁVEIS */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-stone-900 dark:text-white block">
                          O que o comprador recebe neste Volume (Bullets de Valor):
                        </span>
                        <ul className="space-y-1.5">
                          {(activeEbook.salesKit?.deliverables || []).map((d, i) => (
                            <li key={i} className="text-xs text-stone-700 dark:text-stone-300 flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* ABA 3: EXPORTAÇÃO EDITORIAL PARA VENDA */}
                  {innerTab === 'export' && (
                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-4">
                      <h3 className="text-base font-serif font-bold text-stone-900 dark:text-white">
                        Exportar Produto Final Pronto para Entrega e Venda
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        Escolha o formato desejado abaixo para comercializar na Hotmart, Kiwify, Asaas ou venda direta via WhatsApp.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        <button
                          type="button"
                          onClick={() => handleOpenPrintPdf([activeEbook])}
                          className="p-5 rounded-2xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-300 dark:border-teal-800 hover:border-teal-600 text-left space-y-2 transition cursor-pointer"
                        >
                          <Printer className="w-6 h-6 text-teal-700 dark:text-teal-400" />
                          <div className="text-xs font-bold text-stone-900 dark:text-white">
                            1. Gerar PDF Editorial A4
                          </div>
                          <p className="text-[11px] text-stone-600 dark:text-stone-400">
                            Abre o livro diagramado com Capa, Sumário, Boxes de Clareza, Caderno de Exercícios e Contracapa pronto para &ldquo;Salvar como PDF&rdquo;.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadFile(
                              `ebook-isaac-vol-${String(activeEbook.volumeNumber).padStart(2, '0')}-${activeEbook.slug}.html`,
                              buildPrintableBookHtml([activeEbook], collectionMeta),
                              'text/html;charset=utf-8'
                            )
                          }
                          className="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 hover:border-amber-600 text-left space-y-2 transition cursor-pointer"
                        >
                          <BookOpen className="w-6 h-6 text-amber-700 dark:text-amber-400" />
                          <div className="text-xs font-bold text-stone-900 dark:text-white">
                            2. Baixar eBook Digital (.html)
                          </div>
                          <p className="text-[11px] text-stone-600 dark:text-stone-400">
                            Arquivo único autocontido e responsivo que abre em qualquer celular ou computador sem precisar de internet.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadFile(
                              `manuscrito-vol-${String(activeEbook.volumeNumber).padStart(2, '0')}-${activeEbook.slug}.md`,
                              buildMarkdownFromEbooks([activeEbook], collectionMeta, customPrices),
                              'text/markdown;charset=utf-8'
                            )
                          }
                          className="p-5 rounded-2xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 hover:border-stone-500 text-left space-y-2 transition cursor-pointer"
                        >
                          <FileText className="w-6 h-6 text-stone-700 dark:text-stone-300" />
                          <div className="text-xs font-bold text-stone-900 dark:text-white">
                            3. Manuscrito Editável (.md)
                          </div>
                          <p className="text-[11px] text-stone-600 dark:text-stone-400">
                            Texto completo estruturado com Copy de Venda para importar no Canva, Word, Google Docs ou Amazon KDP.
                          </p>
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

