import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  FiAlertTriangle,
  FiCheckCircle,
  FiLock,
} from "react-icons/fi";

import {
  criarClientePrimeiroAcesso,
  STORAGE_KEY_PRIMEIRO_ACESSO,
} from "@/lib/supabaseClient";

import { useNavigate } from "@/lib/navegacao";

import "./DefinirSenhaPage.css";

/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const TAMANHO_MINIMO_SENHA = 6;

/* =========================================================
   TRADUZIR ERROS DE AUTENTICAÇÃO

   Evita apresentar mensagens técnicas do Supabase
   diretamente ao usuário.
========================================================= */

function traduzirErroAutenticacao(error) {
  const mensagem = String(
    error?.message || ""
  ).toLowerCase();

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
      "Este convite expirou ou já foi utilizado. " +
      "Solicite um novo convite ao administrador."
    );
  }

  if (
    mensagem.includes("password should") ||
    mensagem.includes("password must") ||
    mensagem.includes("weak password")
  ) {
    return (
      "A senha não atende aos requisitos de segurança. " +
      "Escolha outra senha e tente novamente."
    );
  }

  return (
    error?.message ||
    "Não foi possível concluir o primeiro acesso."
  );
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

function obterDadosConvite() {
  const parametros = new URLSearchParams(
    window.location.search
  );

  const hash = new URLSearchParams(
    window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : ""
  );

  const tipo =
    parametros.get("type") ||
    hash.get("type");

  const token =
    parametros.get("t") ||
    (
      tipo === "invite"
        ? parametros.get("token_hash")
        : null
    );

  const accessToken =
    hash.get("access_token");

  const refreshToken =
    hash.get("refresh_token");

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
      token ||
      accessToken ||
      refreshToken ||
      parametros.has("token_hash")
    ),
  };
}

/* =========================================================
   REMOVER CREDENCIAIS DA URL

   Evita manter tokens visíveis no endereço.

   Preserva o estado de navegação do navegador.
========================================================= */

function limparCredenciaisUrl() {
  window.history.replaceState(
    window.history.state,
    "",
    window.location.pathname
  );
}

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

