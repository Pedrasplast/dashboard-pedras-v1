import {
  memo,
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Activity,
} from "lucide-react";

import DashboardParadasCard from "./DashboardParadasCard";
import ModalOcorrenciasParadas from "./ModalOcorrenciasParadas";

import {
  formatarDataCurta,
  formatarDuracaoResumida,
} from "../dashboardParadas.utils";

import {
  obterDataISORegistro,
} from "../ocorrenciasParadas.utils";

/* =========================================================
   MODOS
========================================================= */

const MODO_TEMPO =
  "tempo";

const MODO_OCORRENCIAS =
  "ocorrencias";

/* =========================================================
   DATA
========================================================= */

function criarDataUTC(
  dataISO,
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      String(
        dataISO || "",
      ),
    )
  ) {
    return null;
  }

  const [
    ano,
    mes,
    dia,
  ] =
    dataISO
      .split("-")
      .map(Number);

  const data =
    new Date(
      Date.UTC(
        ano,
        mes - 1,
        dia,
      ),
    );

  return Number.isNaN(
    data.getTime(),
  )
    ? null
    : data;
}

function dataParaISO(
  data,
) {
  if (
    !(data instanceof Date) ||
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return "";
  }

  return data
    .toISOString()
    .slice(0, 10);
}

function adicionarDiasUTC(
  dataISO,
  quantidade,
) {
  const data =
    criarDataUTC(
      dataISO,
    );

  if (!data) {
    return "";
  }

  data.setUTCDate(
    data.getUTCDate() +
      quantidade,
  );

  return dataParaISO(
    data,
  );
}

function formatarDataCompletaISO(
  dataISO,
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      String(
        dataISO || "",
      ),
    )
  ) {
    return "";
  }

  const [
    ano,
    mes,
    dia,
  ] =
    dataISO.split("-");

  return `${dia}/${mes}/${ano}`;
}

/* =========================================================
   INÍCIO DA SEMANA
========================================================= */

function obterInicioSemana(
  dataISO,
) {
  const data =
    criarDataUTC(
      dataISO,
    );

  if (!data) {
    return "";
  }

  const diaSemana =
    data.getUTCDay();

  const deslocamento =
    (
      diaSemana + 6
    ) % 7;

  data.setUTCDate(
    data.getUTCDate() -
      deslocamento,
  );

  return dataParaISO(
    data,
  );
}

/* =========================================================
   FIM DO MÊS
========================================================= */

function obterFimMes(
  anoMes,
) {
  if (
    !/^\d{4}-\d{2}$/.test(
      String(
        anoMes || "",
      ),
    )
  ) {
    return "";
  }

  const [
    ano,
    mes,
  ] =
    anoMes
      .split("-")
      .map(Number);

  const data =
    new Date(
      Date.UTC(
        ano,
        mes,
        0,
      ),
    );

  return dataParaISO(
    data,
  );
}

/* =========================================================
   AGRUPAMENTO AUTOMÁTICO
========================================================= */

function definirGranularidade(
  quantidadeDatas,
) {
  if (
    quantidadeDatas <= 45
  ) {
    return "dia";
  }

  if (
    quantidadeDatas <= 120
  ) {
    return "semana";
  }

  return "mes";
}

/* =========================================================
   AGRUPAR EVOLUÇÃO
========================================================= */

