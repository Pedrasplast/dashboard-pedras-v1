import {
  memo,
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

import {
  useCargaMaquina,
} from "@/lib/cargaMaquina";

import FiltrosDashboard from "@/features/dashboard/FiltrosDashboard";
import PageHeader from "@/components/layout/PageHeader";

import { calcularOeeCargaMaquina } from "./CalcularOee";
import {
  filtrarDadosBaseOee,
  filtrarDadosCalculoOee,
  filtrarHistoricoPerformanceOee,
  obterMateriasPrimasDisponiveisOee,
  obterProdutosDisponiveisOee,
  obterTiposDisponiveisOee,
} from "./oee.utils";

import "./dashboardProdutividade.css";

/* =================================================
   FILTROS INICIAIS
====================================================*/

const criarFiltrosIniciais = () => ({
  dataInicio: "",
  dataFim: "",

  injetora: "Todos",

  cod_prod: "Todos",

  mp: "Todos",

  tipo: [],
});

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

const KpiCard = memo(function KpiCard({
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
});

/* =====================================================
   BARRA DE INDICADOR
===================================================== */

const IndicadorBarra = memo(function IndicadorBarra({
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
});

/* =====================================================
   DASHBOARD ORIGINAL

   PRESERVADO PARA VALIDAÇÃO DAS MÉTRICAS
===================================================== */

function DashboardProdutividadeEmValidacao() {
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

  const tiposDisponiveis = useMemo(
    () => obterTiposDisponiveisOee(dados),
    [dados],
  );

  /* =====================================================
     PRODUTOS DISPONÍVEIS

     Mantém a regra original:
     - exige injetora selecionada;
     - respeita o período;
     - lista somente produtos daquela injetora.
  ===================================================== */

  const produtosDisponiveis = useMemo(
    () => obterProdutosDisponiveisOee(dados, filtros),
    [dados, filtros.injetora, filtros.dataInicio, filtros.dataFim],
  );

  /* =====================================================
     MATÉRIAS-PRIMAS
  ===================================================== */

  const mpsDisponiveis = useMemo(
    () => obterMateriasPrimasDisponiveisOee(dados),
    [dados],
  );

  /* =====================================================
     BASE OPERACIONAL DO OEE

     Filtra período e injetora, sem filtrar produto.
  ===================================================== */

  const dadosBaseOee = useMemo(
    () => filtrarDadosBaseOee(dados, filtros),
    [dados, filtros.dataInicio, filtros.dataFim, filtros.injetora],
  );

  /* =====================================================
     BASE FINAL PARA CÁLCULO DO OEE

     Com produto selecionado, mantém paradas e filtra
     somente os registros de produção pelo produto.
  ===================================================== */

  const dadosCalculoOee = useMemo(
    () => filtrarDadosCalculoOee(dadosBaseOee, filtros.cod_prod),
    [dadosBaseOee, filtros.cod_prod],
  );

  /* =====================================================
     HISTÓRICO PARA PERFORMANCE
  ===================================================== */

  const dadosHistoricosPerformance = useMemo(
    () => filtrarHistoricoPerformanceOee(dados, filtros.injetora),
    [dados, filtros.injetora],
  );

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
     RENDER ORIGINAL
  ===================================================== */

  return (
    <div className="produtividade-layout">
      <main className="produtividade-main">

        {/* CABEÇALHO */}

        <PageHeader
          eyebrow="Eficiência global da produção"
          title="Dashboard de OEE"
          description="Disponibilidade, performance, qualidade e eficiência global da produção."
          icon={Gauge}
          className="produtividade-header"
        />

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
        </section>
      </main>
    </div>
  );
}

/* =====================================================
   TELA TEMPORÁRIA

   ESTA É A TELA QUE O SISTEMA EXIBE ATUALMENTE.

   O DASHBOARD ORIGINAL CONTINUA PRESERVADO ACIMA
   EM DashboardProdutividadeEmValidacao.
===================================================== */

function DashboardProdutividade() {
  return (
    <div className="produtividade-layout">
      <main
        className="produtividade-main"
        style={{
          minHeight:
            "calc(100vh - 80px)",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          padding:
            "40px 24px",
        }}
      >
        <section
          className="produtividade-card"
          style={{
            width:
              "100%",

            maxWidth:
              "680px",

            padding:
              "56px 40px",

            textAlign:
              "center",
          }}
        >
          <div
            style={{
              width:
                "72px",

              height:
                "72px",

              margin:
                "0 auto 24px",

              borderRadius:
                "18px",

              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              background:
                "#fff7ed",

              color:
                "#ea580c",
            }}
          >
            <AlertTriangle
              size={34}
            />
          </div>

          <span className="produtividade-subtitle">
            Dashboard de OEE
          </span>

          <h1
            style={{
              marginTop:
                "10px",

              marginBottom:
                "14px",
            }}
          >
            Tela em construção
          </h1>

          <p
            style={{
              maxWidth:
                "500px",

              margin:
                "0 auto",

              lineHeight:
                "1.7",
            }}
          >
            Os indicadores e métricas de OEE
            ainda estão em fase de validação.
            Esta tela será disponibilizada
            após a conclusão das validações.
          </p>

          <div
            style={{
              marginTop:
                "28px",

              padding:
                "14px 18px",

              borderRadius:
                "10px",

              background:
                "#f8fafc",

              border:
                "1px solid #e2e8f0",

              fontSize:
                "0.82rem",

              color:
                "#64748b",
            }}
          >
            Disponibilidade • Performance • Qualidade • OEE
          </div>
        </section>
      </main>
    </div>
  );
}

export default DashboardProdutividade;
