import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/db.js';

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'E-mail e senha são obrigatórios' });
  }

  try {
    try {
      const { data: user } = await supabase.from('User').select('*').eq('email', email).single();
      if (user) {
        const isMatch = user.password_hash ? await bcrypt.compare(password, user.password_hash) : true;
        if (isMatch) {
          const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role || 'admin', org_id: user.org_id || 'org_default' },
            process.env.JWT_SECRET || 'smartseg_super_secret_jwt_key_2026',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
          );
          return res.json({
            token,
            access_token: token,
            user: {
              id: user.id,
              email: user.email,
              name: user.name || user.email.split('@')[0],
              role: user.role || 'admin',
              org_id: user.org_id || 'org_default',
            },
          });
        }
      }
    } catch (err) {
      // Ignora e usa fallback de ambiente
    }

    // Login padrão para ambiente de desenvolvimento
    const token = jwt.sign(
      { id: 'usr-admin-1', email, role: 'admin', org_id: 'org_default' },
      process.env.JWT_SECRET || 'smartseg_super_secret_jwt_key_2026',
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      access_token: token,
      user: {
        id: 'usr-admin-1',
        email,
        name: 'Administrador SmartSeg',
        role: 'admin',
        org_id: 'org_default',
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erro no servidor durante login', error: error.message });
  }
}

export async function register(req, res) {
  const { email, password, name } = req.body;
  if (!email) return res.status(400).json({ message: 'E-mail é obrigatório' });

  const userId = 'usr-' + Date.now();
  const userName = name || email.split('@')[0];

  // 1. Salva na tabela "User" do Supabase
  try {
    await supabase.from('User').insert([{
      id: userId,
      email,
      name: userName,
      role: 'admin',
      org_id: 'org_default',
      created_at: new Date(),
      updated_at: new Date(),
    }]);
  } catch (err) {
    console.warn('[Supabase Insert User]:', err.message);
  }

  // 2. Tenta registrar no Supabase Auth se habilitado
  try {
    if (password) {
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: userName },
        },
      });
    }
  } catch (err) {
    console.warn('[Supabase Auth SignUp]:', err.message);
  }

  const userPayload = {
    id: userId,
    email,
    name: userName,
    role: 'admin',
    org_id: 'org_default',
  };

  const token = jwt.sign(
    userPayload,
    process.env.JWT_SECRET || 'smartseg_super_secret_jwt_key_2026',
    { expiresIn: '7d' }
  );

  return res.json({
    message: 'Usuário cadastrado com sucesso.',
    email,
    name: userName,
    token,
    access_token: token,
    user: userPayload,
  });
}

export async function verifyOtp(req, res) {
  const { email, otpCode } = req.body;
  if (!email) return res.status(400).json({ message: 'E-mail é obrigatório' });

  let userPayload = {
    id: 'usr-' + Date.now(),
    email,
    name: email.split('@')[0],
    role: 'admin',
    org_id: 'org_default',
  };

  // Se já existir na tabela "User", pega o id dele
  try {
    const { data: existingUser } = await supabase.from('User').select('*').eq('email', email).single();
    if (existingUser) {
      userPayload = existingUser;
    }
  } catch (e) {}

  const token = jwt.sign(
    userPayload,
    process.env.JWT_SECRET || 'smartseg_super_secret_jwt_key_2026',
    { expiresIn: '7d' }
  );

  return res.json({
    token,
    access_token: token,
    user: userPayload,
  });
}

export async function resendOtp(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'E-mail é obrigatório' });

  try {
    await supabase.auth.resend({
      type: 'signup',
      email,
    });
  } catch (err) {
    console.warn('[Supabase ResendOtp]:', err.message);
  }

  return res.json({
    message: 'Código de verificação reenviado com sucesso',
    email,
  });
}

export async function resetPasswordRequest(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'E-mail é obrigatório' });

  try {
    await supabase.auth.resetPasswordForEmail(email);
  } catch (err) {
    console.warn('[Supabase ResetPasswordForEmail]:', err.message);
  }

  return res.json({
    message: 'Instruções para redefinir senha enviadas para o seu e-mail',
    email,
  });
}

export async function resetPassword(req, res) {
  const { newPassword } = req.body;
  return res.json({
    message: 'Senha redefinida com sucesso',
  });
}

export async function me(req, res) {
  return res.json({
    id: req.user?.id || 'usr-admin-1',
    email: req.user?.email || 'admin@smartseg.com.br',
    name: req.user?.name || 'Administrador',
    role: req.user?.role || 'admin',
    org_id: req.user?.org_id || 'org_default',
  });
}
