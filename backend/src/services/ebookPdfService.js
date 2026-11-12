import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import {
  AUTHOR_PROFILE,
  ENRICHED_EBOOKS_CATALOG,
  COMPLETE_BUNDLE_PRODUCT,
  findEbookProductBySlug,
} from '../data/superadminEbooksCatalog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PAGE_W = 595.28; // A4 width in points
const PAGE_H = 841.89; // A4 height in points
const MARGIN_X = 50;
const CONTENT_W = PAGE_W - MARGIN_X * 2; // 495.28pt
const TOP_Y = 52;
const CONTENT_BOTTOM_Y = 774; // Exact ceiling right above bottom dedication margin!

const COLORS = {
  obsidian: '#061a1e',
  deepTeal: '#0f4c4c',
  tealAccent: '#0d9488',
  tealSoftBg: '#f0fdfa',
  tealBorder: '#99f6e4',
  gold: '#c8963e',
  goldBright: '#f5cb6c',
  amberSoftBg: '#fffbeb',
  amberBorder: '#fde68a',
  amberText: '#78350f',
  slateDark: '#0f172a',
  slateBody: '#1e293b',
  slateMuted: '#475569',
  slateLight: '#94a3b8',
  boxBg: '#f8fafc',
  boxBorder: '#cbd5e1',
  noteRule: '#cbd5e1',
  white: '#ffffff',
};

/**
 * Ensures 100% compatibility with PDF standard fonts (Helvetica / Times-Roman WinAnsiEncoding)
 * preserving all Portuguese & British English accents,®, ×, —, quotes, and bullets cleanly.
 */
function cleanPdfText(raw = '') {
  return String(raw || '')
    .replace(/\u2192/g, ' -> ')
    .replace(/\u2190/g, ' <- ')
    .replace(/\u2194/g, ' <-> ')
    .replace(/\u2713|\u2714|\u2705/g, '[OK]')
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/\s+\n/g, '\n')
    .trim();
}

