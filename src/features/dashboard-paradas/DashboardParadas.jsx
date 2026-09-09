import {
  useState,
} from "react";

import {
  Activity,
  CirclePause,
  RefreshCw,
  Target,
} from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import Sidebar from "@/components/layout/Sidebar";

import FiltrosDashboard from "@/features/dashboard/FiltrosDashboard";

import CriticidadeParadas from "./components/CriticidadeParadas";
import DistribuicaoDuracao from "./components/DistribuicaoDuracao";
import EvolucaoParadas from "./components/EvolucaoParadas";
import HeatmapParadas from "./components/HeatmapParadas";
import JustificativasParadas from "./components/JustificativasParadas";
import ParadasKpis from "./components/ParadasKpis";
import ParetoParadas from "./components/ParetoParadas";
import RankingInjetoras from "./components/RankingInjetoras";
import TopParadas from "./components/TopParadas";

import useDashboardParadas, {
  FILTROS_INICIAIS_PARADAS,
} from "./useDashboardParadas";

import "./DashboardParadas.css";

/* =========================================================
   FORMATAÇÕES
========================================================= */

function formatarPercentual(
  valor,
) {
  return Number(
    valor || 0,
  ).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    },
  );
}

function formatarNumero(
  valor,
) {
  return Number(
    valor || 0,
  ).toLocaleString(
    "pt-BR",
    {
      maximumFractionDigits: 0,
    },
  );
}

/* =========================================================
   DASHBOARD DE PARADAS
========================================================= */

