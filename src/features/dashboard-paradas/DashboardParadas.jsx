import { useState } from "react";

import { Activity, CirclePause, Target } from "lucide-react";

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

import useDashboardParadas, { FILTROS_INICIAIS_PARADAS } from "./useDashboardParadas";

import "./DashboardParadas.css";

/* =========================================================
   FORMATAÇÕES
========================================================= */

function formatarPercentual(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    maximumFractionDigits: 0,
  });
}

/* =========================================================
   DASHBOARD DE PARADAS
========================================================= */

export default function DashboardParadas() {
  /* =======================================================
     FILTROS

     Cada dashboard mantém seu próprio estado.

     O componente visual dos filtros continua sendo o mesmo
     utilizado no Dashboard de Produção.
  ======================================================= */

  const [filtros, setFiltros] = useState(() => ({
    ...FILTROS_INICIAIS_PARADAS,

    tipo: [...FILTROS_INICIAIS_PARADAS.tipo],
  }));

  /* =======================================================
     DADOS CONSOLIDADOS
  ======================================================= */

  const dashboard = useDashboardParadas(filtros);

  /* =======================================================
     ATALHOS
  ======================================================= */

  const motivoCritico = dashboard.motivoMaisCritico;

  const possuiDados = dashboard.totalParadas > 0;

  /* =======================================================
     LOADING
  ======================================================= */

  if (dashboard.loading) {
    return <div className="loading-spinner">Processando dados de paradas...</div>;
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="dashboard-container dp-page">
      {/* ===================================================
          SIDEBAR / FILTROS
      =================================================== */}

      <Sidebar>
        <FiltrosDashboard
          filtros={filtros}
          setFiltros={setFiltros}
          rawDados={dashboard.rawDados}
          tiposDisponiveis={dashboard.tiposDisponiveis}
          motivosDisponiveis={dashboard.motivosDisponiveis}
          valoresPadrao={FILTROS_INICIAIS_PARADAS}
          exibirPeriodo
          exibirInjetora
          exibirTurno={true}
          exibirProduto={false}
          exibirMp={false}
          exibirTipo
          exibirMotivo
        />
      </Sidebar>

      {/* ===================================================
          CONTEÚDO
      =================================================== */}

      <main className="main-content dp-main">
        {/* =================================================
            CABEÇALHO
        ================================================= */}

        <PageHeader
          eyebrow="Análise operacional"
          title="Dashboard de Paradas"
          description="Visão gerencial das perdas, recorrências e principais causas das paradas registradas."
          icon={CirclePause}
          className="dashboard-header dp-header"
        />

        {/* =================================================
            ERRO
        ================================================= */}

        {dashboard.erro && <div className="dashboard-error">{dashboard.erro}</div>}

        {/* =================================================
            INDICADOR DE ATUALIZAÇÃO

            Não é botão.
            Apenas informa caso o React Query esteja
            atualizando os dados em segundo plano.
        ================================================= */}

        {dashboard.atualizando && !dashboard.loading && (
          <div className="dp-updating">Atualizando dados...</div>
        )}

        {/* =================================================
            KPIs
        ================================================= */}

        <ParadasKpis dados={dashboard} />

        {/* =================================================
            INSIGHTS GERENCIAIS
        ================================================= */}

        <section className="dp-insights" aria-label="Insights principais">
          {/* ===============================================
              MOTIVO MAIS CRÍTICO
          =============================================== */}

          <article className="dp-insight">
            <div className="dp-insight__icon">
              <Activity size={19} strokeWidth={2} aria-hidden="true" />
            </div>

            <div className="dp-insight__content">
              <span>Motivo mais crítico</span>

              <strong>{motivoCritico?.motivo || "Sem dados"}</strong>

              <small>
                {motivoCritico
                  ? `${formatarPercentual(motivoCritico.percentual_impacto)}% do tempo total parado`
                  : "Nenhuma ocorrência encontrada"}
              </small>
            </div>
          </article>

          {/* ===============================================
              CONCENTRAÇÃO TOP 3
          =============================================== */}

          <article className="dp-insight">
            <div className="dp-insight__icon">
              <Target size={19} strokeWidth={2} aria-hidden="true" />
            </div>

            <div className="dp-insight__content">
              <span>Concentração das perdas</span>

              <strong>{formatarPercentual(dashboard.concentracaoTop3)}%</strong>

              <small>do tempo parado está concentrado nos 3 principais motivos</small>
            </div>
          </article>

          {/* ===============================================
              BASE ANALISADA
          =============================================== */}

          <article className="dp-insight">
            <div className="dp-insight__icon">
              <CirclePause size={19} strokeWidth={2} aria-hidden="true" />
            </div>

            <div className="dp-insight__content">
              <span>Base analisada</span>

              <strong>{formatarNumero(dashboard.totalParadas)} paradas</strong>

              <small>conforme os filtros selecionados</small>
            </div>
          </article>
        </section>

        {/* =================================================
            SEM DADOS
        ================================================= */}

        {!possuiDados && (
          <div className="dp-empty-page">
            <CirclePause size={28} strokeWidth={1.7} aria-hidden="true" />

            <div>
              <strong>Nenhuma parada encontrada</strong>

              <p>Não existem registros de parada para os filtros selecionados.</p>
            </div>
          </div>
        )}

        {/* =================================================
            CONTEÚDO ANALÍTICO

            Só renderizamos os gráficos quando existem
            registros no período.
        ================================================= */}

        {possuiDados && (
          <>
            {/* =============================================
                PRIMEIRA LINHA
                PARETO + EVOLUÇÃO
            ============================================= */}

            <section className="dp-grid dp-grid--principal">
              <ParetoParadas dados={dashboard.pareto} ocorrencias={dashboard.dadosFiltrados} />

              <EvolucaoParadas dados={dashboard.evolucao} ocorrencias={dashboard.dadosFiltrados} />
            </section>

            {/* =============================================
                SEGUNDA LINHA
                CRITICIDADE + DISTRIBUIÇÃO
            ============================================= */}

            <section className="dp-grid dp-grid--analise">
              <CriticidadeParadas
                dados={dashboard.criticidade}
                ocorrencias={dashboard.dadosFiltrados}
              />

              <DistribuicaoDuracao
                dados={dashboard.distribuicaoDuracao}
                ocorrencias={dashboard.dadosFiltrados}
              />
            </section>

            {/* =============================================
                RANKING DAS MÁQUINAS
            ============================================= */}

            <RankingInjetoras dados={dashboard.rankingInjetoras} />

            {/* =============================================
                TERCEIRA LINHA
                HEATMAP + TOP 5
            ============================================= */}

            <section className="dp-grid dp-grid--operacional">
              <HeatmapParadas dados={dashboard.heatmap} />

              <TopParadas dados={dashboard.maioresParadas} />
            </section>

            {/* =============================================
                JUSTIFICATIVAS
            ============================================= */}

            <JustificativasParadas dados={dashboard.justificativas} />
          </>
        )}
      </main>
    </div>
  );
}
