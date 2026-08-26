import React, {
  useState,
  useEffect,
  useCallback,
} from "react";

import { useNavigate } from "@/lib/navegacao";
import { supabase } from "@/lib/supabaseClient";

import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    setSenha("");
  }, []);

  const traduzirErroSupabase = useCallback(
    (mensagemOriginal) => {
      const msg = String(
        mensagemOriginal || ""
      ).toLowerCase();

      if (msg.includes("invalid login credentials")) {
        return "E-mail ou senha incorretos.";
      }

      if (msg.includes("email not confirmed")) {
        return "E-mail ainda não confirmado.";
      }

      if (msg.includes("user not found")) {
        return "Usuário não encontrado.";
      }

      if (msg.includes("too many requests")) {
        return "Muitas tentativas de login. Tente novamente mais tarde.";
      }

      return "Não foi possível entrar. Verifique seu e-mail e senha.";
    },
    []
  );

  const handleLogin = useCallback(
    async (event) => {
      event.preventDefault();

      setCarregando(true);
      setMensagem("");

      try {
        const { error } =
          await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password: senha,
          });

        if (error) {
          throw error;
        }

        setSenha("");
        navigate("/", { replace: true });
      } catch (error) {
        setMensagem(
          traduzirErroSupabase(
            error?.message
          )
        );

        setSenha("");
      } finally {
        setCarregando(false);
      }
    },
    [email, senha, navigate, traduzirErroSupabase]
  );

  const handleVoltar = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "40px auto",
        padding: "20px",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        backgroundColor: "white",
      }}
    >
      <button
        type="button"
        className="back-home-btn"
        onClick={handleVoltar}
        style={{
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#475569",
          fontWeight: "500",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <span>Voltar ao Início</span>
      </button>

      <h2
        style={{
          textAlign: "center",
          marginBottom: "8px",
          color: "#1e293b",
        }}
      >
        Acessar o Sistema
      </h2>

      <p
        style={{
          textAlign: "center",
          margin: "0 0 24px 0",
          color: "#64748b",
          fontSize: "0.85rem",
          lineHeight: "1.5",
        }}
      >
        Utilize o e-mail cadastrado pelo administrador e sua senha.
      </p>

      <form onSubmit={handleLogin} autoComplete="off">
        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontSize: "0.9rem",
              color: "#64748b",
              fontWeight: "600",
            }}
          >
            E-mail:
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            autoComplete="username"
            required
            disabled={carregando}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontSize: "0.9rem",
              color: "#64748b",
              fontWeight: "600",
            }}
          >
            Senha:
          </label>

          <input
            type="password"
            value={senha}
            onChange={(event) =>
              setSenha(event.target.value)
            }
            autoComplete="off"
            name="senha-acesso-sistema"
            required
            disabled={carregando}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              boxSizing: "border-box",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={carregando}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: carregando
              ? "not-allowed"
              : "pointer",
            fontWeight: "600",
            opacity: carregando ? 0.7 : 1,
          }}
        >
          {carregando
            ? "Entrando..."
            : "Entrar"}
        </button>
      </form>

      {mensagem && (
        <p
          style={{
            marginTop: "15px",
            marginBottom: 0,
            color: "#ef4444",
            textAlign: "center",
            fontSize: "0.9rem",
          }}
        >
          {mensagem}
        </p>
      )}
    </div>
  );
}

export default Login;
