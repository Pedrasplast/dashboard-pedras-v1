import {
  memo,
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  CartesianGrid,
  Cell,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import {
  Crosshair,
} from "lucide-react";

import DashboardParadasCard from "./DashboardParadasCard";
import ModalOcorrenciasParadas from "./ModalOcorrenciasParadas";

import {
  formatarDuracaoResumida,
} from "../dashboardParadas.utils";

import {
  normalizarTextoOcorrencia,
  obterMotivoRegistro,
} from "../ocorrenciasParadas.utils";

import "./CriticidadeParadas.css";

/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const QUADRANTES = Object.freeze({
  prioridade1: {
    titulo: "Prioridade 1",
    nome: "Atacar primeiro",
    descricao:
      "Muitas ocorrências + muitas horas paradas",
    cor: "#dc2626",
    fundo: "#fef2f2",
    borda: "#fecaca",
    texto: "#991b1b",
  },

  prioridade2: {
    titulo: "Prioridade 2",
    nome: "Alto impacto",
    descricao:
      "Poucas ocorrências + muitas horas paradas",
    cor: "#ea580c",
    fundo: "#fff7ed",
    borda: "#fed7aa",
    texto: "#9a3412",
  },

  prioridade3: {
    titulo: "Prioridade 3",
    nome: "Recorrente",
    descricao:
      "Muitas ocorrências + poucas horas paradas",
    cor: "#2563eb",
    fundo: "#eff6ff",
    borda: "#bfdbfe",
    texto: "#1e40af",
  },

  prioridade4: {
    titulo: "Prioridade 4",
    nome: "Monitorar",
    descricao:
      "Poucas ocorrências + poucas horas paradas",
    cor: "#64748b",
    fundo: "#f8fafc",
    borda: "#e2e8f0",
    texto: "#475569",
  },
});

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

function formatarHoras(valor) {
  return Number(
    valor || 0,
  ).toLocaleString(
    "pt-BR",
    {
      maximumFractionDigits: 1,
    },
  );
}

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

  return (
    dados.reduce(
      (soma, item) =>
        soma +
        (
          Number(
            item?.[campo],
          ) || 0
        ),
      0,
    ) / dados.length
  );
}

/* =========================================================
   CLASSIFICAÇÃO
========================================================= */

function classificarQuadrante({
  ocorrencias,
  horas,
  mediaOcorrencias,
  mediaHoras,
}) {
  const recorrente =
    ocorrencias >=
    mediaOcorrencias;

  const altoImpacto =
    horas >= mediaHoras;

  if (
    recorrente &&
    altoImpacto
  ) {
    return "prioridade1";
  }

  if (
    !recorrente &&
    altoImpacto
  ) {
    return "prioridade2";
  }

  if (
    recorrente &&
    !altoImpacto
  ) {
    return "prioridade3";
  }

  return "prioridade4";
}

/* =========================================================
   TOOLTIP
========================================================= */

