import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Factory,
  LockKeyhole,
  ShieldCheck,
  ShoppingCart,
  UploadCloud,
  UsersRound,
} from "lucide-react";

import {
  useQuery,
} from "@tanstack/react-query";

import {
  usePermissoes,
} from "@/hooks/usePermissoes";

import {
  useDashboardMetrics,
} from "@/hooks/useDashboardMetrics";

import {
  useCargaMaquina,
} from "@/lib/cargaMaquina";

import {
  useNavigate,
} from "@/lib/navegacao";

import {
  supabase,
} from "@/lib/supabaseClient";

import {
  buscarPedidosOmie,
} from "@/features/pedidos/omie.functions";

import "./Home.css";


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const INTERVALO_RESUMO_PEDIDOS =
  15 * 60 * 1000;


/*
 * A Home não seleciona Tipo 3.
 *
 * Portanto:
 *
 * Final de Semana
 * Feriado sem expediente
 * Turno Reduzido
 *
 * não entram em Hora Parada.
 */
const TIPOS_PRODUCAO_HOME = [];


/* =========================================================
   USUÁRIO
========================================================= */

function obterNomeUsuario(email) {
  if (!email) {
    return "Usuário";
  }

  return email
    .split("@")[0]
    .replace(
      /[._-]+/g,
      " ",
    )
    .replace(
      /\b\w/g,
      (letra) =>
        letra.toUpperCase(),
    );
}


/* =========================================================
   TEXTO
========================================================= */

function normalizarTexto(valor) {
  return String(
    valor ?? "",
  )
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    );
}


/* =========================================================
   NÚMEROS
========================================================= */

function converterNumero(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return 0;
  }


  if (
    typeof valor ===
    "number"
  ) {
    return Number.isFinite(
      valor,
    )
      ? valor
      : 0;
  }


  let texto =
    String(valor)
      .trim()
      .replace(
        /\s/g,
        "",
      );


  if (
    texto.includes(
      ",",
    ) &&
    texto.includes(
      ".",
    )
  ) {
    texto =
      texto
        .replace(
          /\./g,
          "",
        )
        .replace(
          ",",
          ".",
        );
  } else {
    texto =
      texto.replace(
        ",",
        ".",
      );
  }


  const numero =
    Number(texto);


  return Number.isFinite(
    numero,
  )
    ? numero
    : 0;
}


function formatarNumero(valor) {
  return converterNumero(
    valor,
  ).toLocaleString(
    "pt-BR",
    {
      maximumFractionDigits: 0,
    },
  );
}


function formatarPercentual(valor) {
  const numero =
    Number(valor);


  if (
    !Number.isFinite(
      numero,
    )
  ) {
    return "0,0%";
  }


  return `${numero.toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    },
  )}%`;
}


/* =========================================================
   DATAS DOS PEDIDOS
========================================================= */

function converterData(
  dataTexto,
) {
  if (!dataTexto) {
    return null;
  }


  if (
    /^\d{2}\/\d{2}\/\d{4}$/.test(
      dataTexto,
    )
  ) {
    const [
      dia,
      mes,
      ano,
    ] =
      dataTexto
        .split("/")
        .map(Number);


    return new Date(
      ano,
      mes - 1,
      dia,
      0,
      0,
      0,
      0,
    );
  }


  const data =
    new Date(
      dataTexto,
    );


  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return null;
  }


  return data;
}


function obterHoje() {
  const agora =
    new Date();


  return new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate(),
    0,
    0,
    0,
    0,
  );
}


function formatarHorario(
  dataTexto,
) {
  if (!dataTexto) {
    return "-";
  }


  const data =
    new Date(
      dataTexto,
    );


  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return "-";
  }


  return data.toLocaleTimeString(
    "pt-BR",
    {
      hour:
        "2-digit",

      minute:
        "2-digit",
    },
  );
}


function formatarDataHora(
  dataTexto,
) {
  if (!dataTexto) {
    return "Ainda não atualizado";
  }


  const data =
    new Date(
      dataTexto,
    );


  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return "Ainda não atualizado";
  }


  return data.toLocaleString(
    "pt-BR",
    {
      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    },
  );
}


/* =========================================================
   PEDIDOS
========================================================= */

function obterChavePedido(
  pedido,
) {
  return String(
    pedido?.codigoPedido ||
    pedido?.codigo_pedido ||
    pedido?.pedido ||
    pedido?.numero_pedido ||
    pedido?.id ||
    "",
  );
}


