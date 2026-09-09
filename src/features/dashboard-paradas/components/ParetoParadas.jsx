import {
  memo,
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  BarChart3,
} from "lucide-react";

import DashboardParadasCard from "./DashboardParadasCard";
import ModalOcorrenciasParadas from "./ModalOcorrenciasParadas";

import {
  formatarDuracaoResumida,
} from "../dashboardParadas.utils";

import {
  normalizarTextoOcorrencia,
} from "../ocorrenciasParadas.utils";

import "./ParetoParadas.css";

/* =========================================================
   CONFIGURAÇÃO
========================================================= */

const QUANTIDADE_PRINCIPAIS = 9;

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

function formatarPercentual(valor) {
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

function formatarHorasEixo(valor) {
  return `${Number(
    valor || 0,
  ).toLocaleString(
    "pt-BR",
    {
      maximumFractionDigits: 0,
    },
  )}h`;
}

/* =========================================================
   MOTIVO NORMALIZADO
========================================================= */

function obterMotivoComparacao(
  registro,
) {
  const motivo =
    String(
      registro?.motivo ?? "",
    ).trim();

  return normalizarTextoOcorrencia(
    motivo || "Sem motivo",
  );
}

/* =========================================================
   QUEBRAR NOME DO MOTIVO
========================================================= */

function quebrarRotulo(
  texto,
  limite = 16,
) {
  const palavras = String(
    texto || "",
  )
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (
    palavras.length === 0
  ) {
    return [""];
  }

  const linhas = [];
  let linhaAtual = "";

  for (
    const palavra of palavras
  ) {
    const tentativa =
      linhaAtual
        ? `${linhaAtual} ${palavra}`
        : palavra;

    if (
      tentativa.length <=
      limite
    ) {
      linhaAtual =
        tentativa;
    } else {
      if (linhaAtual) {
        linhas.push(
          linhaAtual,
        );
      }

      linhaAtual =
        palavra;
    }
  }

  if (linhaAtual) {
    linhas.push(
      linhaAtual,
    );
  }

  return linhas;
}

/* =========================================================
   LABEL DO EIXO X
========================================================= */

function MotivoAxisTick({
  x,
  y,
  payload,
}) {
  const linhas =
    quebrarRotulo(
      payload?.value,
      16,
    );

  return (
    <g
      transform={`translate(${x},${y})`}
    >
      <text
        x={0}
        y={0}
        dy={13}
        textAnchor="middle"
        fill="#64748b"
        fontSize={9.5}
        fontWeight={600}
      >
        {linhas.map(
          (
            linha,
            indice,
          ) => (
            <tspan
              key={`${linha}-${indice}`}
              x={0}
              dy={
                indice === 0
                  ? 0
                  : 11
              }
            >
              {linha}
            </tspan>
          ),
        )}
      </text>
    </g>
  );
}

/* =========================================================
   TOOLTIP
========================================================= */

function ParetoTooltip({
  active,
  payload,
}) {
  if (
    !active ||
    !Array.isArray(payload) ||
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
        {item.motivo}
      </strong>

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
          {formatarNumero(
            item.ocorrencias,
          )}
        </b>
      </div>

      <div className="dp-chart-tooltip__linha">
        <span>
          Participação
        </span>

        <b>
          {formatarPercentual(
            item.percentual,
          )}
          %
        </b>
      </div>

      <div className="dp-chart-tooltip__linha">
        <span>
          Acumulado
        </span>

        <b>
          {formatarPercentual(
            item.percentual_acumulado,
          )}
          %
        </b>
      </div>

      {item.ehOutros && (
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop:
              "1px solid #e2e8f0",
            fontSize: 11,
            color: "#64748b",
          }}
        >
          Agrupa{" "}
          {
            item
              .motivosAgrupados
              ?.length
          }{" "}
          motivos de menor
          participação.
        </div>
      )}

      <div className="dp-drilldown-tooltip-clique">
        Clique na barra para
        visualizar as ocorrências.
      </div>
    </div>
  );
}

/* =========================================================
   LABEL DAS BARRAS
========================================================= */

