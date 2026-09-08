import {
  AlertTriangle,
  Clock3,
  Factory,
  TimerOff,
  TimerReset,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import {
  formatarDuracaoResumida,
} from "../dashboardParadas.utils";

/* =========================================================
   FORMATAÇÃO
========================================================= */

function formatarNumero(valor) {
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
   VARIAÇÃO VS. PERÍODO ANTERIOR
========================================================= */

function Variacao({
  valor,
}) {
  if (
    valor === null ||
    valor === undefined ||
    !Number.isFinite(
      Number(valor),
    )
  ) {
    return null;
  }

  const numero =
    Number(valor);

  /*
   * Para indicadores de parada:
   *
   * cair = bom
   * subir = ruim
   */
  const melhorou =
    numero < 0;

  const Icone =
    melhorou
      ? TrendingDown
      : TrendingUp;

  return (
    <span
      className={[
        "dp-kpi__variacao",

        melhorou
          ? "melhor"
          : "pior",
      ].join(" ")}
    >
      <Icone
        size={13}
        strokeWidth={2.2}
        aria-hidden="true"
      />

      <span>
        {Math.abs(
          numero,
        ).toLocaleString(
          "pt-BR",
          {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          },
        )}
        %
      </span>

      <small>
        vs. período anterior
      </small>
    </span>
  );
}

/* =========================================================
   CARD DE KPI

   Componente interno reaproveitado pelos 5 indicadores.
========================================================= */

function KpiCard({
  icon: Icone,
  label,
  value,
  detail,
  variacao,
  tone = "neutral",
}) {
  return (
    <article
      className={[
        "dp-kpi",
        `dp-kpi--${tone}`,
      ].join(" ")}
    >
      <div className="dp-kpi__top">
        <span className="dp-kpi__label">
          {label}
        </span>

        <div className="dp-kpi__icon">
          <Icone
            size={19}
            strokeWidth={2}
            aria-hidden="true"
          />
        </div>
      </div>

      <strong className="dp-kpi__value">
        {value}
      </strong>

      <span className="dp-kpi__detail">
        {detail}
      </span>

      <Variacao
        valor={variacao}
      />
    </article>
  );
}

/* =========================================================
   KPIs DO DASHBOARD DE PARADAS
========================================================= */

export default function ParadasKpis({
  dados,
}) {
  const maior =
    dados?.maiorParada;

  const maquina =
    dados?.maquinaMaisImpactada;

  const comparativo =
    dados?.comparativo || {};

  return (
    <section
      className="dp-kpis"
      aria-label="Indicadores principais de paradas"
    >
      {/* ===================================================
          TEMPO TOTAL PARADO
      =================================================== */}

      <KpiCard
        icon={TimerOff}
        label="Tempo total parado"
        value={
          formatarDuracaoResumida(
            dados?.tempoTotalSegundos,
          )
        }
        detail={`${formatarNumero(
          dados?.totalParadas,
        )} lançamentos considerados`}
        variacao={
          comparativo.tempoTotal
        }
        tone="danger"
      />

      {/* ===================================================
          TOTAL DE PARADAS
      =================================================== */}

      <KpiCard
        icon={AlertTriangle}
        label="Total de paradas"
        value={
          formatarNumero(
            dados?.totalParadas,
          )
        }
        detail="Ocorrências no período selecionado"
        variacao={
          comparativo.totalParadas
        }
        tone="warning"
      />

      {/* ===================================================
          TEMPO MÉDIO
      =================================================== */}

      <KpiCard
        icon={TimerReset}
        label="Tempo médio"
        value={
          formatarDuracaoResumida(
            dados?.tempoMedioSegundos,
          )
        }
        detail="Duração média por ocorrência"
        variacao={
          comparativo.tempoMedio
        }
        tone="neutral"
      />

      {/* ===================================================
          MAIOR PARADA
      =================================================== */}

      <KpiCard
        icon={Clock3}
        label="Maior parada"
        value={
          formatarDuracaoResumida(
            maior?.duracao_segundos,
          )
        }
        detail={
          maior
            ? `${maior.injetora} • ${maior.motivo}`
            : "Sem ocorrência"
        }
        tone="danger"
      />

      {/* ===================================================
          MÁQUINA MAIS IMPACTADA
      =================================================== */}

      <KpiCard
        icon={Factory}
        label="Máquina mais impactada"
        value={
          maquina?.injetora ||
          "-"
        }
        detail={
          maquina
            ? `${formatarDuracaoResumida(
                maquina.duracao_segundos,
              )} • ${
                maquina.ocorrencias
              } paradas`
            : "Sem ocorrência"
        }
        tone="primary"
      />
    </section>
  );
}