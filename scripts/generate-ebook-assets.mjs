import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const sharp = require('../backend/node_modules/sharp');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const brainDir = 'C:\\Users\\lynx\\.gemini\\antigravity\\brain\\04522c13-3632-473a-8c87-a8efdd6e76d3';

const pubCoversDir = path.join(rootDir, 'frontend/public/ebooks/covers');
const pubIlusDir = path.join(rootDir, 'frontend/public/ebooks/illustrations');
const backCoversDir = path.join(rootDir, 'backend/src/assets/ebooks/covers');
const backIlusDir = path.join(rootDir, 'backend/src/assets/ebooks/illustrations');

for (const d of [pubCoversDir, pubIlusDir, backCoversDir, backIlusDir]) {
  fs.mkdirSync(d, { recursive: true });
}

function escapeXml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const COVERS_SPEC = [
  {
    key: 'vol-01',
    outName: 'vol-01.jpg',
    rawPath: path.join(brainDir, 'isaac_vol01_cover_1794107969520.jpg'),
    badge: 'COLEÇÃO ISAAC® ESSENTIAL • VOLUME 01',
    bilingualTag: 'EDIÇÃO BILÍNGUE • PORTUGUÊS & BRITISH ENGLISH',
    titleLines: ['O DESPERTAR', 'DA CLAREZA'],
    subtitleLines: ['Nossa LEI, Projeto de Vida, Os 6 Horizontes', '& Priorização Cirúrgica com Matriz GUT'],
    enTitle: 'THE AWAKENING OF CLARITY • LIFE DESIGN & GUT MATRIX',
    accentHex: '#2dd4bf',
    goldHex: '#f5cb6c',
  },
  {
    key: 'vol-02',
    outName: 'vol-02.jpg',
    rawPath: path.join(brainDir, 'isaac_vol02_cover_1794107990562.jpg'),
    badge: 'COLEÇÃO ISAAC® ESSENTIAL • VOLUME 02',
    bilingualTag: 'EDIÇÃO BILÍNGUE • PORTUGUÊS & BRITISH ENGLISH',
    titleLines: ['MENTE, DECISÃO', '& ERA DA IA'],
    subtitleLines: ['Como Mensurar a Subjetividade, Equalizar Emoções', '& Não Ser Substituído pela Automação'],
    enTitle: 'MIND, SUBJECTIVITY & DECISION-MAKING IN THE AGE OF AI',
    accentHex: '#818cf8',
    goldHex: '#f5cb6c',
  },
  {
    key: 'vol-03',
    outName: 'vol-03.jpg',
    rawPath: path.join(brainDir, 'isaac_vol03_cover_1794108014572.jpg'),
    badge: 'COLEÇÃO ISAAC® ESSENTIAL • VOLUME 03',
    bilingualTag: 'EDIÇÃO BILÍNGUE • PORTUGUÊS & BRITISH ENGLISH',
    titleLines: ['PILAR 1: CORE', '& OFERTA DE VALOR'],
    subtitleLines: ['Identidade Autêntica, Roma ISAAC®, Os 3 Níveis', 'da Oferta & Portfólio de Transformação'],
    enTitle: 'PILLAR 1: CORE • IDENTITY, 3 OFFER TIERS & PORTFOLIO',
    accentHex: '#fbbf24',
    goldHex: '#fde68a',
  },
  {
    key: 'vol-04',
    outName: 'vol-04.jpg',
    rawPath: path.join(brainDir, 'vol_04_cover_art_refined_1794107948199.jpg'),
    badge: 'COLEÇÃO ISAAC® ESSENTIAL • VOLUME 04',
    bilingualTag: 'EDIÇÃO BILÍNGUE • PORTUGUÊS & BRITISH ENGLISH',
    titleLines: ['PILAR 2: TEMPO', '& PRECIFICAÇÃO'],
    subtitleLines: ['Domínio do Ritmo, Finanças Escaláveis,', 'Receita em 2º Plano & Equipes Autônomas'],
    enTitle: 'PILLAR 2: RESOURCES • TIME MASTERY & SMART PRICING',
    accentHex: '#34d399',
    goldHex: '#f5cb6c',
  },
  {
    key: 'vol-05',
    outName: 'vol-05.jpg',
    rawPath: path.join(brainDir, 'vol_05_cover_art_1794107971198.jpg'),
    badge: 'COLEÇÃO ISAAC® ESSENTIAL • VOLUME 05',
    bilingualTag: 'EDIÇÃO BILÍNGUE • PORTUGUÊS & BRITISH ENGLISH',
    titleLines: ['PILAR 3: O JARDIM', 'DA ATRAÇÃO'],
    subtitleLines: ['Funil de Vendas Ético, Campanha Enxuta', '& As 3 Parábolas da Alta Conversão'],
    enTitle: 'PILLAR 3: MARKET • GARDEN FUNNEL & ETHICAL SALES',
    accentHex: '#fb7185',
    goldHex: '#f5cb6c',
  },
  {
    key: 'vol-06',
    outName: 'vol-06.jpg',
    rawPath: path.join(brainDir, 'vol_06_cover_art_1794107997812.jpg'),
    badge: 'COLEÇÃO ISAAC® ESSENTIAL • VOLUME 06',
    bilingualTag: 'EDIÇÃO BILÍNGUE • PORTUGUÊS & BRITISH ENGLISH',
    titleLines: ['PILAR 4: AMPULHETA', 'DA ENTREGA'],
    subtitleLines: ['Logística da Transformação, Onboarding Impecável', '& Processos que Libertam o Fundador'],
    enTitle: 'PILLAR 4: LOGISTICS • THE HOURGLASS OF TRANSFORMATION',
    accentHex: '#38bdf8',
    goldHex: '#f5cb6c',
  },
  {
    key: 'vol-07',
    outName: 'vol-07.jpg',
    rawPath: path.join(brainDir, 'vol_07_cover_v2_1794107959730.jpg'),
    badge: 'COLEÇÃO ISAAC® ESSENTIAL • VOLUME 07',
    bilingualTag: 'EDIÇÃO BILÍNGUE • PORTUGUÊS & BRITISH ENGLISH',
    titleLines: ['PILAR 5: OS 7', 'CHACRAS & SINA'],
    subtitleLines: ['Prazer em Aprender, Técnica Multifocal', '& A Caderneta ISAAC® de Evolução'],
    enTitle: 'PILLAR 5: LEARNING • 7 CHACRAS, SINA & ISAAC NOTEBOOK',
    accentHex: '#c084fc',
    goldHex: '#f5cb6c',
  },
  {
    key: 'vol-08',
    outName: 'vol-08.jpg',
    rawPath: path.join(brainDir, 'vol_08_cover_v2_1794108004225.jpg'),
    badge: 'COLEÇÃO ISAAC® ESSENTIAL • VOLUME 08',
    bilingualTag: 'EDIÇÃO BILÍNGUE • PORTUGUÊS & BRITISH ENGLISH',
    titleLines: ['PILAR 6: CULTURA', '& ALINHAMENTO'],
    subtitleLines: ['Negócios com Propósito, As 17 Perguntas de Ouro', '& Harmonia entre Lucro e Estilo de Vida'],
    enTitle: 'PILLAR 6: ALIGNMENT • PURPOSE, 17 QUESTIONS & CULTURE',
    accentHex: '#2dd4bf',
    goldHex: '#f5cb6c',
  },
  {
    key: 'colecao-completa',
    outName: 'colecao-completa.jpg',
    rawPath: path.join(brainDir, 'bundle_complete_cover_1794108028778.jpg'),
    badge: 'EDIÇÃO DE COLECIONADOR • OS 8 VOLUMES EM 1 PDF ÚNICO',
    bilingualTag: 'OBRA COMPLETA BILÍNGUE • PORTUGUÊS & BRITISH ENGLISH',
    titleLines: ['COLEÇÃO ISAAC®', 'ESSENTIAL COMPLETA'],
    subtitleLines: ['Todos os 8 Livros Reunidos: Clareza, Mente & IA,', 'Oferta, Finanças, Vendas, Processos & Propósito'],
    enTitle: 'THE COMPLETE 8-IN-1 MASTER ANTHOLOGY • BILINGUAL EDITION',
    accentHex: '#fbbf24',
    goldHex: '#fde68a',
  },
];

