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

import { criarClientePrimeiroAcesso } from "@/lib/supabaseClient";
import { useNavigate } from "@/lib/navegacao";

import "./DefinirSenhaPage.css";

export default function DefinirSenhaPage() {
  const navigate = useNavigate();

  const timerRef = useRef(null);
  const clienteRef = useRef(null);
  const validacaoRef = useRef(null);
  const usuarioConviteRef = useRef(null);

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [carregandoSessao, setCarregandoSessao] =
    useState(true);

  const [sessaoValida, setSessaoValida] =
    useState(false);



  const [salvando, setSalvando] =
    useState(false);

  const [sucesso, setSucesso] =
    useState(false);

  const [mensagemErro, setMensagemErro] =
    useState("");

  useEffect(() => {
    let ativo = true;
    // A promessa sobrevive à repetição do efeito no StrictMode.
    if (!validacaoRef.current) {
      clienteRef.current = criarClientePrimeiroAcesso();
      const cliente = clienteRef.current;
      const parametros = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.slice(1));
      validacaoRef.current = (async () => {
        if (parametros.has("modo") || parametros.get("type") === "recovery" || hash.get("type") === "recovery") {
          throw new Error("Este endereço aceita somente convites de primeiro acesso.");
        }
        let resposta;
        const token = parametros.get("t") || (parametros.get("type") === "invite" ? parametros.get("token_hash") : null);
        if (token) {
          resposta = await cliente.auth.verifyOtp({ token_hash: token, type: "invite" });
        } else if (hash.get("type") === "invite" && hash.get("access_token") && hash.get("refresh_token")) {
          resposta = await cliente.auth.setSession({
            access_token: hash.get("access_token"),
            refresh_token: hash.get("refresh_token"),
          });
        } else {
          throw new Error("Abra o convite de primeiro acesso fornecido pelo administrador.");
        }
        // Remove credenciais da URL mesmo quando o convite expirou.
        window.history.replaceState({}, document.title, window.location.pathname);
        if (resposta.error) throw resposta.error;
        const usuario = resposta.data?.session?.user;
        if (!usuario) throw new Error("Não foi possível validar o convite.");
        return usuario.id;
      })();
    }
    validacaoRef.current.then((usuarioId) => {
      if (!ativo) return;
      usuarioConviteRef.current = usuarioId;
      setSessaoValida(true);
      setCarregandoSessao(false);
    }).catch((error) => {
      if (!ativo) return;
      setMensagemErro(error?.message || "Este convite é inválido ou expirou.");
      setSessaoValida(false);
      setCarregandoSessao(false);
    });
    return () => {
      ativo = false;
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);
  async function definirSenha(event) {
    event.preventDefault();

    setMensagemErro("");

    if (!senha) {
      setMensagemErro(
        "Informe sua nova senha."
      );
      return;
    }

    if (senha.length < 6) {
      setMensagemErro(
        "A senha deve possuir pelo menos 6 caracteres."
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

    try {
      setSalvando(true);

      const {
        data: {
          session,
        },
        error: erroSessao,
      } =
        await clienteRef.current.auth.getSession();

      if (erroSessao) {
        throw erroSessao;
      }

      if (!sessaoValida || !session?.user || session.user.id !== usuarioConviteRef.current) {
        throw new Error(
          "Sua sessão expirou. Solicite um novo link."
        );
      }

      const {
        error,
      } =
        await clienteRef.current.auth.updateUser({
          password: senha,
        });

      if (error) {
        throw error;
      }

      setSucesso(true);

      await clienteRef.current.auth.signOut({ scope: "local" });

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
        error?.message ||
          "Não foi possível definir sua senha."
      );
    } finally {
      setSalvando(false);
    }
  }

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

  return (
    <div className="definir-senha-page">
      <div className="definir-senha-card">
        <div className="definir-senha-icon">
          <FiLock />
        </div>

        <h1>
          Defina sua senha
        </h1>

        <p>
          Este é o seu primeiro acesso. Crie uma senha para utilizar o sistema.
        </p>

        <form
          onSubmit={definirSenha}
          autoComplete="off"
        >
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

          {mensagemErro && (
            <div className="definir-senha-erro">
              <FiAlertTriangle />

              <span>
                {mensagemErro}
              </span>
            </div>
          )}

          <div className="definir-senha-regras">
            A senha deve possuir pelo menos 6 caracteres.
          </div>

          <button
            type="submit"
            className="definir-senha-btn"
            disabled={salvando}
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