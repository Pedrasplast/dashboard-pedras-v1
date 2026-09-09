import {
  AlertTriangle,
  Clock3,
  Factory,
  TimerOff,
  TimerReset,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import "./ParadasKpis.css";

/* =========================================================
   FORMATAÇÕES
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
   DECOMPOR DURAÇÃO
========================================================= */

function decomporDuracao(
  valor,
) {
  const totalSegundos =
    Math.max(
      0,
      Math.floor(
        Number(valor) || 0,
      ),
    );

  const horas =
    Math.floor(
      totalSegundos / 3600,
    );

  const minutos =
    Math.floor(
      (totalSegundos % 3600) /
        60,
    );

  const segundos =
    totalSegundos % 60;

  return {
    totalSegundos,
    horas,
    minutos,
    segundos,
  };
}

/* =========================================================
   DURAÇÃO PARA TEXTO SECUNDÁRIO
========================================================= */

function formatarDuracaoTexto(
  valor,
) {
  const {
    horas,
    minutos,
    segundos,
  } =
    decomporDuracao(
      valor,
    );

  if (horas > 0) {
    return `${formatarNumero(
      horas,
    )} h ${String(
      minutos,
    ).padStart(
      2,
      "0",
    )} min`;
  }

  if (minutos > 0) {
    return `${formatarNumero(
      minutos,
    )} min`;
  }

  if (segundos > 0) {
    return `${segundos} s`;
  }

  return "0 min";
}

/* =========================================================
   DURAÇÃO EM DESTAQUE
========================================================= */

function DuracaoDestaque({
  segundos,
}) {
  const duracao =
    decomporDuracao(
      segundos,
    );

  if (
    duracao.horas >
    0
  ) {
    return (
      <span className="dp-kpi-duration">
        <span className="dp-kpi-duration__principal">
          <span className="dp-kpi-duration__numero">
            {formatarNumero(
              duracao.horas,
            )}
          </span>

          <span className="dp-kpi-duration__unidade">
            h
          </span>
        </span>

        <span className="dp-kpi-duration__secundario">
          <span className="dp-kpi-duration__numero-secundario">
            {String(
              duracao.minutos,
            ).padStart(
              2,
              "0",
            )}
          </span>

          <span className="dp-kpi-duration__unidade-secundaria">
            min
          </span>
        </span>
      </span>
    );
  }

  if (
    duracao.minutos >
    0
  ) {
    return (
      <span className="dp-kpi-duration">
        <span className="dp-kpi-duration__principal">
          <span className="dp-kpi-duration__numero">
            {formatarNumero(
              duracao.minutos,
            )}
          </span>

          <span className="dp-kpi-duration__unidade">
            min
          </span>
        </span>
      </span>
    );
  }

  if (
    duracao.segundos >
    0
  ) {
    return (
      <span className="dp-kpi-duration">
        <span className="dp-kpi-duration__principal">
          <span className="dp-kpi-duration__numero">
            {duracao.segundos}
          </span>

          <span className="dp-kpi-duration__unidade">
            s
          </span>
        </span>
      </span>
    );
  }

  return (
    <span className="dp-kpi-duration">
      <span className="dp-kpi-duration__principal">
        <span className="dp-kpi-duration__numero">
          0
        </span>

        <span className="dp-kpi-duration__unidade">
          min
        </span>
      </span>
    </span>
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
========================================================= */

function KpiCard({
  icon: Icone,
  label,
  value,
  detail,
  variacao,
  tone = "neutral",
  valueType = "default",
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

      <div
        className={[
          "dp-kpi__value",
          valueType ===
          "duration"
            ? "dp-kpi__value--duration"
            : "",
          valueType ===
          "machine"
            ? "dp-kpi__value--machine"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </div>

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
      <KpiCard
        icon={TimerOff}
        label="Tempo total parado"
        value={
          <DuracaoDestaque
            segundos={
              dados?.tempoTotalSegundos
            }
          />
        }
        detail={`${formatarNumero(
          dados?.totalParadas,
        )} lançamentos considerados`}
        variacao={
          comparativo.tempoTotal
        }
        tone="danger"
        valueType="duration"
      />

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

      <KpiCard
        icon={TimerReset}
        label="Tempo médio"
        value={
          <DuracaoDestaque
            segundos={
              dados?.tempoMedioSegundos
            }
          />
        }
        detail="Duração média por ocorrência"
        variacao={
          comparativo.tempoMedio
        }
        tone="neutral"
        valueType="duration"
      />

      <KpiCard
        icon={Clock3}
        label="Maior parada"
        value={
          <DuracaoDestaque
            segundos={
              maior?.duracao_segundos
            }
          />
        }
        detail={
          maior
            ? `${maior.injetora} • ${maior.motivo}`
            : "Sem ocorrência"
        }
        tone="danger"
        valueType="duration"
      />

      <KpiCard
        icon={Factory}
        label="Máquina mais impactada"
        value={
          maquina?.injetora ||
          "-"
        }
        detail={
          maquina
            ? `${formatarDuracaoTexto(
                maquina.duracao_segundos,
              )} • ${formatarNumero(
                maquina.ocorrencias,
              )} paradas`
            : "Sem ocorrência"
        }
        tone="primary"
        valueType="machine"
      />
    </section>
  );
}
