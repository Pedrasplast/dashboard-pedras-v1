import { useMemo, useState } from "react";
import {
  Calculator,
  CheckCircle2,
  Clock,
  Factory,
  PauseCircle,
  Target,
  XCircle,
} from "lucide-react";

import Sidebar from "@/components/layout/Sidebar";
import PageHeader from "@/components/layout/PageHeader";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { valoresUnicosOrdenados } from "@/lib/colecoes";
import { useCargaMaquina } from "@/lib/cargaMaquina";

import FiltrosDashboard from "./FiltrosDashboard";
import {
  filtrarRegistrosDashboard,
} from "./dashboard.utils";
import {
  KpiHoras,
  KpiSimples,
  MotivosParada,
} from "./components/DashboardIndicadores";

import "./Dashboard.css";

const FILTROS_INICIAIS = Object.freeze({
  injetora: "Todos",
  cod_prod: "Todos",
  turno: "Todos",
  tipo: [],
  dataInicio: "",
  dataFim: "",
});

function formatarPercentualInteiro(valor) {
  const numero = Number(valor);
  return Math.round(Number.isFinite(numero) ? numero : 0).toLocaleString("pt-BR");
}

export default function Dashboard() {
  const { dados: rawDados, loading, erro } = useCargaMaquina();
  const [filtros, setFiltros] = useState(() => ({ ...FILTROS_INICIAIS }));

  const tiposDisponiveis = useMemo(
    () => valoresUnicosOrdenados(rawDados.map((registro) => registro.tipo)),
    [rawDados],
  );

  const produtosDisponiveis = useMemo(() => {
    const baseProdutos =
      filtros.injetora === "Todos"
        ? rawDados
        : rawDados.filter((registro) => registro.injetora === filtros.injetora);

    return valoresUnicosOrdenados(baseProdutos.map((registro) => registro.cod_prod));
  }, [rawDados, filtros.injetora]);

  const dadosFiltrados = useMemo(
    () => filtrarRegistrosDashboard(rawDados, filtros),
    [
      rawDados,
      filtros.injetora,
      filtros.cod_prod,
      filtros.turno,
      filtros.dataInicio,
      filtros.dataFim,
    ],
  );

  // O filtro TIPO permanece no hook para preservar a regra de cálculo atual.
  const metrics = useDashboardMetrics(dadosFiltrados, filtros.tipo);

  const horasTotaisDec = Number(metrics?.horasTotaisDec || 0);
  const percentualHoraTrabalhada =
    horasTotaisDec > 0
      ? (Number(metrics?.horasTrabalhadasDec || 0) / horasTotaisDec) * 100
      : 0;
  const percentualHoraParada =
    horasTotaisDec > 0
      ? (Number(metrics?.horasParadasDec || 0) / horasTotaisDec) * 100
      : 0;

  if (loading) {
    return <div className="loading-spinner">Processando dados de produção...</div>;
  }

  return (
    <div className="dashboard-container">
      <Sidebar>
        <FiltrosDashboard
          filtros={filtros}
          setFiltros={setFiltros}
          rawDados={rawDados}
          tiposDisponiveis={tiposDisponiveis}
          produtosDisponiveis={produtosDisponiveis}
          exibirPeriodo
          exibirInjetora
          exibirTurno
          exibirProduto
          exibirMp={false}
          exibirTipo
        />
      </Sidebar>

      <main className="main-content">
        <PageHeader
          eyebrow="Produção"
          title="Dashboard de Produção"
          description="Indicadores consolidados de produção, qualidade e horas trabalhadas."
          icon={Factory}
          className="dashboard-header"
        />

        {erro && <div className="dashboard-error">{erro}</div>}

        <section className="kpi-grid">
          <KpiSimples
            className="verde"
            Icone={CheckCircle2}
            classeIcone="kpi-icon-conforme"
            titulo="CONFORME"
            valor={Number(metrics?.totalConforme || 0).toLocaleString("pt-BR")}
          />

          <KpiSimples
            className="vermelho"
            Icone={XCircle}
            classeIcone="kpi-icon-danificadas"
            titulo="DANIFICADAS"
            valor={Number(metrics?.totalDanificadas || 0).toLocaleString("pt-BR")}
          />

          <KpiSimples
            className="verde"
            Icone={Target}
            classeIcone="kpi-icon-qualidade"
            titulo="QUALIDADE"
            valor={`${Number(metrics?.qualidade || 0).toFixed(2)} %`}
          />

          <KpiHoras
            className="verde"
            Icone={Clock}
            classeIcone="kpi-icon-horas"
            titulo="HORA TRABALHADA"
            dias={metrics?.diasTrabalhados || "0.00"}
            percentual={formatarPercentualInteiro(percentualHoraTrabalhada)}
            classePercentual="percentual-horas-indicador-trabalhadas"
            valor={metrics?.horasTrabalhadas || "00:00"}
          />

          <KpiHoras
            className="vermelho"
            Icone={PauseCircle}
            classeIcone="kpi-icon-paradas"
            titulo="HORA PARADA"
            dias={metrics?.diasParados || "0d 00h"}
            percentual={formatarPercentualInteiro(percentualHoraParada)}
            classePercentual="percentual-horas-indicador-paradas"
            valor={metrics?.horasParadas || "00:00"}
          />

          <KpiHoras
            className="verde"
            Icone={Calculator}
            classeIcone="kpi-icon-horas"
            titulo="TOTAL DE HORAS"
            dias={metrics?.diasTotais || "0d 00h"}
            valor={metrics?.horasTotais || "00:00"}
          />
        </section>

        <MotivosParada motivos={metrics?.motivos || []} />
      </main>
    </div>
  );
}
