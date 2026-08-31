import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Factory,
  LockKeyhole,
  ShieldCheck,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  UploadCloud,
  UsersRound,
  WalletCards,
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

import {
  formatarMoeda,
  processarFinanceiro,
} from "@/features/financeiro/utils/financeiro.utils";

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


  const podeVerFinanceiro =
    Boolean(
      user &&
      (
        isAdmin ||
        (
          !loadingPermissoes &&
          podeAcessarTela(
            "financeiro",
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
  ===================================================== */

  const metricasProducao =
    useDashboardMetrics(
      dadosProducao,
      TIPOS_PRODUCAO_HOME,
    );


  /* =====================================================
     FINANCEIRO
     MÊS ATUAL
  ===================================================== */

  const periodoFinanceiro =
    useMemo(
      () => {
        const agora =
          new Date();


        return {
          ano:
            agora.getFullYear(),

          mes:
            agora.getMonth() +
            1,

          nome:
            agora.toLocaleDateString(
              "pt-BR",
              {
                month:
                  "long",

                year:
                  "numeric",
              },
            ),
        };
      },
      [],
    );


  const {
    data:
      dadosFinanceiro = [],

    error:
      erroFinanceiro,

    isLoading:
      carregandoFinanceiro,
  } =
    useQuery({
      queryKey: [
        "home-resumo-financeiro",
        periodoFinanceiro.ano,
        periodoFinanceiro.mes,
      ],


      enabled:
        podeVerFinanceiro,


      queryFn:
        async () => {
          const {
            data,
            error,
          } =
            await supabase
              .from(
                "financeiro_omie_resumo",
              )
              .select(
                `
                  id,
                  ano,
                  mes,
                  tipo,
                  codigo_categoria,
                  categoria,
                  valor_previsto,
                  valor_realizado
                `,
              )
              .eq(
                "ano",
                periodoFinanceiro.ano,
              )
              .eq(
                "mes",
                periodoFinanceiro.mes,
              )
              .order(
                "tipo",
                {
                  ascending:
                    true,
                },
              )
              .order(
                "codigo_categoria",
                {
                  ascending:
                    true,
                },
              );


          if (error) {
            throw error;
          }


          return Array.isArray(
            data,
          )
            ? data
            : [];
        },


      staleTime:
        5 * 60 * 1000,


      refetchOnMount:
        true,


      refetchOnWindowFocus:
        false,


      retry:
        1,
    });


  const financeiroHome =
    useMemo(
      () =>
        processarFinanceiro(
          dadosFinanceiro,
        ),
      [
        dadosFinanceiro,
      ],
    );


  const receitaFinanceira =
    converterNumero(
      financeiroHome
        ?.resumo
        ?.receitas
        ?.realizado,
    );


  const despesaFinanceira =
    converterNumero(
      financeiroHome
        ?.resumo
        ?.despesas
        ?.realizado,
    );


  const saldoFinanceiro =
    converterNumero(
      financeiroHome
        ?.resumo
        ?.saldo
        ?.realizado,
    );


  const margemFinanceira =
    receitaFinanceira !== 0
      ? (
          saldoFinanceiro /
          receitaFinanceira
        ) * 100
      : 0;


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

              Plataforma de Gestão

            </div>


            <div className="home-public-title">

              <span>
                PEDRASPLAST
              </span>


              <h1>
                Produção, pedidos
                e financeiro em um
                único ambiente.
              </h1>


              <p>
                Centralize produção,
                pedidos e informações
                financeiras para acompanhar
                a operação e apoiar decisões
                com mais clareza.
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
                    Acompanhe indicadores,
                    horas trabalhadas,
                    paradas e desempenho
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
                    Pedidos e financeiro
                  </strong>


                  <span>
                    Monitore pedidos, prazos,
                    receitas, despesas,
                    saldo e evolução
                    financeira.
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
                    somente os módulos
                    e informações
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
                para acessar a plataforma
                de gestão.
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
                   autoComplete="new-password"
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

              Acesso protegido
              e controlado por usuário.

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
                informações da produção,
                dos pedidos e do financeiro.
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
            FINANCEIRO
        =============================================== */}

        {podeVerFinanceiro && (

          <section className="home-summary-section">

            <div className="home-section-heading">

              <div>

                <span>
                  FINANCEIRO
                </span>


                <h2>
                  Resumo financeiro
                </h2>


                <p>
                  Visão geral de{" "}
                  {periodoFinanceiro.nome}.
                </p>

              </div>

            </div>


            {erroFinanceiro ? (

              <div className="home-summary-error">

                <AlertTriangle
                  size={20}
                />


                <div>

                  <strong>
                    Não foi possível carregar
                    o resumo financeiro.
                  </strong>


                  <span>
                    Consulte o módulo Financeiro
                    para verificar os dados.
                  </span>

                </div>

              </div>

            ) : (

              <div className="home-summary-grid">


                <article className="home-summary-card">

                  <div className="home-summary-icon home-summary-icon-success">

                    <TrendingUp
                      size={22}
                    />

                  </div>


                  <div className="home-summary-info">

                    <span>
                      RECEITAS
                    </span>


                    <strong
                      style={{
                        color:
                          receitaFinanceira < 0
                            ? "#dc2626"
                            : "#059669",
                      }}
                    >

                      {carregandoFinanceiro
                        ? "-"
                        : formatarMoeda(
                            receitaFinanceira,
                          )}

                    </strong>


                    <p>
                      Realizado / a realizar
                      no mês.
                    </p>

                  </div>

                </article>


                <article className="home-summary-card">

                  <div
                    className="home-summary-icon"
                    style={{
                      background:
                        "#fef2f2",

                      color:
                        "#dc2626",
                    }}
                  >

                    <TrendingDown
                      size={22}
                    />

                  </div>


                  <div className="home-summary-info">

                    <span>
                      DESPESAS
                    </span>


                    <strong>

                      {carregandoFinanceiro
                        ? "-"
                        : formatarMoeda(
                            despesaFinanceira,
                          )}

                    </strong>


                    <p>
                      Realizado / a realizar
                      no mês.
                    </p>

                  </div>

                </article>


                <article className="home-summary-card">

                  <div
                    className="home-summary-icon"
                    style={{
                      background:
                        saldoFinanceiro < 0
                          ? "#fef2f2"
                          : "#ecfdf5",

                      color:
                        saldoFinanceiro < 0
                          ? "#dc2626"
                          : "#059669",
                    }}
                  >

                    <WalletCards
                      size={22}
                    />

                  </div>


                  <div className="home-summary-info">

                    <span>
                      SALDO
                    </span>


                    <strong
                      style={{
                        color:
                          saldoFinanceiro < 0
                            ? "#dc2626"
                            : "#059669",
                      }}
                    >

                      {carregandoFinanceiro
                        ? "-"
                        : formatarMoeda(
                            saldoFinanceiro,
                          )}

                    </strong>


                    <p>
                      Receitas menos despesas.
                    </p>

                  </div>

                </article>


                <article className="home-summary-card">

                  <div
                    className="home-summary-icon"
                    style={{
                      background:
                        margemFinanceira < 0
                          ? "#fef2f2"
                          : "#ecfdf5",

                      color:
                        margemFinanceira < 0
                          ? "#dc2626"
                          : "#059669",
                    }}
                  >

                    <CircleDollarSign
                      size={22}
                    />

                  </div>


                  <div className="home-summary-info">

                    <span>
                      MARGEM
                    </span>


                    <strong
                      style={{
                        color:
                          margemFinanceira < 0
                            ? "#dc2626"
                            : "#059669",
                      }}
                    >

                      {carregandoFinanceiro
                        ? "-"
                        : formatarPercentual(
                            margemFinanceira,
                          )}

                    </strong>


                    <p>
                      Resultado sobre
                      a receita.
                    </p>

                  </div>

                </article>

              </div>

            )}

          </section>

        )}


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
            Gestão integrada e acompanhamento operacional
          </span>

        </footer>

      </div>

    </main>
  );
}


export default Home;