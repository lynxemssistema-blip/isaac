import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { genAI, CHAT_MODEL, FALLBACK_CHAT_MODELS } from '../config/gemini.js';
import { supabaseAdmin } from '../config/supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envCandidates = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend/.env'),
];
for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

/**
 * Cria o transportador SMTP oficial usando o servidor Hostinger
 */
export function getEmailTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = (process.env.SMTP_USER || 'suporte@lynxems.com.br').trim();
  const pass = (process.env.SMTP_PASS || '').trim();

  if (!pass) {
    throw new Error('SMTP_PASS não configurada nas variáveis de ambiente.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Envia um e-mail de teste para verificar a conectividade com o servidor SMTP da Hostinger
 */
export async function sendTestEmail(toEmail) {
  const transporter = getEmailTransporter();
  const fromAddress = `"IZAQUE - Suporte & Mentoria" <${process.env.SMTP_USER || 'suporte@lynxems.com.br'}>`;

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject: '🌿 Teste de Conexão - Suporte IZAQUE',
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #faf9f6; padding: 32px; border-radius: 24px; border: 1px solid #e7e5e4; color: #292524;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0f766e; font-size: 26px; margin: 0; font-weight: 600;">IZAQUE</h1>
          <p style="color: #78716c; font-size: 13px; margin-top: 4px;">Espaço de Clareza & Mentoria de Vida</p>
        </div>

        <div style="background-color: #ffffff; padding: 28px; border-radius: 20px; border: 1px solid #f5f5f4; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <h2 style="font-size: 18px; color: #1c1917; margin-top: 0;">✅ Teste de E-mail de Suporte Concluído</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #44403c;">
            Olá! Este é um e-mail de teste para validar o canal de suporte oficial do <strong>IZAQUE</strong>.
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #44403c;">
            O servidor SMTP da Hostinger (<code>smtp.hostinger.com:465</code>) está conectado com sucesso e pronto para envio das recuperações de senha e suporte dos usuários.
          </p>
          <div style="margin: 24px 0; padding: 16px; background-color: #f0fdfa; border-left: 4px solid #0f766e; border-radius: 8px;">
            <p style="margin: 0; font-size: 13px; color: #115e59;">
              <strong>Canal Oficial:</strong> suporte@lynxems.com.br<br>
              <strong>Data/Hora do Teste:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
            </p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #a8a29e;">
          © ${new Date().getFullYear()} IZAQUE Mentoria. Todos os direitos reservados.
        </div>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`✉️ [SMTP Success] E-mail de teste enviado para ${toEmail}. Message ID: ${info.messageId}`);
  return info;
}

/**
 * Envia o e-mail de recuperação de senha com link seguro
 */
export async function sendPasswordResetEmail({ toEmail, name, resetLink }) {
  const transporter = getEmailTransporter();
  const fromAddress = `"IZAQUE - Suporte & Mentoria" <${process.env.SMTP_USER || 'suporte@lynxems.com.br'}>`;

  const displayName = name ? name.split(' ')[0] : 'Viajante';

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject: '🔑 Recuperação de Acesso ao seu Refúgio - IZAQUE',
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #faf9f6; padding: 32px; border-radius: 24px; border: 1px solid #e7e5e4; color: #292524;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0f766e; font-size: 26px; margin: 0; font-weight: 600;">IZAQUE</h1>
          <p style="color: #78716c; font-size: 13px; margin-top: 4px;">Espaço de Clareza & Mentoria de Vida</p>
        </div>

        <div style="background-color: #ffffff; padding: 32px; border-radius: 20px; border: 1px solid #f5f5f4; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <h2 style="font-size: 18px; color: #1c1917; margin-top: 0;">Olá, ${displayName}</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #44403c;">
            Recebemos uma solicitação para redefinir a sua senha de acesso ao seu refúgio pessoal no <strong>IZAQUE</strong>.
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #44403c;">
            Para criar sua nova senha com segurança, clique no botão abaixo:
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetLink}" style="background-color: #0f766e; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 16px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 10px rgba(15, 118, 110, 0.25);">
              Redefinir Minha Senha
            </a>
          </div>

          <p style="font-size: 12px; line-height: 1.5; color: #78716c; margin-top: 24px; border-top: 1px solid #f5f5f4; padding-top: 16px;">
            Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:<br>
            <a href="${resetLink}" style="color: #0f766e; word-break: break-all; font-size: 11px;">${resetLink}</a>
          </p>

          <p style="font-size: 12px; color: #a8a29e; margin-top: 16px;">
            ⚠️ Se você não solicitou a redefinição de senha, apenas ignore este e-mail. Seu acesso continua protegido.
          </p>
        </div>

        <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #78716c;">
          Dúvidas ou suporte? Responda diretamente para <a href="mailto:suporte@lynxems.com.br" style="color: #0f766e; font-weight: 500;">suporte@lynxems.com.br</a>
        </div>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`✉️ [Password Reset Sent] E-mail enviado com sucesso para ${toEmail}. Message ID: ${info.messageId}`);
  return info;
}

