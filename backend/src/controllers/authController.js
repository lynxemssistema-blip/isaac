import { supabaseAdmin } from '../config/supabase.js';
import { sendPasswordResetEmail, sendTestEmail } from '../services/emailService.js';
import { extractBearerToken } from '../middlewares/authMiddleware.js';

/**
 * Controller de Recuperação de Senha Oficial
 * Rota: POST /api/auth/forgot-password
 */
export async function handleForgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Por favor, informe um endereço de e-mail válido.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const appUrl = (process.env.APP_URL || 'https://isaac.lynxems.com.br').replace(/\/$/, '');

    // 1. Busca os dados do perfil do usuário para capturar o nome
    const { data: profile } = await supabaseAdmin
      .from('izaque_profiles')
      .select('full_name')
      .eq('email', cleanEmail)
      .maybeSingle();

    // 2. Gera o link criptografado de recuperação via Supabase Admin (sem disparar e-mail do Supabase)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: cleanEmail,
      options: {
        redirectTo: `${appUrl}/?mode=reset-password`,
      },
    });

    if (linkError) {
      console.warn(`⚠️ [Forgot Password] Aviso ao gerar link para ${cleanEmail}:`, linkError.message);
      // Para segurança (prevenção de enumeração de e-mails), respondemos com sucesso mesmo se não existir
      return res.status(200).json({
        message: 'Se este e-mail estiver cadastrado, você receberá o link de recuperação em instantes.',
      });
    }

    const hashedToken = linkData?.properties?.hashed_token;
    if (!hashedToken) {
      throw new Error('Não foi possível gerar o token de recuperação.');
    }

    // Link direto apontando para o app ISAAC
    // Evita o redirecionamento padrão do Supabase que apontava para lynxems.com.br
    const resetLink = `${appUrl}/?token_hash=${hashedToken}&type=recovery`;

    // 3. Dispara o e-mail oficial através do SMTP Hostinger (suporte@lynxems.com.br)
    await sendPasswordResetEmail({
      toEmail: cleanEmail,
      name: profile?.full_name || '',
      resetLink,
    });

    console.log(`🔑 [Forgot Password] Link de recuperação enviado para ${cleanEmail} via suporte@lynxems.com.br`);

    res.status(200).json({
      message: 'Link de recuperação enviado com sucesso para o seu e-mail!',
      sentTo: cleanEmail,
    });
  } catch (error) {
    console.error('❌ Erro no fluxo de forgot-password:', error);
    res.status(500).json({
      error: 'Erro ao processar a recuperação de senha. Tente novamente em instantes.',
      details: error.message,
    });
  }
}

/**
 * Rota de Teste do Envio de E-mail
 * Rota: POST /api/auth/test-email
 */
export async function handleTestEmail(req, res) {
  try {
    const { email } = req.body;
    const targetEmail = email || 'edsonmanoel2012@gmail.com';

    const info = await sendTestEmail(targetEmail);
    res.status(200).json({
      message: `E-mail de teste enviado com sucesso para ${targetEmail}`,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail de teste:', error);
    res.status(500).json({
      error: 'Falha ao enviar e-mail de teste.',
      details: error.message,
    });
  }
}

/**
 * Controller de Redefinição Segura de Senha via Token (Sem dependência de sessão no cliente)
 * Rota: POST /api/auth/reset-password
 */
export async function handleResetPasswordWithToken(req, res) {
  try {
    const { token_hash, password } = req.body;

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }

    // 1. Verificação criptográfica via token_hash de uso único (OTP recovery)
    if (token_hash && typeof token_hash === 'string') {
      const { data: otpData, error: otpError } = await supabaseAdmin.auth.verifyOtp({
        token_hash,
        type: 'recovery',
      });

      if (otpError || !otpData?.user) {
        console.warn('⚠️ [Reset Password] Falha ao verificar OTP:', otpError?.message);
        return res.status(400).json({
          error: 'Link de recuperação expirado ou inválido. Por favor, solicite um novo link de redefinição.',
        });
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(otpData.user.id, {
        password,
      });

      if (updateError) {
        throw updateError;
      }

      console.log(`🔐 [Reset Password] Senha redefinida com sucesso via token_hash para ${otpData.user.email} (ID: ${otpData.user.id})`);

      return res.status(200).json({
        success: true,
        message: 'Senha redefinida com sucesso! Você já pode entrar com sua nova senha.',
      });
    }

    // 2. Fallback autenticado: caso o token_hash já tenha sido consumido no client-side (verifyOtp)
    // e o cliente possua o JWT legítimo da sessão de recuperação no header Authorization
    const bearerToken = extractBearerToken(req);
    if (bearerToken) {
      const { data: authData, error: authErr } = await supabaseAdmin.auth.getUser(bearerToken);
      if (!authErr && authData?.user?.id) {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authData.user.id, {
          password,
        });
        if (updateError) throw updateError;

        console.log(`🔐 [Reset Password] Senha redefinida via JWT autenticado para ${authData.user.email} (ID: ${authData.user.id})`);
        return res.status(200).json({
          success: true,
          message: 'Senha redefinida com sucesso!',
        });
      }
    }

    return res.status(401).json({
      error: 'Token de recuperação ausente ou expirado. Por favor, solicite um novo link por e-mail.',
    });
  } catch (error) {
    console.error('❌ Erro ao redefinir senha com token:', error);
    res.status(500).json({
      error: 'Erro ao salvar nova senha. Solicite um novo link e tente novamente.',
    });
  }
}
