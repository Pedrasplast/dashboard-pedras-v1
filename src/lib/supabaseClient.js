import { createClient } from "@supabase/supabase-js";

/* =========================================================
   CONFIGURAÇÕES DO SUPABASE
========================================================= */

const urlSupabase =
  import.meta.env.VITE_SUPABASE_URL;

const chaveAnonSupabase =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/* =========================================================
   VALIDAÇÃO DAS VARIÁVEIS
========================================================= */

if (!urlSupabase) {
  throw new Error(
    "A variável VITE_SUPABASE_URL não foi configurada."
  );
}

if (!chaveAnonSupabase) {
  throw new Error(
    "A chave pública do Supabase não foi configurada."
  );
}

/* =========================================================
   CLIENTE PRINCIPAL

   Utilizado normalmente pelo dashboard.

   A sessão do administrador e dos demais usuários
   permanece armazenada pelo próprio Supabase.

   Não alterar a chave de armazenamento desse cliente.
========================================================= */

export const supabase = createClient(
  urlSupabase,
  chaveAnonSupabase,
  {
    auth: {
      persistSession: true,

      autoRefreshToken: true,

      detectSessionInUrl: false,
    },
  }
);

/* =========================================================
   CLIENTE ISOLADO DE PRIMEIRO ACESSO

   Problema corrigido:

   Antes:
   persistSession: false

   A sessão ficava apenas na memória e poderia
   desaparecer quando o cliente fosse recriado.

   Agora:

   - Usa sessionStorage.
   - Possui storageKey independente.
   - Não substitui a sessão do administrador.
   - Mantém a sessão durante um recarregamento.
   - Atualiza automaticamente o token, se necessário.
   - Reutiliza uma única instância do cliente.

   A sessão é encerrada após a definição da senha.
========================================================= */

export const STORAGE_KEY_PRIMEIRO_ACESSO =
  "pedrasplast-primeiro-acesso";

let clientePrimeiroAcesso = null;

/* =========================================================
   OBTENÇÃO DO ARMAZENAMENTO TEMPORÁRIO
========================================================= */

function obterStoragePrimeiroAcesso() {
  if (typeof window === "undefined") {
    throw new Error(
      "O primeiro acesso deve ser realizado pelo navegador."
    );
  }

  try {
    const armazenamento = window.sessionStorage;

    if (!armazenamento) {
      throw new Error(
        "Armazenamento indisponível."
      );
    }

    return armazenamento;
  } catch (error) {
    console.error(
      "Erro ao acessar armazenamento temporário:",
      error
    );

    throw new Error(
      "Não foi possível iniciar uma sessão segura. " +
        "Verifique se o navegador permite armazenamento de sessão."
    );
  }
}

/* =========================================================
   CRIAR / REUTILIZAR CLIENTE DE PRIMEIRO ACESSO
========================================================= */

export function criarClientePrimeiroAcesso() {
  if (clientePrimeiroAcesso) {
    return clientePrimeiroAcesso;
  }

  const armazenamento = obterStoragePrimeiroAcesso();

  clientePrimeiroAcesso = createClient(
    urlSupabase,
    chaveAnonSupabase,
    {
      auth: {
        /*
         * Persiste exclusivamente durante a
         * sessão da aba do navegador.
         */

        persistSession: true,

        /*
         * Permite renovação da sessão caso o usuário
         * demore para concluir o primeiro acesso.
         */

        autoRefreshToken: true,

        /*
         * O convite é validado manualmente
         * em DefinirSenhaPage.jsx.
         */

        detectSessionInUrl: false,

        /*
         * Armazenamento separado do cliente principal.
         */

        storage: armazenamento,

        storageKey: STORAGE_KEY_PRIMEIRO_ACESSO,
      },
    }
  );

  return clientePrimeiroAcesso;
}