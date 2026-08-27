import React, {
  useEffect,
  useState,
} from "react";

import {
  FiLock,
  FiCheckCircle,
  FiAlertTriangle,
} from "react-icons/fi";

import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "@/lib/navegacao";

import "./DefinirSenhaPage.css";

export default function DefinirSenhaPage() {
  const navigate = useNavigate();

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregandoSessao, setCarregandoSessao] = useState(true);
  const [sessaoValida, setSessaoValida] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [mensagemErro, setMensagemErro] = useState("");

  useEffect(() => {
    let ativo = true;
    let timer;

    const { data: listener } =
      supabase.auth.onAuthStateChange(
        (_evento, novaSessao) => {
          if (!ativo) return;

          if (novaSessao?.user) {
            setSessaoValida(true);
            setCarregandoSessao(false);
          }
        }
      );

    async function verificarSessao() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!ativo) return;

        if (session?.user) {
          setSessaoValida(true);
          setCarregandoSessao(false);
          return;
        }

        timer = window.setTimeout(
          async () => {
            if (!ativo) return;

            const {
              data: { session: sessaoFinal },
            } = await supabase.auth.getSession();

            if (!ativo) return;

            setSessaoValida(
              Boolean(sessaoFinal?.user)
            );
            setCarregandoSessao(false);
          },
          2500
        );
      } catch (error) {
        console.error(
          "Erro ao verificar sessão:",
          error
        );

        if (ativo) {
          setSessaoValida(false);
          setCarregandoSessao(false);
        }
      }
    }

    verificarSessao();

    return () => {
      ativo = false;

      if (timer) {
        window.clearTimeout(timer);
      }

      listener?.subscription?.unsubscribe();
    };
  }, []);

  async function definirSenha(event) {
    event.preventDefault();
    setMensagemErro("");

    if (!senha) {
      setMensagemErro("Informe sua nova senha.");
      return;
    }

    if (senha.length < 8) {
      setMensagemErro(
        "A senha deve possuir pelo menos 8 caracteres."
      );
      return;
    }

    if (!confirmarSenha) {
      setMensagemErro("Confirme sua nova senha.");
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

      const { error } =
        await supabase.auth.updateUser({
          password: senha,
        });

      if (error) {
        throw error;
      }

      setSucesso(true);

      await supabase.auth.signOut();

      window.setTimeout(() => {
        navigate("/login", {
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

          <h1>Link inválido ou expirado</h1>

          <p>
            Este link de primeiro acesso não é mais válido.
          </p>

          <p className="definir-senha-texto-secundario">
            Solicite ao administrador um novo acesso.
          </p>

          <button
            type="button"
            className="definir-senha-btn-secundario"
            onClick={() =>
              navigate("/login", {
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

          <h1>Senha definida!</h1>

          <p>
            Seu acesso foi configurado com sucesso.
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

        <h1>Defina sua senha</h1>

        <p>
          Este é o seu primeiro acesso. Crie uma senha
          para utilizar o sistema.
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
                setSenha(event.target.value)
              }
              placeholder="Mínimo de 8 caracteres"
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
              <span>{mensagemErro}</span>
            </div>
          )}

          <div className="definir-senha-regras">
            A senha deve possuir pelo menos 8 caracteres.
          </div>

          <button
            type="submit"
            className="definir-senha-btn"
            disabled={salvando}
          >
            {salvando
              ? "Salvando..."
              : "Definir minha senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
