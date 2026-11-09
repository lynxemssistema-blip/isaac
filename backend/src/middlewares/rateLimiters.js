import rateLimit from 'express-rate-limit';

/**
 * Rate Limiter Geral da API (proteção contra floods e scraping automatizado)
 */
export const apiGeneralLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições simultâneas. Aguarde alguns segundos e tente novamente.' },
});

/**
 * Rate Limiter para Endpoints de IA / Voz (protege cotas financeiras do Gemini e TTS por usuário autenticado + IP)
 */
export const aiResourceLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30,
  keyGenerator: (req) => (req.user?.id ? `user:${req.user.id}` : req.ip || 'anon'),
   validate: { xForwardedForHeader: false, default: false },
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de interações por minuto atingido. Respire fundo e tente novamente em instantes.' },
});

/**
 * Rate Limiter Estrito para Autenticação, Recuperação de Senha e Disparo de E-mails Públicos
 * (protege reputação do domínio SMTP suporte@lynxems.com.br e previne força bruta)
 */
export const authAndMailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas em curto intervalo. Por segurança, aguarde 15 minutos.' },
});

