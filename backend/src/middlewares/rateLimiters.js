import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

/**
 * Rate Limiter Geral da API:
 * - Quando autenticado (Authorization: Bearer <jwt>), isola a cota individualmente por usuário (evita falso-positivo em Wi-Fi de eventos ou CGNAT 4G/5G com 1.000+ pessoas no mesmo IP).
 * - Para rotas públicas sem login, suporta até 2.500 req/min por IP de rede compartilhada.
 */
export const apiGeneralLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: (req) => {
    const auth = req.headers?.authorization || req.headers?.Authorization;
    return auth && String(auth).startsWith('Bearer ') ? 240 : 2500;
  },
  keyGenerator: (req) => {
    const auth = req.headers?.authorization || req.headers?.Authorization;
    if (auth && typeof auth === 'string' && auth.startsWith('Bearer ') && auth.length > 20) {
      const tokenHash = crypto.createHash('sha1').update(auth.slice(7)).digest('hex').slice(0, 16);
      return `jwt:${tokenHash}`;
    }
    return `ip:${req.ip || 'anon'}`;
  },
  validate: { xForwardedForHeader: false, default: false },
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

