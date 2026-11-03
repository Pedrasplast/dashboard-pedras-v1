/* =========================================================
   DEFINIR SENHA — REGRAS
   ---------------------------------------------------------
   Funções puras e constantes usadas pela tela; movidas do
   componente sem alteração.
========================================================= */

/* =========================================================
   CONFIGURAÇÕES
========================================================= */

export const TAMANHO_MINIMO_SENHA = 6;

/* =========================================================
   TRADUZIR ERROS DE AUTENTICAÇÃO

   Evita apresentar mensagens técnicas do Supabase
   diretamente ao usuário.
========================================================= */

export function traduzirErroAutenticacao(error) {
  const mensagem = String(error?.message || "").toLowerCase();

  if (
    mensagem.includes("auth session missing") ||
    mensagem.includes("session missing") ||
    mensagem.includes("session not found") ||
    mensagem.includes("invalid session")
  ) {
    return (
      "Sua sessão de primeiro acesso não está disponível. " +
      "Solicite um novo convite ao administrador."
    );
  }

  if (
    mensagem.includes("expired") ||
    mensagem.includes("invalid token") ||
    mensagem.includes("token has")
  ) {
    return (
      "Este convite expirou ou já foi utilizado. " + "Solicite um novo convite ao administrador."
    );
  }

  if (
    mensagem.includes("password should") ||
    mensagem.includes("password must") ||
    mensagem.includes("weak password")
  ) {
    return (
      "A senha não atende aos requisitos de segurança. " + "Escolha outra senha e tente novamente."
    );
  }

  return error?.message || "Não foi possível concluir o primeiro acesso.";
}

/* =========================================================
   LER DADOS DO CONVITE

   Formatos aceitos:

   1. Link personalizado:
      ?t=TOKEN

   2. Token hash:
      ?token_hash=TOKEN&type=invite

   3. Sessão recebida pelo fragmento:
      #access_token=...&refresh_token=...&type=invite
========================================================= */

export function obterDadosConvite() {
  const parametros = new URLSearchParams(window.location.search);

  const hash = new URLSearchParams(
    window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "",
  );

  const tipo = parametros.get("type") || hash.get("type");

  const token = parametros.get("t") || (tipo === "invite" ? parametros.get("token_hash") : null);

  const accessToken = hash.get("access_token");

  const refreshToken = hash.get("refresh_token");

  const ehRecuperacao =
    parametros.has("modo") ||
    parametros.get("type") === "recovery" ||
    hash.get("type") === "recovery";

  return {
    token,
    tipo,
    accessToken,
    refreshToken,
    ehRecuperacao,

    possuiCredenciais: Boolean(
      token || accessToken || refreshToken || parametros.has("token_hash"),
    ),
  };
}

/* =========================================================
   REMOVER CREDENCIAIS DA URL

   Evita manter tokens visíveis no endereço.

   Preserva o estado de navegação do navegador.
========================================================= */

export function limparCredenciaisUrl() {
  window.history.replaceState(window.history.state, "", window.location.pathname);
}