const ILLUSTRATIONS_SPEC = [
  { outName: 'ilus-01.jpg', rawPath: path.join(brainDir, 'ilus_01_1794108156498.jpg') },
  { outName: 'ilus-02.jpg', rawPath: path.join(brainDir, 'ilus_02_1794108177779.jpg') },
  { outName: 'ilus-03.jpg', rawPath: path.join(brainDir, 'ilus_03_1794108219047.jpg') },
  { outName: 'ilus-04.jpg', rawPath: path.join(brainDir, 'ilus_04_1794108283439.jpg') },
  { outName: 'ilus-05.jpg', rawPath: path.join(brainDir, 'ilus_05_1794108322587.jpg') },
  { outName: 'ilus-06.jpg', rawPath: path.join(brainDir, 'ilus_06_1794108366546.jpg') },
  { outName: 'ilus-07.jpg', rawPath: path.join(brainDir, 'ilus_07_1794108412173.jpg') },
  { outName: 'ilus-08.jpg', rawPath: path.join(brainDir, 'ilus_08_1794108460924.jpg') },
];

async function buildCircularAuthorAvatarPng(size = 112) {
  const authorPath = path.join(rootDir, 'backend/src/assets/thiago-prata.jpg');
  const circleMask = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 4}" fill="white"/>
    </svg>`
  );
  const avatarImg = await sharp(authorPath)
    .resize(size, size, { fit: 'cover', position: 'top' })
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const ringSvg = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 3}" fill="none" stroke="#f5cb6c" stroke-width="4"/>
    </svg>`
  );

  return sharp(avatarImg)
    .composite([{ input: ringSvg, blend: 'over' }])
    .png()
    .toBuffer();
}

