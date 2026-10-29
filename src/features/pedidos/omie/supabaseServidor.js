/* =========================================================
   SUPABASE NO SERVIDOR
   ---------------------------------------------------------
   SOMENTE SERVIDOR. Usado pelas funções de omie.functions.js;
   a chave secreta nunca pode chegar ao navegador.
========================================================= */

import { createClient } from "@supabase/supabase-js";

const OPCOES_AUTH_SERVIDOR = {
  persistSession: false,

  autoRefreshToken: false,

  detectSessionInUrl: false,
};

function obterSupabaseUrl() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;

  if (!url) {
    throw new Error("URL do Supabase não configurada.");
  }

  return url;
}

function obterSupabasePublicKey() {
  const chave =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!chave) {
    throw new Error("Chave pública do Supabase não configurada.");
  }

  return chave;
}

function obterSupabaseSecretKey() {
  const chave = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!chave) {
    throw new Error("SUPABASE_SECRET_KEY não configurada no servidor.");
  }

  return chave;
}

/** Cliente com a sessão do usuário: respeita RLS. */
export function criarClienteSupabaseUsuario(accessToken) {
  return createClient(obterSupabaseUrl(), obterSupabasePublicKey(), {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },

    auth: { ...OPCOES_AUTH_SERVIDOR },
  });
}

/** Cliente administrativo (chave secreta): ignora RLS. */
export function criarClienteSupabaseAdmin() {
  return createClient(obterSupabaseUrl(), obterSupabaseSecretKey(), {
    auth: { ...OPCOES_AUTH_SERVIDOR },
  });
}

export async function validarSessao(accessToken) {
  const supabase = criarClienteSupabaseUsuario(accessToken);

  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data?.user) {
    throw new Error("Sessão inválida ou expirada.");
  }

  return data.user;
}

/** Validador das funções de servidor: exige um accessToken preenchido. */
export function validarEntradaSessao(dados) {
  if (!dados || typeof dados.accessToken !== "string" || !dados.accessToken.trim()) {
    throw new Error("Sessão não informada.");
  }

  return {
    accessToken: dados.accessToken,
  };
}
