import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiActivity,
  FiArrowDownRight,
  FiArrowUpRight,
  FiBarChart2,
  FiCalendar,
  FiRefreshCw,
  FiTarget,
  FiTrendingDown,
  FiTrendingUp,
} from "react-icons/fi";

import {
  useQuery,
} from "@tanstack/react-query";

import {
  supabase,
} from "@/lib/supabaseClient";

import "./FinanceiroEvolucaoMensalPage.css";


/* =========================================================
   MESES
========================================================= */

const MESES = Object.freeze([
  { valor: 1, nome: "Janeiro" },
  { valor: 2, nome: "Fevereiro" },
  { valor: 3, nome: "Março" },
  { valor: 4, nome: "Abril" },
  { valor: 5, nome: "Maio" },
  { valor: 6, nome: "Junho" },
  { valor: 7, nome: "Julho" },
  { valor: 8, nome: "Agosto" },
  { valor: 9, nome: "Setembro" },
  { valor: 10, nome: "Outubro" },
  { valor: 11, nome: "Novembro" },
  { valor: 12, nome: "Dezembro" },
]);


/* =========================================================
   AUXILIARES
========================================================= */

function obterAnoAtual() {
  return new Date().getFullYear();
}


function obterMesAtual() {
  return new Date().getMonth() + 1;
}


function converterNumero(valor) {
  const numero =
    Number(valor);

  return Number.isFinite(numero)
    ? numero
    : 0;
}


function formatarMoeda(valor) {
  return converterNumero(
    valor,
  ).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );
}


function formatarMoedaCompacta(valor) {
  return converterNumero(
    valor,
  ).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
      notation: "compact",
      maximumFractionDigits: 1,
    },
  );
}


function formatarPercentual(valor) {
  if (
    valor === null ||
    valor === undefined ||
    !Number.isFinite(
      Number(valor),
    )
  ) {
    return "-";
  }

  return `${Number(
    valor,
  ).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}%`;
}


function calcularPercentual(
  numerador,
  denominador,
) {
  const base =
    converterNumero(
      denominador,
    );

  if (base === 0) {
    return null;
  }

  return (
    converterNumero(
      numerador,
    ) /
    Math.abs(
      base,
    )
  ) * 100;
}


/* =========================================================
   PÁGINA
========================================================= */