function agruparEvolucao(
  dados,
) {
  const lista =
    Array.isArray(dados)
      ? dados
          .filter(
            (item) =>
              item?.data,
          )
          .sort(
            (a, b) =>
              String(
                a.data,
              ).localeCompare(
                String(
                  b.data,
                ),
              ),
          )
      : [];

  const granularidade =
    definirGranularidade(
      lista.length,
    );

  const mapa =
    new Map();

  for (
    const item of lista
  ) {
    const dataISO =
      String(
        item.data || "",
      );

    let chave =
      dataISO;

    let label =
      formatarDataCurta(
        dataISO,
      );

    let labelCompleto =
      label;

    let dataInicio =
      dataISO;

    let dataFim =
      dataISO;

    /* =====================================================
       SEMANA
    ===================================================== */

    if (
      granularidade ===
      "semana"
    ) {
      const inicioSemana =
        obterInicioSemana(
          dataISO,
        );

      chave =
        inicioSemana;

      dataInicio =
        inicioSemana;

      dataFim =
        adicionarDiasUTC(
          inicioSemana,
          6,
        );

      label =
        formatarDataCurta(
          inicioSemana,
        );

      labelCompleto =
        `Semana de ${label}`;
    }

    /* =====================================================
       MÊS
    ===================================================== */

    if (
      granularidade ===
      "mes"
    ) {
      chave =
        dataISO.slice(
          0,
          7,
        );

      const [
        ano,
        mes,
      ] =
        chave.split("-");

      dataInicio =
        `${chave}-01`;

      dataFim =
        obterFimMes(
          chave,
        );

      label =
        `${mes}/${String(
          ano,
        ).slice(-2)}`;

      labelCompleto =
        `${mes}/${ano}`;
    }

    if (
      !mapa.has(
        chave,
      )
    ) {
      mapa.set(
        chave,
        {
          chave,

          label,

          labelCompleto,

          dataInicio,

          dataFim,

          duracao_segundos:
            0,

          ocorrencias:
            0,
        },
      );
    }

    const grupo =
      mapa.get(
        chave,
      );

    grupo.duracao_segundos +=
      Number(
        item.duracao_segundos ||
          0,
      );

    grupo.ocorrencias +=
      Number(
        item.ocorrencias ||
          0,
      );
  }

  return {
    granularidade,

    dados:
      Array.from(
        mapa.values(),
      ),
  };
}

/* =========================================================
   MÉDIA
========================================================= */

function calcularMedia(
  dados,
  campo,
) {
  if (
    !Array.isArray(dados) ||
    dados.length === 0
  ) {
    return 0;
  }

  const total =
    dados.reduce(
      (
        soma,
        item,
      ) =>
        soma +
        (
          Number(
            item?.[campo],
          ) || 0
        ),
      0,
    );

  return (
    total /
    dados.length
  );
}

/* =========================================================
   TOOLTIP
========================================================= */

function EvolucaoTooltip({
  active,
  payload,
  modo,
}) {
  if (
    !active ||
    !Array.isArray(
      payload,
    ) ||
    payload.length === 0
  ) {
    return null;
  }

  const item =
    payload[0]?.payload;

  if (!item) {
    return null;
  }

  return (
    <div className="dp-chart-tooltip">
      <strong>
        {item.labelCompleto}
      </strong>

      {modo ===
      MODO_TEMPO ? (
        <>
          <div className="dp-chart-tooltip__linha">
            <span>
              Tempo parado
            </span>

            <b>
              {formatarDuracaoResumida(
                item.duracao_segundos,
              )}
            </b>
          </div>

          <div className="dp-chart-tooltip__linha">
            <span>
              Ocorrências
            </span>

            <b>
              {Number(
                item.ocorrencias ||
                  0,
              ).toLocaleString(
                "pt-BR",
              )}
            </b>
          </div>
        </>
      ) : (
        <>
          <div className="dp-chart-tooltip__linha">
            <span>
              Ocorrências
            </span>

            <b>
              {Number(
                item.ocorrencias ||
                  0,
              ).toLocaleString(
                "pt-BR",
              )}
            </b>
          </div>

          <div className="dp-chart-tooltip__linha">
            <span>
              Tempo acumulado
            </span>

            <b>
              {formatarDuracaoResumida(
                item.duracao_segundos,
              )}
            </b>
          </div>
        </>
      )}

      <div className="dp-drilldown-tooltip-clique">
        Clique no ponto para
        visualizar as ocorrências.
      </div>
    </div>
  );
}

/* =========================================================
   EVOLUÇÃO
========================================================= */