export default function DashboardParadas() {
  /* =======================================================
     FILTROS
  ======================================================= */

  const [
    filtros,
    setFiltros,
  ] = useState(
    () => ({
      ...FILTROS_INICIAIS_PARADAS,

      tipo: [
        ...FILTROS_INICIAIS_PARADAS.tipo,
      ],
    }),
  );

  /* =======================================================
     DADOS CONSOLIDADOS
  ======================================================= */

  const dashboard =
    useDashboardParadas(
      filtros,
    );

  /* =======================================================
     ATALHOS
  ======================================================= */

  const motivoCritico =
    dashboard.motivoMaisCritico;

  const possuiDados =
    dashboard.totalParadas > 0;

  /* =======================================================
     ATUALIZAR DADOS
  ======================================================= */

  async function atualizarDados() {
    if (
      dashboard.loading ||
      dashboard.atualizando
    ) {
      return;
    }

    try {
      await dashboard.recarregarCompleto();
    } catch (erro) {
      console.error(
        "Erro ao atualizar dados do Dashboard de Paradas:",
        erro,
      );
    }
  }

  /* =======================================================
     LOADING INICIAL
  ======================================================= */

  if (dashboard.loading) {
    return (
      <div className="loading-spinner">
        Processando dados de paradas...
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="dashboard-container dp-page">
      {/* ===================================================
          SIDEBAR / FILTROS
      =================================================== */}

      <div className="dp-sidebar-shell">
        <Sidebar>
          <FiltrosDashboard
            filtros={filtros}
            setFiltros={setFiltros}
            rawDados={
              dashboard.rawDados
            }
            tiposDisponiveis={
              dashboard.tiposDisponiveis
            }
            motivosDisponiveis={
              dashboard.motivosDisponiveis
            }
            valoresPadrao={
              FILTROS_INICIAIS_PARADAS
            }
            exibirPeriodo
            exibirInjetora
            exibirTurno={true}
            exibirProduto={false}
            exibirMp={false}
            exibirTipo
            exibirMotivo
            motivoAbaixoTurno
          />
        </Sidebar>
      </div>

      {/* ===================================================
          CONTEÚDO
      =================================================== */}

      <main className="main-content dp-main">
        {/* =================================================
            CABEÇALHO
        ================================================= */}

        <div className="dp-main-fixed">
          <PageHeader
            eyebrow="Análise operacional"
            title="Dashboard de Paradas"
            description="Visão gerencial das perdas, recorrências e principais causas das paradas registradas."
            icon={CirclePause}
            className="dashboard-header dp-header"
          />

          {/* ===============================================
              BARRA DE AÇÕES
          =============================================== */}

          <div className="dp-dashboard-actions">
          <div className="dp-dashboard-actions__status">
            {dashboard.atualizando && (
              <span className="dp-updating">
                Atualizando dados...
              </span>
            )}
          </div>

          <button
            type="button"
            className="dp-refresh-button"
            onClick={
              atualizarDados
            }
            disabled={
              dashboard.atualizando
            }
            title="Buscar novamente os dados atualizados"
          >
            <RefreshCw
              size={15}
              strokeWidth={2.2}
              className={
                dashboard.atualizando
                  ? "dp-refresh-button__icon is-spinning"
                  : "dp-refresh-button__icon"
              }
            />

            <span>
              {dashboard.atualizando
                ? "Atualizando..."
                : "Atualizar dados"}
            </span>
          </button>
          </div>
        </div>

        {/* =================================================
            ÁREA ROLÁVEL DOS DADOS
        ================================================= */}

        <div className="dp-data-scroll">
          {/* ===============================================
              ERRO
          =============================================== */}

          {dashboard.erro && (
          <div className="dashboard-error">
            {dashboard.erro}
          </div>
        )}

        {/* =================================================
            KPIs
        ================================================= */}

        <ParadasKpis
          dados={dashboard}
        />

        {/* =================================================
            INSIGHTS GERENCIAIS
        ================================================= */}

        <section
          className="dp-insights"
          aria-label="Insights principais"
        >
          {/* ===============================================
              MOTIVO MAIS CRÍTICO
          =============================================== */}

          <article className="dp-insight">
            <div className="dp-insight__icon">
              <Activity
                size={19}
                strokeWidth={2}
                aria-hidden="true"
              />
            </div>

            <div className="dp-insight__content">
              <span>
                Motivo mais crítico
              </span>

              <strong>
                {motivoCritico?.motivo ||
                  "Sem dados"}
              </strong>

              <small>
                {motivoCritico
                  ? `${formatarPercentual(
                      motivoCritico.percentual_impacto,
                    )}% do tempo total parado`
                  : "Nenhuma ocorrência encontrada"}
              </small>
            </div>
          </article>

          {/* ===============================================
              CONCENTRAÇÃO TOP 3
          =============================================== */}

          <article className="dp-insight">
            <div className="dp-insight__icon">
              <Target
                size={19}
                strokeWidth={2}
                aria-hidden="true"
              />
            </div>

            <div className="dp-insight__content">
              <span>
                Concentração das perdas
              </span>

              <strong>
                {formatarPercentual(
                  dashboard.concentracaoTop3,
                )}
                %
              </strong>

              <small>
                do tempo parado está concentrado
                nos 3 principais motivos
              </small>
            </div>
          </article>

          {/* ===============================================
              BASE ANALISADA
          =============================================== */}

          <article className="dp-insight">
            <div className="dp-insight__icon">
              <CirclePause
                size={19}
                strokeWidth={2}
                aria-hidden="true"
              />
            </div>

            <div className="dp-insight__content">
              <span>
                Base analisada
              </span>

              <strong>
                {formatarNumero(
                  dashboard.totalParadas,
                )}{" "}
                paradas
              </strong>

              <small>
                conforme os filtros selecionados
              </small>
            </div>
          </article>
        </section>

        {/* =================================================
            SEM DADOS
        ================================================= */}

        {!possuiDados && (
          <div className="dp-empty-page">
            <CirclePause
              size={28}
              strokeWidth={1.7}
              aria-hidden="true"
            />

            <div>
              <strong>
                Nenhuma parada encontrada
              </strong>

              <p>
                Não existem registros de parada
                para os filtros selecionados.
              </p>
            </div>
          </div>
        )}

        {/* =================================================
            CONTEÚDO ANALÍTICO
        ================================================= */}

        {possuiDados && (
          <>
            {/* =============================================
                PRIMEIRA LINHA
                PARETO + EVOLUÇÃO
            ============================================= */}

            <section className="dp-grid dp-grid--principal">
              <ParetoParadas
                dados={
                  dashboard.pareto
                }
                ocorrencias={
                  dashboard.dadosFiltrados
                }
              />

              <EvolucaoParadas
                dados={
                  dashboard.evolucao
                }
                ocorrencias={
                  dashboard.dadosFiltrados
                }
              />
            </section>

            {/* =============================================
                SEGUNDA LINHA
                CRITICIDADE + DISTRIBUIÇÃO
            ============================================= */}

            <section className="dp-grid dp-grid--analise">
              <CriticidadeParadas
                dados={
                  dashboard.criticidade
                }
                ocorrencias={
                  dashboard.dadosFiltrados
                }
              />

              <DistribuicaoDuracao
                dados={
                  dashboard.distribuicaoDuracao
                }
                ocorrencias={
                  dashboard.dadosFiltrados
                }
              />
            </section>

            {/* =============================================
                RANKING DAS MÁQUINAS
            ============================================= */}

            <RankingInjetoras
              dados={
                dashboard.rankingInjetoras
              }
            />

            {/* =============================================
                TERCEIRA LINHA
                HEATMAP + TOP 5
            ============================================= */}

            <section className="dp-grid dp-grid--operacional">
              <HeatmapParadas
                dados={
                  dashboard.heatmap
                }
              />

              <TopParadas
                dados={
                  dashboard.maioresParadas
                }
              />
            </section>

            {/* =============================================
                JUSTIFICATIVAS
            ============================================= */}

            <JustificativasParadas
              dados={
                dashboard.justificativas
              }
            />
          </>
        )}
        </div>
      </main>
    </div>
  );
}