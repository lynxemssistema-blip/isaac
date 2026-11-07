import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase.js';
import { getCached, setCached, invalidateCachePrefix } from '../utils/memoryCache.js';

const AUTH_CACHE_TTL_MS = 45_000; // 45s para evitar chamadas repetidas ao Supabase Auth a cada request

/**
 * Extrai o token JWT do header Authorization: Bearer <token>
 */
export function extractBearerToken(req) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  const parts = authHeader.trim().split(/\s+/);
  if (parts.length === 2 && /^Bearer$/i.test(parts[0]) && parts[1]) {
    return parts[1];
  }
  return null;
}

/**
 * Invalida o cache de autenticação (ex: ao alterar role ou bloquear usuário no Admin)
 */
export function invalidateAuthCache() {
  invalidateCachePrefix('auth:jwt:');
}

/**
 * Valida criptograficamente o JWT no Supabase e carrega o role atualizado em izaque_profiles
 */
export async function verifySupabaseJwt(token) {
  if (!token) return null;

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const cacheKey = `auth:jwt:${tokenHash}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { data: authData, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !authData?.user) {
    return null;
  }

  const authUser = authData.user;
  const { data: profile } = await supabaseAdmin
    .from('izaque_profiles')
    .select('id, email, role, is_active')
    .eq('id', authUser.id)
    .maybeSingle();

  const superAdminEmail = (process.env.SUPERADMIN_EMAIL || 'edsonmanoel2012@gmail.com').trim().toLowerCase();
  const isFallbackMaster = (authUser.email || '').trim().toLowerCase() === superAdminEmail;

  const resolvedUser = {
    id: authUser.id,
    email: authUser.email || profile?.email || '',
    role: profile?.role || (isFallbackMaster ? 'master' : 'user'),
    isActive: profile ? profile.is_active !== false : true,
  };

  setCached(cacheKey, resolvedUser, AUTH_CACHE_TTL_MS);
  return resolvedUser;
}

/**
 * Exige usuário autenticado com sessão JWT válida e conta ativa.
 */
export async function requireAuth(req, res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Não autenticado. Faça login para continuar.' });
    }

    const user = await verifySupabaseJwt(token);
    if (!user) {
      return res.status(401).json({ error: 'Sessão expirada ou inválida. Faça login novamente.' });
    }

    if (!user.isActive && user.role !== 'master') {
      return res.status(403).json({ error: 'Sua conta encontra-se temporariamente desativada.' });
    }

    req.user = user;
    return next();
  } catch (err) {
    console.error('❌ [Auth Middleware] Erro na verificação JWT:', err.message);
    return res.status(401).json({ error: 'Falha ao validar credenciais de acesso.' });
  }
}

/**
 * Exige perfil administrativo ('admin' ou 'master').
 */
export async function requireAdmin(req, res, next) {
  return requireAuth(req, res, () => {
    if (req.user?.role !== 'master' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso restrito aos administradores do sistema.' });
    }
    return next();
  });
}

/**
 * Previne BOLA / IDOR: garante que o usuário autenticado acesse apenas seus próprios recursos,
 * exceto quando possuir perfil 'admin' ou 'master'.
 */
export function requireSelfOrAdmin(fieldName = 'userId') {
  return (req, res, next) => {
    return requireAuth(req, res, () => {
      const isAdmin = req.user?.role === 'master' || req.user?.role === 'admin';
      const targetId =
        req.params?.[fieldName] ||
        req.body?.[fieldName] ||
        req.body?.user_id ||
        req.query?.[fieldName] ||
        req.query?.user_id ||
        req.query?.userId;

      if (!isAdmin && targetId && String(targetId) !== String(req.user.id)) {
        return res.status(403).json({
          error: 'Acesso negado: você não tem permissão para acessar dados de outro usuário.',
        });
      }

      // Garante que controllers que leem userId recebam o ID autenticado caso omitido
      if (!targetId && req.body && typeof req.body === 'object') {
        req.body[fieldName] = req.user.id;
      }

      return next();
    });
  };
}