function HorasLabel({
  x,
  y,
  width,
  value,
}) {
  if (
    !Number.isFinite(
      Number(value),
    ) ||
    Number(value) <= 0
  ) {
    return null;
  }

  return (
    <text
      x={
        Number(x) +
        Number(width) / 2
      }
      y={Number(y) - 7}
      textAnchor="middle"
      fill="#475569"
      fontSize={9.5}
      fontWeight={700}
    >
      {formatarHorasEixo(
        value,
      )}
    </text>
  );
}

/* =========================================================
   PARETO
========================================================= */

function ParetoParadas({
  dados = [],
  ocorrencias = [],
}) {
  const [
    itemSelecionado,
    setItemSelecionado,
  ] = useState(null);

  /* =======================================================
     DADOS DO GRÁFICO
  ======================================================= */

  const dadosGrafico =
    useMemo(() => {
      const origem = (
        Array.isArray(dados)
          ? dados
          : []
      )
        .map((item) => ({
          ...item,

          motivo:
            item.motivo ||
            item.name ||
            "Sem motivo",

          duracao_segundos:
            Number(
              item.duracao_segundos ||
                0,
            ),

          ocorrencias:
            Number(
              item.ocorrencias ||
                0,
            ),
        }))
        .filter(
          (item) =>
            item.duracao_segundos >
            0,
        )
        .sort(
          (a, b) =>
            b.duracao_segundos -
            a.duracao_segundos,
        );

      if (
        origem.length === 0
      ) {
        return [];
      }

      const totalSegundos =
        origem.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.duracao_segundos,
          0,
        );

      let consolidados;

      if (
        origem.length <=
        QUANTIDADE_PRINCIPAIS +
          1
      ) {
        consolidados =
          origem.map(
            (item) => ({
              ...item,

              ehOutros:
                false,

              motivosAgrupados: [
                item.motivo,
              ],
            }),
          );
      } else {
        const principais =
          origem
            .slice(
              0,
              QUANTIDADE_PRINCIPAIS,
            )
            .map(
              (item) => ({
                ...item,

                ehOutros:
                  false,

                motivosAgrupados: [
                  item.motivo,
                ],
              }),
            );

        const restantes =
          origem.slice(
            QUANTIDADE_PRINCIPAIS,
          );

        const outros = {
          motivo: "Outros",

          duracao_segundos:
            restantes.reduce(
              (
                total,
                item,
              ) =>
                total +
                item.duracao_segundos,
              0,
            ),

          ocorrencias:
            restantes.reduce(
              (
                total,
                item,
              ) =>
                total +
                item.ocorrencias,
              0,
            ),

          ehOutros: true,

          motivosAgrupados:
            restantes.map(
              (item) =>
                item.motivo,
            ),
        };

        consolidados = [
          ...principais,
          outros,
        ];
      }

      let acumulado = 0;

      return consolidados.map(
        (item) => {
          const percentual =
            totalSegundos > 0
              ? (
                  item.duracao_segundos /
                  totalSegundos
                ) *
                100
              : 0;

          acumulado +=
            percentual;

          return {
            ...item,

            horas:
              item.duracao_segundos /
              3600,

            percentual,

            percentual_acumulado:
              Math.min(
                acumulado,
                100,
              ),
          };
        },
      );
    }, [dados]);

  /* =======================================================
     CLIQUE
  ======================================================= */

  const abrirMotivo =
    useCallback(
      (evento) => {
        const item =
          evento?.payload ||
          evento;

        if (
          !item?.motivo
        ) {
          return;
        }

        setItemSelecionado(
          item,
        );
      },
      [],
    );

  const fecharMotivo =
    useCallback(() => {
      setItemSelecionado(
        null,
      );
    }, []);

  /* =======================================================
     OCORRÊNCIAS SELECIONADAS
  ======================================================= */

  const ocorrenciasSelecionadas =
    useMemo(() => {
      if (!itemSelecionado) {
        return [];
      }

      const motivos =
        Array.isArray(
          itemSelecionado
            .motivosAgrupados,
        )
          ? itemSelecionado
              .motivosAgrupados
          : [
              itemSelecionado
                .motivo,
            ];

      const chaves =
        new Set(
          motivos.map(
            (motivo) =>
              normalizarTextoOcorrencia(
                motivo ||
                  "Sem motivo",
              ),
          ),
        );

      return (
        Array.isArray(
          ocorrencias,
        )
          ? ocorrencias
          : []
      ).filter(
        (registro) =>
          chaves.has(
            obterMotivoComparacao(
              registro,
            ),
          ),
      );
    }, [
      ocorrencias,
      itemSelecionado,
    ]);

  const vazio =
    dadosGrafico.length === 0;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <DashboardParadasCard
        title="Pareto dos motivos"
        subtitle="Principais causas ordenadas pelo tempo total de parada"
        icon={BarChart3}
        empty={vazio}
      >
        <div className="dp-chart dp-chart--pareto dp-chart--pareto-clicavel">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <ComposedChart
              data={dadosGrafico}
              barCategoryGap="28%"
              margin={{
                top: 30,
                right: 18,
                left: 5,
                bottom: 5,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e8eef5"
              />

              <XAxis
                dataKey="motivo"
                interval={0}
                height={82}
                tickLine={false}
                axisLine={{
                  stroke:
                    "#cbd5e1",
                }}
                tick={
                  <MotivoAxisTick />
                }
              />

              <YAxis
                yAxisId="horas"
                tick={{
                  fontSize: 11,
                  fill: "#64748b",
                }}
                axisLine={false}
                tickLine={false}
                width={58}
                tickFormatter={
                  formatarHorasEixo
                }
              />

              <YAxis
                yAxisId="percentual"
                orientation="right"
                domain={[0, 100]}
                ticks={[
                  0,
                  25,
                  50,
                  75,
                  100,
                ]}
                tick={{
                  fontSize: 11,
                  fill: "#64748b",
                }}
                axisLine={false}
                tickLine={false}
                width={45}
                tickFormatter={(
                  valor,
                ) =>
                  `${valor}%`
                }
              />

              <Tooltip
                content={
                  <ParetoTooltip />
                }
              />

              <ReferenceLine
                yAxisId="percentual"
                y={80}
                stroke="#94a3b8"
                strokeDasharray="5 5"
              />

              <Bar
                yAxisId="horas"
                dataKey="horas"
                maxBarSize={54}
                radius={[
                  6,
                  6,
                  0,
                  0,
                ]}
                onClick={
                  abrirMotivo
                }
                className="dp-pareto-barra"
              >
                {dadosGrafico.map(
                  (
                    item,
                    indice,
                  ) => (
                    <Cell
                      key={`${item.motivo}-${indice}`}
                      fill={
                        itemSelecionado
                          ?.motivo ===
                        item.motivo
                          ? "#1e40af"
                          : "#2563eb"
                      }
                    />
                  ),
                )}

                <LabelList
                  dataKey="horas"
                  content={
                    <HorasLabel />
                  }
                />
              </Bar>

              <Line
                yAxisId="percentual"
                type="monotone"
                dataKey="percentual_acumulado"
                stroke="#059669"
                strokeWidth={2.5}
                dot={{
                  r: 3,
                  fill: "#059669",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 5,
                  fill: "#059669",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="dp-drilldown__clique">
          Clique em uma barra para
          visualizar as ocorrências
          daquele motivo.
        </div>
      </DashboardParadasCard>

      <ModalOcorrenciasParadas
        aberto={Boolean(
          itemSelecionado,
        )}
        titulo={
          itemSelecionado
            ? itemSelecionado
                .ehOutros
              ? "Outros motivos"
              : itemSelecionado
                  .motivo
            : ""
        }
        subtitulo={
          itemSelecionado
            ?.ehOutros
            ? `${itemSelecionado.motivosAgrupados.length} motivos agrupados dentro dos filtros atuais`
            : "Ocorrências deste motivo dentro dos filtros atuais"
        }
        eyebrow="Detalhamento do Pareto"
        ocorrencias={
          ocorrenciasSelecionadas
        }
        onFechar={
          fecharMotivo
        }
        icone={
          BarChart3
        }
      />
    </>
  );
}

export default memo(
  ParetoParadas,
);