export default function DefinirSenhaPage() {
  const navigate = useNavigate();

  /* =====================================================
     REFERÊNCIAS
  ===================================================== */

  const timerRef = useRef(null);

  const clienteRef = useRef(null);

  const validacaoRef = useRef(null);

  const usuarioConviteRef = useRef(null);

  /* =====================================================
     ESTADOS DO FORMULÁRIO
  ===================================================== */

  const [senha, setSenha] = useState("");

  const [
    confirmarSenha,
    setConfirmarSenha,
  ] = useState("");

  const [
    carregandoSessao,
    setCarregandoSessao,
  ] = useState(true);

  const [
    sessaoValida,
    setSessaoValida,
  ] = useState(false);

  const [salvando, setSalvando] =
    useState(false);

  const [sucesso, setSucesso] =
    useState(false);

  const [
    mensagemErro,
    setMensagemErro,
  ] = useState("");

  /* =====================================================
     VALIDAR CONVITE E SESSÃO

     Esta função:

     1. Cria o cliente isolado.
     2. Verifica o token do convite.
     3. Confirma a sessão estabelecida.
     4. Valida a identidade do usuário.
     5. Libera o formulário.

     Também permite continuar após recarregar a página,
     desde que exista uma sessão isolada válida.
  ===================================================== */

  async function validarPrimeiroAcesso() {
    const cliente =
      criarClientePrimeiroAcesso();

    clienteRef.current = cliente;

    const convite = obterDadosConvite();

    /* =================================================
       BLOQUEAR LINKS DE RECUPERAÇÃO DE SENHA
    ================================================= */

    if (convite.ehRecuperacao) {
      if (convite.possuiCredenciais) {
        limparCredenciaisUrl();
      }

      throw new Error(
        "Este endereço aceita somente convites de primeiro acesso."
      );
    }

    let sessaoDoConvite = null;

    /* =================================================
       CENÁRIO 1: TOKEN DO CONVITE
    ================================================= */

    if (convite.token) {
      /*
       * Remove o token do endereço antes da
       * requisição de validação.
       */

      limparCredenciaisUrl();

      const {
        data,
        error,
      } = await cliente.auth.verifyOtp({
        token_hash: convite.token,

        type: "invite",
      });

      if (error) {
        throw error;
      }

      sessaoDoConvite =
        data?.session ?? null;

      if (
        !sessaoDoConvite?.access_token ||
        !sessaoDoConvite?.refresh_token ||
        !sessaoDoConvite?.user?.id
      ) {
        throw new Error(
          "O convite não retornou uma sessão válida. " +
          "Solicite um novo convite ao administrador."
        );
      }
    }

    /* =================================================
       CENÁRIO 2: LINK COM TOKENS DE SESSÃO
    ================================================= */

    else if (
      convite.tipo === "invite" &&
      convite.accessToken &&
      convite.refreshToken
    ) {
      limparCredenciaisUrl();

      const {
        data,
        error,
      } = await cliente.auth.setSession({
        access_token: convite.accessToken,

        refresh_token: convite.refreshToken,
      });

      if (error) {
        throw error;
      }

      sessaoDoConvite =
        data?.session ?? null;

      if (!sessaoDoConvite?.user?.id) {
        throw new Error(
          "Não foi possível estabelecer a sessão do convite."
        );
      }
    }

    /* =================================================
       CENÁRIO 3: PÁGINA RECARREGADA

       O convite já foi validado anteriormente,
       mas a página foi recarregada antes da senha
       ser definida.

       Recupera somente a sessão temporária isolada.
    ================================================= */

    else if (!convite.possuiCredenciais) {
      const {
        data,
        error,
      } = await cliente.auth.getSession();

      if (error) {
        throw error;
      }

      sessaoDoConvite =
        data?.session ?? null;

      if (!sessaoDoConvite?.user?.id) {
        throw new Error(
          "Abra o convite de primeiro acesso fornecido pelo administrador."
        );
      }
    }

    /* =================================================
       LINK INCOMPLETO OU INVÁLIDO
    ================================================= */

    else {
      limparCredenciaisUrl();

      throw new Error(
        "Este link de primeiro acesso está incompleto ou inválido."
      );
    }

    /* =================================================
       CONFIRMAR SESSÃO DO CLIENTE

       Verifica se a sessão realmente ficou disponível
       no cliente que será utilizado para salvar a senha.
    ================================================= */

    let {
      data: dadosSessao,
      error: erroSessao,
    } = await cliente.auth.getSession();

    if (erroSessao) {
      throw erroSessao;
    }

    let sessaoAtual =
      dadosSessao?.session ?? null;

    /* =================================================
       RECUPERAÇÃO DE SESSÃO

       Caso a validação tenha retornado tokens mas o
       cliente ainda não tenha armazenado a sessão,
       estabelece a sessão explicitamente.
    ================================================= */

    if (
      !sessaoAtual &&
      sessaoDoConvite?.access_token &&
      sessaoDoConvite?.refresh_token
    ) {
      const {
        data,
        error,
      } = await cliente.auth.setSession({
        access_token:
          sessaoDoConvite.access_token,

        refresh_token:
          sessaoDoConvite.refresh_token,
      });

      if (error) {
        throw error;
      }

      sessaoAtual =
        data?.session ?? null;
    }

    /* =================================================
       VERIFICAR IDENTIDADE E TOKEN
    ================================================= */

    if (
      !sessaoAtual?.access_token ||
      !sessaoAtual?.user?.id
    ) {
      throw new Error(
        "Sua sessão de primeiro acesso não foi estabelecida. " +
        "Solicite um novo convite ao administrador."
      );
    }

    /*
     * Confirma a identidade junto ao Supabase.
     *
     * Não depende apenas dos dados armazenados
     * no navegador.
     */

    const {
      data: dadosUsuario,
      error: erroUsuario,
    } = await cliente.auth.getUser();

    if (erroUsuario) {
      throw erroUsuario;
    }

    const usuarioValidado =
      dadosUsuario?.user ?? null;

    if (
      !usuarioValidado?.id ||
      usuarioValidado.id !== sessaoAtual.user.id
    ) {
      throw new Error(
        "Não foi possível confirmar a identidade do usuário convidado."
      );
    }

    /*
     * Se o convite foi validado nesta execução,
     * confirma que a sessão pertence ao mesmo usuário.
     */

    if (
      sessaoDoConvite?.user?.id &&
      sessaoDoConvite.user.id !== usuarioValidado.id
    ) {
      throw new Error(
        "A sessão encontrada não corresponde ao usuário convidado."
      );
    }

    return usuarioValidado.id;
  }

  /* =====================================================
     INICIALIZAÇÃO DO PRIMEIRO ACESSO

     A promessa é reutilizada para evitar duas
     validações do mesmo convite em React StrictMode.
  ===================================================== */

  useEffect(() => {
    let ativo = true;

    if (!validacaoRef.current) {
      validacaoRef.current =
        validarPrimeiroAcesso();
    }

    validacaoRef.current
      .then((usuarioId) => {
        if (!ativo) {
          return;
        }

        usuarioConviteRef.current =
          usuarioId;

        setSessaoValida(true);

        setMensagemErro("");

        setCarregandoSessao(false);
      })
      .catch((error) => {
        if (!ativo) {
          return;
        }

        console.error(
          "Erro ao validar primeiro acesso:",
          error
        );

        usuarioConviteRef.current =
          null;

        setSessaoValida(false);

        setMensagemErro(
          traduzirErroAutenticacao(error)
        );

        setCarregandoSessao(false);
      });

    return () => {
      ativo = false;

      if (timerRef.current) {
        window.clearTimeout(
          timerRef.current
        );
      }
    };
  }, []);

  /* =====================================================
     DEFINIR NOVA SENHA
  ===================================================== */

  async function definirSenha(event) {
    event.preventDefault();

    setMensagemErro("");

    /* =================================================
       VALIDAR SENHA
    ================================================= */

    if (!senha) {
      setMensagemErro(
        "Informe sua nova senha."
      );

      return;
    }

    if (
      senha.length <
      TAMANHO_MINIMO_SENHA
    ) {
      setMensagemErro(
        `A senha deve possuir pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`
      );

      return;
    }

    if (!confirmarSenha) {
      setMensagemErro(
        "Confirme sua nova senha."
      );

      return;
    }

    if (senha !== confirmarSenha) {
      setMensagemErro(
        "As senhas informadas não são iguais."
      );

      return;
    }

    /* =================================================
       IMPEDIR ENVIO SEM SESSÃO VALIDADA
    ================================================= */

    if (
      !sessaoValida ||
      !clienteRef.current ||
      !usuarioConviteRef.current
    ) {
      setMensagemErro(
        "Sua sessão ainda não foi validada. " +
        "Abra novamente o convite de primeiro acesso."
      );

      return;
    }

    /* =================================================
       SALVAR SENHA
    ================================================= */

    try {
      setSalvando(true);

      const cliente =
        clienteRef.current;

      /* =================================================
         CONFIRMAR SESSÃO ANTES DE SALVAR
      ================================================= */

      const {
        data: dadosSessao,
        error: erroSessao,
      } = await cliente.auth.getSession();

      if (erroSessao) {
        throw erroSessao;
      }

      const sessao =
        dadosSessao?.session ?? null;

      if (
        !sessao?.access_token ||
        !sessao?.user?.id ||
        sessao.user.id !==
          usuarioConviteRef.current
      ) {
        throw new Error(
          "Sua sessão expirou. Solicite um novo link."
        );
      }

      /* =================================================
         CONFIRMAR O USUÁRIO NO SERVIDOR
      ================================================= */

      const {
        data: dadosUsuario,
        error: erroUsuario,
      } = await cliente.auth.getUser();

      if (erroUsuario) {
        throw erroUsuario;
      }

      if (
        !dadosUsuario?.user?.id ||
        dadosUsuario.user.id !==
          usuarioConviteRef.current
      ) {
        throw new Error(
          "Não foi possível confirmar sua sessão. " +
          "Solicite um novo link."
        );
      }

      /* =================================================
         ATUALIZAR SENHA

         IMPORTANTE:
         Utiliza exclusivamente o cliente isolado.

         A sessão do administrador não é utilizada.
      ================================================= */

      const {
        error: erroAtualizacao,
      } = await cliente.auth.updateUser({
        password: senha,
      });

      if (erroAtualizacao) {
        throw erroAtualizacao;
      }

      /* =================================================
         SENHA SALVA COM SUCESSO
      ================================================= */

      setSenha("");

      setConfirmarSenha("");

      setSucesso(true);

      /* =================================================
         ENCERRAR A SESSÃO TEMPORÁRIA

         Não encerra a sessão do administrador,
         pois os clientes possuem armazenamentos
         e chaves diferentes.
      ================================================= */

      try {
        const {
          error: erroSaida,
        } = await cliente.auth.signOut({
          scope: "local",
        });

        if (erroSaida) {
          console.error(
            "Erro ao encerrar sessão temporária:",
            erroSaida
          );
        }
      } catch (erroSaida) {
        console.error(
          "Erro ao encerrar sessão temporária:",
          erroSaida
        );
      }

      /*
       * Remove também o armazenamento temporário
       * utilizado pelo primeiro acesso.
       */

      try {
        window.sessionStorage.removeItem(
          STORAGE_KEY_PRIMEIRO_ACESSO
        );
      } catch (erroStorage) {
        console.error(
          "Não foi possível limpar armazenamento temporário:",
          erroStorage
        );
      }

      usuarioConviteRef.current =
        null;

      /* =================================================
         REDIRECIONAR PARA O LOGIN
      ================================================= */

      timerRef.current =
        window.setTimeout(() => {
          navigate("/", {
            replace: true,
          });
        }, 1800);
    } catch (error) {
      console.error(
        "Erro ao definir senha:",
        error
      );

      setMensagemErro(
        traduzirErroAutenticacao(error)
      );
    } finally {
      setSalvando(false);
    }
  }

  /* =====================================================
     TELA: VALIDANDO O CONVITE
  ===================================================== */

  if (carregandoSessao) {
    return (
      <div className="definir-senha-page">
        <div className="definir-senha-card">
          <div className="definir-senha-carregando">
            Verificando seu link de acesso...
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     TELA: CONVITE INVÁLIDO
  ===================================================== */

  if (!sessaoValida) {
    return (
      <div className="definir-senha-page">
        <div className="definir-senha-card">

          <div className="definir-senha-icon erro">
            <FiAlertTriangle />
          </div>

          <h1>
            Link inválido ou expirado
          </h1>

          <p>
            {mensagemErro ||
              "Este link não é mais válido."}
          </p>

          <p className="definir-senha-texto-secundario">
            Solicite um novo convite ao administrador.
          </p>

          <button
            type="button"
            className="definir-senha-btn-secundario"
            onClick={() =>
              navigate("/", {
                replace: true,
              })
            }
          >
            Voltar para o login
          </button>

        </div>
      </div>
    );
  }

  /* =====================================================
     TELA: SENHA DEFINIDA
  ===================================================== */

  if (sucesso) {
    return (
      <div className="definir-senha-page">
        <div className="definir-senha-card">

          <div className="definir-senha-icon sucesso">
            <FiCheckCircle />
          </div>

          <h1>
            Senha definida!
          </h1>

          <p>
            Sua nova senha foi salva com sucesso.
          </p>

          <p className="definir-senha-texto-secundario">
            Você será direcionado para o login.
          </p>

        </div>
      </div>
    );
  }

  /* =====================================================
     TELA: DEFINIR SENHA
  ===================================================== */

  return (
    <div className="definir-senha-page">
      <div className="definir-senha-card">

        {/* ÍCONE */}

        <div className="definir-senha-icon">
          <FiLock />
        </div>

        {/* TÍTULO */}

        <h1>
          Defina sua senha
        </h1>

        <p>
          Este é o seu primeiro acesso.
          Crie uma senha para utilizar o sistema.
        </p>

        {/* FORMULÁRIO */}

        <form
          onSubmit={definirSenha}
          autoComplete="off"
        >

          {/* NOVA SENHA */}

          <div className="definir-senha-campo">

            <label htmlFor="nova-senha">
              Nova senha
            </label>

            <input
              id="nova-senha"
              type="password"
              value={senha}
              onChange={(event) =>
                setSenha(
                  event.target.value
                )
              }
              placeholder="Mínimo de 6 caracteres"
              autoComplete="new-password"
              disabled={salvando}
              autoFocus
            />

          </div>

          {/* CONFIRMAR SENHA */}

          <div className="definir-senha-campo">

            <label htmlFor="confirmar-nova-senha">
              Confirmar nova senha
            </label>

            <input
              id="confirmar-nova-senha"
              type="password"
              value={confirmarSenha}
              onChange={(event) =>
                setConfirmarSenha(
                  event.target.value
                )
              }
              placeholder="Digite a senha novamente"
              autoComplete="new-password"
              disabled={salvando}
            />

          </div>

          {/* ERRO */}

          {mensagemErro && (
            <div
              className="definir-senha-erro"
              role="alert"
            >
              <FiAlertTriangle />

              <span>
                {mensagemErro}
              </span>
            </div>
          )}

          {/* REGRAS */}

          <div className="definir-senha-regras">
            A senha deve possuir pelo menos 6 caracteres.
          </div>

          {/* BOTÃO */}

          <button
            type="submit"
            className="definir-senha-btn"
            disabled={
              salvando ||
              !sessaoValida
            }
          >
            {salvando
              ? "Salvando..."
              : "Definir senha"}
          </button>

        </form>
      </div>
    </div>
  );
}