export default function FinanceiroEvolucaoMensalPage() {
  const [
    ano,
    setAno,
  ] =
    useState(
      obterAnoAtual(),
    );

  const [
    mesInicial,
    setMesInicial,
  ] =
    useState(1);

  const [
    mesFinal,
    setMesFinal,
  ] =
    useState(
      obterMesAtual(),
    );


  /* =======================================================
     ANOS DISPONÍVEIS
  ======================================================= */

  const {
    data:
      anosDisponiveis = [],

    isLoading:
      carregandoAnos,
  } =
    useQuery({
      queryKey: [
        "financeiro-evolucao-mensal-anos",
      ],

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
              .select("ano")
              .order(
                "ano",
                {
                  ascending: false,
                },
              );

          if (error) {
            throw error;
          }

          return [
            ...new Set(
              (
                data || []
              )
                .map(
                  (item) =>
                    Number(
                      item.ano,
                    ),
                )
                .filter(
                  Number.isFinite,
                ),
            ),
          ];
        },

      staleTime:
        5 * 60 * 1000,

      retry:
        1,
    });


  /* =======================================================
     AJUSTAR ANO AUTOMATICAMENTE
  ======================================================= */

  useEffect(
    () => {
      if (
        anosDisponiveis.length ===
        0
      ) {
        return;
      }

      if (
        !anosDisponiveis.includes(
          Number(
            ano,
          ),
        )
      ) {
        setAno(
          anosDisponiveis[0],
        );
      }
    },
    [
      anosDisponiveis,
      ano,
    ],
  );


  /* =======================================================
     DADOS DA EVOLUÇÃO
  ======================================================= */

  const {
    data:
      dados = [],

    isLoading,

    isFetching,

    error,

    refetch,
  } =
    useQuery({
      queryKey: [
        "financeiro-evolucao-mensal",
        ano,
        mesInicial,
        mesFinal,
      ],

      queryFn:
        async () => {
          const {
            data,
            error:
              erroRpc,
          } =
            await supabase.rpc(
              "listar_relatorio_financeiro_evolucao_mensal",
              {
                p_ano:
                  Number(
                    ano,
                  ),

                p_mes_inicial:
                  Number(
                    mesInicial,
                  ),

                p_mes_final:
                  Number(
                    mesFinal,
                  ),
              },
            );

          if (erroRpc) {
            throw erroRpc;
          }

          return Array.isArray(
            data,
          )
            ? data
            : [];
        },

      enabled:
        Boolean(
          ano &&
          mesInicial &&
          mesFinal,
        ),

      staleTime:
        30 * 1000,

      refetchOnWindowFocus:
        true,

      retry:
        1,
    });


  /* =======================================================
     FILTROS
  ======================================================= */

  function alterarMesInicial(
    valor,
  ) {
    const novoMes =
      Number(
        valor,
      );

    setMesInicial(
      novoMes,
    );

    if (
      novoMes >
      Number(
        mesFinal,
      )
    ) {
      setMesFinal(
        novoMes,
      );
    }
  }


  function alterarMesFinal(
    valor,
  ) {
    const novoMes =
      Number(
        valor,
      );

    setMesFinal(
      novoMes,
    );

    if (
      novoMes <
      Number(
        mesInicial,
      )
    ) {
      setMesInicial(
        novoMes,
      );
    }
  }


  /* =======================================================
     INDICADORES
  ======================================================= */

  const indicadores =
    useMemo(
      () => {
        const acumulado =
          dados.reduce(
            (
              total,
              item,
            ) => {
              total.receitaPrevista +=
                converterNumero(
                  item.receita_prevista,
                );

              total.receitaRealizada +=
                converterNumero(
                  item.receita_realizada,
                );

              total.despesaPrevista +=
                converterNumero(
                  item.despesa_prevista,
                );

              total.despesaRealizada +=
                converterNumero(
                  item.despesa_realizada,
                );

              total.resultadoPrevisto +=
                converterNumero(
                  item.resultado_previsto,
                );

              total.resultadoRealizado +=
                converterNumero(
                  item.resultado_realizado,
                );

              return total;
            },
            {
              receitaPrevista: 0,
              receitaRealizada: 0,
              despesaPrevista: 0,
              despesaRealizada: 0,
              resultadoPrevisto: 0,
              resultadoRealizado: 0,
            },
          );


        const margemRealizada =
          calcularPercentual(
            acumulado.resultadoRealizado,
            acumulado.receitaRealizada,
          );


        const variacaoResultado =
          acumulado.resultadoRealizado -
          acumulado.resultadoPrevisto;


        const variacaoResultadoPercentual =
          calcularPercentual(
            variacaoResultado,
            acumulado.resultadoPrevisto,
          );


        const mesesComResultado =
          dados.filter(
            (item) =>
              converterNumero(
                item.receita_realizada,
              ) !== 0 ||
              converterNumero(
                item.despesa_realizada,
              ) !== 0,
          );


        const mesesPositivos =
          mesesComResultado.filter(
            (item) =>
              converterNumero(
                item.resultado_realizado,
              ) >= 0,
          ).length;


        const mesesNegativos =
          mesesComResultado.filter(
            (item) =>
              converterNumero(
                item.resultado_realizado,
              ) < 0,
          ).length;


        const ordenadosResultado =
          [...mesesComResultado].sort(
            (
              a,
              b,
            ) =>
              converterNumero(
                b.resultado_realizado,
              ) -
              converterNumero(
                a.resultado_realizado,
              ),
          );


        const melhorMes =
          ordenadosResultado[0] ||
          null;


        const piorMes =
          ordenadosResultado[
            ordenadosResultado.length -
            1
          ] ||
          null;


        const mediaResultado =
          mesesComResultado.length >
          0
            ? acumulado.resultadoRealizado /
              mesesComResultado.length
            : 0;


        return {
          ...acumulado,

          margemRealizada,

          variacaoResultado,

          variacaoResultadoPercentual,

          mesesPositivos,

          mesesNegativos,

          melhorMes,

          piorMes,

          mediaResultado,

          mesesComDados:
            mesesComResultado.length,
        };
      },
      [
        dados,
      ],
    );


  /* =======================================================
     ESCALA DO GRÁFICO
  ======================================================= */

  const maiorMovimento =
    useMemo(
      () =>
        Math.max(
          1,
          ...dados.flatMap(
            (item) => [
              Math.abs(
                converterNumero(
                  item.receita_realizada,
                ),
              ),

              Math.abs(
                converterNumero(
                  item.despesa_realizada,
                ),
              ),
            ],
          ),
        ),
      [
        dados,
      ],
    );


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="financeiro-evolucao-page">

      {/* ===================================================
          CABEÇALHO
      =================================================== */}

      <header className="financeiro-evolucao-cabecalho">

        <div className="financeiro-evolucao-cabecalho-principal">

          <div className="financeiro-evolucao-cabecalho-icone">
            <FiActivity />
          </div>


          <div>

            <span className="financeiro-evolucao-categoria">
              Financeiro
            </span>

            <h1>
              Evolução Mensal Financeira
            </h1>

            <p>
              Acompanhe a evolução de receitas, despesas e resultado ao longo dos meses.
            </p>

          </div>

        </div>


        <button
          type="button"
          className="financeiro-evolucao-atualizar"
          onClick={
            () =>
              refetch()
          }
          disabled={
            isFetching
          }
        >
          <FiRefreshCw
            className={
              isFetching
                ? "girando"
                : ""
            }
          />

          <span>
            {isFetching
              ? "Atualizando..."
              : "Atualizar"}
          </span>
        </button>

      </header>


      {/* ===================================================
          FILTROS
      =================================================== */}

      <section className="financeiro-evolucao-filtros-card">

        <div className="financeiro-evolucao-filtros-titulo">

          <div className="financeiro-evolucao-filtros-icone">
            <FiCalendar />
          </div>


          <div>

            <h2>
              Período da análise
            </h2>

            <p>
              Selecione o ano e o intervalo de meses.
            </p>

          </div>

        </div>


        <div className="financeiro-evolucao-filtros">

          <label>

            <span>
              Ano
            </span>

            <select
              value={
                ano
              }
              disabled={
                carregandoAnos
              }
              onChange={
                (
                  event,
                ) =>
                  setAno(
                    Number(
                      event
                        .target
                        .value,
                    ),
                  )
              }
            >

              {(anosDisponiveis.length >
              0
                ? anosDisponiveis
                : [
                    obterAnoAtual(),
                  ]
              ).map(
                (
                  itemAno,
                ) => (

                  <option
                    key={
                      itemAno
                    }
                    value={
                      itemAno
                    }
                  >
                    {itemAno}
                  </option>

                ),
              )}

            </select>

          </label>


          <label>

            <span>
              Mês inicial
            </span>

            <select
              value={
                mesInicial
              }
              onChange={
                (
                  event,
                ) =>
                  alterarMesInicial(
                    event
                      .target
                      .value,
                  )
              }
            >

              {MESES.map(
                (
                  itemMes,
                ) => (

                  <option
                    key={
                      itemMes.valor
                    }
                    value={
                      itemMes.valor
                    }
                  >
                    {itemMes.nome}
                  </option>

                ),
              )}

            </select>

          </label>


          <label>

            <span>
              Mês final
            </span>

            <select
              value={
                mesFinal
              }
              onChange={
                (
                  event,
                ) =>
                  alterarMesFinal(
                    event
                      .target
                      .value,
                  )
              }
            >

              {MESES.map(
                (
                  itemMes,
                ) => (

                  <option
                    key={
                      itemMes.valor
                    }
                    value={
                      itemMes.valor
                    }
                  >
                    {itemMes.nome}
                  </option>

                ),
              )}

            </select>

          </label>

        </div>

      </section>


      {/* ===================================================
          ESTADOS
      =================================================== */}

      {error && (

        <div className="financeiro-evolucao-status financeiro-evolucao-status-erro">

          {error.message ||
            "Não foi possível carregar a evolução financeira."}

        </div>

      )}


      {isLoading && (

        <div className="financeiro-evolucao-status">
          Carregando evolução financeira...
        </div>

      )}


      {/* ===================================================
          CONTEÚDO
      =================================================== */}

      {!isLoading &&
        !error &&
        dados.length >
          0 && (
          <>

            {/* =============================================
                KPIs
            ============================================= */}

            <section className="financeiro-evolucao-kpis">

              <article className="financeiro-evolucao-kpi financeiro-evolucao-kpi-receita">

                <div className="financeiro-evolucao-kpi-topo">

                  <span>
                    Receita realizada
                  </span>

                  <FiTrendingUp />

                </div>


                <strong>
                  {formatarMoeda(
                    indicadores.receitaRealizada,
                  )}
                </strong>


                <small>
                  Previsto:{" "}
                  {formatarMoeda(
                    indicadores.receitaPrevista,
                  )}
                </small>

              </article>


              <article className="financeiro-evolucao-kpi financeiro-evolucao-kpi-despesa">

                <div className="financeiro-evolucao-kpi-topo">

                  <span>
                    Despesa realizada
                  </span>

                  <FiTrendingDown />

                </div>


                <strong>
                  {formatarMoeda(
                    indicadores.despesaRealizada,
                  )}
                </strong>


                <small>
                  Previsto:{" "}
                  {formatarMoeda(
                    indicadores.despesaPrevista,
                  )}
                </small>

              </article>


              <article
                className={`financeiro-evolucao-kpi ${
                  indicadores.resultadoRealizado >=
                  0
                    ? "financeiro-evolucao-kpi-resultado-positivo"
                    : "financeiro-evolucao-kpi-resultado-negativo"
                }`}
              >

                <div className="financeiro-evolucao-kpi-topo">

                  <span>
                    Resultado realizado
                  </span>

                  {indicadores.resultadoRealizado >=
                  0 ? (
                    <FiArrowUpRight />
                  ) : (
                    <FiArrowDownRight />
                  )}

                </div>


                <strong>
                  {formatarMoeda(
                    indicadores.resultadoRealizado,
                  )}
                </strong>


                <small>
                  Previsto:{" "}
                  {formatarMoeda(
                    indicadores.resultadoPrevisto,
                  )}
                </small>

              </article>


              <article
                className={`financeiro-evolucao-kpi ${
                  indicadores.margemRealizada === null
                    ? "financeiro-evolucao-kpi-margem"
                    : indicadores.margemRealizada >= 0
                      ? "financeiro-evolucao-kpi-margem-positiva"
                      : "financeiro-evolucao-kpi-margem-negativa"
                }`}
              >

                <div className="financeiro-evolucao-kpi-topo">

                  <span>
                    Margem do período
                  </span>

                  <FiTarget />

                </div>


                <strong
                  className={
                    indicadores.margemRealizada === null
                      ? ""
                      : indicadores.margemRealizada >= 0
                        ? "financeiro-margem-positiva"
                        : "financeiro-margem-negativa"
                  }
                >
                  {formatarPercentual(
                    indicadores.margemRealizada,
                  )}
                </strong>


                <small>
                  Resultado / Receita
                </small>

              </article>

            </section>


            {/* =============================================
                LEITURA GERENCIAL
            ============================================= */}

            <section className="financeiro-evolucao-painel">

              <div className="financeiro-evolucao-painel-header">

                <div>

                  <span className="financeiro-evolucao-eyebrow">
                    Leitura gerencial
                  </span>

                  <h2>
                    Desempenho do período
                  </h2>

                </div>


                <FiBarChart2 />

              </div>


              <div className="financeiro-evolucao-insights">

                <article>

                  <span>
                    Melhor mês
                  </span>

                  <strong>
                    {indicadores.melhorMes?.mes_nome ||
                      "-"}
                  </strong>

                  <small className="financeiro-insight-positivo">
                    {indicadores.melhorMes
                      ? formatarMoeda(
                          indicadores.melhorMes
                            .resultado_realizado,
                        )
                      : "-"}
                  </small>

                </article>


                <article>

                  <span>
                    Pior mês
                  </span>

                  <strong>
                    {indicadores.piorMes?.mes_nome ||
                      "-"}
                  </strong>

                  <small
                    className={
                      converterNumero(
                        indicadores.piorMes
                          ?.resultado_realizado,
                      ) >= 0
                        ? "financeiro-insight-positivo"
                        : "financeiro-insight-negativo"
                    }
                  >
                    {indicadores.piorMes
                      ? formatarMoeda(
                          indicadores.piorMes
                            .resultado_realizado,
                        )
                      : "-"}
                  </small>

                </article>


                <article>

                  <span>
                    Média mensal
                  </span>

                  <strong
                    className={
                      indicadores.mediaResultado >= 0
                        ? "financeiro-insight-positivo"
                        : "financeiro-insight-negativo"
                    }
                  >
                    {formatarMoeda(
                      indicadores.mediaResultado,
                    )}
                  </strong>

                  <small>
                    Resultado médio
                  </small>

                </article>


                <article>

                  <span>
                    Meses positivos
                  </span>

                  <strong>
                    {indicadores.mesesPositivos}
                    {" / "}
                    {indicadores.mesesComDados}
                  </strong>

                  <small>
                    {indicadores.mesesNegativos} mês(es) negativo(s)
                  </small>

                </article>


                <article>

                  <span>
                    Desvio do resultado
                  </span>

                  <strong
                    className={
                      indicadores.variacaoResultado >=
                      0
                        ? "financeiro-insight-positivo"
                        : "financeiro-insight-negativo"
                    }
                  >
                    {formatarMoeda(
                      indicadores.variacaoResultado,
                    )}
                  </strong>

                  <small>
                    {formatarPercentual(
                      indicadores.variacaoResultadoPercentual,
                    )} vs. previsto
                  </small>

                </article>

              </div>

            </section>


            {/* =============================================
                GRÁFICO RECEITA X DESPESA
            ============================================= */}

            <section className="financeiro-evolucao-painel">

              <div className="financeiro-evolucao-painel-header">

                <div>

                  <span className="financeiro-evolucao-eyebrow">
                    Comparativo mensal
                  </span>

                  <h2>
                    Receita x Despesa
                  </h2>

                </div>


                <div className="financeiro-evolucao-legenda">

                  <span className="financeiro-legenda-receita">
                    Receita
                  </span>

                  <span className="financeiro-legenda-despesa">
                    Despesa
                  </span>

                </div>

              </div>


              <div className="financeiro-evolucao-grafico-wrapper">

                <div className="financeiro-evolucao-grafico">

                  {dados.map(
                    (
                      item,
                    ) => {
                      const receita =
                        converterNumero(
                          item.receita_realizada,
                        );

                      const despesa =
                        converterNumero(
                          item.despesa_realizada,
                        );

                      const resultado =
                        converterNumero(
                          item.resultado_realizado,
                        );


                      const alturaReceita =
                        receita === 0
                          ? 0
                          : Math.max(
                              3,
                              Math.min(
                                100,
                                (
                                  Math.abs(
                                    receita,
                                  ) /
                                  maiorMovimento
                                ) *
                                  100,
                              ),
                            );


                      const alturaDespesa =
                        despesa === 0
                          ? 0
                          : Math.max(
                              3,
                              Math.min(
                                100,
                                (
                                  Math.abs(
                                    despesa,
                                  ) /
                                  maiorMovimento
                                ) *
                                  100,
                              ),
                            );


                      return (
                        <div
                          key={
                            `${item.ano}-${item.mes}`
                          }
                          className="financeiro-evolucao-coluna-mes"
                        >

                          <div className="financeiro-evolucao-valores-topo">

                            <span
                              className="financeiro-evolucao-valor-receita"
                              title={
                                formatarMoeda(
                                  receita,
                                )
                              }
                            >
                              {formatarMoedaCompacta(
                                receita,
                              )}
                            </span>


                            <span
                              className="financeiro-evolucao-valor-despesa"
                              title={
                                formatarMoeda(
                                  despesa,
                                )
                              }
                            >
                              {formatarMoedaCompacta(
                                despesa,
                              )}
                            </span>

                          </div>


                          <div className="financeiro-evolucao-barras-verticais">

                            <div
                              className="financeiro-evolucao-barra-vertical financeiro-evolucao-barra-vertical-receita"
                              style={{
                                height:
                                  `${alturaReceita}%`,
                              }}
                              title={
                                `Receita: ${formatarMoeda(
                                  receita,
                                )}`
                              }
                            />


                            <div
                              className="financeiro-evolucao-barra-vertical financeiro-evolucao-barra-vertical-despesa"
                              style={{
                                height:
                                  `${alturaDespesa}%`,
                              }}
                              title={
                                `Despesa: ${formatarMoeda(
                                  despesa,
                                )}`
                              }
                            />

                          </div>


                          <strong className="financeiro-evolucao-mes-label">
                            {item.mes_nome}
                          </strong>


                          <span
                            className={
                              resultado >=
                              0
                                ? "financeiro-evolucao-resultado-mes financeiro-resultado-positivo"
                                : "financeiro-evolucao-resultado-mes financeiro-resultado-negativo"
                            }
                          >
                            {formatarMoedaCompacta(
                              resultado,
                            )}
                          </span>

                        </div>
                      );
                    },
                  )}

                </div>

              </div>

            </section>


            {/* =============================================
                TABELA
            ============================================= */}

            <section className="financeiro-evolucao-painel">

              <div className="financeiro-evolucao-painel-header">

                <div>

                  <span className="financeiro-evolucao-eyebrow">
                    Detalhamento
                  </span>

                  <h2>
                    Evolução por mês
                  </h2>

                </div>

              </div>


              <div className="financeiro-evolucao-tabela-wrapper">

                <table className="financeiro-evolucao-tabela">

                  <thead>

                    <tr>
                      <th>Mês</th>
                      <th>Receita prevista</th>
                      <th>Receita realizada</th>
                      <th>Despesa prevista</th>
                      <th>Despesa realizada</th>
                      <th>Resultado previsto</th>
                      <th>Resultado realizado</th>
                    </tr>

                  </thead>


                  <tbody>

                    {dados.map(
                      (
                        item,
                      ) => {
                        const resultado =
                          converterNumero(
                            item.resultado_realizado,
                          );

                        return (
                          <tr
                            key={
                              `tabela-${item.ano}-${item.mes}`
                            }
                            className={
                              resultado <
                              0
                                ? "financeiro-evolucao-tabela-negativa"
                                : ""
                            }
                          >
                            <td>
                              <strong>
                                {item.mes_nome}
                              </strong>
                            </td>

                            <td>
                              {formatarMoeda(
                                item.receita_prevista,
                              )}
                            </td>

                            <td>
                              {formatarMoeda(
                                item.receita_realizada,
                              )}
                            </td>

                            <td>
                              {formatarMoeda(
                                item.despesa_prevista,
                              )}
                            </td>

                            <td>
                              {formatarMoeda(
                                item.despesa_realizada,
                              )}
                            </td>

                            <td>
                              {formatarMoeda(
                                item.resultado_previsto,
                              )}
                            </td>

                            <td
                              className={
                                resultado >=
                                0
                                  ? "financeiro-resultado-positivo"
                                  : "financeiro-resultado-negativo"
                              }
                            >
                              <strong>
                                {formatarMoeda(
                                  resultado,
                                )}
                              </strong>
                            </td>
                          </tr>
                        );
                      },
                    )}

                  </tbody>

                </table>

              </div>

            </section>

          </>
        )}


      {!isLoading &&
        !error &&
        dados.length ===
          0 && (

          <div className="financeiro-evolucao-status">
            Nenhum dado encontrado para o período selecionado.
          </div>

        )}

    </main>
  );
}