/* =========================================================
   HOME
========================================================= */

function Home({
  user,
  isAdmin,
}) {
  const navigate =
    useNavigate();


  const {
    podeAcessarTela,
    loadingPermissoes,
  } =
    usePermissoes();


  /* =====================================================
     LOGIN
  ===================================================== */

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


  const handleLogin =
    useCallback(
      async (event) => {
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
            await supabase
              .auth
              .signInWithPassword({
                email:
                  email
                    .trim()
                    .toLowerCase(),

                password,
              });


          if (error) {
            setLoginError(
              error.message ===
                "Invalid login credentials"
                ? "E-mail ou senha incorretos."
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
        } catch (error) {
          console.error(
            "Erro ao realizar login:",
            error,
          );


          setLoginError(
            "Não foi possível realizar o login. Tente novamente.",
          );


          setPassword(
            "",
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
     PERFIL
  ===================================================== */

  const nomeUsuario =
    useMemo(
      () =>
        obterNomeUsuario(
          user?.email,
        ),
      [
        user?.email,
      ],
    );


  const perfilUsuario =
    isAdmin
      ? "Administrador"
      : "Operador";


  /* =====================================================
     PERMISSÕES
  ===================================================== */

  const podeVerPedidos =
    Boolean(
      user &&
      (
        isAdmin ||
        (
          !loadingPermissoes &&
          podeAcessarTela(
            "pedidos",
          )
        )
      ),
    );


  const podeImportar =
    Boolean(
      user &&
      (
        isAdmin ||
        (
          !loadingPermissoes &&
          podeAcessarTela(
            "importar",
          )
        )
      ),
    );


  const podeGerenciarUsuarios =
    Boolean(
      user &&
      isAdmin,
    );


  const possuiAcoesAdministrativas =
    podeImportar ||
    podeGerenciarUsuarios;


  /* =====================================================
     PRODUÇÃO
  ===================================================== */

  const {
    dados:
      dadosProducao,

    loading:
      carregandoProducao,

    erro:
      erroProducao,
  } =
    useCargaMaquina({
      enabled:
        Boolean(user),
    });


  /* =====================================================
     MÉTRICAS DE PRODUÇÃO

     IMPORTANTE:

     É EXATAMENTE O MESMO HOOK
     USADO PELO DASHBOARD.

     Não existe mais cálculo
     de horas dentro da Home.
  ===================================================== */

  const metricasProducao =
    useDashboardMetrics(
      dadosProducao,
      TIPOS_PRODUCAO_HOME,
    );


  /* =====================================================
     PEDIDOS
  ===================================================== */

  const {
    data:
      respostaPedidos,

    error:
      erroPedidos,

    isLoading:
      carregandoPedidos,
  } =
    useQuery({
      queryKey: [
        "home-resumo-pedidos",
      ],


      enabled:
        podeVerPedidos,


      queryFn:
        async () => {
          const {
            data:
              sessaoData,

            error:
              sessaoErro,
          } =
            await supabase
              .auth
              .getSession();


          if (
            sessaoErro
          ) {
            throw new Error(
              "Não foi possível validar sua sessão.",
            );
          }


          const accessToken =
            sessaoData
              ?.session
              ?.access_token;


          if (!accessToken) {
            throw new Error(
              "Sua sessão expirou.",
            );
          }


          return await buscarPedidosOmie({
            data: {
              accessToken,
            },
          });
        },


      refetchInterval:
        INTERVALO_RESUMO_PEDIDOS,


      refetchIntervalInBackground:
        false,


      refetchOnMount:
        true,


      refetchOnWindowFocus:
        false,


      staleTime:
        INTERVALO_RESUMO_PEDIDOS,


      retry:
        1,
    });


  const pedidos =
    useMemo(
      () =>
        Array.isArray(
          respostaPedidos?.pedidos,
        )
          ? respostaPedidos.pedidos
          : [],
      [
        respostaPedidos,
      ],
    );


  /* =====================================================
     PEDIDOS EM ABERTO
  ===================================================== */

  const pedidosEmAberto =
    useMemo(
      () =>
        pedidos.filter(
          (pedido) =>
            normalizarTexto(
              pedido?.status,
            ) ===
            "pedido",
        ),
      [
        pedidos,
      ],
    );


  /* =====================================================
     PEDIDOS ÚNICOS
  ===================================================== */

  const pedidosUnicos =
    useMemo(
      () => {
        const mapa =
          new Map();


        for (
          const pedido
          of pedidosEmAberto
        ) {
          const chave =
            obterChavePedido(
              pedido,
            );


          if (
            chave &&
            !mapa.has(
              chave,
            )
          ) {
            mapa.set(
              chave,
              pedido,
            );
          }
        }


        return [
          ...mapa.values(),
        ];
      },
      [
        pedidosEmAberto,
      ],
    );


  /* =====================================================
     PEDIDOS ATRASADOS
  ===================================================== */

  const pedidosAtrasados =
    useMemo(
      () => {
        const hoje =
          obterHoje();


        return pedidosUnicos.filter(
          (pedido) => {
            const previsao =
              converterData(
                pedido?.previsao,
              );


            if (!previsao) {
              return false;
            }


            previsao.setHours(
              0,
              0,
              0,
              0,
            );


            return (
              previsao <
              hoje
            );
          },
        ).length;
      },
      [
        pedidosUnicos,
      ],
    );


  /* =====================================================
     PRÓXIMOS 7 DIAS
  ===================================================== */

  const proximosSeteDias =
    useMemo(
      () => {
        const hoje =
          obterHoje();


        const limite =
          new Date(
            hoje,
          );


        limite.setDate(
          limite.getDate() +
          7,
        );


        return pedidosUnicos.filter(
          (pedido) => {
            const previsao =
              converterData(
                pedido?.previsao,
              );


            if (!previsao) {
              return false;
            }


            previsao.setHours(
              0,
              0,
              0,
              0,
            );


            return (
              previsao >= hoje &&
              previsao <= limite
            );
          },
        ).length;
      },
      [
        pedidosUnicos,
      ],
    );


  /* =====================================================
     HOME PÚBLICA
  ===================================================== */

  if (!user) {
    return (
      <main className="home-page">

        <div className="home-public-layout">

          <section className="home-public-hero">

            <div className="home-brand-badge">

              <Factory
                size={16}
              />

              Gestão Industrial

            </div>


            <div className="home-public-title">

              <span>
                PEDRASPLAST
              </span>


              <h1>
                Gestão da produção
                em um único ambiente.
              </h1>


              <p>
                Centralize informações,
                acompanhe indicadores
                e tenha uma visão clara
                da operação industrial.
              </p>

            </div>


            <div className="home-benefits">

              <div className="home-benefit">

                <CheckCircle2
                  size={20}
                />


                <div>

                  <strong>
                    Produção e produtividade
                  </strong>


                  <span>
                    Informações organizadas
                    para acompanhamento
                    da operação.
                  </span>

                </div>

              </div>


              <div className="home-benefit">

                <CheckCircle2
                  size={20}
                />


                <div>

                  <strong>
                    Pedidos e prazos
                  </strong>


                  <span>
                    Acompanhe pedidos,
                    previsões e atrasos
                    em um único ambiente.
                  </span>

                </div>

              </div>


              <div className="home-benefit">

                <CheckCircle2
                  size={20}
                />


                <div>

                  <strong>
                    Acesso controlado
                  </strong>


                  <span>
                    Cada colaborador acessa
                    somente os recursos
                    autorizados.
                  </span>

                </div>

              </div>

            </div>

          </section>


          <section className="home-login-card">

            <div className="home-login-icon">

              <LockKeyhole
                size={25}
              />

            </div>


            <div className="home-login-header">

              <span>
                Área restrita
              </span>


              <h2>
                Acessar o sistema
              </h2>


              <p>
                Entre com suas credenciais
                para continuar.
              </p>

            </div>


            {loginError && (
              <div className="home-login-error">
                {loginError}
              </div>
            )}


            <form
              className="home-login-form"
              onSubmit={
                handleLogin
              }
              autoComplete="off"
            >

              <div className="home-login-field">

                <label
                  htmlFor="home-email"
                >
                  E-mail
                </label>


                <input
                  id="home-email"
                  type="email"
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
                  placeholder="nome@empresa.com"
                  autoComplete="username"
                  disabled={
                    loadingLogin
                  }
                  required
                />

              </div>


              <div className="home-login-field">

                <label
                  htmlFor="home-password"
                >
                  Senha
                </label>


                <input
                  id="home-password"
                  type="password"
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
                  placeholder="Digite sua senha"
                  autoComplete="off"
                  name="senha-acesso-home"
                  disabled={
                    loadingLogin
                  }
                  required
                />

              </div>


              <button
                type="submit"
                className="home-login-button"
                disabled={
                  loadingLogin
                }
              >

                {loadingLogin
                  ? "Autenticando..."
                  : "Entrar no sistema"}

              </button>

            </form>


            <div className="home-login-security">

              <ShieldCheck
                size={15}
              />

              Acesso protegido por usuário.

            </div>

          </section>

        </div>

      </main>
    );
  }


  /* =====================================================
     HOME LOGADA
  ===================================================== */

  return (
    <main className="home-page">

      <div className="home-dashboard">


        {/* ===============================================
            CABEÇALHO
        =============================================== */}

        <section className="home-welcome">

          <div className="home-welcome-main">

            <div className="home-welcome-icon">

              <Factory
                size={28}
              />

            </div>


            <div>

              <span className="home-welcome-label">
                Painel Pedrasplast
              </span>


              <h1>
                Olá, {nomeUsuario}
              </h1>


              <p>
                Aqui estão as principais
                informações da operação.
              </p>

            </div>

          </div>


          <div className="home-profile-badge">

            <ShieldCheck
              size={17}
            />


            <div>

              <span>
                Perfil
              </span>


              <strong>
                {perfilUsuario}
              </strong>

            </div>

          </div>

        </section>


        {/* ===============================================
            PRODUÇÃO
        =============================================== */}

        <section className="home-production-section">

          <div className="home-section-heading">

            <div>

              <span>
                RESUMO DA PRODUÇÃO
              </span>


              <h2>
                Produção acumulada
              </h2>


              <p>
                Indicadores gerais considerando
                todos os dados importados
                no sistema.
              </p>

            </div>

          </div>


          {erroProducao ? (

            <div className="home-summary-error">

              <AlertTriangle
                size={20}
              />


              <div>

                <strong>
                  Não foi possível carregar
                  os dados da produção.
                </strong>


                <span>
                  Consulte o Dashboard
                  para verificar os dados.
                </span>

              </div>

            </div>

          ) : (

            <div className="home-summary-grid">


              {/* =============================================
                  HORAS TRABALHADAS
              ============================================= */}

              <article className="home-summary-card">

                <div className="home-summary-icon">

                  <Clock3
                    size={22}
                  />

                </div>


                <div className="home-summary-info">

                  <span>
                    HORAS TRABALHADAS
                  </span>


                  <strong className="home-summary-duration">

                    {carregandoProducao
                      ? "-"
                      : metricasProducao
                          .horasTrabalhadas}

                  </strong>


                  <p>
                    Total acumulado
                    de horas em produção.
                  </p>

                </div>

              </article>


              {/* =============================================
                  HORAS PARADAS
              ============================================= */}

              <article
                className={
                  Number(
                    metricasProducao
                      ?.horasParadasDec ||
                    0,
                  ) > 0
                    ? "home-summary-card home-summary-card-warning"
                    : "home-summary-card"
                }
              >

                <div
                  className={
                    Number(
                      metricasProducao
                        ?.horasParadasDec ||
                      0,
                    ) > 0
                      ? "home-summary-icon home-summary-icon-warning"
                      : "home-summary-icon"
                  }
                >

                  <AlertTriangle
                    size={22}
                  />

                </div>


                <div className="home-summary-info">

                  <span>
                    HORAS PARADAS
                  </span>


                  <strong className="home-summary-duration">

                    {carregandoProducao
                      ? "-"
                      : metricasProducao
                          .horasParadas}

                  </strong>


                  <p>
                    Horas de indisponibilidade
                    sem considerar Tipo 3.
                  </p>

                </div>

              </article>


              {/* =============================================
                  % HORAS TRABALHADAS
              ============================================= */}

              <article className="home-summary-card">

                <div className="home-summary-icon home-summary-icon-success">

                  <CheckCircle2
                    size={22}
                  />

                </div>


                <div className="home-summary-info">

                  <span>
                    % HORAS TRABALHADAS
                  </span>


                  <strong>

                    {carregandoProducao
                      ? "-"
                      : formatarPercentual(
                          metricasProducao
                            .percentualHorasTrabalhadas,
                        )}

                  </strong>


                  <p>
                    Percentual do tempo
                    considerado em produção.
                  </p>

                </div>

              </article>


              {/* =============================================
                  REGISTROS DE PARADA
              ============================================= */}

              <article
                className={
                  Number(
                    metricasProducao
                      ?.registrosParada ||
                    0,
                  ) > 0
                    ? "home-summary-card home-summary-card-warning"
                    : "home-summary-card"
                }
              >

                <div
                  className={
                    Number(
                      metricasProducao
                        ?.registrosParada ||
                      0,
                    ) > 0
                      ? "home-summary-icon home-summary-icon-warning"
                      : "home-summary-icon"
                  }
                >

                  <Clock3
                    size={22}
                  />

                </div>


                <div className="home-summary-info">

                  <span>
                    REGISTROS DE PARADA
                  </span>


                  <strong>

                    {carregandoProducao
                      ? "-"
                      : formatarNumero(
                          metricasProducao
                            .registrosParada,
                        )}

                  </strong>


                  <p>
                    Ocorrências de indisponibilidade
                    sem considerar Tipo 3.
                  </p>

                </div>

              </article>

            </div>
          )}

        </section>


        {/* ===============================================
            PEDIDOS
        =============================================== */}

        {podeVerPedidos && (
          <>

            <section className="home-summary-section">

              <div className="home-section-heading">

                <div>

                  <span>
                    PEDIDOS
                  </span>


                  <h2>
                    Resumo comercial
                  </h2>


                  <p>
                    Atualização automática
                    a cada 15 minutos.
                  </p>

                </div>

              </div>


              {erroPedidos ? (

                <div className="home-summary-error">

                  <AlertTriangle
                    size={20}
                  />


                  <div>

                    <strong>
                      Não foi possível carregar
                      o resumo dos pedidos.
                    </strong>


                    <span>
                      Uma nova tentativa será
                      realizada automaticamente.
                    </span>

                  </div>

                </div>

              ) : (

                <div className="home-summary-grid">


                  {/* PEDIDOS EM ABERTO */}

                  <article className="home-summary-card">

                    <div className="home-summary-icon">

                      <ShoppingCart
                        size={22}
                      />

                    </div>


                    <div className="home-summary-info">

                      <span>
                        PEDIDOS EM ABERTO
                      </span>


                      <strong>

                        {carregandoPedidos
                          ? "-"
                          : formatarNumero(
                              pedidosUnicos.length,
                            )}

                      </strong>


                      <p>
                        Pedidos comerciais
                        em acompanhamento.
                      </p>

                    </div>

                  </article>


                  {/* PEDIDOS ATRASADOS */}

                  <article
                    className={
                      pedidosAtrasados > 0
                        ? "home-summary-card home-summary-card-warning"
                        : "home-summary-card"
                    }
                  >

                    <div
                      className={
                        pedidosAtrasados > 0
                          ? "home-summary-icon home-summary-icon-warning"
                          : "home-summary-icon"
                      }
                    >

                      <AlertTriangle
                        size={22}
                      />

                    </div>


                    <div className="home-summary-info">

                      <span>
                        PEDIDOS ATRASADOS
                      </span>


                      <strong>

                        {carregandoPedidos
                          ? "-"
                          : formatarNumero(
                              pedidosAtrasados,
                            )}

                      </strong>


                      <p>

                        {pedidosAtrasados > 0
                          ? "Pedidos que precisam de atenção."
                          : "Nenhum atraso identificado."}

                      </p>

                    </div>

                  </article>


                  {/* PRÓXIMOS 7 DIAS */}

                  <article className="home-summary-card">

                    <div className="home-summary-icon">

                      <CalendarClock
                        size={22}
                      />

                    </div>


                    <div className="home-summary-info">

                      <span>
                        PRÓXIMOS 7 DIAS
                      </span>


                      <strong>

                        {carregandoPedidos
                          ? "-"
                          : formatarNumero(
                              proximosSeteDias,
                            )}

                      </strong>


                      <p>
                        Pedidos previstos
                        para faturamento.
                      </p>

                    </div>

                  </article>


                  {/* ÚLTIMA ATUALIZAÇÃO */}

                  <article className="home-summary-card">

                    <div className="home-summary-icon">

                      <Clock3
                        size={22}
                      />

                    </div>


                    <div className="home-summary-info">

                      <span>
                        ÚLTIMA ATUALIZAÇÃO
                      </span>


                      <strong className="home-summary-time">

                        {carregandoPedidos
                          ? "-"
                          : formatarHorario(
                              respostaPedidos
                                ?.atualizadoEm,
                            )}

                      </strong>


                      <p>

                        {formatarDataHora(
                          respostaPedidos
                            ?.atualizadoEm,
                        )}

                      </p>

                    </div>

                  </article>

                </div>
              )}

            </section>


            {/* =============================================
                ATENÇÕES
            ============================================= */}

            {!carregandoPedidos &&
              !erroPedidos && (

                <section className="home-alerts-section">

                  <div className="home-section-heading">

                    <div>

                      <span>
                        ATENÇÕES
                      </span>


                      <h2>
                        Pedidos que merecem atenção
                      </h2>

                    </div>

                  </div>


                  <div className="home-alerts-card">


                    {pedidosAtrasados > 0 ? (

                      <div className="home-alert-item home-alert-warning">

                        <div className="home-alert-icon">

                          <AlertTriangle
                            size={19}
                          />

                        </div>


                        <div>

                          <strong>

                            {formatarNumero(
                              pedidosAtrasados,
                            )} pedido
                            {pedidosAtrasados !== 1
                              ? "s"
                              : ""} em atraso

                          </strong>


                          <p>
                            Consulte Pedidos
                            para verificar
                            os prazos vencidos.
                          </p>

                        </div>

                      </div>

                    ) : (

                      <div className="home-alert-item home-alert-success">

                        <div className="home-alert-icon">

                          <CheckCircle2
                            size={19}
                          />

                        </div>


                        <div>

                          <strong>
                            Nenhum pedido em atraso
                          </strong>


                          <p>
                            Não foram identificados
                            pedidos vencidos
                            no momento.
                          </p>

                        </div>

                      </div>

                    )}


                    <div className="home-alert-divider" />


                    <div className="home-alert-item home-alert-info">

                      <div className="home-alert-icon">

                        <CalendarClock
                          size={19}
                        />

                      </div>


                      <div>

                        <strong>

                          {formatarNumero(
                            proximosSeteDias,
                          )} faturamento
                          {proximosSeteDias !== 1
                            ? "s"
                            : ""} nos próximos 7 dias

                        </strong>


                        <p>
                          Pedidos previstos
                          para faturamento
                          durante a próxima semana.
                        </p>

                      </div>

                    </div>

                  </div>

                </section>

              )}

          </>
        )}


        {/* ===============================================
            ADMINISTRAÇÃO
        =============================================== */}

        {possuiAcoesAdministrativas && (

          <section className="home-admin-section">

            <div className="home-section-heading">

              <div>

                <span>
                  ADMINISTRAÇÃO
                </span>


                <h2>
                  Ferramentas administrativas
                </h2>


                <p>
                  Recursos adicionais
                  disponíveis para seu perfil.
                </p>

              </div>

            </div>


            <div className="home-admin-actions">


              {podeImportar && (

                <button
                  type="button"
                  className="home-admin-action"
                  onClick={() =>
                    navigate(
                      "/importar",
                    )
                  }
                >

                  <div className="home-admin-action-icon">

                    <UploadCloud
                      size={21}
                    />

                  </div>


                  <div>

                    <strong>
                      Importar dados
                    </strong>


                    <span>
                      Importação da programação
                      e dados operacionais.
                    </span>

                  </div>

                </button>

              )}


              {podeGerenciarUsuarios && (

                <button
                  type="button"
                  className="home-admin-action"
                  onClick={() =>
                    navigate(
                      "/usuarios",
                    )
                  }
                >

                  <div className="home-admin-action-icon">

                    <UsersRound
                      size={21}
                    />

                  </div>


                  <div>

                    <strong>
                      Gerenciar usuários
                    </strong>


                    <span>
                      Usuários, perfis
                      e permissões de acesso.
                    </span>

                  </div>

                </button>

              )}

            </div>

          </section>

        )}


        {/* ===============================================
            RODAPÉ
        =============================================== */}

        <footer className="home-system-footer">

          <div>

            <Factory
              size={15}
            />


            <strong>
              Pedrasplast
            </strong>

          </div>


          <span>
            Gestão e acompanhamento operacional
          </span>

        </footer>

      </div>

    </main>
  );
}


export default Home;