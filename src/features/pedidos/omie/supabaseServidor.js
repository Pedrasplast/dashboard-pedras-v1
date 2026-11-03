/* =========================================================
   SUPABASE NO SERVIDOR
   ---------------------------------------------------------
   SOMENTE SERVIDOR. Usado pelas funções de omie.functions.js.
   Usa apenas a chave pública + o token do usuário (respeita
   RLS); o site não precisa da chave secreta do Supabase.
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

function obterChavePublicaSupabase() {
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

/** Cliente com a sessão do usuário: respeita RLS. */
export function criarClienteSupabaseUsuario(accessToken) {
  return createClient(obterSupabaseUrl(), obterChavePublicaSupabase(), {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },

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

/**
 * Validador da leitura de pedidos: além do token, aceita
 * `comNumeracao: false` para pular o cálculo da numeração visual (/1, /2...),
 * que lê todo o histórico de pedidos_omie. Padrão: com numeração.
 */
export function validarEntradaPedidos(dados) {
  return {
    ...validarEntradaSessao(dados),

    comNumeracao: dados.comNumeracao !== false,
  };
}