function resolveAssetFile(relSubpath) {
  const candidates = [
    path.resolve(__dirname, '../assets', relSubpath),
    path.resolve(__dirname, '../../../frontend/public', relSubpath),
    path.resolve(process.cwd(), 'backend/src/assets', relSubpath),
    path.resolve(process.cwd(), 'frontend/public', relSubpath),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function drawInteriorHeaderAndFooter(doc, { pageNum, lang = 'pt', bookShortTitle, buyerName }) {
  doc.save();

  // Top subtle running header
  doc
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .fillColor(COLORS.tealAccent)
    .text(
      cleanPdfText(
        lang === 'en'
          ? `ISAAC® ESSENTIAL COLLECTION • ${bookShortTitle.toUpperCase()}`
          : `COLEÇÃO ISAAC® ESSENTIAL • ${bookShortTitle.toUpperCase()}`
      ),
      MARGIN_X,
      24,
      { width: CONTENT_W - 95, lineBreak: false }
    );

  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor(COLORS.slateLight)
    .text(lang === 'en' ? 'Thiago Prata • EN-GB' : 'Thiago Prata • PT-BR', MARGIN_X, 24, {
      width: CONTENT_W,
      align: 'right',
      lineBreak: false,
    });

  doc
    .moveTo(MARGIN_X, 37)
    .lineTo(PAGE_W - MARGIN_X, 37)
    .lineWidth(0.6)
    .strokeColor('#e2e8f0')
    .stroke();

  // Bottom Dedication Margin Rule (y = 784)
  doc
    .moveTo(MARGIN_X, 784)
    .lineTo(PAGE_W - MARGIN_X, 784)
    .lineWidth(0.9)
    .strokeColor(COLORS.gold)
    .stroke();

  const cleanBuyer = cleanPdfText(buyerName || '');
  let dedicationLine1 = '';
  let dedicationLine2 = '';

  if (cleanBuyer) {
    if (lang === 'en') {
      dedicationLine1 = `Personal edition warmly dedicated to ${cleanBuyer}`;
      dedicationLine2 = `May these pages bring clarity, peace, and direction to your journey. • Thiago Prata — ISAAC® Platform`;
    } else {
      dedicationLine1 = `Exemplar dedicado especialmente a ${cleanBuyer}`;
      dedicationLine2 = `Que estas páginas iluminem suas decisões, sua paz e sua caminhada. • Thiago Prata — Plataforma ISAAC®`;
    }
  } else if (lang === 'en') {
    dedicationLine1 = `Official Bilingual Authorial Edition • Thiago Prata — Mentor & Creator of ISAAC®`;
    dedicationLine2 = `isaac.lynxems.com.br • Turning good into good business`;
  } else {
    dedicationLine1 = `Edição Oficial Autoral Bilíngue • Thiago Prata — Mentor & Idealizador do App ISAAC®`;
    dedicationLine2 = `isaac.lynxems.com.br • Fazer do bem um bom negócio`;
  }

  doc
    .font('Times-Italic')
    .fontSize(8.3)
    .fillColor(COLORS.deepTeal)
    .text(cleanPdfText(dedicationLine1), MARGIN_X, 790, {
      width: CONTENT_W - 55,
      lineBreak: false,
    });

  doc
    .font('Helvetica')
    .fontSize(7.3)
    .fillColor(COLORS.slateMuted)
    .text(cleanPdfText(dedicationLine2), MARGIN_X, 802, {
      width: CONTENT_W - 55,
      lineBreak: false,
    });

  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor(COLORS.slateDark)
    .text(lang === 'en' ? `Page ${pageNum}` : `Pág. ${pageNum}`, MARGIN_X, 794, {
      width: CONTENT_W,
      align: 'right',
      lineBreak: false,
    });

  doc.restore();
}

function drawFullBleedCoverPage(doc, coverRelPath, fallbackTitle, fallbackSub) {
  const fullPath = resolveAssetFile(coverRelPath);
  doc.save();
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(COLORS.obsidian);

  if (fullPath) {
    // Cover image is 960x1360 (ratio 0.70588) — virtually identical to A4 (595.28/841.89 = 0.70707)!
    doc.image(fullPath, 0, 0, { width: PAGE_W, height: PAGE_H });
  } else {
    doc
      .rect(28, 28, PAGE_W - 56, PAGE_H - 56)
      .lineWidth(1.5)
      .strokeColor(COLORS.goldBright)
      .stroke();
    doc
      .font('Times-Bold')
      .fontSize(30)
      .fillColor(COLORS.white)
      .text(cleanPdfText(fallbackTitle), 60, 260, { width: PAGE_W - 120, align: 'center' });
    doc
      .font('Times-Italic')
      .fontSize(15)
      .fillColor(COLORS.goldBright)
      .text(cleanPdfText(fallbackSub), 70, 360, { width: PAGE_W - 140, align: 'center' });
    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor(COLORS.white)
      .text('THIAGO PRATA — Mentor & Idealizador do ISAAC®', 60, 720, {
        width: PAGE_W - 120,
        align: 'center',
      });
  }
  doc.restore();
}

/**
 * Draws custom vector architecture diagram sized cleanly at 495.28pt x 146pt for each volume's exact topic.
 */
function drawTopicVectorDiagram(doc, y, { diagramType, diagramTitle, lang = 'pt', volume }) {
  const boxH = 148;
  doc.save();
  doc
    .roundedRect(MARGIN_X, y, CONTENT_W, boxH, 10)
    .fillAndStroke('#08252b', COLORS.gold);

  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor(COLORS.goldBright)
    .text(cleanPdfText(diagramTitle || ''), MARGIN_X + 16, y + 12, {
      width: CONTENT_W - 32,
      align: 'center',
    });

  const innerY = y + 34;
  const innerW = CONTENT_W - 32;
  const startX = MARGIN_X + 16;

  const stepsByVolume = {
    1:
      lang === 'en'
        ? [
            ['1. LIFE LEGACY', 'Core Mission'],
            ['2. 10-YR MASTER', 'Patrimony & Vision'],
            ['3. 4-YR STRATEGY', 'Scenarios & Structure'],
            ['4. 1-YR TACTICAL', 'Annual Goals'],
            ['5. 3-MO OPERAT.', 'Quarterly Control'],
            ['6. 4-WK SPRINT', 'G×U×T Execution'],
          ]
        : [
            ['1. PLANO VIDA', 'Missão & Legado'],
            ['2. DIRETOR 10A', 'Grandes Marcos'],
            ['3. ESTRAT. 4A', 'Cenários & Risco'],
            ['4. TÁTICO 1A', 'Metas do Ano'],
            ['5. OPERAC. 3M', 'Ciclo Trimestral'],
            ['6. AÇÃO 4 SEM.', 'Execução G×U×T'],
          ],
    2:
      lang === 'en'
        ? [
            ['INTUITION', '1st Spontaneous Signal'],
            ['EQUALISATION', 'Listen & Welcome Emotion'],
            ['ADAPTABILITY', 'Spot Comfort-Seeking'],
            ['IF / ELSE REASON', 'Observable Reality Test'],
          ]
        : [
            ['INTUIÇÃO', '1º Sinal Espontâneo'],
            ['EQUALIZAÇÃO', 'Ouvir e Acolher Emoção'],
            ['ADAPTABILIDADE', 'Mapear Zona Conforto'],
            ['RAZÃO IF / ELSE', 'Regra Objetiva Real'],
          ],
    3:
      lang === 'en'
        ? [
            ['UNCONDITIONAL', 'Free Value & Connection'],
            ['SEMI-CONDITIONAL', 'Commitment & Action'],
            ['CONDITIONAL', 'Paid Sustainable Offer'],
            ['VIABILITY 4X', 'Personal•Social•Econ•Long'],
          ]
        : [
            ['INCONDICIONAL', 'Conexão Aberta Genuína'],
            ['SEMI-CONDICIONAL', 'Compromisso & Ação'],
            ['CONDICIONAL', 'Oferta Paga Sustentável'],
            ['4 LENTES VIDA', 'Pessoal•Social•Econ•Long'],
          ],
    4:
      lang === 'en'
        ? [
            ['TIME BLOCKS', 'Rhythm Over Haste'],
            ['COST FLOOR', 'Fixed + Variable + Margin'],
            ['COMPARABLES', 'Direct & Indirect Options'],
            ['VALUE CEILING', 'Intangible Impact + Bg Rev'],
          ]
        : [
            ['BLOCOS TEMPO', 'Ritmo Acima da Pressa'],
            ['PISO DE CUSTO', 'Fixo + Variável + Margem'],
            ['COMPARÁVEIS', 'Diretos & Indiretos'],
            ['TETO DE VALOR', 'Impacto + Receita 2º Plano'],
          ],
    5:
      lang === 'en'
        ? [
            ['100 PRESENTED', 'Clear Sower Planting'],
            ['60 CURIOUS', 'Garden Engagement'],
            ['20 DIALOGUE', 'High-Trust Channel'],
            ['10 CONVERTED', '+ 50 Nurtured in Garden'],
          ]
        : [
            ['100 ABORDADOS', 'Plantio do Semeador'],
            ['60 CURIOSOS', 'Atração no Jardim'],
            ['20 EM CONVERSA', 'Canal de Confiança'],
            ['10 FECHAMENTOS', '+ 50 Nutridos no Jardim'],
          ],
    6:
      lang === 'en'
        ? [
            ['TOP CONE', 'Attraction & Conversion'],
            ['CHECKOUT NECK', 'Instant Email + WhatsApp'],
            ['ONBOARDING', '7-Day Quick Victory'],
            ['LOWER CONE', 'Transformation & Referrals'],
          ]
        : [
            ['CONE SUPERIOR', 'Atração & Venda Ética'],
            [' COMPRA / PIX', 'Entrega Imediata Dupla'],
            ['ONBOARDING', 'Segurança nos 1ºs 7 Dias'],
            ['CONE INFERIOR', 'Transformação & Indicação'],
          ],
    7:
      lang === 'en'
        ? [
            ['1. DATE & FACT', 'Zero Drama Record'],
            ['2. REACTION', 'Immediate Impulse'],
            ['3. ROOT EMOTION', 'Hidden Fear / Pride'],
            ['4. RENEWING ACT', 'Conscious Evolution'],
          ]
        : [
            ['1. DATA & FATO', 'Registro Sem Drama'],
            ['2. REAÇÃO', 'Impulso Automático'],
            ['3. EMOÇÃO RAIZ', 'Crença / Medo Ferido'],
            ['4. AÇÃO NOVA', 'Superação Consciente'],
          ],
    8:
      lang === 'en'
        ? [
            ['1. BLOCKED', 'Paralysed by Fear'],
            ['2. MISALIGNED', 'High Effort, Low Focus'],
            ['3. PSEUDO-ALIGNED', 'Cash Without Peace'],
            ['4. INTEGRAL ALIGN.', 'Mission + Lifestyle'],
          ]
        : [
            ['1. BLOQUEADO', 'Paralisia & Medo'],
            ['2. DESALINHADO', 'Esforço Sem Direção'],
            ['3. PSEUDO-ALINH.', 'Lucro Sem Paz'],
            ['4. ALINHADO', 'Missão + Estilo de Vida'],
          ],
  };

  const cards = stepsByVolume[volume?.volumeNumber] || stepsByVolume[1];
  const gap = 8;
  const cardW = (innerW - gap * (cards.length - 1)) / cards.length;
  const cardH = 88;

  cards.forEach(([head, sub], idx) => {
    const cx = startX + idx * (cardW + gap);
    const isLast = idx === cards.length - 1;
    doc
      .roundedRect(cx, innerY, cardW, cardH, 7)
      .fillAndStroke(isLast ? '#114b53' : '#0c333a', isLast ? COLORS.goldBright : '#2dd4bf');

    doc
      .circle(cx + cardW / 2, innerY + 18, 9)
      .fill(isLast ? COLORS.goldBright : '#14b8a6');

    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(COLORS.obsidian)
      .text(String(idx + 1), cx, innerY + 14, { width: cardW, align: 'center', lineBreak: false });

    doc
      .font('Helvetica-Bold')
      .fontSize(cards.length > 4 ? 7 : 8)
      .fillColor(COLORS.white)
      .text(cleanPdfText(head), cx + 4, innerY + 34, {
        width: cardW - 8,
        align: 'center',
      });

    doc
      .font('Times-Italic')
      .fontSize(cards.length > 4 ? 7 : 8)
      .fillColor('#cbd5e1')
      .text(cleanPdfText(sub), cx + 4, innerY + 56, {
        width: cardW - 8,
        align: 'center',
      });
  });

  doc
    .font('Helvetica')
    .fontSize(7.2)
    .fillColor('#94a3b8')
    .text(
      lang === 'en'
        ? 'Original Systemic Diagram • Thiago Prata — ISAAC® Essential Methodology'
        : 'Diagrama Sistêmico Autoral • Thiago Prata — Metodologia ISAAC® Essential',
      MARGIN_X,
      y + boxH - 16,
      { width: CONTENT_W, align: 'center', lineBreak: false }
    );

  doc.restore();
  return y + boxH + 14;
}

/**
 * Fills ruled note-taking lines ALL THE WAY DOWN to CONTENT_BOTTOM_Y (right above the dedication footer),
 * eliminating empty white voids at the end of chapters!
 */
function drawRuledNotesToBottomOfPage(doc, startY, { lang = 'pt' }) {
  let y = startY;
  const lineSpacing = 22;

  doc.save();
  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor(COLORS.deepTeal)
    .text(
      lang === 'en'
        ? 'PERSONAL NOTES, INSIGHTS & COMMITMENTS (WRITE ALL THE WAY DOWN):'
        : 'MINHAS ANOTAÇÕES, INSIGHTS & COMPROMISSOS PRÁTICOS:',
      MARGIN_X,
      y,
      { width: CONTENT_W }
    );

  y += 20;

  while (y <= CONTENT_BOTTOM_Y - 4) {
    doc
      .moveTo(MARGIN_X, y)
      .lineTo(PAGE_W - MARGIN_X, y)
      .lineWidth(0.65)
      .dash(2, { space: 2 })
      .strokeColor('#94a3b8')
      .stroke()
      .undash();
    y += lineSpacing;
  }
  doc.restore();
  return CONTENT_BOTTOM_Y;
}

function renderAuthorAndDedicationPage(doc, state, { isBundle, mainProduct, buyerName, purchaseDateStr }) {
  doc.addPage({ size: 'A4', margin: 0 });
  state.pageNum += 1;
  drawInteriorHeaderAndFooter(doc, {
    pageNum: state.pageNum,
    lang: 'pt',
    bookShortTitle: isBundle ? 'Coleção Completa (8 Volumes)' : `Vol. 0${mainProduct.volumeNumber}`,
    buyerName,
  });

  let y = TOP_Y;

  // Title Header Box
  doc
    .roundedRect(MARGIN_X, y, CONTENT_W, 92, 10)
    .fillAndStroke(COLORS.obsidian, COLORS.gold);

  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor(COLORS.goldBright)
    .text('EDIÇÃO OFICIAL BILÍNGUE • PORTUGUÊS (PT-BR) & BRITISH ENGLISH (EN-GB)', MARGIN_X + 16, y + 14, {
      width: CONTENT_W - 32,
      align: 'center',
    });

  doc
    .font('Times-Bold')
    .fontSize(isBundle ? 16 : 15)
    .fillColor(COLORS.white)
    .text(cleanPdfText(mainProduct.title), MARGIN_X + 18, y + 31, {
      width: CONTENT_W - 36,
      align: 'center',
    });

  doc
    .font('Times-Italic')
    .fontSize(10)
    .fillColor('#cbd5e1')
    .text(cleanPdfText(isBundle ? mainProduct.enTitle : mainProduct.enGb?.title || ''), MARGIN_X + 18, y + 66, {
      width: CONTENT_W - 36,
      align: 'center',
    });

  y += 108;

  // Personal Dedication Box (when buyerName exists, or Authorial Welcome)
  const cleanBuyer = cleanPdfText(buyerName || '');
  const dedicationBoxH = 104;
  doc
    .roundedRect(MARGIN_X, y, CONTENT_W, dedicationBoxH, 10)
    .fillAndStroke(COLORS.amberSoftBg, COLORS.gold);

  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor(COLORS.amberText)
    .text(
      cleanBuyer
        ? `DEDICATÓRIA PESSOAL AO LEITOR • PERSONAL DEDICATION`
        : `MENSAGEM DE ACOLHIMENTO DO AUTOR • AUTHOR'S WELCOME`,
      MARGIN_X + 18,
      y + 12,
      { width: CONTENT_W - 36 }
    );

  const ptDed = cleanBuyer
    ? `Para ${cleanBuyer}: obrigado por investir na sua clareza e evolução. Este exemplar foi preparado especialmente para caminhar ao seu lado nas decisões que realmente importam${purchaseDateStr ? ` (${purchaseDateStr})` : ''}.`
    : `Obrigado por abrir espaço na sua rotina para desacelerar e enxergar com nitidez. Cada ferramenta deste livro nasceu da escuta real de pessoas que escolheram viver e empreender com propósito.`;

  const enDed = cleanBuyer
    ? `For ${cleanBuyer}: thank you for investing in your clarity and growth. This bilingual edition has been personally dedicated to accompany your most meaningful decisions.`
    : `Thank you for creating quiet space to reflect and decide with clarity. Every framework in these pages grew from guiding real people committed to purposeful living.`;

  doc
    .font('Times-BoldItalic')
    .fontSize(10.2)
    .fillColor(COLORS.slateDark)
    .text(cleanPdfText(ptDed), MARGIN_X + 18, y + 28, { width: CONTENT_W - 36, lineGap: 2 });

  doc
    .font('Times-Italic')
    .fontSize(9.5)
    .fillColor(COLORS.slateMuted)
    .text(cleanPdfText(enDed), MARGIN_X + 18, y + 66, { width: CONTENT_W - 36, lineGap: 1.5 });

  y += dedicationBoxH + 14;

  // About the Author: Thiago Prata (with real photo!)
  const authorBoxH = 158;
  doc
    .roundedRect(MARGIN_X, y, CONTENT_W, authorBoxH, 10)
    .fillAndStroke(COLORS.tealSoftBg, COLORS.tealAccent);

  const photoPath = resolveAssetFile('thiago-prata.jpg');
  const textLeftX = photoPath ? MARGIN_X + 108 : MARGIN_X + 18;
  const textAvailW = photoPath ? CONTENT_W - 124 : CONTENT_W - 36;

  if (photoPath) {
    doc.save();
    doc.roundedRect(MARGIN_X + 16, y + 18, 78, 98, 8).clip();
    doc.image(photoPath, MARGIN_X + 16, y + 18, { width: 78, height: 98 });
    doc.restore();
    doc
      .roundedRect(MARGIN_X + 16, y + 18, 78, 98, 8)
      .lineWidth(1.5)
      .strokeColor(COLORS.gold)
      .stroke();
  }

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(COLORS.tealAccent)
    .text('SOBRE O AUTOR & MENTOR • ABOUT THE AUTHOR', textLeftX, y + 14, { width: textAvailW });

  doc
    .font('Times-Bold')
    .fontSize(15)
    .fillColor(COLORS.slateDark)
    .text(AUTHOR_PROFILE.name, textLeftX, y + 26, { width: textAvailW });

  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor(COLORS.deepTeal)
    .text(cleanPdfText(AUTHOR_PROFILE.rolePt), textLeftX, y + 44, { width: textAvailW });

  doc
    .font('Times-Roman')
    .fontSize(9.2)
    .fillColor(COLORS.slateBody)
    .text(cleanPdfText(AUTHOR_PROFILE.bioPt), textLeftX, y + 58, { width: textAvailW, lineGap: 1.5 });

  doc
    .font('Times-Italic')
    .fontSize(8.8)
    .fillColor(COLORS.slateMuted)
    .text(cleanPdfText(AUTHOR_PROFILE.bioEn), MARGIN_X + 16, y + 122, {
      width: CONTENT_W - 32,
      lineGap: 1.2,
    });

  y += authorBoxH + 14;

  // Structure & Bilingual Index Box filling cleanly to the bottom of Page 2
  const remainH = CONTENT_BOTTOM_Y - y;
  doc
    .roundedRect(MARGIN_X, y, CONTENT_W, remainH, 10)
    .fillAndStroke(COLORS.boxBg, COLORS.boxBorder);

  doc
    .font('Helvetica-Bold')
    .fontSize(9.5)
    .fillColor(COLORS.obsidian)
    .text(
      isBundle
        ? 'ESTRUTURA DA OBRA COMPLETA (8 VOLUMES BILÍNGUES PT-BR + EN-GB)'
        : 'COMO APROVEITAR ESTA EDIÇÃO BILÍNGUE (ESTRUTURA DO VOLUME)',
      MARGIN_X + 18,
      y + 14,
      { width: CONTENT_W - 36 }
    );

  let listY = y + 32;
  if (isBundle) {
    ENRICHED_EBOOKS_CATALOG.forEach((v) => {
      doc
        .font('Helvetica-Bold')
        .fontSize(8.6)
        .fillColor(COLORS.deepTeal)
        .text(
          cleanPdfText(`Volume 0${v.volumeNumber} — ${v.title}`),
          MARGIN_X + 18,
          listY,
          { width: CONTENT_W - 36, lineBreak: false }
        );
      listY += 12;
      doc
        .font('Times-Italic')
        .fontSize(8.2)
        .fillColor(COLORS.slateMuted)
        .text(cleanPdfText(`EN-GB: ${v.enGb?.title || ''}`), MARGIN_X + 28, listY, {
          width: CONTENT_W - 46,
          lineBreak: false,
        });
      listY += 16;
    });
  } else {
    doc
      .font('Helvetica-Bold')
      .fontSize(8.8)
      .fillColor(COLORS.deepTeal)
      .text('PARTE I — EDIÇÃO EM PORTUGUÊS (PT-BR):', MARGIN_X + 18, listY);
    listY += 14;
    mainProduct.chapters.forEach((ch) => {
      doc
        .font('Times-Roman')
        .fontSize(9.2)
        .fillColor(COLORS.slateBody)
        .text(cleanPdfText(`• Capítulo ${ch.number}: ${ch.title}`), MARGIN_X + 24, listY, {
          width: CONTENT_W - 42,
        });
      listY = doc.y + 3;
    });

    listY += 8;
    doc
      .font('Helvetica-Bold')
      .fontSize(8.8)
      .fillColor(COLORS.deepTeal)
      .text('PART II — BRITISH ENGLISH EDITION (EN-GB):', MARGIN_X + 18, listY);
    listY += 14;
    (mainProduct.enGb?.chapters || []).forEach((ch) => {
      doc
        .font('Times-Italic')
        .fontSize(9.2)
        .fillColor(COLORS.slateMuted)
        .text(cleanPdfText(`• Chapter ${ch.number}: ${ch.title}`), MARGIN_X + 24, listY, {
          width: CONTENT_W - 42,
        });
      listY = doc.y + 3;
    });

    if (CONTENT_BOTTOM_Y - listY >= 34) {
      doc
        .font('Times-Italic')
        .fontSize(8.8)
        .fillColor(COLORS.amberText)
        .text(
          cleanPdfText(AUTHOR_PROFILE.quotePt + ' — Thiago Prata'),
          MARGIN_X + 18,
          CONTENT_BOTTOM_Y - 26,
          { width: CONTENT_W - 36, align: 'center' }
        );
    }
  }
}

function renderVolumeLanguageSection(doc, state, { volume, lang = 'pt', buyerName }) {
  const isEn = lang === 'en';
  const vTitle = isEn ? volume.enGb?.title || volume.title : volume.title;
  const vSub = isEn ? volume.enGb?.subtitle || volume.subtitle : volume.subtitle;
  const vExec = isEn ? volume.enGb?.executiveSummary || volume.executiveSummary : volume.executiveSummary;
  const chapters = isEn ? volume.enGb?.chapters || [] : volume.chapters || [];
  const shortRunTitle = `Vol. 0${volume.volumeNumber} • ${
    isEn ? volume.visualSpec?.shortCoverTitleEn || 'ISAAC' : volume.visualSpec?.shortCoverTitlePt || 'ISAAC'
  }`;

  const startFreshPage = () => {
    doc.addPage({ size: 'A4', margin: 0 });
    state.pageNum += 1;
    drawInteriorHeaderAndFooter(doc, {
      pageNum: state.pageNum,
      lang,
      bookShortTitle: shortRunTitle,
      buyerName,
    });
    return TOP_Y;
  };

  // SECTION OPENING PAGE: Header + 16:9 Topic Illustration (Ideal Proportion!) + Executive Summary + Vector Diagram
  let y = startFreshPage();

  // Language & Volume Header Banner
  doc
    .roundedRect(MARGIN_X, y, CONTENT_W, 86, 10)
    .fillAndStroke(isEn ? '#112240' : COLORS.obsidian, COLORS.gold);

  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor(COLORS.goldBright)
    .text(
      cleanPdfText(
        isEn
          ? `PART II • BRITISH ENGLISH EDITION (EN-GB) — VOLUME 0${volume.volumeNumber}`
          : `PARTE I • EDIÇÃO EM PORTUGUÊS (PT-BR) — VOLUME 0${volume.volumeNumber}`
      ),
      MARGIN_X + 16,
      y + 12,
      { width: CONTENT_W - 32 }
    );

  doc
    .font('Times-Bold')
    .fontSize(14.5)
    .fillColor(COLORS.white)
    .text(cleanPdfText(vTitle), MARGIN_X + 16, y + 27, { width: CONTENT_W - 32 });

  doc
    .font('Times-Italic')
    .fontSize(9.5)
    .fillColor('#cbd5e1')
    .text(cleanPdfText(vSub), MARGIN_X + 16, y + 62, { width: CONTENT_W - 32 });

  y += 98;

  // Embedded 16:9 Panoramic Topic Illustration at exact 16:9 aspect ratio (495.28 x 248 cropped cleanly or 440 x 247.5 centered!)
  const ilusRel = `ebooks/illustrations/${volume.visualSpec?.illustrationFile || `ilus-0${volume.volumeNumber}.jpg`}`;
  const ilusFull = resolveAssetFile(ilusRel);
  if (ilusFull) {
    // Ideal 16:9 aspect ratio box spanning full content width: 495.28pt width -> 278.5pt height (exact 16:9 = zero distortion!)
    const imgW = CONTENT_W;
    const imgH = Math.round((CONTENT_W * 9) / 16); // 279pt
    doc.save();
    doc.roundedRect(MARGIN_X, y, imgW, imgH, 10).clip();
    doc.image(ilusFull, MARGIN_X, y, { width: imgW, height: imgH });
    doc.restore();
    doc
      .roundedRect(MARGIN_X, y, imgW, imgH, 10)
      .lineWidth(1.2)
      .strokeColor(COLORS.gold)
      .stroke();

    y += imgH + 6;
    const caption = isEn
      ? volume.visualSpec?.illustrationCaptionEn || ''
      : volume.visualSpec?.illustrationCaptionPt || '';
    if (caption) {
      doc
        .font('Times-Italic')
        .fontSize(8.4)
        .fillColor(COLORS.slateMuted)
        .text(cleanPdfText(caption), MARGIN_X + 8, y, { width: CONTENT_W - 16, align: 'center' });
      y = doc.y + 10;
    }
  }

  // Executive Summary Box
  doc.font('Times-Roman').fontSize(10.4);
  const execTextClean = cleanPdfText(vExec);
  const execTextH = doc.heightOfString(execTextClean, { width: CONTENT_W - 32, lineGap: 2.5 });
  const execBoxH = execTextH + 38;

  doc
    .roundedRect(MARGIN_X, y, CONTENT_W, execBoxH, 9)
    .fillAndStroke(COLORS.tealSoftBg, COLORS.tealAccent);

  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor(COLORS.deepTeal)
    .text(
      isEn ? 'EXECUTIVE OVERVIEW • BY THIAGO PRATA' : 'VISÃO EXECUTIVA DO VOLUME • POR THIAGO PRATA',
      MARGIN_X + 16,
      y + 11,
      { width: CONTENT_W - 32 }
    );

  doc
    .font('Times-Roman')
    .fontSize(10.4)
    .fillColor(COLORS.slateBody)
    .text(execTextClean, MARGIN_X + 16, y + 26, {
      width: CONTENT_W - 32,
      align: 'justify',
      lineGap: 2.5,
    });

  y += execBoxH + 12;

  // Custom Vector Diagram for this Volume
  if (y + 154 <= CONTENT_BOTTOM_Y) {
    y = drawTopicVectorDiagram(doc, y, {
      diagramType: volume.visualSpec?.diagramType,
      diagramTitle: isEn ? volume.visualSpec?.diagramTitleEn : volume.visualSpec?.diagramTitlePt,
      lang,
      volume,
    });
  }

  // Fill any remaining space on the opening page with quick reflection lines to bottom if >= 48pt remain
  if (CONTENT_BOTTOM_Y - y >= 48) {
    drawRuledNotesToBottomOfPage(doc, y + 4, { lang });
  }

  // RENDER EACH CHAPTER WITH FULL DETAIL + RULED NOTES TO EXACT PAGE BOTTOM
  for (const ch of chapters) {
    y = startFreshPage();

    const ensureSpace = (neededH) => {
      if (y + neededH > CONTENT_BOTTOM_Y) {
        y = startFreshPage();
      }
    };

    // Chapter Header Card
    const chLabel = isEn
      ? `CHAPTER 0${ch.number} • VOLUME 0${volume.volumeNumber}`
      : `CAPÍTULO 0${ch.number} • VOLUME 0${volume.volumeNumber}`;
    doc.font('Times-Bold').fontSize(15);
    const chTitleClean = cleanPdfText(ch.title);
    const chTitleH = doc.heightOfString(chTitleClean, { width: CONTENT_W - 32 });
    const chBannerH = chTitleH + 34;

    doc
      .roundedRect(MARGIN_X, y, CONTENT_W, chBannerH, 9)
      .fillAndStroke('#0b2f35', COLORS.gold);

    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(COLORS.goldBright)
      .text(chLabel, MARGIN_X + 16, y + 10, { width: CONTENT_W - 32 });

    doc
      .font('Times-Bold')
      .fontSize(15)
      .fillColor(COLORS.white)
      .text(chTitleClean, MARGIN_X + 16, y + 23, { width: CONTENT_W - 32 });

    y += chBannerH + 14;

    // Detailed Multi-Paragraph Body Text (Core Explanation + Deep Enrichment Paragraphs)
    const allParagraphs = [ch.coreExplanation, ...(ch.deepParagraphs || [])].filter(Boolean);
    for (const para of allParagraphs) {
      const pClean = cleanPdfText(para);
      doc.font('Times-Roman').fontSize(11);
      const pH = doc.heightOfString(pClean, { width: CONTENT_W, lineGap: 3.2 });
      ensureSpace(pH + 10);
      doc
        .font('Times-Roman')
        .fontSize(11)
        .fillColor(COLORS.slateBody)
        .text(pClean, MARGIN_X, y, {
          width: CONTENT_W,
          align: 'justify',
          lineGap: 3.2,
        });
      y = doc.y + 10;
    }

    // Real-World Case Study Box
    if (ch.caseStudy) {
      const caseClean = cleanPdfText(ch.caseStudy);
      doc.font('Times-Italic').fontSize(10.2);
      const cH = doc.heightOfString(caseClean, { width: CONTENT_W - 32, lineGap: 2.2 });
      const caseBoxH = cH + 34;
      ensureSpace(caseBoxH + 10);

      doc
        .roundedRect(MARGIN_X, y, CONTENT_W, caseBoxH, 8)
        .fillAndStroke('#f1f5f9', '#64748b');

      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(COLORS.slateDark)
        .text(
          isEn ? 'REAL-WORLD CASE & PRACTICAL SCENARIO' : 'ESTUDO DE CASO & CENÁRIO PRÁTICO',
          MARGIN_X + 16,
          y + 10,
          { width: CONTENT_W - 32 }
        );

      doc
        .font('Times-Italic')
        .fontSize(10.2)
        .fillColor(COLORS.slateBody)
        .text(caseClean, MARGIN_X + 16, y + 23, {
          width: CONTENT_W - 32,
          align: 'justify',
          lineGap: 2.2,
        });

      y += caseBoxH + 12;
    }

    // Clarity Key Highlight Box
    if (ch.clarityKey) {
      const keyClean = cleanPdfText(`"${ch.clarityKey}"`);
      doc.font('Times-BoldItalic').fontSize(10.8);
      const kH = doc.heightOfString(keyClean, { width: CONTENT_W - 36, lineGap: 2.4 });
      const keyBoxH = kH + 36;
      ensureSpace(keyBoxH + 10);

      doc
        .roundedRect(MARGIN_X, y, CONTENT_W, keyBoxH, 8)
        .fillAndStroke(COLORS.amberSoftBg, COLORS.gold);

      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(COLORS.amberText)
        .text(
          isEn ? 'CLARITY KEY • THIAGO PRATA' : 'CHAVE DE CLAREZA • THIAGO PRATA',
          MARGIN_X + 18,
          y + 10,
          { width: CONTENT_W - 36 }
        );

      doc
        .font('Times-BoldItalic')
        .fontSize(10.8)
        .fillColor(COLORS.amberText)
        .text(keyClean, MARGIN_X + 18, y + 24, {
          width: CONTENT_W - 36,
          lineGap: 2.4,
        });

      y += keyBoxH + 12;
    }

    // Operational Framework Box
    if (Array.isArray(ch.frameworkItems) && ch.frameworkItems.length > 0) {
      doc.font('Times-Roman').fontSize(10.2);
      let itemsTotalH = 0;
      const cleanedItems = ch.frameworkItems.map((it) => cleanPdfText(it));
      for (const itemStr of cleanedItems) {
        itemsTotalH += doc.heightOfString(`• ${itemStr}`, { width: CONTENT_W - 36, lineGap: 2 }) + 6;
      }
      const fwBoxH = itemsTotalH + 38;
      ensureSpace(fwBoxH + 10);

      doc
        .roundedRect(MARGIN_X, y, CONTENT_W, fwBoxH, 9)
        .fillAndStroke(COLORS.tealSoftBg, COLORS.tealAccent);

      doc
        .font('Helvetica-Bold')
        .fontSize(8.8)
        .fillColor(COLORS.deepTeal)
        .text(
          cleanPdfText(
            (isEn ? 'OPERATIONAL FRAMEWORK: ' : 'FERRAMENTA PRÁTICA: ') + (ch.frameworkTitle || '')
          ),
          MARGIN_X + 18,
          y + 11,
          { width: CONTENT_W - 36 }
        );

      let iy = y + 28;
      for (const itemStr of cleanedItems) {
        doc
          .font('Times-Roman')
          .fontSize(10.2)
          .fillColor(COLORS.slateDark)
          .text(`• ${itemStr}`, MARGIN_X + 18, iy, {
            width: CONTENT_W - 36,
            lineGap: 2,
          });
        iy = doc.y + 6;
      }

      y += fwBoxH + 12;
    }

    // Practical Exercise + Ruled Note Lines ALL THE WAY TO THE BOTTOM OF THE PAGE!
    const exClean = cleanPdfText(ch.practicalExercise || '');
    doc.font('Times-Roman').fontSize(10.4);
    const exH = doc.heightOfString(exClean, { width: CONTENT_W - 32, lineGap: 2.2 });
    const exBoxH = exH + 36;

    // Ensure there is room for BOTH the Exercise Box AND at least 3 ruled lines below it before page bottom;
    // otherwise start cleanly on a fresh page and draw ruled lines all the way down!
    if (y + exBoxH + 86 > CONTENT_BOTTOM_Y) {
      // Fill remaining space on current page if enough room for notes header + 2 lines, then open new page for exercise
      if (CONTENT_BOTTOM_Y - y >= 68) {
        drawRuledNotesToBottomOfPage(doc, y, { lang });
      }
      y = startFreshPage();
    }

    doc
      .roundedRect(MARGIN_X, y, CONTENT_W, exBoxH, 8)
      .fillAndStroke('#ecfdf5', '#059669');

    doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor('#065f46')
      .text(
        isEn
          ? 'PRACTICAL APPLICATION EXERCISE (COMPLETE BELOW)'
          : 'EXERCÍCIO DE APLICAÇÃO PRÁTICA (REGISTRE ABAIXO)',
        MARGIN_X + 16,
        y + 10,
        { width: CONTENT_W - 32 }
      );

    doc
      .font('Times-Roman')
      .fontSize(10.4)
      .fillColor(COLORS.slateDark)
      .text(exClean, MARGIN_X + 16, y + 24, {
        width: CONTENT_W - 32,
        lineGap: 2.2,
      });

    y += exBoxH + 14;

    // Extend ruled note lines ALL THE WAY to the bottom margin of the page!
    drawRuledNotesToBottomOfPage(doc, y, { lang });
  }
}

function renderClosingBackCoverPage(doc, { buyerName }) {
  doc.addPage({ size: 'A4', margin: 0 });
  doc.save();
  doc.rect(0, 0, PAGE_W, PAGE_H).fill(COLORS.obsidian);

  doc
    .roundedRect(32, 32, PAGE_W - 64, PAGE_H - 64, 12)
    .lineWidth(1.6)
    .strokeColor(COLORS.gold)
    .stroke();

  doc
    .roundedRect(42, 42, PAGE_W - 84, PAGE_H - 84, 8)
    .lineWidth(0.7)
    .strokeColor('#2dd4bf')
    .stroke();

  let y = 110;
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(COLORS.goldBright)
    .text('PLATAFORMA ISAAC® • ESPAÇO CONFIDENCIAL DE CLAREZA & DIREÇÃO', 70, y, {
      width: PAGE_W - 140,
      align: 'center',
    });

  y += 38;
  doc
    .font('Times-Bold')
    .fontSize(26)
    .fillColor(COLORS.white)
    .text('Continue Sua Jornada de Clareza com o App ISAAC®', 70, y, {
      width: PAGE_W - 140,
      align: 'center',
    });

  y = doc.y + 18;
  doc
    .font('Times-Roman')
    .fontSize(12)
    .fillColor('#e2e8f0')
    .text(
      cleanPdfText(
        'A leitura abre a consciência; a prática acompanhada consolida a transformação. Acesse gratuitamente o App Web da Plataforma ISAAC® para conversar em texto e voz 24h, registrar seus aprendizados no Laboratório do Incômodo Criativo e caminhar com memória evolutiva contínua.'
      ),
      80,
      y,
      { width: PAGE_W - 160, align: 'center', lineGap: 4 }
    );

  y = doc.y + 28;
  doc
    .font('Times-Italic')
    .fontSize(11.5)
    .fillColor('#94a3b8')
    .text(
      cleanPdfText(
        'Reading awakens awareness; guided practice consolidates transformation. Visit the ISAAC® Platform Web App free of charge to reflect via text and voice 24/7, use the Creative Trouble Lab, and grow with continuous evolutionary memory.'
      ),
      80,
      y,
      { width: PAGE_W - 160, align: 'center', lineGap: 3.5 }
    );

  y = doc.y + 42;
  doc
    .roundedRect(135, y, PAGE_W - 270, 54, 27)
    .fillAndStroke('#0d9488', COLORS.goldBright);

  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor(COLORS.white)
    .text('https://isaac.lynxems.com.br', 135, y + 20, {
      width: PAGE_W - 270,
      align: 'center',
    });

  y += 96;
  const photoPath = resolveAssetFile('thiago-prata.jpg');
  if (photoPath) {
    doc.save();
    doc.circle(PAGE_W / 2, y + 40, 40).clip();
    doc.image(photoPath, PAGE_W / 2 - 40, y, { width: 80, height: 80 });
    doc.restore();
    doc.circle(PAGE_W / 2, y + 40, 40).lineWidth(2).strokeColor(COLORS.goldBright).stroke();
    y += 94;
  }

  doc
    .font('Times-Bold')
    .fontSize(18)
    .fillColor(COLORS.white)
    .text('THIAGO PRATA', 70, y, { width: PAGE_W - 140, align: 'center' });

  doc
    .font('Times-Italic')
    .fontSize(11)
    .fillColor(COLORS.goldBright)
    .text('Mentor em Projetos e Negócios • Idealizador da Metodologia e do App ISAAC®', 70, doc.y + 4, {
      width: PAGE_W - 140,
      align: 'center',
    });

  if (buyerName) {
    doc
      .font('Times-Italic')
      .fontSize(9.5)
      .fillColor('#cbd5e1')
      .text(
        cleanPdfText(`Exemplar exclusivo dedicado a ${buyerName} • Exclusive edition dedicated to ${buyerName}`),
        60,
        PAGE_H - 72,
        { width: PAGE_W - 120, align: 'center' }
      );
  }

  doc.restore();
}

/**
 * Generates a complete, print-ready Bilingual PDF Buffer (PT-BR + EN-GB in the same PDF)
 * for either any individual volume ('vol-01'..'vol-08' or slug) OR the Complete 8-in-1 Collection ('colecao-completa').
 */
export async function generateEbookBilingualPdfBuffer({
  slugOrId,
  buyerName = '',
  purchaseDateStr = '',
} = {}) {
  const product = findEbookProductBySlug(slugOrId);
  if (!product) {
    throw new Error(`eBook "${slugOrId}" não encontrado no catálogo.`);
  }

  const isBundle = Boolean(product.isBundle);
  const volumesToRender = isBundle ? ENRICHED_EBOOKS_CATALOG : [product];

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        info: {
          Title: isBundle
            ? `${COMPLETE_BUNDLE_PRODUCT.title} — Thiago Prata`
            : `${product.title} — Thiago Prata`,
          Author: 'Thiago Prata — Mentor & Idealizador da Plataforma ISAAC®',
          Subject: 'Coleção ISAAC® Essential (Edição Bilíngue Português + Inglês Britânico)',
          Keywords: 'ISAAC, Thiago Prata, Clareza, Liderança, Plataforma, Bilingual eBook',
          Creator: 'Plataforma ISAAC® Editorial Engine',
        },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const state = { pageNum: 1 };

      // 1. Front Cover (Page 1)
      const mainCoverRel = isBundle
        ? 'ebooks/covers/colecao-completa.jpg'
        : `ebooks/covers/${product.visualSpec?.coverFile || `${product.id}.jpg`}`;
      drawFullBleedCoverPage(doc, mainCoverRel, product.title, product.subtitle);

      // 2. Author Thiago Prata & Personal Dedication + Bilingual Index (Page 2)
      renderAuthorAndDedicationPage(doc, state, {
        isBundle,
        mainProduct: product,
        buyerName,
        purchaseDateStr,
      });

      // 3. Render Volume(s) — Each volume has Part I (PT-BR) + Part II (British English EN-GB)!
      for (const vol of volumesToRender) {
        if (isBundle) {
          // Insert each individual volume's cover as a visual divider inside the Complete 8-in-1 Anthology!
          doc.addPage({ size: 'A4', margin: 0 });
          state.pageNum += 1;
          const vCoverRel = `ebooks/covers/${vol.visualSpec?.coverFile || `${vol.id}.jpg`}`;
          drawFullBleedCoverPage(doc, vCoverRel, vol.title, vol.subtitle);
        }

        // Part I: Português (PT-BR)
        renderVolumeLanguageSection(doc, state, {
          volume: vol,
          lang: 'pt',
          buyerName,
        });

        // Part II: British English (EN-GB)
        renderVolumeLanguageSection(doc, state, {
          volume: vol,
          lang: 'en',
          buyerName,
        });
      }

      // 4. Final Back Cover Page
      renderClosingBackCoverPage(doc, { buyerName });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export function getEbookPdfFileName(slugOrId) {
  const product = findEbookProductBySlug(slugOrId);
  if (!product) return 'ISAAC-Essential-Thiago-Prata.pdf';
  if (product.isBundle) {
    return 'Colecao-Completa-ISAAC-Essential-8-eBooks-PT-EN-Thiago-Prata.pdf';
  }
  return `ISAAC-Vol-0${product.volumeNumber}-${product.slug}-PT-EN-Thiago-Prata.pdf`;
}

