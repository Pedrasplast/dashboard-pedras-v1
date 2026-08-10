import React, {
  useMemo,
  useState,
} from "react";

import {
  Activity,
  Gauge,
  ShieldCheck,
  TimerReset,
  Factory,
  Boxes,
  AlertTriangle,
} from "lucide-react";

import {  useCargaMaquina, } from "@/lib/cargaMaquina";

import FiltrosDashboard from "@/features/dashboard/FiltrosDashboard";

import { calcularOeeCargaMaquina } from "./CalcularOee";

import "./DashboardProdutividade.css";

/* =====================================================
   FILTROS INICIAIS
======================================================== */

const criarFiltrosIniciais = () => ({
  dataInicio: "",
  dataFim: "",

  injetora: "Todos",

  cod_prod: "Todos",

  mp: "Todos",

  tipo: [],
});

/* =====================================================
   DATA DO REGISTRO
===================================================== */

function obterDataRegistro(item) {
  const valor =
    item?.lista_de_data ||
    item?.inicio ||
    item?.inicio_dia ||
    item?.data ||
    null;

  if (!valor) {
    return "";
  }

  const texto =
    String(valor).trim();

  const correspondencia =
    texto.match(
      /^(\d{4})-(\d{2})-(\d{2})/,
    );

  if (!correspondencia) {
    return "";
  }

  return [
    correspondencia[1],
    correspondencia[2],
    correspondencia[3],
  ].join("-");
}

/* =====================================================
   NORMALIZA VALOR
===================================================== */

function normalizarValor(valor) {
  return String(
    valor ?? "",
  ).trim();
}

/* =====================================================
   IDENTIFICA PARADA
===================================================== */

function registroEhParada(item) {
  const tipo =
    normalizarValor(
      item?.tipo,
    );

  return (
    tipo === "1" ||
    tipo === "2" ||
    tipo === "3"
  );
}

/* =====================================================
   FORMATAÇÕES
===================================================== */

function formatarPercentual(valor) {
  const numero =
    Number(valor) || 0;

  return `${numero.toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    },
  )}%`;
}

function formatarNumero(valor) {
  const numero =
    Number(valor) || 0;

  return numero.toLocaleString(
    "pt-BR",
    {
      maximumFractionDigits: 0,
    },
  );
}

/* =====================================================
   COMPONENTE KPI
===================================================== */

function KpiCard({
  titulo,
  valor,
  descricao,
  Icone,
  destaque = false,
  aviso = false,
}) {
  return (
    <article
      className={`oee-kpi-card ${
        destaque
          ? "oee-kpi-card-destaque"
          : ""
      }`}
    >
      <div className="oee-kpi-topo">
        <div className="oee-kpi-icone">
          <Icone size={20} />
        </div>

        {aviso && (
          <span className="oee-kpi-aviso">
            estimado
          </span>
        )}
      </div>

      <span className="oee-kpi-titulo">
        {titulo}
      </span>

      <strong className="oee-kpi-valor">
        {valor}
      </strong>

      <span className="oee-kpi-descricao">
        {descricao}
      </span>
    </article>
  );
}

/* =====================================================
   BARRA DE INDICADOR
===================================================== */

function IndicadorBarra({
  titulo,
  valor,
}) {
  const percentual =
    Math.max(
      0,
      Math.min(
        100,
        Number(valor) || 0,
      ),
    );

  return (
    <div className="oee-indicador-barra">
      <div className="oee-indicador-barra-topo">
        <span>
          {titulo}
        </span>

        <strong>
          {formatarPercentual(
            percentual,
          )}
        </strong>
      </div>

      <div className="oee-barra-track">
        <div
          className="oee-barra-progresso"
          style={{
            width: `${percentual}%`,
          }}
        />
      </div>
    </div>
  );
}

/* =====================================================
   DASHBOARD
===================================================== */

