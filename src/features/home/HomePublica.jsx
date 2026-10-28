import { useCallback, useState } from "react";

import { CheckCircle2, Factory, LockKeyhole, ShieldCheck } from "lucide-react";

import { supabase } from "@/lib/supabaseClient";

/* =========================================================
   HOME PÚBLICA (SEM LOGIN)

   Apresentação da plataforma e formulário de acesso.
========================================================= */

export default function HomePublica() {
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [loadingLogin, setLoadingLogin] = useState(false);

  const [loginError, setLoginError] = useState("");

  const handleLogin = useCallback(
    async (event) => {
      event.preventDefault();

      setLoadingLogin(true);

      setLoginError("");

      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),

          password,
        });

        if (error) {
          setLoginError(
            error.message === "Invalid login credentials"
              ? "E-mail ou senha incorretos."
              : error.message,
          );

          setPassword("");

          return;
        }

        setPassword("");
      } catch (error) {
        console.error("Erro ao realizar login:", error);

        setLoginError("Não foi possível realizar o login. Tente novamente.");

        setPassword("");
      } finally {
        setLoadingLogin(false);
      }
    },
    [email, password],
  );

  return (
    <main className="home-page">
      <div className="home-public-layout">
        <section className="home-public-hero">
          <div className="home-brand-badge">
            <Factory size={16} />
            Plataforma de Gestão
          </div>

          <div className="home-public-title">
            <span>PEDRASPLAST</span>

            <h1>Produção, pedidos e financeiro em um único ambiente.</h1>

            <p>
              Centralize produção, pedidos e informações financeiras para acompanhar a operação e
              apoiar decisões com mais clareza.
            </p>
          </div>

          <div className="home-benefits">
            <div className="home-benefit">
              <CheckCircle2 size={20} />

              <div>
                <strong>Produção e produtividade</strong>

                <span>
                  Acompanhe indicadores, horas trabalhadas, paradas e desempenho da operação.
                </span>
              </div>
            </div>

            <div className="home-benefit">
              <CheckCircle2 size={20} />

              <div>
                <strong>Pedidos e financeiro</strong>

                <span>
                  Monitore pedidos, prazos, receitas, despesas, saldo e evolução financeira.
                </span>
              </div>
            </div>

            <div className="home-benefit">
              <CheckCircle2 size={20} />

              <div>
                <strong>Acesso controlado</strong>

                <span>Cada colaborador acessa somente os módulos e informações autorizados.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="home-login-card">
          <div className="home-login-icon">
            <LockKeyhole size={25} />
          </div>

          <div className="home-login-header">
            <span>Área restrita</span>

            <h2>Acessar o sistema</h2>

            <p>Entre com suas credenciais para acessar a plataforma de gestão.</p>
          </div>

          {loginError && <div className="home-login-error">{loginError}</div>}

          <form className="home-login-form" onSubmit={handleLogin} autoComplete="off">
            <div className="home-login-field">
              <label htmlFor="home-email">E-mail</label>

              <input
                id="home-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nome@empresa.com"
                autoComplete="username"
                disabled={loadingLogin}
                required
              />
            </div>

            <div className="home-login-field">
              <label htmlFor="home-password">Senha</label>

              <input
                id="home-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Digite sua senha"
                autoComplete="new-password"
                name="senha-acesso-home"
                disabled={loadingLogin}
                required
              />
            </div>

            <button type="submit" className="home-login-button" disabled={loadingLogin}>
              {loadingLogin ? "Autenticando..." : "Entrar no sistema"}
            </button>
          </form>

          <div className="home-login-security">
            <ShieldCheck size={15} />
            Acesso protegido e controlado por usuário.
          </div>
        </section>
      </div>
    </main>
  );
}
