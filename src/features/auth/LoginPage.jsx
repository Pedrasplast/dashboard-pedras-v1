import React, { useState, useEffect, useCallback } from "react";

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

  const traduzirErroSupabase = useCallback((mensagemOriginal) => {
    const msg = String(mensagemOriginal || "").toLowerCase();

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
  }, []);

  const handleLogin = useCallback(
    async (event) => {
      event.preventDefault();

      setCarregando(true);
      setMensagem("");

      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: senha,
        });

        if (error) {
          throw error;
        }

        setSenha("");

        navigate("/", {
          replace: true,
        });
      } catch (error) {
        setMensagem(traduzirErroSupabase(error?.message));

        setSenha("");
      } finally {
        setCarregando(false);
      }
    },
    [email, senha, navigate, traduzirErroSupabase],
  );

  const handleVoltar = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h2>Acessar o Sistema</h2>

          <p>Utilize o e-mail cadastrado pelo administrador e sua senha.</p>
        </div>

        <form onSubmit={handleLogin} autoComplete="off" className="login-form">
          <div className="login-form-group">
            <label htmlFor="login-email" className="login-label">
              E-mail:
            </label>

            <input
              id="login-email"
              type="email"
              className="login-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
              disabled={carregando}
            />
          </div>

          <div className="login-form-group">
            <label htmlFor="login-senha" className="login-label">
              Senha:
            </label>

            <input
              id="login-senha"
              type="password"
              className="login-input"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              autoComplete="new-password"
              name="senha-acesso-sistema"
              required
              disabled={carregando}
            />
          </div>

          <button type="submit" className="login-submit-button" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </button>

          <button
            type="button"
            className="login-back-button"
            onClick={handleVoltar}
            disabled={carregando}
          >
            Pagina inicial
          </button>
        </form>

        {mensagem && <p className="login-error-message">{mensagem}</p>}
      </div>
    </div>
  );
}

export default Login;