function EvolucaoParadas({
  dados = [],
  ocorrencias = [],
}) {
  const [
    modo,
    setModo,
  ] = useState(
    MODO_TEMPO,
  );

  const [
    periodoSelecionado,
    setPeriodoSelecionado,
  ] = useState(null);

  /* =======================================================
     AGRUPAMENTO
  ======================================================= */

  const agrupamento =
    useMemo(
      () =>
        agruparEvolucao(
          dados,
        ),
      [dados],
    );

  /* =======================================================
     DADOS DO GRÁFICO
  ======================================================= */

  const dadosGrafico =
    useMemo(
      () =>
        agrupamento.dados.map(
          (item) => ({
            ...item,

            horas:
              item.duracao_segundos /
              3600,

            valor:
              modo ===
              MODO_TEMPO
                ? item.duracao_segundos /
                  3600
                : item.ocorrencias,
          }),
        ),
      [
        agrupamento,
        modo,
      ],
    );

  const vazio =
    dadosGrafico.length ===
    0;

  /* =======================================================
     MÉDIA
  ======================================================= */

  const media =
    useMemo(
      () =>
        calcularMedia(
          dadosGrafico,
          "valor",
        ),
      [dadosGrafico],
    );

  /* =======================================================
     GRANULARIDADE
  ======================================================= */

  const granularidadeLabel =
    useMemo(() => {
      if (
        agrupamento
          .granularidade ===
        "mes"
      ) {
        return "Visão mensal";
      }

      if (
        agrupamento
          .granularidade ===
        "semana"
      ) {
        return "Visão semanal";
      }

      return "Visão diária";
    }, [
      agrupamento
        .granularidade,
    ]);

  /* =======================================================
     CLIQUE NO GRÁFICO
  ======================================================= */

  const abrirPeriodo =
    useCallback(
      (evento) => {
        const item =
          evento
            ?.activePayload?.[0]
            ?.payload ||
          evento?.payload;

        if (
          !item?.dataInicio ||
          !item?.dataFim
        ) {
          return;
        }

        setPeriodoSelecionado(
          item,
        );
      },
      [],
    );

  const fecharPeriodo =
    useCallback(() => {
      setPeriodoSelecionado(
        null,
      );
    }, []);

  /* =======================================================
     OCORRÊNCIAS DO PERÍODO
  ======================================================= */

  const ocorrenciasPeriodo =
    useMemo(() => {
      if (
        !periodoSelecionado
      ) {
        return [];
      }

      const inicio =
        periodoSelecionado
          .dataInicio;

      const fim =
        periodoSelecionado
          .dataFim;

      return (
        Array.isArray(
          ocorrencias,
        )
          ? ocorrencias
          : []
      ).filter(
        (registro) => {
          const dataISO =
            obterDataISORegistro(
              registro,
            );

          if (!dataISO) {
            return false;
          }

          return (
            dataISO >= inicio &&
            dataISO <= fim
          );
        },
      );
    }, [
      ocorrencias,
      periodoSelecionado,
    ]);

  /* =======================================================
     TÍTULO DO MODAL
  ======================================================= */

  const tituloModal =
    useMemo(() => {
      if (
        !periodoSelecionado
      ) {
        return "";
      }

      if (
        agrupamento
          .granularidade ===
        "mes"
      ) {
        return `Mês: ${periodoSelecionado.labelCompleto}`;
      }

      if (
        agrupamento
          .granularidade ===
        "semana"
      ) {
        return (
          "Semana: " +
          `${formatarDataCompletaISO(
            periodoSelecionado
              .dataInicio,
          )} a ` +
          `${formatarDataCompletaISO(
            periodoSelecionado
              .dataFim,
          )}`
        );
      }

      return (
        "Dia: " +
        formatarDataCompletaISO(
          periodoSelecionado
            .dataInicio,
        )
      );
    }, [
      periodoSelecionado,
      agrupamento
        .granularidade,
    ]);

  /* =======================================================
     BOTÕES
  ======================================================= */

  const actions = (
    <div className="dp-evolucao-actions">
      <span className="dp-evolucao-granularidade">
        {granularidadeLabel}
      </span>

      <div
        className="dp-chart-toggle"
        role="group"
        aria-label="Visualização da evolução"
      >
        <button
          type="button"
          className={
            modo ===
            MODO_TEMPO
              ? "dp-chart-toggle__btn active"
              : "dp-chart-toggle__btn"
          }
          onClick={() =>
            setModo(
              MODO_TEMPO,
            )
          }
        >
          Tempo parado
        </button>

        <button
          type="button"
          className={
            modo ===
            MODO_OCORRENCIAS
              ? "dp-chart-toggle__btn active"
              : "dp-chart-toggle__btn"
          }
          onClick={() =>
            setModo(
              MODO_OCORRENCIAS,
            )
          }
        >
          Ocorrências
        </button>
      </div>
    </div>
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <DashboardParadasCard
        title="Evolução das paradas"
        subtitle="Tendência das ocorrências registradas ao longo do período"
        icon={Activity}
        actions={actions}
        empty={vazio}
      >
        <div className="dp-chart dp-chart--evolucao dp-chart--evolucao-clicavel">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <AreaChart
              data={dadosGrafico}
              onClick={
                abrirPeriodo
              }
              margin={{
                top: 18,
                right: 18,
                bottom: 6,
                left: 8,
              }}
            >
              <defs>
                <linearGradient
                  id="dpEvolucaoGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#2563eb"
                    stopOpacity={0.32}
                  />

                  <stop
                    offset="100%"
                    stopColor="#2563eb"
                    stopOpacity={0.03}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e8eef5"
              />

              <XAxis
                dataKey="label"
                tick={{
                  fontSize: 11,
                  fill: "#64748b",
                }}
                axisLine={{
                  stroke:
                    "#cbd5e1",
                }}
                tickLine={false}
                minTickGap={18}
              />

              <YAxis
                allowDecimals={
                  modo ===
                  MODO_TEMPO
                }
                tick={{
                  fontSize: 11,
                  fill: "#64748b",
                }}
                axisLine={false}
                tickLine={false}
                width={52}
                tickFormatter={(
                  valor,
                ) => {
                  if (
                    modo ===
                    MODO_TEMPO
                  ) {
                    return `${Number(
                      valor,
                    ).toLocaleString(
                      "pt-BR",
                      {
                        maximumFractionDigits:
                          1,
                      },
                    )}h`;
                  }

                  return Number(
                    valor,
                  ).toLocaleString(
                    "pt-BR",
                    {
                      maximumFractionDigits:
                        0,
                    },
                  );
                }}
              />

              <Tooltip
                content={
                  <EvolucaoTooltip
                    modo={modo}
                  />
                }
              />

              {media > 0 && (
                <ReferenceLine
                  y={media}
                  stroke="#94a3b8"
                  strokeDasharray="5 5"
                  label={{
                    value: "Média",
                    position:
                      "insideTopRight",
                    fill:
                      "#64748b",
                    fontSize:
                      10,
                  }}
                />
              )}

              <Area
                type="monotone"
                dataKey="valor"
                stroke="#2563eb"
                strokeWidth={2.5}
                fill="url(#dpEvolucaoGradient)"
                fillOpacity={1}
                connectNulls
                activeDot={{
                  r: 6,
                  fill:
                    "#1d4ed8",
                  stroke:
                    "#ffffff",
                  strokeWidth:
                    2,
                  cursor:
                    "pointer",
                }}
                dot={
                  dadosGrafico.length <=
                  24
                    ? {
                        r: 3,
                        fill:
                          "#2563eb",
                        stroke:
                          "#ffffff",
                        strokeWidth:
                          1.5,
                      }
                    : false
                }
                isAnimationActive
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="dp-drilldown__clique">
          Clique em um ponto do
          gráfico para visualizar
          as ocorrências daquele
          período.
        </div>
      </DashboardParadasCard>

      <ModalOcorrenciasParadas
        aberto={Boolean(
          periodoSelecionado,
        )}
        titulo={tituloModal}
        subtitulo="Ocorrências deste período dentro dos filtros atuais"
        eyebrow="Detalhamento da evolução"
        ocorrencias={
          ocorrenciasPeriodo
        }
        onFechar={
          fecharPeriodo
        }
        icone={
          Activity
        }
      />
    </>
  );
}

export default memo(
  EvolucaoParadas,
);