function DashboardProdutividade() {
  const {
    dados,
    loading,
    erro,
  } =
    useCargaMaquina();

  const [
    filtros,
    setFiltros,
  ] =
    useState(
      criarFiltrosIniciais,
    );

  /* =====================================================
     TIPOS DISPONÍVEIS
  ===================================================== */

  const tiposDisponiveis =
    useMemo(() => {
      if (
        !Array.isArray(dados)
      ) {
        return [];
      }

      return [
        ...new Set(
          dados
            .map(
              (item) =>
                normalizarValor(
                  item.tipo,
                ),
            )
            .filter(
              (tipo) =>
                [
                  "1",
                  "2",
                  "3",
                ].includes(
                  tipo,
                ),
            ),
        ),
      ].sort(
        (a, b) =>
          Number(a) -
          Number(b),
      );
    }, [dados]);

  /* =====================================================
     PRODUTOS DISPONÍVEIS

     REGRA:

     - Só mostra produtos se uma injetora estiver selecionada
     - Só mostra produtos que tenham registro naquela injetora
     - Se houver período, também respeita o período
  ===================================================== */

  const produtosDisponiveis =
    useMemo(() => {
      if (
        !Array.isArray(dados)
      ) {
        return [];
      }

      if (
        !filtros.injetora ||
        filtros.injetora ===
          "Todos"
      ) {
        return [];
      }

      const injetoraSelecionada =
        normalizarValor(
          filtros.injetora,
        ).toLocaleUpperCase(
          "pt-BR",
        );

      const produtos =
        dados
          .filter(
            (item) => {
              const injetoraRegistro =
                normalizarValor(
                  item.injetora,
                ).toLocaleUpperCase(
                  "pt-BR",
                );

              if (
                injetoraRegistro !==
                injetoraSelecionada
              ) {
                return false;
              }

              const dataRegistro =
                obterDataRegistro(
                  item,
                );

              if (
                filtros.dataInicio &&
                (
                  !dataRegistro ||
                  dataRegistro <
                    filtros.dataInicio
                )
              ) {
                return false;
              }

              if (
                filtros.dataFim &&
                (
                  !dataRegistro ||
                  dataRegistro >
                    filtros.dataFim
                )
              ) {
                return false;
              }

              const produto =
                normalizarValor(
                  item.cod_prod,
                );

              if (!produto) {
                return false;
              }

              return true;
            },
          )
          .map(
            (item) =>
              normalizarValor(
                item.cod_prod,
              ),
          );

      return [
        ...new Set(
          produtos,
        ),
      ].sort(
        (a, b) =>
          a.localeCompare(
            b,
            "pt-BR",
            {
              numeric: true,
              sensitivity:
                "base",
            },
          ),
      );
    }, [
      dados,
      filtros.injetora,
      filtros.dataInicio,
      filtros.dataFim,
    ]);

  /* =====================================================
     MATÉRIAS-PRIMAS
  ===================================================== */

  const mpsDisponiveis =
    useMemo(() => {
      if (
        !Array.isArray(dados)
      ) {
        return [];
      }

      return [
        ...new Set(
          dados
            .map(
              (item) =>
                normalizarValor(
                  item.mp,
                ),
            )
            .filter(Boolean),
        ),
      ].sort(
        (a, b) =>
          String(a).localeCompare(
            String(b),
            "pt-BR",
            {
              sensitivity:
                "base",
            },
          ),
      );
    }, [dados]);

  /* =====================================================
     BASE OPERACIONAL DO OEE

     FILTRA:
     - período
     - injetora

     NÃO filtra produto.
  ===================================================== */

  const dadosBaseOee =
    useMemo(() => {
      if (
        !Array.isArray(dados)
      ) {
        return [];
      }

      return dados.filter(
        (item) => {
          /* DATA */

          const data =
            obterDataRegistro(
              item,
            );

          if (
            filtros.dataInicio &&
            (
              !data ||
              data <
                filtros.dataInicio
            )
          ) {
            return false;
          }

          if (
            filtros.dataFim &&
            (
              !data ||
              data >
                filtros.dataFim
            )
          ) {
            return false;
          }

          /* INJETORA */

          if (
            filtros.injetora &&
            filtros.injetora !==
              "Todos" &&
            normalizarValor(
              item.injetora,
            ) !==
              normalizarValor(
                filtros.injetora,
              )
          ) {
            return false;
          }

          return true;
        },
      );
    }, [
      dados,
      filtros.dataInicio,
      filtros.dataFim,
      filtros.injetora,
    ]);

  /* =====================================================
     BASE FINAL PARA CÁLCULO DO OEE

     PRODUTO = TODOS:
     usa toda a base.

     PRODUTO selecionado:
     - mantém paradas
     - filtra apenas produção pelo produto
  ===================================================== */

  const dadosCalculoOee =
    useMemo(() => {
      if (
        !Array.isArray(
          dadosBaseOee,
        )
      ) {
        return [];
      }

      if (
        !filtros.cod_prod ||
        filtros.cod_prod ===
          "Todos"
      ) {
        return dadosBaseOee;
      }

      const produtoSelecionado =
        normalizarValor(
          filtros.cod_prod,
        );

      return dadosBaseOee.filter(
        (item) => {
          if (
            registroEhParada(
              item,
            )
          ) {
            return true;
          }

          return (
            normalizarValor(
              item.cod_prod,
            ) ===
            produtoSelecionado
          );
        },
      );
    }, [
      dadosBaseOee,
      filtros.cod_prod,
    ]);

  /* =====================================================
     HISTÓRICO PARA PERFORMANCE

     Se houver injetora selecionada:
     usa histórico daquela injetora.
  ===================================================== */

  const dadosHistoricosPerformance =
    useMemo(() => {
      if (
        !Array.isArray(dados)
      ) {
        return [];
      }

      if (
        !filtros.injetora ||
        filtros.injetora ===
          "Todos"
      ) {
        return dados;
      }

      return dados.filter(
        (item) =>
          normalizarValor(
            item.injetora,
          ) ===
          normalizarValor(
            filtros.injetora,
          ),
      );
    }, [
      dados,
      filtros.injetora,
    ]);

  /* =====================================================
     CALCULA OEE
  ===================================================== */

  const indicadores =
    useMemo(() => {
      return calcularOeeCargaMaquina(
        dadosCalculoOee,
        dadosHistoricosPerformance,
      );
    }, [
      dadosCalculoOee,
      dadosHistoricosPerformance,
    ]);

  /* =====================================================
     REFUGO
  ===================================================== */

  const refugoPercentual =
    useMemo(() => {
      if (
        indicadores.totalProduzido <=
        0
      ) {
        return 0;
      }

      return (
        indicadores.danificada /
        indicadores.totalProduzido
      ) * 100;
    }, [
      indicadores,
    ]);

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="produtividade-loading">
        <div className="produtividade-spinner" />

        <span>
          Carregando indicadores de produtividade...
        </span>
      </div>
    );
  }

  /* =====================================================
     ERRO
  ===================================================== */

  if (erro) {
    return (
      <div className="produtividade-erro">
        <AlertTriangle
          size={22}
        />

        <div>
          <strong>
            Não foi possível carregar o dashboard
          </strong>

          <span>
            {erro}
          </span>
        </div>
      </div>
    );
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="produtividade-layout">
      <main className="produtividade-main">

        {/* CABEÇALHO */}

        <header className="produtividade-header">
          <div>
            <span className="produtividade-subtitle">
              Eficiência global da produção
            </span>

            <h1>
              Dashboard de OEE
            </h1>

            <p>
              Disponibilidade, performance,
              qualidade e eficiência global
              da produção.
            </p>
          </div>
        </header>

        {/* FILTROS */}

        <section className="produtividade-filtros-card">
          <div className="produtividade-section-header">
            <div>
              <h2>
                Filtros
              </h2>

              <p>
                Refine os indicadores por período,
                injetora ou produto.
              </p>
            </div>
          </div>

          <FiltrosDashboard
            filtros={
              filtros
            }

            setFiltros={
              setFiltros
            }

            rawDados={
              dados
            }

            exibirPeriodo

            exibirInjetora

            exibirProduto

            exibirMp={
              false
            }

            exibirTipo={
              false
            }

            tiposDisponiveis={
              tiposDisponiveis
            }

            produtosDisponiveis={
              produtosDisponiveis
            }

            mpsDisponiveis={
              mpsDisponiveis
            }
          />
        </section>

        {/* KPIs */}

        <section className="oee-kpis-grid">
          <KpiCard
            titulo="Disponibilidade"

            valor={
              formatarPercentual(
                indicadores.disponibilidade,
              )
            }

            descricao="Tempo produtivo sobre o tempo considerado."

            Icone={
              TimerReset
            }
          />

          <KpiCard
            titulo="Performance"

            valor={
              formatarPercentual(
                indicadores.performance,
              )
            }

            descricao="Eficiência frente ao melhor ciclo histórico."

            Icone={
              Gauge
            }

            aviso
          />

          <KpiCard
            titulo="Qualidade"

            valor={
              formatarPercentual(
                indicadores.qualidade,
              )
            }

            descricao="Peças conformes sobre a produção total."

            Icone={
              ShieldCheck
            }
          />

          <KpiCard
            titulo="OEE"

            valor={
              formatarPercentual(
                indicadores.oee,
              )
            }

            descricao="Eficiência global calculada pelos três fatores."

            Icone={
              Activity
            }

            destaque
          />
        </section>

        {/* DETALHAMENTO */}

        <section className="produtividade-grid-detalhes">

          <article className="produtividade-card produtividade-card-indicadores">
            <div className="produtividade-card-header">
              <div>
                <span className="produtividade-card-eyebrow">
                  Indicadores
                </span>

                <h2>
                  Composição do OEE
                </h2>
              </div>
            </div>

            <div className="oee-indicadores-lista">
              <IndicadorBarra
                titulo="Disponibilidade"

                valor={
                  indicadores.disponibilidade
                }
              />

              <IndicadorBarra
                titulo="Performance"

                valor={
                  indicadores.performance
                }
              />

              <IndicadorBarra
                titulo="Qualidade"

                valor={
                  indicadores.qualidade
                }
              />

              <IndicadorBarra
                titulo="OEE"

                valor={
                  indicadores.oee
                }
              />
            </div>
          </article>

          {/* TEMPO */}

          <article className="produtividade-card">
            <div className="produtividade-card-header">
              <div>
                <span className="produtividade-card-eyebrow">
                  Disponibilidade
                </span>

                <h2>
                  Tempo operacional
                </h2>
              </div>

              <Factory
                size={19}
              />
            </div>

            <div className="produtividade-metricas-lista">
              <div className="produtividade-metrica">
                <span>
                  Tempo produzindo
                </span>

                <strong>
                  {
                    indicadores.tempoProduzindo
                  }
                </strong>
              </div>

              <div className="produtividade-metrica">
                <span>
                  Tempo parado
                </span>

                <strong>
                  {
                    indicadores.tempoParado
                  }
                </strong>
              </div>

              <div className="produtividade-metrica produtividade-metrica-destaque">
                <span>
                  Tempo considerado
                </span>

                <strong>
                  {
                    indicadores.tempoConsiderado
                  }
                </strong>
              </div>
            </div>
          </article>

          {/* QUALIDADE */}

          <article className="produtividade-card">
            <div className="produtividade-card-header">
              <div>
                <span className="produtividade-card-eyebrow">
                  Qualidade
                </span>

                <h2>
                  Produção e refugo
                </h2>
              </div>

              <Boxes
                size={19}
              />
            </div>

            <div className="produtividade-metricas-lista">
              <div className="produtividade-metrica">
                <span>
                  Conformes
                </span>

                <strong>
                  {formatarNumero(
                    indicadores.conforme,
                  )}
                </strong>
              </div>

              <div className="produtividade-metrica">
                <span>
                  Danificadas
                </span>

                <strong>
                  {formatarNumero(
                    indicadores.danificada,
                  )}
                </strong>
              </div>

              <div className="produtividade-metrica">
                <span>
                  Total produzido
                </span>

                <strong>
                  {formatarNumero(
                    indicadores.totalProduzido,
                  )}
                </strong>
              </div>

              <div className="produtividade-metrica produtividade-metrica-destaque">
                <span>
                  Refugo
                </span>

                <strong>
                  {formatarPercentual(
                    refugoPercentual,
                  )}
                </strong>
              </div>
            </div>
          </article>
        </section>

        {/* OBSERVAÇÃO */}

        <section className="produtividade-nota">
          <Gauge
            size={17}
          />

          <p>
            <strong>
              Performance estimada:
            </strong>{" "}

            o cálculo utiliza como referência
            os melhores ciclos históricos
            encontrados na tabela{" "}

            <code>
              carga_maquina
            </code>.

            Quando houver ciclo padrão técnico
            cadastrado por produto, podemos
            substituir essa referência sem alterar
            o restante do dashboard.
          </p>
        </section>
      </main>
    </div>
  );
}

export default DashboardProdutividade;