import React, {
  useCallback,
  useState
} from 'react';

import {
  useNavigate
} from '@/lib/navegacao';

import {
  supabase
} from '@/lib/supabaseClient';

import './Home.css';

function Home({
  user,
  isAdmin
}) {
  const navigate = useNavigate();

  const [
    email,
    setEmail
  ] = useState('');

  const [
    password,
    setPassword
  ] = useState('');

  const [
    loadingLogin,
    setLoadingLogin
  ] = useState(false);

  const [
    loginError,
    setLoginError
  ] = useState('');

  const handleLogin = useCallback(
    async (event) => {
      event.preventDefault();

      setLoadingLogin(true);
      setLoginError('');

      try {
        const {
          error
        } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          setLoginError(
            error.message ===
              'Invalid login credentials'
              ? 'Credenciais inválidas. Verifique seu e-mail e senha.'
              : error.message
          );

          setPassword('');
          return;
        }

        setPassword('');
      } catch (error) {
        console.error(
          'Erro inesperado durante o login:',
          error
        );

        setLoginError(
          'Não foi possível realizar o login. Tente novamente.'
        );
      } finally {
        setLoadingLogin(false);
      }
    },
    [
      email,
      password
    ]
  );

  const goToDashboard = useCallback(
    () => {
      navigate('/dashboard');
    },
    [navigate]
  );

  const goToImportar = useCallback(
    () => {
      navigate('/importar');
    },
    [navigate]
  );

  const goToUsuarios = useCallback(
    () => {
      navigate('/usuarios');
    },
    [navigate]
  );

  const goToCadastro = useCallback(
    () => {
      navigate('/cadastro');
    },
    [navigate]
  );

  return (
    <div className="home-screen">
      <div className="welcome-banner">
        <h1>
          Seja bem-vindo ao Painel de Produção
        </h1>

        <p>
          Visão integrada da produtividade por máquina,
          identificação de paradas e monitoramento de
          eficiência operacional.
        </p>
      </div>

      <div
        className={
          user
            ? 'home-grid home-grid-logged'
            : 'home-grid'
        }
      >
        <div className="info-card">
          <h3>
            O que você deseja fazer?
          </h3>

          <div className="action-guide">
            <div
              className="guide-item"
              onClick={goToDashboard}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' ||
                  event.key === ' '
                ) {
                  goToDashboard();
                }
              }}
            >
              <span className="guide-icon">
                📈
              </span>

              <div>
                <h4>
                  Visualizar Dashboard
                </h4>

                <p>
                  Gráficos de eficiência, peças fabricadas,
                  tempos de atividade e análise de paradas.
                </p>
              </div>
            </div>

            {user && isAdmin && (
              <>
                <div
                  className="guide-item"
                  onClick={goToImportar}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' ||
                      event.key === ' '
                    ) {
                      goToImportar();
                    }
                  }}
                >
                  <span className="guide-icon">
                    📥
                  </span>

                  <div>
                    <h4>
                      Importar Carga Máquina
                    </h4>

                    <p>
                      Envio em massa de planilhas de
                      programação de injetoras.
                    </p>
                  </div>
                </div>

                <div
                  className="guide-item"
                  onClick={goToUsuarios}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' ||
                      event.key === ' '
                    ) {
                      goToUsuarios();
                    }
                  }}
                >
                  <span className="guide-icon">
                    👥
                  </span>

                  <div>
                    <h4>
                      Gerenciar Usuários
                    </h4>

                    <p>
                      Controle permissões, níveis de acesso
                      e perfis de colaboradores.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {!user && (
          <div className="auth-card">
            <div className="login-form-wrapper">
              <h3>
                Acesso ao Sistema
              </h3>

              <p className="login-subtitle">
                Faça login para continuar
              </p>

              {loginError && (
                <div className="login-error-alert">
                  {loginError}
                </div>
              )}

              <form
                onSubmit={handleLogin}
                className="login-form"
              >
                <div className="form-group">
                  <label htmlFor="login-email">
                    E-mail
                  </label>

                  <input
                    id="login-email"
                    type="email"
                    placeholder="nome@empresa.com"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="login-password">
                    Senha
                  </label>

                  <input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    autoComplete="current-password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loadingLogin}
                >
                  {loadingLogin
                    ? 'Autenticando...'
                    : 'Entrar'}
                </button>
              </form>

              <div className="login-footer-actions">
                <span className="separator-text">
                  ou
                </span>

                <button
                  type="button"
                  className="btn-link-cadastro"
                  onClick={goToCadastro}
                >
                  Criar nova conta
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;