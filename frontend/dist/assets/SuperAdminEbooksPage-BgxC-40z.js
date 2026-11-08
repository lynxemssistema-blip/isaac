import{j as e}from"./animations-CTBnN-U1.js";import{a as n,O as E,v as me,aY as Se,N as Ae,E as V,aZ as $,m as pe,t as be,ap as Pe,q as Ee,c as F,al as z,e as ge,a_ as $e,n as Ie,ag as he,aW as De,d as Be,x as ue,as as Te,a$ as Le,b0 as Oe,a5 as Re,an as Ve,a8 as Fe,b1 as ze}from"./icons-B4KX0GMQ.js";import{aH as Me,aI as _e,aJ as Ue}from"./index-B4uLHqfc.js";import"./vendor-CVt3yQ3G.js";import"./supabase-C5o0XR4z.js";const v={teal:{badge:"bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30",ring:"border-teal-600 dark:border-teal-400 bg-teal-50/70 dark:bg-teal-950/30",cover:"from-teal-900 via-teal-800 to-slate-900",hex:"#0f766e"},indigo:{badge:"bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/30",ring:"border-indigo-600 dark:border-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/30",cover:"from-indigo-950 via-indigo-800 to-slate-900",hex:"#3730a3"},amber:{badge:"bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-500/30",ring:"border-amber-600 dark:border-amber-400 bg-amber-50/70 dark:bg-amber-950/30",cover:"from-amber-900 via-amber-800 to-stone-900",hex:"#b45309"},emerald:{badge:"bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",ring:"border-emerald-600 dark:border-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/30",cover:"from-emerald-950 via-emerald-800 to-slate-900",hex:"#047857"},rose:{badge:"bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30",ring:"border-rose-600 dark:border-rose-400 bg-rose-50/70 dark:bg-rose-950/30",cover:"from-rose-950 via-rose-800 to-slate-900",hex:"#be123c"},sky:{badge:"bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30",ring:"border-sky-600 dark:border-sky-400 bg-sky-50/70 dark:bg-sky-950/30",cover:"from-sky-950 via-sky-800 to-slate-900",hex:"#0369a1"},violet:{badge:"bg-violet-500/15 text-violet-800 dark:text-violet-300 border-violet-500/30",ring:"border-violet-600 dark:border-violet-400 bg-violet-50/70 dark:bg-violet-950/30",cover:"from-violet-950 via-violet-800 to-slate-900",hex:"#6d28d9"},stone:{badge:"bg-stone-500/15 text-stone-800 dark:text-stone-300 border-stone-500/30",ring:"border-stone-700 dark:border-stone-400 bg-stone-100 dark:bg-slate-800",cover:"from-stone-900 via-stone-800 to-slate-950",hex:"#44403c"}};function x(c){return String(c||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function fe(c,r){const k=c.map(m=>{const p=v[m.accentColor]||v.teal,i=(m.chapters||[]).map(d=>`
          <div class="toc-item">
            <span class="toc-num">Capítulo ${String(d.number).padStart(2,"0")}</span>
            <span class="toc-title">${x(d.title)}</span>
          </div>`).join(""),w=(m.chapters||[]).map(d=>`
          <section class="chapter">
            <div class="chapter-kicker" style="color:${p.hex}">CAPÍTULO ${String(d.number).padStart(2,"0")}</div>
            <h2 class="chapter-title">${x(d.title)}</h2>
            <p class="chapter-body">${x(d.coreExplanation)}</p>

            <div class="clarity-box" style="border-left-color:${p.hex}">
              <div class="clarity-label" style="color:${p.hex}">CHAVE DE CLAREZA</div>
              <p class="clarity-text">&ldquo;${x(d.clarityKey)}&rdquo;</p>
            </div>

            <div class="framework-box">
              <div class="framework-title">${x(d.frameworkTitle)}</div>
              <ul class="framework-list">
                ${(d.frameworkItems||[]).map(g=>`<li>${x(g)}</li>`).join("")}
              </ul>
            </div>

            <div class="exercise-box">
              <div class="exercise-label">APLICAÇÃO IMEDIATA (CADERNO PRÁTICO)</div>
              <p class="exercise-text">${x(d.practicalExercise)}</p>
              <div class="notes-lines">
                <div></div><div></div><div></div>
              </div>
            </div>
          </section>`).join("");return`
        <article class="ebook-volume">
          <!-- CAPA EDITORIAL -->
          <section class="cover-page" style="background: linear-gradient(145deg, ${p.hex} 0%, #0f172a 100%);">
            <div class="cover-top">
              <span class="cover-collection">${x((r==null?void 0:r.collectionTitle)||"COLEÇÃO ISAAC® ESSENTIAL")}</span>
              <span class="cover-vol">VOLUME ${String(m.volumeNumber).padStart(2,"0")}</span>
            </div>
            <div class="cover-center">
              <div class="cover-segment">${x(m.segmentBadge)}</div>
              <h1 class="cover-title">${x(m.title)}</h1>
              <p class="cover-subtitle">${x(m.subtitle)}</p>
            </div>
            <div class="cover-footer">
              <div>ISAAC® — Inovação • Sustentabilidade • Amor • Atitude • Conhecimento</div>
              <div>isaac.lynxems.com.br</div>
            </div>
          </section>

          <!-- APRESENTAÇÃO & SUMÁRIO -->
          <section class="intro-page">
            <div class="intro-kicker" style="color:${p.hex}">VISÃO EXECUTIVA DO VOLUME</div>
            <h2 class="intro-heading">Por que este guia foi escrito</h2>
            <p class="intro-summary">${x(m.executiveSummary)}</p>

            <div class="toc-box">
              <div class="toc-header">Sumário Estruturado</div>
              ${i}
            </div>
          </section>

          ${w}

          <!-- CONTRACAPA DE CONVERSÃO -->
          <section class="back-cover">
            <div class="back-badge" style="color:${p.hex}">PRÓXIMO PASSO DA SUA JORNADA</div>
            <h3>Continue sua evolução com a Mentoria ISAAC®</h3>
            <p>Aplique os exercícios deste volume e leve suas decisões, reflexões e desafios para o espaço confidencial de mentoria 24h em texto e voz.</p>
            <div class="back-url">https://isaac.lynxems.com.br</div>
          </section>
        </article>
      `}).join(`
`);return`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${x(c.length===1?c[0].title:(r==null?void 0:r.collectionTitle)||"Coleção ISAAC Essential")}</title>
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
  ${k}
</body>
</html>`}function Ke(c,r,k={}){const m=`# ${(r==null?void 0:r.collectionTitle)||"Coleção ISAAC® Essential"}
> ${(r==null?void 0:r.collectionSubtitle)||""}

---

`,p=c.map(i=>{var g,h;const w=k[i.id]||i.suggestedPrice,d=(i.chapters||[]).map(l=>`### Capítulo ${l.number}: ${l.title}

${l.coreExplanation}

> **Chave de Clareza:** "${l.clarityKey}"

**${l.frameworkTitle}:**
${(l.frameworkItems||[]).map(I=>`- ${I}`).join(`
`)}

**Aplicação Imediata:** ${l.practicalExercise}
`).join(`
---

`);return`## Volume ${String(i.volumeNumber).padStart(2,"0")} — ${i.title}
*${i.subtitle}*

- **Segmento:** ${i.segmentBadge}
- **Preço Sugerido de Venda:** ${w}
- **Headline Comercial:** ${((g=i.salesKit)==null?void 0:g.headline)||""}
- **Copy WhatsApp:** ${((h=i.salesKit)==null?void 0:h.whatsappCopy)||""}

### Visão Executiva
${i.executiveSummary}

${d}`}).join(`

================================================================================

`);return m+p}function Xe({user:c,profile:r,loadingProfile:k,onOpenLogin:m,onBackToApp:p}){var Z,J,Q,ee,te,se,ae,re,oe,le,ne,ie,de,ce,xe;const i=!!c&&((r==null?void 0:r.role)==="master"||String((c==null?void 0:c.email)||(r==null?void 0:r.email)||"").trim().toLowerCase()==="edsonmanoel2012@gmail.com"),[w,d]=n.useState(!1),[g,h]=n.useState(""),[l,I]=n.useState(null),[f,je]=n.useState([]),[M,_]=n.useState("vol-01"),[N,ve]=n.useState("read"),[b,U]=n.useState("pt"),[S,ke]=n.useState(""),[j,K]=n.useState(""),[D,we]=n.useState({}),[B,q]=n.useState(""),[u,H]=n.useState(""),[T,Ne]=n.useState([]),[G,W]=n.useState(!1),Y=async()=>{W(!0);try{const t=await _e();Ne(t.orders||[])}catch(t){console.warn("Aviso ao carregar pedidos Asaas de eBooks:",t.message)}finally{W(!1)}},A=async t=>{if(!(!t||u)){H(t),h("");try{await Ue(t,B.trim())}catch(a){h(a.message||"Falha ao baixar o PDF bilíngue oficial.")}finally{H("")}}};n.useEffect(()=>{document.title="Acervo de eBooks p/ Venda (Superadmin) — ISAAC"},[]),n.useEffect(()=>{if(!i)return;let t=!0;return d(!0),h(""),Me().then(a=>{if(!t)return;I(a.collection||null);const o=a.ebooks||[];je(o),o.length>0&&_(o[0].id)}).catch(a=>{t&&h(a.message||"Não foi possível carregar o acervo do Superadmin.")}).finally(()=>{t&&d(!1)}),Y(),()=>{t=!1}},[i]);const L=n.useMemo(()=>{if(!S.trim())return f;const t=S.toLowerCase();return f.filter(a=>a.title.toLowerCase().includes(t)||a.subtitle.toLowerCase().includes(t)||a.segmentBadge.toLowerCase().includes(t)||(a.chapters||[]).some(o=>o.title.toLowerCase().includes(t)||o.coreExplanation.toLowerCase().includes(t)))},[f,S]),s=n.useMemo(()=>f.find(t=>t.id===M)||L[0]||null,[f,M,L]),O=async(t,a)=>{try{await navigator.clipboard.writeText(a),K(t),setTimeout(()=>K(""),2500)}catch{}},ye=t=>{const a=fe(t,l),o=window.open("","_blank");if(!o){alert("Permita pop-ups no navegador para abrir a visualização de impressão/PDF.");return}o.document.open(),o.document.write(a),o.document.close(),setTimeout(()=>{o.focus(),o.print()},350)},X=(t,a,o)=>{const R=new Blob([a],{type:o}),y=URL.createObjectURL(R),C=document.createElement("a");C.href=y,C.download=t,document.body.appendChild(C),C.click(),document.body.removeChild(C),URL.revokeObjectURL(y)};if(k)return e.jsx("div",{className:"min-h-screen bg-stone-50 dark:bg-slate-950 flex items-center justify-center p-6",children:e.jsxs("div",{className:"text-center space-y-3",children:[e.jsx(E,{className:"w-8 h-8 text-teal-600 animate-spin mx-auto"}),e.jsx("p",{className:"text-xs text-stone-500 dark:text-stone-400",children:"Verificando credenciais Superadmin..."})]})});if(!c)return e.jsx("div",{className:"min-h-screen bg-stone-50 dark:bg-slate-950 flex items-center justify-center p-6",children:e.jsxs("div",{className:"max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xl text-center space-y-4",children:[e.jsx("div",{className:"w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto",children:e.jsx(me,{className:"w-7 h-7"})}),e.jsx("h1",{className:"text-xl font-serif font-bold text-stone-900 dark:text-white",children:"Área Editorial Exclusiva Superadmin"}),e.jsxs("p",{className:"text-xs text-stone-500 dark:text-stone-400 leading-relaxed",children:["Esta página contém os eBooks comerciais segmentados do Mapa Mental ISAAC® e é acessível unicamente pelo usuário ",e.jsx("strong",{children:"Superadmin Master"}),"."]}),e.jsxs("div",{className:"pt-2 space-y-2.5",children:[e.jsx("button",{type:"button",onClick:m,className:"w-full py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-md transition cursor-pointer",children:"Entrar como Superadmin"}),e.jsx("button",{type:"button",onClick:p,className:"w-full py-2.5 rounded-2xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 text-xs font-medium text-stone-600 dark:text-stone-300 transition cursor-pointer",children:"Voltar ao App"})]})]})});if(!i)return e.jsx("div",{className:"min-h-screen bg-stone-50 dark:bg-slate-950 flex items-center justify-center p-6",children:e.jsxs("div",{className:"max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 shadow-xl text-center space-y-4",children:[e.jsx("div",{className:"w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto",children:e.jsx(Se,{className:"w-7 h-7"})}),e.jsx("h1",{className:"text-xl font-serif font-bold text-stone-900 dark:text-white",children:"Acesso Estritamente Restrito"}),e.jsxs("p",{className:"text-xs text-stone-500 dark:text-stone-400 leading-relaxed",children:["Esta página é exclusiva para o perfil ",e.jsx("strong",{children:"Superadmin Master"}),". Sua conta atual (",c.email,") não possui permissão para visualizar este acervo."]}),e.jsx("button",{type:"button",onClick:p,className:"w-full py-3 rounded-2xl bg-stone-900 dark:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer",children:"Voltar para a Mentoria ISAAC"})]})});const Ce=v[s==null?void 0:s.accentColor]||v.teal,P=s?D[s.id]??s.suggestedPrice:"";return e.jsxs("div",{className:"min-h-screen bg-stone-100/80 dark:bg-slate-950 text-stone-900 dark:text-stone-100",children:[e.jsx("header",{className:"sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-stone-200 dark:border-slate-800 px-4 sm:px-8 py-3.5",children:e.jsxs("div",{className:"max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("button",{type:"button",onClick:p,className:"p-2 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-700 dark:text-stone-200 transition cursor-pointer",title:"Voltar ao App ISAAC",children:e.jsx(Ae,{className:"w-4 h-4"})}),e.jsxs("div",{children:[e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsxs("span",{className:"px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1",children:[e.jsx(me,{className:"w-3 h-3"})," Acesso Exclusivo Superadmin"]}),e.jsxs("a",{href:"https://trello.com/b/squXZ3Yq/isaac-essential-mind-map",target:"_blank",rel:"noreferrer",className:"text-[11px] font-medium text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1",children:[e.jsx("span",{children:"Fonte: Trello ISAAC Essential Mind Map"}),e.jsx(V,{className:"w-3 h-3"})]})]}),e.jsx("h1",{className:"text-base sm:text-lg font-serif font-bold text-stone-900 dark:text-white mt-0.5",children:(l==null?void 0:l.collectionTitle)||"Coleção ISAAC® Essential — Acervo de eBooks para Venda"})]})]}),f.length>0&&e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsx("input",{type:"text",value:B,onChange:t=>q(t.target.value),placeholder:"Nome p/ dedicatória no rodapé (opcional)",className:"px-3 py-2 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 text-xs text-stone-800 dark:text-stone-100 w-56 outline-none focus:border-teal-600",title:"Se preenchido, o PDF baixado incluirá a dedicatória nominal na margem inferior de todas as páginas"}),e.jsxs("button",{type:"button",disabled:!!u,onClick:()=>A("colecao-completa"),className:"px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60",children:[u==="colecao-completa"?e.jsx(E,{className:"w-3.5 h-3.5 animate-spin"}):e.jsx($,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Baixar PDF Único Completo (8 eBooks PT+EN)"})]}),e.jsxs("a",{href:"/loja/ebooks",target:"_blank",rel:"noreferrer",className:"px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5",children:[e.jsx(pe,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Ver Loja Pública (/loja/ebooks)"})]})]})]})}),e.jsxs("main",{className:"max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6",children:[g&&e.jsx("div",{className:"p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300",children:g}),w?e.jsxs("div",{className:"py-20 text-center",children:[e.jsx(E,{className:"w-8 h-8 animate-spin text-teal-600 mx-auto mb-3"}),e.jsx("p",{className:"text-xs text-stone-500",children:"Carregando os 8 volumes segmentados e kits de venda..."})]}):e.jsxs(e.Fragment,{children:[l&&e.jsx("section",{className:"p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white shadow-lg border border-teal-800/50",children:e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-4 gap-4 items-center",children:[e.jsxs("div",{className:"lg:col-span-2 space-y-1.5",children:[e.jsxs("div",{className:"text-[10px] font-bold uppercase tracking-widest text-teal-300 flex items-center gap-1.5",children:[e.jsx(be,{className:"w-3.5 h-3.5"})," Arquitetura de Monetização • 49 Cartões do Trello Mapeados"]}),e.jsx("h2",{className:"text-base sm:text-lg font-serif font-bold",children:l.acronymMeaning}),e.jsx("p",{className:"text-xs text-slate-300 leading-relaxed",children:(Z=l.commercialStrategy)==null?void 0:Z.upsellBridge})]}),e.jsxs("div",{className:"p-3.5 rounded-2xl bg-white/10 border border-white/10",children:[e.jsx("span",{className:"block text-[10px] uppercase tracking-wider text-teal-300 font-bold",children:"Venda Individual"}),e.jsx("span",{className:"block text-sm font-bold mt-0.5",children:(J=l.commercialStrategy)==null?void 0:J.individualTicketRange}),e.jsx("span",{className:"block text-[11px] text-slate-300 mt-0.5",children:"Porta de entrada por dor específica"})]}),e.jsxs("div",{className:"p-3.5 rounded-2xl bg-amber-500/20 border border-amber-400/30",children:[e.jsx("span",{className:"block text-[10px] uppercase tracking-wider text-amber-300 font-bold",children:"Passaporte Coleção Completa"}),e.jsx("span",{className:"block text-sm font-bold mt-0.5",children:(Q=l.commercialStrategy)==null?void 0:Q.fullPassTicketRange}),e.jsx("span",{className:"block text-[11px] text-amber-100/90 mt-0.5",children:"Os 8 Volumes + Exercícios Práticos"})]})]})}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-12 gap-6 items-start",children:[e.jsxs("aside",{className:"lg:col-span-4 space-y-3",children:[e.jsxs("div",{className:"relative",children:[e.jsx(Pe,{className:"w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2"}),e.jsx("input",{type:"text",value:S,onChange:t=>ke(t.target.value),placeholder:"Buscar tema, pilar ou ferramenta...",className:"w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-xs text-stone-900 dark:text-white outline-none focus:border-teal-600"})]}),e.jsx("div",{className:"space-y-2.5",children:L.map(t=>{var y;const a=(s==null?void 0:s.id)===t.id,o=v[t.accentColor]||v.teal,R=D[t.id]??t.suggestedPrice;return e.jsxs("button",{type:"button",onClick:()=>_(t.id),className:`w-full text-left p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${a?`${o.ring} border-2 shadow-sm`:"bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-800 hover:border-stone-300 dark:hover:border-slate-700"}`,children:[t.coverUrl&&e.jsx("img",{src:t.coverUrl,alt:t.title,className:"w-12 h-17 object-cover rounded-lg border border-stone-200 dark:border-slate-700 shrink-0 shadow-xs"}),e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2 mb-1",children:[e.jsxs("span",{className:`px-2 py-0.5 rounded-full text-[10px] font-bold border ${o.badge}`,children:["Vol. ",String(t.volumeNumber).padStart(2,"0")]}),e.jsx("span",{className:"text-[11px] font-bold text-emerald-700 dark:text-emerald-400",children:R})]}),e.jsx("h3",{className:"text-xs sm:text-sm font-serif font-bold text-stone-900 dark:text-white leading-snug line-clamp-2",children:t.title}),e.jsxs("div",{className:"flex items-center gap-2 mt-1.5 text-[10px] text-stone-500 dark:text-stone-400",children:[e.jsx("span",{children:"PT-BR + EN-GB"}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:[((y=t.chapters)==null?void 0:y.length)||0," cap."]})]})]})]},t.id)})})]}),s&&e.jsxs("section",{className:"lg:col-span-8 space-y-5",children:[e.jsxs("div",{className:`p-6 sm:p-8 rounded-3xl bg-gradient-to-br ${Ce.cover} text-white shadow-xl space-y-5`,children:[e.jsxs("div",{className:"flex flex-col sm:flex-row gap-5 items-start",children:[s.coverUrl&&e.jsx("img",{src:s.coverUrl,alt:`Capa ${s.title}`,className:"w-28 sm:w-32 aspect-[3/4.25] object-cover rounded-2xl border-2 border-white/25 shadow-2xl shrink-0"}),e.jsxs("div",{className:"flex-1 space-y-2.5 min-w-0",children:[e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsxs("span",{className:"px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 backdrop-blur-xs",children:["VOLUME ",String(s.volumeNumber).padStart(2,"0")," — ",s.segmentBadge]}),e.jsx("span",{className:"px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/25 border border-emerald-300/30",children:"Venda Direta Asaas: R$ 19,90 (Pacote 8 em 1: R$ 111,44 • 30% OFF)"})]}),e.jsx("h2",{className:"text-xl sm:text-2xl font-serif font-bold leading-snug",children:b==="en"&&((ee=s.en)!=null&&ee.title)?s.en.title:s.title}),e.jsx("p",{className:"text-xs sm:text-sm text-white/85 leading-relaxed",children:b==="en"&&((te=s.en)!=null&&te.subtitle)?s.en.subtitle:s.subtitle}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2 pt-1 text-[11px] text-amber-200 font-semibold",children:[e.jsx(Ee,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Autor Oficial: Thiago Prata — Mentor & Criador da Mentoria ISAAC®"}),e.jsx("span",{children:"•"}),e.jsx("span",{children:"Edição Bilíngue (PT-BR + Inglês Britânico no mesmo PDF)"})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2 pt-1",children:[e.jsxs("a",{href:`/loja/ebooks/${s.slug}`,target:"_blank",rel:"noreferrer",className:"px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-semibold flex items-center gap-1.5",children:[e.jsx(V,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Abrir Página de Venda Dedicada"})]}),e.jsxs("button",{type:"button",onClick:()=>O("sales_url",`${window.location.origin}/loja/ebooks/${s.slug}`),className:"px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer",children:[j==="sales_url"?e.jsx(F,{className:"w-3.5 h-3.5 text-emerald-300"}):e.jsx(z,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:j==="sales_url"?"Link Copiado!":"Copiar Link de Venda"})]})]})]})]}),e.jsxs("div",{className:"pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/15",children:[e.jsx("div",{className:"flex flex-wrap items-center gap-2",children:[{id:"read",label:"Leitura Bilíngue + Ilustração",icon:ge},{id:"sales",label:"Copy & Material de Venda",icon:$e},{id:"export",label:"Baixar PDF Individual / Pacote",icon:$},{id:"orders",label:`Pedidos Asaas (${T.length})`,icon:pe}].map(t=>{const a=t.icon;return e.jsxs("button",{type:"button",onClick:()=>ve(t.id),className:`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${N===t.id?"bg-white text-slate-900 shadow-sm":"bg-white/10 hover:bg-white/20 text-white"}`,children:[e.jsx(a,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:t.label})]},t.id)})}),e.jsxs("button",{type:"button",disabled:!!u,onClick:()=>A(s.slug),className:"px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-60",children:[u===s.slug?e.jsx(E,{className:"w-3.5 h-3.5 animate-spin"}):e.jsx($,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Baixar PDF Bilíngue Deste eBook"})]})]})]}),N==="read"&&e.jsxs("div",{className:"space-y-5",children:[e.jsxs("div",{className:"p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2",children:[e.jsxs("div",{className:"flex items-center gap-2 text-xs font-semibold text-stone-600 dark:text-stone-300",children:[e.jsx(Ie,{className:"w-4 h-4 text-teal-600"}),e.jsx("span",{children:"Ambos os idiomas constam juntos no mesmo arquivo PDF oficial:"})]}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx("button",{type:"button",onClick:()=>U("pt"),className:`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${b==="pt"?"bg-teal-700 text-white":"bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-stone-300"}`,children:"🇧🇷 Parte I — Português (PT-BR)"}),e.jsx("button",{type:"button",onClick:()=>U("en"),className:`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${b==="en"?"bg-indigo-700 text-white":"bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-stone-300"}`,children:"🇬🇧 Part II — British English (EN-GB)"})]})]}),s.illustrationUrl&&e.jsxs("div",{className:"rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xs",children:[e.jsx("img",{src:s.illustrationUrl,alt:s.title,className:"w-full aspect-video object-cover"}),e.jsxs("div",{className:"px-5 py-3 text-xs text-stone-600 dark:text-stone-300 flex items-center justify-between gap-2",children:[e.jsx("span",{children:b==="en"?s.illustrationCaptionEn||((se=s.en)==null?void 0:se.subtitle):s.illustrationCaptionPt||s.subtitle}),e.jsx("span",{className:"text-[10px] font-bold uppercase text-teal-700 dark:text-teal-400 shrink-0",children:"Ilustração Editorial 16:9 Inclusa no PDF"})]})]}),e.jsxs("div",{className:"p-6 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-3",children:[e.jsxs("div",{className:"text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5",children:[e.jsx(he,{className:"w-3.5 h-3.5"})," ",b==="en"?"Executive Synthesis of This Volume":"Síntese Executiva do Volume"]}),e.jsx("p",{className:"text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-serif",children:b==="en"&&((ae=s.en)!=null&&ae.executiveSummary)?s.en.executiveSummary:s.executiveSummary}),e.jsxs("div",{className:"pt-2 border-t border-stone-100 dark:border-slate-800",children:[e.jsx("span",{className:"block text-[10px] font-bold uppercase text-stone-400 mb-1",children:"Módulos e Cartões do Trello Condensados Neste eBook:"}),e.jsx("ul",{className:"space-y-1",children:(s.trelloSources||[]).map((t,a)=>e.jsxs("li",{className:"text-[11px] text-stone-500 dark:text-stone-400",children:["• ",t]},a))})]})]}),(b==="en"&&((oe=(re=s.en)==null?void 0:re.chapters)!=null&&oe.length)?s.en.chapters:s.chapters||[]).map(t=>e.jsxs("article",{className:"p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xs space-y-4",children:[e.jsxs("div",{children:[e.jsxs("span",{className:"text-[11px] font-bold uppercase tracking-widest text-teal-700 dark:text-teal-400",children:[b==="en"?"Chapter":"Capítulo"," ",String(t.number).padStart(2,"0")]}),e.jsx("h3",{className:"text-lg sm:text-xl font-serif font-bold text-stone-900 dark:text-white mt-0.5",children:t.title})]}),e.jsx("p",{className:"text-sm text-stone-700 dark:text-stone-200 leading-relaxed",children:t.coreExplanation}),t.deepDive&&e.jsx("p",{className:"text-sm text-stone-600 dark:text-stone-300 leading-relaxed",children:t.deepDive}),t.caseStudy&&e.jsxs("div",{className:"p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/25 border border-indigo-200/70 dark:border-indigo-800/50 space-y-1",children:[e.jsx("div",{className:"text-[10px] font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300",children:b==="en"?"Real-World Mentoring Case Study — Thiago Prata":"Estudo de Caso Real na Mentoria — Thiago Prata"}),e.jsx("p",{className:"text-xs text-stone-700 dark:text-stone-200 leading-relaxed",children:t.caseStudy})]}),e.jsxs("div",{className:"p-4 rounded-2xl bg-teal-50/80 dark:bg-teal-950/30 border-l-4 border-teal-600 space-y-1",children:[e.jsxs("div",{className:"text-[10px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5",children:[e.jsx(De,{className:"w-3.5 h-3.5"})," ",b==="en"?"Clarity Key":"Chave de Clareza"]}),e.jsxs("p",{className:"text-xs sm:text-sm font-serif italic font-semibold text-stone-900 dark:text-stone-100",children:["“",t.clarityKey,"”"]})]}),e.jsxs("div",{className:"p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700 space-y-2",children:[e.jsxs("div",{className:"text-xs font-bold text-stone-900 dark:text-white flex items-center gap-1.5",children:[e.jsx(Be,{className:"w-4 h-4 text-teal-600"}),e.jsx("span",{children:t.frameworkTitle})]}),e.jsx("ul",{className:"space-y-1.5",children:(t.frameworkItems||[]).map((a,o)=>e.jsxs("li",{className:"text-xs text-stone-700 dark:text-stone-300 flex items-start gap-2 leading-relaxed",children:[e.jsx(ue,{className:"w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5"}),e.jsx("span",{children:a})]},o))})]}),e.jsxs("div",{className:"p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/50 space-y-1",children:[e.jsxs("div",{className:"text-[10px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300",children:["✍️"," ",b==="en"?"Immediate Practical Application (Ruled Notes to Bottom Margin in PDF)":"Exercício Prático de Aplicação Imediata (Linhas pautadas até o final da página no PDF)"]}),e.jsx("p",{className:"text-xs text-amber-950 dark:text-amber-100 leading-relaxed",children:t.practicalExercise})]})]},t.number))]}),N==="sales"&&e.jsxs("div",{className:"p-6 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-5",children:[e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200 dark:border-slate-800",children:[e.jsxs("div",{children:[e.jsxs("h3",{className:"text-base font-serif font-bold text-stone-900 dark:text-white",children:["Kit Comercial Pronto para Venda — Volume ",s.volumeNumber]}),e.jsxs("p",{className:"text-xs text-stone-500 dark:text-stone-400",children:["Página dedicada oficial: ",e.jsxs("strong",{children:["/loja/ebooks/",s.slug]})," (R$ 19,90) • Pacote 8 em 1: ",e.jsx("strong",{children:"/loja/ebooks/colecao-completa"})," (R$ 111,44)."]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("label",{className:"text-xs font-semibold text-stone-500",children:"Preço:"}),e.jsx("input",{type:"text",value:P,onChange:t=>we(a=>({...a,[s.id]:t.target.value})),className:"w-28 px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 text-xs font-bold text-emerald-700 dark:text-emerald-400"})]})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsxs("div",{className:"p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700 space-y-1.5",children:[e.jsxs("div",{className:"text-[11px] font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1.5",children:[e.jsx(Te,{className:"w-3.5 h-3.5"})," Público-Alvo Ideal"]}),e.jsx("p",{className:"text-xs text-stone-700 dark:text-stone-300 leading-relaxed",children:(le=s.salesKit)==null?void 0:le.targetAudience})]}),e.jsxs("div",{className:"p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/50 space-y-1.5",children:[e.jsxs("div",{className:"text-[11px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5",children:[e.jsx(Le,{className:"w-3.5 h-3.5"})," Dor Principal Resolvida"]}),e.jsx("p",{className:"text-xs text-stone-700 dark:text-stone-300 leading-relaxed",children:(ne=s.salesKit)==null?void 0:ne.corePain})]}),e.jsxs("div",{className:"p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/50 space-y-1.5",children:[e.jsxs("div",{className:"text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5",children:[e.jsx(be,{className:"w-3.5 h-3.5"})," Promessa de Transformação"]}),e.jsx("p",{className:"text-xs text-stone-700 dark:text-stone-300 leading-relaxed",children:(ie=s.salesKit)==null?void 0:ie.transformationPromise})]})]}),e.jsxs("div",{className:"p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/70 border border-stone-200 dark:border-slate-700 space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-xs font-bold text-stone-900 dark:text-white",children:"Headline Principal (Página de Vendas / Anúncio)"}),e.jsxs("button",{type:"button",onClick:()=>{var t;return O("headline",((t=s.salesKit)==null?void 0:t.headline)||"")},className:"px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer",children:[j==="headline"?e.jsx(F,{className:"w-3 h-3"}):e.jsx(z,{className:"w-3 h-3"}),e.jsx("span",{children:j==="headline"?"Copiado!":"Copiar Headline"})]})]}),e.jsx("p",{className:"text-sm font-serif font-semibold text-stone-800 dark:text-stone-100",children:(de=s.salesKit)==null?void 0:de.headline})]}),e.jsxs("div",{className:"p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800/60 space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("span",{className:"text-xs font-bold text-emerald-950 dark:text-emerald-200",children:["Mensagem Pronta de Oferta para WhatsApp (",P,") + Link Direto Asaas"]}),e.jsxs("button",{type:"button",onClick:()=>{var t;return O("whatsapp",`${(t=s.salesKit)==null?void 0:t.whatsappCopy}

✍️ Autor: *Thiago Prata* (Mentor & Criador do ISAAC®)
📘 Edição Bilíngue (Português + Inglês Britânico no mesmo PDF) por *${P}*
👉 Garanta seu exemplar com dedicatória personalizada:
https://isaac.lynxems.com.br/loja/ebooks/${s.slug}`)},className:"px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer",children:[j==="whatsapp"?e.jsx(F,{className:"w-3 h-3"}):e.jsx(z,{className:"w-3 h-3"}),e.jsx("span",{children:j==="whatsapp"?"Copiada!":"Copiar Mensagem WhatsApp"})]})]}),e.jsxs("p",{className:"text-xs text-stone-800 dark:text-stone-200 whitespace-pre-wrap leading-relaxed",children:[(ce=s.salesKit)==null?void 0:ce.whatsappCopy,`

`,"✍️ Autor: *Thiago Prata* (Mentor & Criador do ISAAC®)",`
`,"📘 Edição Bilíngue (Português + Inglês Britânico no mesmo PDF) por *",P,"*",`
`,"👉 https://isaac.lynxems.com.br/loja/ebooks/",s.slug]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("span",{className:"text-xs font-bold text-stone-900 dark:text-white block",children:"O que o comprador recebe neste Volume (Bullets de Valor):"}),e.jsx("ul",{className:"space-y-1.5",children:(((xe=s.salesKit)==null?void 0:xe.deliverables)||[]).map((t,a)=>e.jsxs("li",{className:"text-xs text-stone-700 dark:text-stone-300 flex items-center gap-2",children:[e.jsx(ue,{className:"w-3.5 h-3.5 text-emerald-600 shrink-0"}),e.jsx("span",{children:t})]},a))})]})]}),N==="export"&&e.jsxs("div",{className:"p-6 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-5",children:[e.jsx("div",{className:"flex flex-col sm:flex-row sm:items-center justify-between gap-3",children:e.jsxs("div",{children:[e.jsx("h3",{className:"text-base font-serif font-bold text-stone-900 dark:text-white",children:"Download Oficial em PDF Bilíngue (PT-BR + Inglês Britânico no Mesmo PDF)"}),e.jsxs("p",{className:"text-xs text-stone-500 dark:text-stone-400",children:["Com capa editorial de venda, biografia do autor ",e.jsx("strong",{children:"Thiago Prata"}),", ilustrações 16:9, linhas de anotações até o final da página e dedicatória nominal na margem inferior."]})]})}),e.jsxs("div",{className:"p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3",children:[e.jsxs("div",{className:"text-xs text-amber-950 dark:text-amber-200",children:[e.jsx("strong",{children:"Testar Dedicatória na Margem Inferior:"})," preencha um nome ao lado para gerar o PDF exatamente como o comprador recebe após a confirmação do pagamento Asaas."]}),e.jsx("input",{type:"text",value:B,onChange:t=>q(t.target.value),placeholder:"Ex: Maria Clara Silva",className:"px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-xs text-stone-900 dark:text-white sm:w-64 shrink-0"})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4 pt-1",children:[e.jsxs("button",{type:"button",disabled:!!u,onClick:()=>A(s.slug),className:"p-5 rounded-2xl bg-teal-50/90 dark:bg-teal-950/30 border-2 border-teal-500/50 hover:border-teal-600 text-left space-y-2 transition cursor-pointer disabled:opacity-60",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx($,{className:"w-6 h-6 text-teal-700 dark:text-teal-400"}),e.jsx("span",{className:"px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-600 text-white",children:"PDF Individual Oficial"})]}),e.jsxs("div",{className:"text-sm font-bold text-stone-900 dark:text-white",children:["1. Baixar PDF Deste Volume (",s.volumeNumber,"/08)"]}),e.jsx("p",{className:"text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed",children:"Baixa imediatamente o arquivo PDF nativo de alta resolução deste volume contendo Parte I (Português) + Parte II (British English), capa oficial e linhas de anotações até o rodapé."})]}),e.jsxs("button",{type:"button",disabled:!!u,onClick:()=>A("colecao-completa"),className:"p-5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border-2 border-amber-500/50 hover:border-amber-600 text-left space-y-2 transition cursor-pointer disabled:opacity-60",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx(he,{className:"w-6 h-6 text-amber-700 dark:text-amber-400"}),e.jsx("span",{className:"px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white",children:"PDF Único Consolidado (8 em 1)"})]}),e.jsx("div",{className:"text-sm font-bold text-stone-900 dark:text-white",children:"2. Baixar Coleção Completa em PDF Único"}),e.jsx("p",{className:"text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed",children:"Gera e baixa o arquivo PDF único consolidado com todos os 8 eBooks bilíngues completos (vendido no pacote promocional com 30% de desconto por R$ 111,44)."})]})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-stone-200 dark:border-slate-800",children:[e.jsxs("button",{type:"button",onClick:()=>ye([s]),className:"p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/70 border border-stone-200 dark:border-slate-700 hover:border-teal-600 text-left space-y-1.5 transition cursor-pointer",children:[e.jsx(Oe,{className:"w-5 h-5 text-teal-700 dark:text-teal-400"}),e.jsx("div",{className:"text-xs font-bold text-stone-900 dark:text-white",children:"Visualização p/ Impressão A4"}),e.jsx("p",{className:"text-[11px] text-stone-500",children:"Versão rápida de leitura no navegador."})]}),e.jsxs("button",{type:"button",onClick:()=>X(`ebook-isaac-vol-${String(s.volumeNumber).padStart(2,"0")}-${s.slug}.html`,fe([s],l),"text/html;charset=utf-8"),className:"p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/70 border border-stone-200 dark:border-slate-700 hover:border-amber-600 text-left space-y-1.5 transition cursor-pointer",children:[e.jsx(ge,{className:"w-5 h-5 text-amber-700 dark:text-amber-400"}),e.jsx("div",{className:"text-xs font-bold text-stone-900 dark:text-white",children:"Baixar Versão Web (.html)"}),e.jsx("p",{className:"text-[11px] text-stone-500",children:"Arquivo HTML autocontido offline."})]}),e.jsxs("button",{type:"button",onClick:()=>X(`manuscrito-vol-${String(s.volumeNumber).padStart(2,"0")}-${s.slug}.md`,Ke([s],l,D),"text/markdown;charset=utf-8"),className:"p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/70 border border-stone-200 dark:border-slate-700 hover:border-stone-500 text-left space-y-1.5 transition cursor-pointer",children:[e.jsx(Re,{className:"w-5 h-5 text-stone-700 dark:text-stone-300"}),e.jsx("div",{className:"text-xs font-bold text-stone-900 dark:text-white",children:"Manuscrito Editável (.md)"}),e.jsx("p",{className:"text-[11px] text-stone-500",children:"Texto estruturado + Copy Comercial."})]})]})]}),N==="orders"&&e.jsxs("div",{className:"p-6 rounded-3xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-4",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-base font-serif font-bold text-stone-900 dark:text-white",children:"Pedidos & Vendas Diretas Asaas (Entrega por E-mail e WhatsApp)"}),e.jsx("p",{className:"text-xs text-stone-500 dark:text-stone-400",children:"Acompanhe pagamentos, envios automáticos de link e downloads com dedicatória personalizada."})]}),e.jsxs("button",{type:"button",onClick:Y,disabled:G,className:"px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer",children:[e.jsx(Ve,{className:`w-3.5 h-3.5 ${G?"animate-spin":""}`}),e.jsx("span",{children:"Atualizar"})]})]}),T.length===0?e.jsx("div",{className:"py-10 text-center text-xs text-stone-500",children:"Nenhum pedido registrado ainda. Os pedidos criados nas páginas dedicadas ou no carrinho da página principal aparecerão aqui em tempo real."}):e.jsx("div",{className:"space-y-2.5 max-h-[520px] overflow-y-auto pr-1",children:T.map(t=>e.jsxs("div",{className:"p-4 rounded-2xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3",children:[e.jsxs("div",{className:"space-y-1 min-w-0",children:[e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsx("span",{className:"text-xs font-bold text-stone-900 dark:text-white",children:t.buyer_name}),e.jsx("span",{className:`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.status==="paid"?"bg-emerald-500/15 text-emerald-700 dark:text-emerald-300":"bg-amber-500/15 text-amber-800 dark:text-amber-300"}`,children:t.status==="paid"?"PAGO & LIBERADO":`AGUARDANDO (${t.status})`}),e.jsx("span",{className:"text-xs font-bold text-teal-700 dark:text-teal-400",children:Number(t.total_amount||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})})]}),e.jsxs("div",{className:"text-[11px] text-stone-500 flex flex-wrap items-center gap-3",children:[e.jsxs("span",{className:"flex items-center gap-1",children:[e.jsx(Fe,{className:"w-3 h-3"})," ",t.buyer_email]}),t.buyer_phone&&e.jsxs("span",{className:"flex items-center gap-1",children:[e.jsx(ze,{className:"w-3 h-3"})," ",t.buyer_phone]}),e.jsxs("span",{children:["Downloads: ",t.download_count||0]})]}),e.jsxs("div",{className:"text-[11px] text-stone-400",children:["Dedicatória no rodapé: ",e.jsx("strong",{children:t.dedication_name||t.buyer_name})," •"," ",t.is_complete_bundle?"Pacote Completo (PDF Único 8 em 1)":`${(t.item_slugs||[]).length} eBook(s)`]})]}),e.jsx("div",{className:"flex items-center gap-2 shrink-0",children:e.jsxs("a",{href:`/meus-ebooks/${t.download_token}`,target:"_blank",rel:"noreferrer",className:"px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-semibold flex items-center gap-1",children:[e.jsx(V,{className:"w-3 h-3"}),e.jsx("span",{children:"Portal do Comprador"})]})})]},t.id))})]})]})]})]})]})]})}export{Xe as default};