/**
 * Envia notificação de pedido de assinatura PIX recebido
 */
export async function sendSubscriptionOrderNotification({ toEmail, userName, planName, price, pixKey }) {
  try {
    const transporter = getEmailTransporter();
    const fromAddress = `"IZAQUE - Suporte & Assinaturas" <${process.env.SMTP_USER || 'suporte@lynxems.com.br'}>`;
    const formattedPrice = Number(price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // 1. E-mail de confirmação para o Usuário
    await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: '🌿 Recebemos sua solicitação de assinatura - IZAQUE',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #faf9f6; padding: 32px; border-radius: 24px; border: 1px solid #e7e5e4; color: #292524;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #0f766e; font-size: 26px; margin: 0; font-weight: 600;">IZAQUE</h1>
            <p style="color: #78716c; font-size: 13px; margin-top: 4px;">Espaço de Clareza & Mentoria de Vida</p>
          </div>

          <div style="background-color: #ffffff; padding: 32px; border-radius: 20px; border: 1px solid #f5f5f4; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
            <h2 style="font-size: 18px; color: #1c1917; margin-top: 0;">Olá, ${userName || 'Viajante'}</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #44403c;">
              Recebemos seu pedido de ativação do plano <strong>${planName}</strong> no valor de <strong>${formattedPrice}</strong>.
            </p>
            
            <div style="margin: 24px 0; padding: 18px; background-color: #f0fdfa; border-left: 4px solid #0f766e; border-radius: 12px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #0f766e;">⏳ Informação Importante sobre a Ativação</h3>
              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #115e59;">
                O pagamento é realizado exclusivamente via <strong>PIX</strong>. A ativação do plano pode demorar <strong>até 10 minutos</strong> após o pagamento para confirmação e liberação pelo sistema.
              </p>
            </div>

            <p style="font-size: 13px; color: #78716c;">
              Chave PIX utilizada: <code>${pixKey}</code>
            </p>
            <p style="font-size: 13px; color: #78716c;">
              Assim que o valor for identificado, seu acesso ilimitado com voz neural será liberado imediatamente!
            </p>
          </div>

          <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #78716c;">
            Qualquer dúvida, responda para <a href="mailto:suporte@lynxems.com.br" style="color: #0f766e; font-weight: 500;">suporte@lynxems.com.br</a>
          </div>
        </div>
      `,
    });

    // 2. Alerta para a equipe Lynx
    await transporter.sendMail({
      from: fromAddress,
      to: process.env.SMTP_USER || 'suporte@lynxems.com.br',
      subject: `🔔 [Novo Pedido PIX] ${userName || toEmail} escolheu ${planName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h3>Novo pedido de assinatura registrado:</h3>
          <ul>
            <li><strong>Cliente:</strong> ${userName || 'Sem nome'} (${toEmail})</li>
            <li><strong>Plano:</strong> ${planName}</li>
            <li><strong>Valor:</strong> ${formattedPrice}</li>
            <li><strong>Data:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</li>
          </ul>
          <p>Acesse o <a href="https://izaque.lynxems.com.br">Painel de Gestão IZAQUE</a> para conferir e aprovar.</p>
        </div>
      `,
    });
  } catch (err) {
    console.warn('⚠️ [Subscription Email] Aviso ao enviar notificação de pedido:', err.message);
  }
}

/**
 * Envia notificação de aprovação e ativação de plano
 */
export async function sendSubscriptionApprovedNotification({ toEmail, userName, planName }) {
  try {
    const transporter = getEmailTransporter();
    const fromAddress = `"IZAQUE - Suporte & Mentoria" <${process.env.SMTP_USER || 'suporte@lynxems.com.br'}>`;

    await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: '✨ Seu refúgio ilimitado foi ativado! - IZAQUE',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #faf9f6; padding: 32px; border-radius: 24px; border: 1px solid #e7e5e4; color: #292524;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #0f766e; font-size: 26px; margin: 0; font-weight: 600;">IZAQUE</h1>
            <p style="color: #78716c; font-size: 13px; margin-top: 4px;">Espaço de Clareza & Mentoria de Vida</p>
          </div>

          <div style="background-color: #ffffff; padding: 32px; border-radius: 20px; border: 1px solid #f5f5f4; box-shadow: 0 4px 12px rgba(0,0,0,0.03); text-align: center;">
            <div style="width: 54px; height: 54px; border-radius: 50%; background-color: #0f766e; color: #ffffff; font-size: 28px; line-height: 54px; margin: 0 auto 16px auto;">
              ✓
            </div>
            <h2 style="font-size: 20px; color: #1c1917; margin-top: 0;">Plano Ativado com Sucesso!</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #44403c;">
              Olá, <strong>${userName || 'Viajante'}</strong>! Seu plano <strong>${planName}</strong> foi aprovado e já está ativo no seu refúgio.
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #44403c;">
              Agora você tem acesso ilimitado à voz neural de estúdio do Gemini, memória profunda contínua e suporte prioritário.
            </p>

            <div style="margin: 32px 0;">
              <a href="https://izaque.lynxems.com.br" style="background-color: #0f766e; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 16px; font-weight: 600; font-size: 14px; display: inline-block;">
                Acessar a Mentoria IZAQUE
              </a>
            </div>
          </div>

          <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #78716c;">
            Equipe Lynx EMS • <a href="mailto:suporte@lynxems.com.br" style="color: #0f766e;">suporte@lynxems.com.br</a>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.warn('⚠️ [Approved Email] Aviso ao enviar e-mail de aprovação:', err.message);
  }
}

/**
 * Envia mensagem/reclamação/sugestão do assinante para o suporte oficial Lynx
 */
export async function sendFeedbackToSupport({ fromEmail, userName, userPlan, type, subject, message }) {
  const transporter = getEmailTransporter();
  const supportEmail = process.env.SMTP_USER || 'suporte@lynxems.com.br';
  const typeLabelMap = {
    suggestion: '💡 Sugestão de Melhoria',
    complaint: '⚠️ Reclamação de Assinante',
    support: '🛠️ Pedido de Suporte Técnico',
    praise: '🌟 Elogio / Depoimento',
  };
  const typeLabel = typeLabelMap[type] || '📩 Mensagem de Usuário';

  // 1. Envia para a equipe de suporte
  const info = await transporter.sendMail({
    from: `"IZAQUE Assinantes" <${supportEmail}>`,
    replyTo: fromEmail,
    to: supportEmail,
    subject: `[${typeLabel}] ${subject || 'Sem Assunto'} - ${userName} (${fromEmail})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
        <div style="background-color: #ffffff; padding: 24px; border-radius: 12px;">
          <h2 style="color: #0f766e; margin-top: 0;">Nova mensagem de cliente do IZAQUE</h2>
          <table style="width: 100%; font-size: 14px; border-collapse: collapse; margin-bottom: 20px;">
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Tipo:</strong></td><td style="color: #0f172a;">${typeLabel}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Nome:</strong></td><td style="color: #0f172a;">${userName || 'Não informado'}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>E-mail:</strong></td><td style="color: #0f172a;">${fromEmail}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Plano:</strong></td><td style="color: #0f172a;">${userPlan || 'free'}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;"><strong>Assunto:</strong></td><td style="color: #0f172a;">${subject}</td></tr>
          </table>

          <div style="padding: 16px; background-color: #f1f5f9; border-radius: 8px; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap;">
${message}
          </div>
        </div>
      </div>
    `,
  });

  // 2. Confirmação automática para o usuário
  try {
    await transporter.sendMail({
      from: `"Suporte Lynx EMS" <${supportEmail}>`,
      to: fromEmail,
      subject: `🌿 Recebemos sua mensagem: "${subject}" - Suporte IZAQUE`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #faf9f6; padding: 24px; border-radius: 16px; border: 1px solid #e7e5e4;">
          <div style="background-color: #ffffff; padding: 24px; border-radius: 12px;">
            <h3 style="color: #0f766e; margin-top: 0;">Olá, ${userName || 'Viajante'}!</h3>
            <p style="font-size: 14px; line-height: 1.6; color: #44403c;">
              Confirmamos o recebimento da sua mensagem sobre <strong>"${subject}"</strong>.
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #44403c;">
              Nossa equipe de suporte técnico e desenvolvimento da Lynx já está analisando o seu contato e responderá diretamente a este e-mail o mais breve possível.
            </p>
            <p style="font-size: 12px; color: #78716c; margin-top: 20px; border-top: 1px solid #f5f5f4; padding-top: 12px;">
              Canal oficial de atendimento: suporte@lynxems.com.br
            </p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.warn('⚠️ [Feedback Confirmation] Erro ao enviar cópia ao cliente:', err.message);
  }

  return info;
}

/**
 * Solicita ao Gemini para redigir um e-mail de novidades detalhista, educado e profundamente humanizado
 */
export async function generateBroadcastEmailDraft({ topic, targetAudience = 'all', extraPrompt = '' }) {
  const modelsToTry = [CHAT_MODEL, ...(FALLBACK_CHAT_MODELS || [])].filter((m, i, arr) => arr.indexOf(m) === i);

  const defaultTopic = `Novidades e melhorias recentes no aplicativo IZAQUE:
1. Chegada de 4 novos mentores especialistas para acolher sua jornada:
   - Marco Aurélio (Resiliência & Serenidade Estoica para lidar com o que não podemos controlar)
   - Clara (Travessia do Luto, Términos Difíceis e Reconstrução Existencial)
   - Dra. Sofia (Prevenção de Burnout, Exaustão e a Arte de Dizer Não com Paz)
   - Caleb (Coragem Profissional e Superação da Síndrome do Impostor)
2. Síntese de Voz neural humanizada estendida, sem cortes nas falas longas, com cadência mansa e reflexiva.
3. RAG de Memória de Longo Prazo aprimorado para recordar e valorizar a evolução de cada mentorado.
4. Refúgio acolhedor com atendimento e suporte atencioso da equipe Lynx EMS.`;

  const chosenTopic = (topic && topic.trim().length > 0) ? topic.trim() : defaultTopic;

  const prompt = `Você é o redator sênior de comunicação e acolhimento humano da Mentoria IZAQUE e da Equipe Lynx EMS.
Sua missão é escrever um e-mail oficial de novidades para os usuários cadastrados no aplicativo IZAQUE.

DIRETRIZES ESSENCIAIS DE COMUNICAÇÃO:
1. SEJA DETALHISTA: Explique com riqueza de detalhes cada novidade, o propósito ético de cada melhoria e como isso acolhe o usuário na prática.
2. EXTREMAMENTE EDUCADO E POLIDO: Trate o usuário com reverência, elegância, respeito e gentileza.
3. HUMANIZADO AO MÁXIMO: O tom NÃO pode parecer marketing frio, spam de vendas ou anúncio superficial. Deve parecer uma carta de acolhimento escrita com carinho e presença viva.
4. PERSONALIZAÇÃO: Use a tag {{nome}} no início para saudação individual (ex: "Olá, {{nome}}...").
5. ASSINATURA OBRIGATÓRIA: O texto deve concluir homenageando a jornada do usuário e preparando a assinatura da "Equipe Lynx EMS & Mentoria IZAQUE".

NOVIDADES A COMUNICAR:
${chosenTopic}

${extraPrompt ? `INSTRUÇÕES ADICIONAIS DO ADMINISTRADOR:\n${extraPrompt}\n` : ''}

RETORNE EXCLUSIVAMENTE UM OBJETO JSON VÁLIDO (sem fences markdown extras fora do JSON):
{
  "subject": "Assunto cativante, elegante e acolhedor (com emoji suave no início)",
  "previewText": "Frase curta de visualização para a caixa de entrada (máx 90 caracteres)",
  "bodyHtml": "Conteúdo completo em HTML limpo usando tags <p>, <h3>, <strong> e <em>. Não inclua a tag <html> ou <body>, apenas o conteúdo interno dos parágrafos.",
  "callToActionText": "Texto do botão principal (ex: Visitar Meu Refúgio Agora)"
}`;

  let parsed = null;
  let lastErr = null;

  for (const modelCandidate of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelCandidate,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      });

      const res = await model.generateContent(prompt);
      let text = res.response.text().trim();
      text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
      parsed = JSON.parse(text);
      if (parsed?.subject && parsed?.bodyHtml) break;
    } catch (e) {
      lastErr = e;
      console.warn(`⚠️ [Broadcast Draft] Falha com modelo ${modelCandidate}:`, e.message);
    }
  }

  if (!parsed || !parsed.subject) {
    throw lastErr || new Error('Não foi possível gerar a redação com a IA.');
  }

  return parsed;
}

/**
 * Envelopa o conteúdo no layout HTML oficial do IZAQUE com a assinatura da Equipe Lynx EMS
 */
export function renderBroadcastEmailHtml({ contentHtml, userName, appUrl = 'https://izaque.lynxems.com.br', callToActionText = 'Acessar o IZAQUE' }) {
  const safeName = userName ? userName.split(' ')[0] : 'Viajante';
  const personalizedContent = (contentHtml || '')
    .replace(/\{\{nome\}\}/gi, safeName)
    .replace(/\{\{name\}\}/gi, safeName);

  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #faf9f6; padding: 36px 20px; border-radius: 28px; border: 1px solid #e7e5e4; color: #292524; line-height: 1.65;">
      <!-- CABEÇALHO -->
      <div style="text-align: center; margin-bottom: 28px;">
        <h1 style="color: #0f766e; font-size: 28px; margin: 0; font-weight: 600; letter-spacing: -0.5px;">IZAQUE</h1>
        <p style="color: #78716c; font-size: 13px; margin-top: 4px; font-style: italic;">Espaço de Clareza, Acolhimento & Reconstrução de Vida</p>
      </div>

      <!-- CARD PRINCIPAL -->
      <div style="background-color: #ffffff; padding: 36px 32px; border-radius: 22px; border: 1px solid #f5f5f4; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <div style="color: #334155; font-size: 15px;">
          ${personalizedContent}
        </div>

        <!-- BOTÃO DE AÇÃO -->
        <div style="text-align: center; margin: 36px 0 20px 0;">
          <a href="${appUrl}" style="background-color: #0f766e; color: #ffffff; text-decoration: none; padding: 15px 36px; border-radius: 16px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(15, 118, 110, 0.28); letter-spacing: 0.2px;">
            ${callToActionText}
          </a>
        </div>

        <!-- ASSINATURA OBRIGATÓRIA DA EQUIPE LYNX EMS -->
        <div style="margin-top: 36px; padding-top: 24px; border-top: 1px solid #f1f5f9;">
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #0f766e;">Com respeito, admiração e carinho pela sua caminhada,</p>
          <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 700; color: #0f172a;">Equipe Lynx EMS</p>
          <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">Tecnologia com Alma & Mentoria IZAQUE</p>
          <p style="margin: 6px 0 0 0; font-size: 12px;">
            <a href="mailto:suporte@lynxems.com.br" style="color: #0f766e; text-decoration: none; font-weight: 500;">suporte@lynxems.com.br</a>
          </p>
        </div>
      </div>

      <!-- RODAPÉ -->
      <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #a8a29e;">
        Você está recebendo este comunicado porque faz parte do refúgio <strong>IZAQUE</strong>.<br>
        © ${new Date().getFullYear()} Lynx EMS. Todos os direitos reservados.
      </div>
    </div>
  `;
}

/**
 * Dispara o e-mail em massa para os usuários do app
 */
export async function sendBroadcastEmail({
  subject,
  htmlContent,
  callToActionText = 'Visitar Meu Refúgio Agora',
  targetAudience = 'all',
  testEmail = null,
}) {
  const transporter = getEmailTransporter();
  const fromAddress = `"Equipe Lynx EMS - IZAQUE" <${process.env.SMTP_USER || 'suporte@lynxems.com.br'}>`;
  const appUrl = (process.env.APP_URL || 'https://izaque.lynxems.com.br').replace(/\/$/, '');

  // 1. Modo de Teste
  if (targetAudience === 'test') {
    const recipient = testEmail || process.env.SMTP_USER || 'suporte@lynxems.com.br';
    const finalHtml = renderBroadcastEmailHtml({
      contentHtml: htmlContent,
      userName: 'Administrador',
      appUrl,
      callToActionText,
    });

    const info = await transporter.sendMail({
      from: fromAddress,
      to: recipient,
      subject: `[TESTE] ${subject}`,
      html: finalHtml,
    });

    return {
      success: true,
      mode: 'test',
      totalTarget: 1,
      totalSent: 1,
      totalFailed: 0,
      recipients: [recipient],
      messageId: info.messageId,
    };
  }

  // 2. Busca os usuários alvo no Supabase (contas do app + fichas de inscrição com e-mail)
  let query = supabaseAdmin
    .from('izaque_profiles')
    .select('id, email, full_name, plan_id, is_active')
    .not('email', 'is', null)
    .neq('is_active', false);

  if (targetAudience === 'subscribers') {
    query = query.not('plan_id', 'is', null).neq('plan_id', 'free');
  } else if (targetAudience === 'free') {
    query = query.or('plan_id.is.null,plan_id.eq.free');
  }

  const { data: users, error: userErr } = await query;
  if (userErr) throw userErr;

  let mergedUsers = [...(users || [])];

  if (targetAudience !== 'subscribers') {
    const { data: inscriptions } = await supabaseAdmin
      .from('izaque_inscriptions')
      .select('id, email, full_name, is_active')
      .not('email', 'is', null)
      .neq('is_active', false);

    const existingEmails = new Set(
      mergedUsers
        .filter((u) => u.email)
        .map((u) => u.email.trim().toLowerCase())
    );

    for (const insc of inscriptions || []) {
      if (!insc.email || !insc.email.includes('@')) continue;
      const lower = insc.email.trim().toLowerCase();
      if (!existingEmails.has(lower)) {
        existingEmails.add(lower);
        mergedUsers.push({
          id: insc.id,
          email: insc.email.trim(),
          full_name: insc.full_name,
          plan_id: 'inscricao',
          is_active: insc.is_active,
        });
      }
    }
  }

  const validUsers = mergedUsers.filter(u => u.email && u.email.includes('@'));
  if (validUsers.length === 0) {
    return {
      success: true,
      mode: 'broadcast',
      totalTarget: 0,
      totalSent: 0,
      totalFailed: 0,
      recipients: [],
    };
  }

  let totalSent = 0;
  let totalFailed = 0;
  const failedList = [];

  for (const user of validUsers) {
    try {
      const finalHtml = renderBroadcastEmailHtml({
        contentHtml: htmlContent,
        userName: user.full_name || '',
        appUrl,
        callToActionText,
      });

      await transporter.sendMail({
        from: fromAddress,
        to: user.email,
        subject,
        html: finalHtml,
      });

      totalSent++;
      console.log(`✉️ [Broadcast Sent] ${totalSent}/${validUsers.length} para ${user.email}`);

      // Pausa de 120ms para respeitar taxas de envio do SMTP da Hostinger
      await new Promise(r => setTimeout(r, 120));
    } catch (err) {
      totalFailed++;
      console.warn(`⚠️ [Broadcast Error] Falha ao enviar para ${user.email}:`, err.message);
      failedList.push({ email: user.email, error: err.message });
    }
  }

  return {
    success: true,
    mode: 'broadcast',
    totalTarget: validUsers.length,
    totalSent,
    totalFailed,
    failedList,
  };
}

/**
 * Envia e-mail de cobrança / lembrete de atividade do Projeto IZAQUE
 */
export async function sendTaskReminderEmail({
  recipientEmail,
  recipientName,
  taskTitle,
  taskDescription = '',
  dueDate,
  daysRemaining,
  milestoneTitle = 'Fase Geral',
  priority = 'medium',
  isDueToday = false,
}) {
  const transporter = getEmailTransporter();
  const fromAddress = `"Gestão de Projetos IZAQUE" <${process.env.SMTP_USER || 'suporte@lynxems.com.br'}>`;

  const priorityLabels = {
    critical: '🔴 Crítica',
    high: '🟠 Alta',
    medium: '🟡 Média',
    low: '🟢 Baixa',
  };

  const subject = isDueToday
    ? `🚨 [PRAZO HOJE] Entrega da Atividade: ${taskTitle}`
    : `⏰ [LEMBRETE] ${daysRemaining} dia(s) para o prazo: ${taskTitle}`;

  const bannerColor = isDueToday ? '#ef4444' : '#f59e0b';
  const bannerText = isDueToday
    ? 'Atenção: A data limite de entrega desta atividade é HOJE!'
    : `Atenção: Faltam apenas ${daysRemaining} dia(s) para a entrega desta atividade.`;

  const formattedDate = dueDate
    ? new Date(dueDate + 'T12:00:00Z').toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    : 'Não definida';

  const mailOptions = {
    from: fromAddress,
    to: recipientEmail,
    subject,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #faf9f6; padding: 32px 20px; border-radius: 24px; border: 1px solid #e7e5e4; color: #292524;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0f766e; font-size: 26px; margin: 0; font-weight: 700; letter-spacing: -0.5px;">IZAQUE</h1>
          <p style="color: #78716c; font-size: 13px; margin-top: 4px; font-weight: 500;">Governança & Cronograma de Entregas</p>
        </div>

        <div style="background-color: #ffffff; padding: 28px; border-radius: 20px; border: 1px solid #f0eeeb; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
          <div style="background-color: ${bannerColor}15; border-left: 4px solid ${bannerColor}; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 13px; font-weight: 600; color: ${bannerColor === '#ef4444' ? '#b91c1c' : '#b45309'};">
              ${bannerText}
            </p>
          </div>

          <h2 style="font-size: 18px; color: #1c1917; margin-top: 0; margin-bottom: 8px;">Olá, ${recipientName || 'Colega de Equipe'}!</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #57534e; margin-bottom: 20px;">
            Este é um aviso automático do sistema de acompanhamento do Projeto IZAQUE sobre uma atividade sob sua responsabilidade:
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin-bottom: 20px;">
            <div style="margin-bottom: 12px;">
              <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">Atividade</span>
              <h3 style="margin: 4px 0 0 0; font-size: 16px; color: #0f172a; font-weight: 600;">${taskTitle}</h3>
            </div>

            ${taskDescription ? `
            <div style="margin-bottom: 12px;">
              <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">Detalhes / Escopo</span>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #475569; line-height: 1.5; white-space: pre-wrap;">${taskDescription}</p>
            </div>
            ` : ''}

            <table style="width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Etapa / Marco:</strong></td>
                <td style="padding: 6px 0; color: #0f172a; text-align: right;">${milestoneTitle}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Prazo de Entrega:</strong></td>
                <td style="padding: 6px 0; color: ${isDueToday ? '#dc2626' : '#0f172a'}; font-weight: 600; text-align: right;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Prioridade:</strong></td>
                <td style="padding: 6px 0; text-align: right;">${priorityLabels[priority] || priority}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; line-height: 1.5; color: #78716c; margin-bottom: 0;">
            Por favor, garanta a execução e avise a gestão do projeto assim que a entrega for concluída ou caso haja qualquer impedimento.
          </p>
        </div>

        <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #a8a29e;">
          © ${new Date().getFullYear()} Gestão do Projeto IZAQUE. Sistema Automatizado de Cronograma.
        </div>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

/**
 * Envia e-mail notificando a conclusão de uma atividade
 */
export async function sendTaskCompletedEmail({
  recipientEmail,
  taskTitle,
  taskDescription = '',
  memberName,
  completedDate,
  milestoneTitle = 'Fase Geral',
}) {
  const transporter = getEmailTransporter();
  const fromAddress = `"Gestão de Projetos IZAQUE" <${process.env.SMTP_USER || 'suporte@lynxems.com.br'}>`;

  const formattedDate = completedDate
    ? new Date(completedDate).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    : new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  const mailOptions = {
    from: fromAddress,
    to: recipientEmail,
    subject: `✅ [ENTREGA CONCLUÍDA] Atividade Finalizada: ${taskTitle}`,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #faf9f6; padding: 32px 20px; border-radius: 24px; border: 1px solid #e7e5e4; color: #292524;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0f766e; font-size: 26px; margin: 0; font-weight: 700; letter-spacing: -0.5px;">IZAQUE</h1>
          <p style="color: #78716c; font-size: 13px; margin-top: 4px; font-weight: 500;">Governança & Cronograma de Entregas</p>
        </div>

        <div style="background-color: #ffffff; padding: 28px; border-radius: 20px; border: 1px solid #f0eeeb; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
          <div style="background-color: #10b98115; border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 13px; font-weight: 600; color: #047857;">
              🎉 Mais uma etapa entregue com sucesso no projeto!
            </p>
          </div>

          <h2 style="font-size: 18px; color: #1c1917; margin-top: 0; margin-bottom: 12px;">Atividade Finalizada</h2>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin-bottom: 20px;">
            <div style="margin-bottom: 12px;">
              <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">Atividade</span>
              <h3 style="margin: 4px 0 0 0; font-size: 16px; color: #0f172a; font-weight: 600;">${taskTitle}</h3>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Executado por:</strong></td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${memberName || 'Equipe'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Etapa / Marco:</strong></td>
                <td style="padding: 6px 0; color: #0f172a; text-align: right;">${milestoneTitle}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Data de Conclusão:</strong></td>
                <td style="padding: 6px 0; color: #059669; font-weight: 600; text-align: right;">${formattedDate}</td>
              </tr>
            </table>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #a8a29e;">
          © ${new Date().getFullYear()} Gestão do Projeto IZAQUE. Sistema Automatizado de Cronograma.
        </div>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}



/**
 * Envia o e-mail de boas-vindas / campanha contendo o arquivo PDF em anexo
 * e link seguro alternativo para download + acesso ao app.
 */
export async function sendCampaignPdfEmail({
  toEmail,
  recipientName,
  campaignTitle,
  emailSubject,
  emailBody,
  pdfBuffer,
  pdfFileName,
  pdfPublicUrl,
  appUrl,
}) {
  const transporter = getEmailTransporter();
  const fromAddress = `"IZAQUE - Clareza & Mentoria" <${process.env.SMTP_USER || 'suporte@lynxems.com.br'}>`;

  const firstName = recipientName ? recipientName.trim().split(/\s+/)[0] : 'Viajante';
  const safeAppUrl = appUrl || process.env.FRONTEND_URL || 'https://izaque.lynxems.com.br';

  const interpolate = (str = '') =>
    str
      .replace(/\{\{\s*nome\s*\}\}/gi, firstName)
      .replace(/\{\{\s*nome_completo\s*\}\}/gi, recipientName || firstName)
      .replace(/\{\{\s*titulo\s*\}\}/gi, campaignTitle || 'Material Exclusivo');

  const resolvedSubject = interpolate(
    emailSubject || `📄 Seu material chegou: ${campaignTitle || 'Guia Exclusivo IZAQUE'}`
  );

  const defaultBody = `Olá, ${firstName}!\n\nQue alegria receber você no ecossistema IZAQUE.\n\nConforme prometido, anexamos neste e-mail o seu material "${campaignTitle || 'Guia Exclusivo'}" em formato PDF para você ler e guardar com tranquilidade.\n\nAproveite também para acessar sua área de mentoria e iniciar suas conversas de clareza quando desejar.`;

  const rawBody = emailBody && emailBody.trim() ? interpolate(emailBody.trim()) : defaultBody;
  const formattedBodyHtml = rawBody
    .split(/\n{2,}/)
    .map(
      (paragraph) =>
        `<p style="font-size: 14px; line-height: 1.7; color: #44403c; margin: 0 0 14px 0;">${paragraph
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br/>')}</p>`
    )
    .join('');

  const attachments = [];
  if (pdfBuffer) {
    attachments.push({
      filename: pdfFileName || 'material-izaque.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf',
    });
  }

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject: resolvedSubject,
    attachments,
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #faf9f6; padding: 32px 20px; border-radius: 24px; border: 1px solid #e7e5e4; color: #292524;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0f766e; font-size: 26px; margin: 0; font-weight: 700; letter-spacing: -0.5px;">IZAQUE</h1>
          <p style="color: #78716c; font-size: 13px; margin-top: 4px;">Espaço de Clareza, Escuta &amp; Transformação</p>
        </div>

        <div style="background-color: #ffffff; padding: 30px; border-radius: 20px; border: 1px solid #f0eeeb; box-shadow: 0 4px 14px rgba(0,0,0,0.03);">
          <div style="margin-bottom: 20px; padding: 12px 16px; background-color: #f0fdfa; border-left: 4px solid #0f766e; border-radius: 10px;">
            <p style="margin: 0; font-size: 13px; color: #115e59; font-weight: 600;">
              📎 Anexo incluído: ${pdfFileName || 'Material em PDF'}
            </p>
          </div>

          ${formattedBodyHtml}

          <div style="text-align: center; margin: 28px 0 16px 0;">
            ${
              pdfPublicUrl
                ? `<a href="${pdfPublicUrl}" target="_blank" rel="noopener noreferrer" style="background-color: #0f766e; color: #ffffff; text-decoration: none; padding: 13px 26px; border-radius: 14px; font-weight: 600; font-size: 14px; display: inline-block; margin: 6px; box-shadow: 0 4px 10px rgba(15, 118, 110, 0.22);">
                    Baixar PDF Diretamente
                  </a>`
                : ''
            }
            <a href="${safeAppUrl}" target="_blank" rel="noopener noreferrer" style="background-color: #f5f5f4; color: #1c1917; border: 1px solid #d6d3d1; text-decoration: none; padding: 13px 24px; border-radius: 14px; font-weight: 600; font-size: 14px; display: inline-block; margin: 6px;">
              Entrar no App IZAQUE
            </a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 22px; font-size: 12px; color: #78716c;">
          Dúvidas ou suporte? Fale conosco em <a href="mailto:suporte@lynxems.com.br" style="color: #0f766e; font-weight: 600;">suporte@lynxems.com.br</a>
        </div>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`✉️ [Campaign PDF Sent] PDF "${pdfFileName}" enviado para ${toEmail}. Message ID: ${info.messageId}`);
  return info;
}