async function generateCovers() {
  const W = 960;
  const H = 1360;
  const avatarBuf = await buildCircularAuthorAvatarPng(108);

  for (const spec of COVERS_SPEC) {
    const svgOverlay = `
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="topGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#041317" stop-opacity="0.96"/>
          <stop offset="26%" stop-color="#041317" stop-opacity="0.82"/>
          <stop offset="46%" stop-color="#041317" stop-opacity="0.08"/>
          <stop offset="72%" stop-color="#041317" stop-opacity="0.18"/>
          <stop offset="86%" stop-color="#041317" stop-opacity="0.90"/>
          <stop offset="100%" stop-color="#030d10" stop-opacity="0.98"/>
        </linearGradient>
        <linearGradient id="spineShadow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.65"/>
          <stop offset="45%" stop-color="#ffffff" stop-opacity="0.14"/>
          <stop offset="70%" stop-color="#000000" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="goldLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#b6892e" stop-opacity="0.2"/>
          <stop offset="50%" stop-color="${spec.goldHex}" stop-opacity="1"/>
          <stop offset="100%" stop-color="#b6892e" stop-opacity="0.2"/>
        </linearGradient>
      </defs>

      <!-- Atmospheric Editorial Contrast Vignette -->
      <rect x="0" y="0" width="${W}" height="${H}" fill="url(#topGrad)"/>

      <!-- Subtle Hardcover Book Spine Crease on Left -->
      <rect x="0" y="0" width="34" height="${H}" fill="url(#spineShadow)"/>

      <!-- Luxury Double Gold Frame -->
      <rect x="38" y="34" width="${W - 76}" height="${H - 68}" rx="12" fill="none" stroke="${spec.goldHex}" stroke-opacity="0.55" stroke-width="2"/>
      <rect x="48" y="44" width="${W - 96}" height="${H - 88}" rx="8" fill="none" stroke="${spec.goldHex}" stroke-opacity="0.22" stroke-width="1"/>

      <!-- Top Collection Ribbon Pill -->
      <rect x="108" y="74" width="${W - 216}" height="40" rx="20" fill="#072227" fill-opacity="0.92" stroke="${spec.goldHex}" stroke-opacity="0.75" stroke-width="1.5"/>
      <text x="${W / 2}" y="100" text-anchor="middle" fill="${spec.goldHex}" font-family="Georgia, 'Times New Roman', serif" font-size="16.5" font-weight="bold" letter-spacing="2.2">
        ${escapeXml(spec.badge)}
      </text>

      <!-- Bilingual Tag -->
      <text x="${W / 2}" y="144" text-anchor="middle" fill="${spec.accentHex}" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="bold" letter-spacing="2.4">
        ${escapeXml(spec.bilingualTag)}
      </text>

      <!-- Main Commanding Title -->
      <text x="${W / 2}" y="222" text-anchor="middle" fill="#ffffff" font-family="Georgia, 'Times New Roman', serif" font-size="60" font-weight="bold" letter-spacing="1.2">
        ${escapeXml(spec.titleLines[0])}
      </text>
      <text x="${W / 2}" y="292" text-anchor="middle" fill="${spec.goldHex}" font-family="Georgia, 'Times New Roman', serif" font-size="60" font-weight="bold" letter-spacing="1.2">
        ${escapeXml(spec.titleLines[1])}
      </text>

      <!-- Decorative Gold Divider -->
      <rect x="250" y="316" width="${W - 500}" height="2.5" fill="url(#goldLine)"/>

      <!-- Portuguese Subtitle -->
      <text x="${W / 2}" y="354" text-anchor="middle" fill="#e7eceb" font-family="Georgia, 'Times New Roman', serif" font-size="21" font-style="italic">
        ${escapeXml(spec.subtitleLines[0])}
      </text>
      <text x="${W / 2}" y="384" text-anchor="middle" fill="#e7eceb" font-family="Georgia, 'Times New Roman', serif" font-size="21" font-style="italic">
        ${escapeXml(spec.subtitleLines[1])}
      </text>

      <!-- English Subtitle Strip Above Author Block -->
      <rect x="86" y="1102" width="${W - 172}" height="34" rx="17" fill="#072227" fill-opacity="0.88" stroke="${spec.goldHex}" stroke-opacity="0.38" stroke-width="1"/>
      <text x="${W / 2}" y="1124" text-anchor="middle" fill="#d6e3e1" font-family="Arial, Helvetica, sans-serif" font-size="13.5" font-weight="bold" letter-spacing="1.6">
        ${escapeXml(spec.enTitle)}
      </text>

      <!-- Bottom Author Signature Panel -->
      <rect x="74" y="1156" width="${W - 148}" height="138" rx="18" fill="#061b20" fill-opacity="0.92" stroke="${spec.goldHex}" stroke-opacity="0.55" stroke-width="1.5"/>

      <text x="230" y="1202" text-anchor="start" fill="#94a3b8" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="bold" letter-spacing="2.5">
        AUTOR &amp; MENTOR OFICIAL
      </text>
      <text x="230" y="1244" text-anchor="start" fill="#ffffff" font-family="Georgia, 'Times New Roman', serif" font-size="36" font-weight="bold" letter-spacing="1">
        THIAGO PRATA
      </text>
      <text x="230" y="1273" text-anchor="start" fill="${spec.goldHex}" font-family="Georgia, 'Times New Roman', serif" font-size="17" font-style="italic">
        Mentor &amp; Idealizador da Metodologia e do App ISAAC®
      </text>
    </svg>`;

    const composedBuffer = await sharp(spec.rawPath)
      .resize(W, H, { fit: 'cover', position: 'centre' })
      .composite([
        { input: Buffer.from(svgOverlay), top: 0, left: 0 },
        { input: avatarBuf, top: 1171, left: 98 },
      ])
      .jpeg({ quality: 91, mozjpeg: true })
      .toBuffer();

    fs.writeFileSync(path.join(pubCoversDir, spec.outName), composedBuffer);
    fs.writeFileSync(path.join(backCoversDir, spec.outName), composedBuffer);
    console.log(`✅ Cover generated: ${spec.outName} (${Math.round(composedBuffer.length / 1024)} KB)`);
  }
}

async function generateIllustrations() {
  for (const item of ILLUSTRATIONS_SPEC) {
    const buf = await sharp(item.rawPath)
      .resize(1280, 720, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();

    fs.writeFileSync(path.join(pubIlusDir, item.outName), buf);
    fs.writeFileSync(path.join(backIlusDir, item.outName), buf);
    console.log(`✅ Illustration optimized: ${item.outName} (${Math.round(buf.length / 1024)} KB)`);
  }
}

await generateCovers();
await generateIllustrations();
console.log('🎉 All 9 Sales Covers + 8 Interior Illustrations ready!');
