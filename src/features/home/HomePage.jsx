import React, {
  useCallback,
  useState,
} from "react";

import {
  ArrowRight,
  BarChart3,
  Factory,
  Gauge,
  LockKeyhole,
  UploadCloud,
  UsersRound,
} from "lucide-react";

import {
  useNavigate,
} from "@/lib/navegacao";

import {
  supabase,
} from "@/lib/supabaseClient";

import "./Home.css";


function Home({
  user,
  isAdmin,
}) {
  const navigate =
    useNavigate();

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    loadingLogin,
    setLoadingLogin,
  ] =
    useState(false);

  const [
    loginError,
    setLoginError,
  ] =
    useState("");


  /* =====================================================
     LOGIN
  ===================================================== */

  const handleLogin =
    useCallback(
      async (
        event,
      ) => {
        event.preventDefault();

        setLoadingLogin(
          true,
        );

        setLoginError(
          "",
        );

        try {
          const {
            error,
          } =
            await supabase.auth.signInWithPassword({
              email,
              password,
            });

          if (error) {
            setLoginError(
              error.message ===
                "Invalid login credentials"
                ? "Credenciais inválidas. Verifique seu e-mail e senha."
                : error.message,
            );

            setPassword(
              "",
            );

            return;
          }

          setPassword(
            "",
          );
        } catch (
          error
        ) {
          console.error(
            "Erro inesperado durante o login:",
            error,
          );

          setLoginError(
            "Não foi possível realizar o login. Tente novamente.",
          );
        } finally {
          setLoadingLogin(
            false,
          );
        }
      },
      [
        email,
        password,
      ],
    );


  /* =====================================================
     NAVEGAÇÃO
  ===================================================== */

  const goToDashboard =
    useCallback(
      () => {
        navigate(
          "/dashboard",
        );
      },
      [
        navigate,
      ],
    );

  const goToImportar =
    useCallback(
      () => {
        navigate(
          "/importar",
        );
      },
      [
        navigate,
      ],
    );

  const goToUsuarios =
    useCallback(
      () => {
        navigate(
          "/usuarios",
        );
      },
      [
        navigate,
      ],
    );

  const goToCadastro =
    useCallback(
      () => {
        navigate(
          "/cadastro",
        );
      },
      [
        navigate,
      ],
    );


  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="home-screen">

      {/* =================================================
          HERO
      ================================================= */}

      <section className="home-hero">
        <div className="home-hero-content">
          <div className="home-hero-badge">
            <Factory
              size={15}
            />

            <span>
              Gestão Industrial
            </span>
          </div>

          <h1>
            Painel de Produção
          </h1>

          <p>
            Acompanhe produtividade,
            eficiência operacional,
            produção e ocorrências das
            injetoras em um único ambiente.
          </p>

          <div className="home-hero-tags">
            <span>
              Produção
            </span>

            <span>
              Paradas
            </span>

            <span>
              Eficiência
            </span>
          </div>
        </div>

        <div className="home-hero-visual">
          <div className="home-hero-icon">
            <Gauge
              size={48}
            />
          </div>

          <div>
            <span className="home-hero-visual-label">
              Gestão integrada
            </span>

            <strong>
              Produção em foco
            </strong>

            <p>
              Informações organizadas
              para apoiar a operação.
            </p>
          </div>
        </div>
      </section>


      {/* =================================================
          CONTEÚDO
      ================================================= */}

      <div
        className={
          user
            ? "home-grid home-grid-logged"
            : "home-grid"
        }
      >

        {/* =================================================
            ACESSO RÁPIDO
        ================================================= */}

        <section className="home-actions-card">
          <div className="home-section-header">
            <div>
              <span className="home-section-eyebrow">
                Acesso rápido
              </span>

              <h2>
                O que você deseja fazer?
              </h2>

              <p>
                Selecione uma das opções
                abaixo para continuar.
              </p>
            </div>           
          </div>


          <div className="home-actions-grid">

            {/* DASHBOARD */}

            <button
              type="button"
              className="home-action-item home-action-primary"
              onClick={
                goToDashboard
              }
            >
              <div className="home-action-top">
                <div className="home-action-icon">
                  <BarChart3
                    size={25}
                  />
                </div>

                <ArrowRight
                  className="home-action-arrow"
                  size={20}
                />
              </div>

              <div className="home-action-content">
                <h3>
                  Visualizar Dashboard
                </h3>

                <p>
                  Consulte gráficos,
                  produção, tempos de
                  atividade e análises
                  de paradas.
                </p>
              </div>

              <span className="home-action-link">
                Acessar dashboard
              </span>
            </button>


            {/* IMPORTAÇÃO */}

            {user &&
              isAdmin && (
                <button
                  type="button"
                  className="home-action-item"
                  onClick={
                    goToImportar
                  }
                >
                  <div className="home-action-top">
                    <div className="home-action-icon">
                      <UploadCloud
                        size={25}
                      />
                    </div>

                    <ArrowRight
                      className="home-action-arrow"
                      size={20}
                    />
                  </div>

                  <div className="home-action-content">
                    <h3>
                      Importar Carga Máquina
                    </h3>

                    <p>
                      Realize o envio em
                      massa das planilhas
                      de programação das
                      injetoras.
                    </p>
                  </div>

                  <span className="home-action-link">
                    Importar dados
                  </span>
                </button>
              )}


            {/* USUÁRIOS */}

            {user &&
              isAdmin && (
                <button
                  type="button"
                  className="home-action-item"
                  onClick={
                    goToUsuarios
                  }
                >
                  <div className="home-action-top">
                    <div className="home-action-icon">
                      <UsersRound
                        size={25}
                      />
                    </div>

                    <ArrowRight
                      className="home-action-arrow"
                      size={20}
                    />
                  </div>

                  <div className="home-action-content">
                    <h3>
                      Gerenciar Usuários
                    </h3>

                    <p>
                      Controle permissões,
                      níveis de acesso e
                      perfis dos
                      colaboradores.
                    </p>
                  </div>

                  <span className="home-action-link">
                    Gerenciar acessos
                  </span>
                </button>
              )}

          </div>
        </section>


        {/* =================================================
            LOGIN
        ================================================= */}

        {!user && (
          <aside className="home-auth-card">
            <div className="home-auth-icon">
              <LockKeyhole
                size={25}
              />
            </div>

            <div className="home-auth-header">
              <span>
                Área restrita
              </span>

              <h2>
                Acesso ao Sistema
              </h2>

              <p>
                Entre com suas
                credenciais para
                acessar os recursos
                disponíveis.
              </p>
            </div>

            {loginError && (
              <div className="login-error-alert">
                {loginError}
              </div>
            )}

            <form
              onSubmit={
                handleLogin
              }
              className="login-form"
            >
              <div className="form-group">
                <label
                  htmlFor="login-email"
                >
                  E-mail
                </label>

                <input
                  id="login-email"
                  type="email"
                  placeholder="nome@empresa.com"
                  value={
                    email
                  }
                  onChange={(
                    event,
                  ) =>
                    setEmail(
                      event.target.value,
                    )
                  }
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group">
                <label
                  htmlFor="login-password"
                >
                  Senha
                </label>

                <input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={
                    password
                  }
                  onChange={(
                    event,
                  ) =>
                    setPassword(
                      event.target.value,
                    )
                  }
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-submit"
                disabled={
                  loadingLogin
                }
              >
                {loadingLogin
                  ? "Autenticando..."
                  : "Entrar"}
              </button>
            </form>

            <div className="login-footer-actions">
              <span className="separator-text">
                ou
              </span>

              <button
                type="button"
                className="btn-link-cadastro"
                onClick={
                  goToCadastro
                }
              >
                Criar nova conta
              </button>
            </div>
          </aside>
        )}
      </div>


      {/* =================================================
          RODAPÉ
      ================================================= */}

      <footer className="home-footer">
        <Factory
          size={14}
        />

        <span>
          Painel de Produção
        </span>

        <span className="home-footer-separator">
          •
        </span>

        <span>
          Gestão e acompanhamento
          operacional
        </span>
      </footer>
    </div>
  );
}


export default Home;