function CriticidadeTooltip({
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

  const dados =
    payload[0]?.payload;

  if (!dados) {
    return null;
  }

  const configuracao =
    QUADRANTES[
      dados.quadrante
    ] ||
    QUADRANTES.prioridade4;

  return (
    <div className="dp-chart-tooltip">
      <strong>
        {dados.motivo}
      </strong>

      <div
        className="dp-criticidade-tooltip-prioridade"
        style={{
          background:
            configuracao.fundo,
          borderColor:
            configuracao.borda,
        }}
      >
        <b
          style={{
            color:
              configuracao.texto,
          }}
        >
          {configuracao.titulo}
          {" — "}
          {configuracao.nome}
        </b>

        <span>
          {configuracao.descricao}
        </span>
      </div>

      <div className="dp-chart-tooltip__linha">
        <span>
          Ocorrências
        </span>

        <b>
          {formatarNumero(
            dados.ocorrencias,
          )}
        </b>
      </div>

      <div className="dp-chart-tooltip__linha">
        <span>
          Tempo parado
        </span>

        <b>
          {formatarDuracaoResumida(
            dados.duracao_segundos,
          )}
        </b>
      </div>

      <div className="dp-chart-tooltip__linha">
        <span>
          Tempo médio
        </span>

        <b>
          {formatarDuracaoResumida(
            dados.tempo_medio_segundos,
          )}
        </b>
      </div>

      <div className="dp-criticidade-tooltip-clique">
        Clique para ver todas
        as ocorrências.
      </div>
    </div>
  );
}

/* =========================================================
   LEGENDA DOS QUADRANTES
========================================================= */

function CardQuadrante({
  configuracao,
  quantidade,
}) {
  return (
    <div
      className="dp-criticidade-quadrante-card"
      style={{
        background:
          configuracao.fundo,
        borderColor:
          configuracao.borda,
      }}
    >
      <div className="dp-criticidade-quadrante-topo">
        <strong
          style={{
            color:
              configuracao.texto,
          }}
        >
          {configuracao.titulo}
        </strong>

        <span
          style={{
            background:
              configuracao.cor,
          }}
        >
          {quantidade}
        </span>
      </div>

      <b>
        {configuracao.nome}
      </b>

      <small>
        {configuracao.descricao}
      </small>
    </div>
  );
}

/* =========================================================
   COMPONENTE
========================================================= */

function CriticidadeParadas({
  dados = [],
  ocorrencias = [],
}) {
  const [
    motivoSelecionado,
    setMotivoSelecionado,
  ] = useState("");

  /* =======================================================
     BASE DO GRÁFICO
  ======================================================= */

  const base =
    useMemo(
      () =>
        (
          Array.isArray(dados)
            ? dados
            : []
        )
          .filter(
            (item) =>
              Number(
                item?.ocorrencias,
              ) > 0,
          )
          .map((item) => ({
            ...item,

            motivo:
              String(
                item?.motivo ||
                  "SEM MOTIVO INFORMADO",
              ).trim(),

            ocorrencias:
              Number(
                item.ocorrencias,
              ) || 0,

            horas:
              Number(
                item.horas,
              ) || 0,

            duracao_segundos:
              Number(
                item.duracao_segundos,
              ) || 0,

            tempo_medio_segundos:
              Number(
                item.tempo_medio_segundos,
              ) || 0,

            tamanho:
              Math.max(
                80,
                Number(
                  item.tamanho,
                ) || 80,
              ),
          })),
      [dados],
    );

  const mediaOcorrencias =
    useMemo(
      () =>
        calcularMedia(
          base,
          "ocorrencias",
        ),
      [base],
    );

  const mediaHoras =
    useMemo(
      () =>
        calcularMedia(
          base,
          "horas",
        ),
      [base],
    );

  const dadosGrafico =
    useMemo(
      () =>
        base.map(
          (item) => ({
            ...item,

            quadrante:
              classificarQuadrante({
                ocorrencias:
                  item.ocorrencias,
                horas:
                  item.horas,
                mediaOcorrencias,
                mediaHoras,
              }),
          }),
        ),
      [
        base,
        mediaOcorrencias,
        mediaHoras,
      ],
    );

  /* =======================================================
     CONTAGEM
  ======================================================= */

  const contagem =
    useMemo(() => {
      const resultado = {
        prioridade1: 0,
        prioridade2: 0,
        prioridade3: 0,
        prioridade4: 0,
      };

      for (
        const item of
        dadosGrafico
      ) {
        resultado[
          item.quadrante
        ] += 1;
      }

      return resultado;
    }, [dadosGrafico]);

  /* =======================================================
     LIMITES
  ======================================================= */

  const maxOcorrencias =
    useMemo(
      () =>
        dadosGrafico.reduce(
          (maior, item) =>
            Math.max(
              maior,
              item.ocorrencias,
            ),
          0,
        ),
      [dadosGrafico],
    );

  const maxHoras =
    useMemo(
      () =>
        dadosGrafico.reduce(
          (maior, item) =>
            Math.max(
              maior,
              item.horas,
            ),
          0,
        ),
      [dadosGrafico],
    );

  const limiteX =
    Math.max(
      1,
      Math.ceil(
        maxOcorrencias *
          1.12,
      ),
    );

  const limiteY =
    Math.max(
      1,
      maxHoras * 1.12,
    );

  /* =======================================================
     CLIQUE NA BOLHA
  ======================================================= */

  const abrirOcorrencias =
    useCallback(
      (evento) => {
        const item =
          evento?.payload ||
          evento;

        const motivo =
          String(
            item?.motivo || "",
          ).trim();

        if (!motivo) {
          return;
        }

        setMotivoSelecionado(
          motivo,
        );
      },
      [],
    );

  const fecharOcorrencias =
    useCallback(() => {
      setMotivoSelecionado("");
    }, []);

  /* =======================================================
     REGISTROS DO MOTIVO
  ======================================================= */

  const ocorrenciasDoMotivo =
    useMemo(() => {
      if (!motivoSelecionado) {
        return [];
      }

      const chave =
        normalizarTextoOcorrencia(
          motivoSelecionado,
        );

      return (
        Array.isArray(
          ocorrencias,
        )
          ? ocorrencias
          : []
      ).filter(
        (registro) =>
          normalizarTextoOcorrencia(
            obterMotivoRegistro(
              registro,
            ),
          ) === chave,
      );
    }, [
      ocorrencias,
      motivoSelecionado,
    ]);

  const vazio =
    dadosGrafico.length === 0;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <DashboardParadasCard
        title="Quadrante de criticidade"
        subtitle="Quanto mais à direita, mais recorrente. Quanto mais acima, maior o impacto."
        icon={Crosshair}
        empty={vazio}
      >
        <div className="dp-criticidade">
          {/* =============================================
              QUADRANTES
          ============================================= */}

          <div className="dp-criticidade-quadrantes">
            <CardQuadrante
              configuracao={
                QUADRANTES.prioridade2
              }
              quantidade={
                contagem.prioridade2
              }
            />

            <CardQuadrante
              configuracao={
                QUADRANTES.prioridade1
              }
              quantidade={
                contagem.prioridade1
              }
            />

            <CardQuadrante
              configuracao={
                QUADRANTES.prioridade4
              }
              quantidade={
                contagem.prioridade4
              }
            />

            <CardQuadrante
              configuracao={
                QUADRANTES.prioridade3
              }
              quantidade={
                contagem.prioridade3
              }
            />
          </div>

          {/* =============================================
              GRÁFICO
          ============================================= */}

          <div className="dp-chart dp-chart--criticidade">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <ScatterChart
                margin={{
                  top: 20,
                  right: 25,
                  bottom: 22,
                  left: 8,
                }}
              >
                <ReferenceArea
                  x1={0}
                  x2={mediaOcorrencias}
                  y1={mediaHoras}
                  y2={limiteY}
                  fill={
                    QUADRANTES
                      .prioridade2
                      .cor
                  }
                  fillOpacity={0.06}
                />

                <ReferenceArea
                  x1={mediaOcorrencias}
                  x2={limiteX}
                  y1={mediaHoras}
                  y2={limiteY}
                  fill={
                    QUADRANTES
                      .prioridade1
                      .cor
                  }
                  fillOpacity={0.06}
                />

                <ReferenceArea
                  x1={0}
                  x2={mediaOcorrencias}
                  y1={0}
                  y2={mediaHoras}
                  fill={
                    QUADRANTES
                      .prioridade4
                      .cor
                  }
                  fillOpacity={0.035}
                />

                <ReferenceArea
                  x1={mediaOcorrencias}
                  x2={limiteX}
                  y1={0}
                  y2={mediaHoras}
                  fill={
                    QUADRANTES
                      .prioridade3
                      .cor
                  }
                  fillOpacity={0.055}
                />

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                />

                <XAxis
                  type="number"
                  dataKey="ocorrencias"
                  domain={[
                    0,
                    limiteX,
                  ]}
                  allowDecimals={false}
                  tick={{
                    fontSize: 11,
                  }}
                  label={{
                    value:
                      "Quantidade de ocorrências →",
                    position:
                      "insideBottom",
                    offset: -13,
                    fontSize: 10,
                  }}
                />

                <YAxis
                  type="number"
                  dataKey="horas"
                  domain={[
                    0,
                    limiteY,
                  ]}
                  tick={{
                    fontSize: 11,
                  }}
                  tickFormatter={(
                    valor,
                  ) =>
                    `${formatarHoras(
                      valor,
                    )}h`
                  }
                  label={{
                    value:
                      "Horas paradas →",
                    angle: -90,
                    position:
                      "insideLeft",
                    fontSize: 10,
                  }}
                />

                <ZAxis
                  type="number"
                  dataKey="tamanho"
                  range={[
                    90,
                    900,
                  ]}
                />

                {mediaOcorrencias >
                  0 && (
                  <ReferenceLine
                    x={mediaOcorrencias}
                    stroke="#94a3b8"
                    strokeDasharray="5 5"
                  />
                )}

                {mediaHoras > 0 && (
                  <ReferenceLine
                    y={mediaHoras}
                    stroke="#94a3b8"
                    strokeDasharray="5 5"
                  />
                )}

                <Tooltip
                  cursor={{
                    strokeDasharray:
                      "3 3",
                  }}
                  content={
                    <CriticidadeTooltip />
                  }
                />

                <Scatter
                  name="Motivos"
                  data={dadosGrafico}
                  onClick={
                    abrirOcorrencias
                  }
                  fillOpacity={0.74}
                  strokeWidth={1.4}
                  className="dp-criticidade-scatter"
                >
                  {dadosGrafico.map(
                    (
                      item,
                      indice,
                    ) => {
                      const config =
                        QUADRANTES[
                          item.quadrante
                        ];

                      return (
                        <Cell
                          key={`${item.motivo}-${indice}`}
                          fill={
                            config.cor
                          }
                          stroke={
                            config.cor
                          }
                        />
                      );
                    },
                  )}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="dp-criticidade__footer">
            <span>
              Tamanho da bolha:
            </span>

            <strong>
              tempo médio por parada
            </strong>

            <span className="dp-criticidade__footer-clique">
              Clique na bolha para
              visualizar os detalhes
            </span>
          </div>
        </div>
      </DashboardParadasCard>

      <ModalOcorrenciasParadas
        aberto={Boolean(
          motivoSelecionado,
        )}
        titulo={
          motivoSelecionado
        }
        subtitulo="Todas as ocorrências deste motivo dentro dos filtros atuais"
        eyebrow="Análise detalhada do motivo"
        ocorrencias={
          ocorrenciasDoMotivo
        }
        onFechar={
          fecharOcorrencias
        }
        icone={Crosshair}
      />
    </>
  );
}

export default memo(
  CriticidadeParadas,
);
