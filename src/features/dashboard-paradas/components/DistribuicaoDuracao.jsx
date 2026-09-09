import {
  memo,
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Timer,
} from "lucide-react";

import DashboardParadasCard from "./DashboardParadasCard";
import ModalOcorrenciasParadas from "./ModalOcorrenciasParadas";

import {
  FAIXAS_DURACAO,
} from "../dashboardParadas.utils";

import {
  registroPertenceFaixaDuracao,
} from "../ocorrenciasParadas.utils";

import "./DistribuicaoDuracao.css";

/* =========================================================
   TOOLTIP
========================================================= */

function DistribuicaoTooltip({
  active,
  payload,
  label,
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

  return (
    <div className="dp-chart-tooltip">
      <strong>
        {label}
      </strong>

      <div className="dp-chart-tooltip__linha">
        <span>
          Ocorrências
        </span>

        <b>
          {Number(
            dados.ocorrencias || 0,
          ).toLocaleString(
            "pt-BR",
          )}
        </b>
      </div>

      <div className="dp-chart-tooltip__linha">
        <span>
          Participação
        </span>

        <b>
          {Number(
            dados.percentual || 0,
          ).toLocaleString(
            "pt-BR",
            {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            },
          )}
          %
        </b>
      </div>

      <div className="dp-distribuicao-tooltip-clique">
        Clique na barra para
        visualizar as ocorrências.
      </div>
    </div>
  );
}

/* =========================================================
   DISTRIBUIÇÃO
========================================================= */

function DistribuicaoDuracao({
  dados = [],
  ocorrencias = [],
}) {
  const [
    faixaSelecionada,
    setFaixaSelecionada,
  ] = useState("");

  /* =======================================================
     PREPARAR DADOS
  ======================================================= */

  const dadosGrafico =
    useMemo(() => {
      const lista =
        Array.isArray(dados)
          ? dados
          : [];

      const total =
        lista.reduce(
          (soma, item) =>
            soma +
            (
              Number(
                item?.ocorrencias,
              ) || 0
            ),
          0,
        );

      return lista.map(
        (item, indice) => {
          const ocorrenciasItem =
            Number(
              item?.ocorrencias,
            ) || 0;

          return {
            ...item,

            ocorrencias:
              ocorrenciasItem,

            percentual:
              total > 0
                ? (
                    ocorrenciasItem /
                    total
                  ) * 100
                : 0,

            ordem:
              indice,
          };
        },
      );
    }, [dados]);

  const vazio =
    dadosGrafico.length === 0 ||
    dadosGrafico.every(
      (item) =>
        item.ocorrencias === 0,
    );

  /* =======================================================
     PRINCIPAL FAIXA
  ======================================================= */

  const principalFaixa =
    useMemo(() => {
      if (vazio) {
        return null;
      }

      return dadosGrafico.reduce(
        (maior, item) => {
          if (!maior) {
            return item;
          }

          return item.ocorrencias >
            maior.ocorrencias
            ? item
            : maior;
        },
        null,
      );
    }, [
      dadosGrafico,
      vazio,
    ]);

  /* =======================================================
     FAIXA SELECIONADA
  ======================================================= */

  const configuracaoFaixa =
    useMemo(
      () =>
        FAIXAS_DURACAO.find(
          (faixa) =>
            faixa.label ===
            faixaSelecionada,
        ) || null,
      [faixaSelecionada],
    );

  /* =======================================================
     OCORRÊNCIAS DA FAIXA

     Usa FAIXAS_DURACAO, a mesma configuração usada pelo
     consolidarParadas(). Assim a quantidade do modal deve
     bater com a quantidade exibida na barra.
  ======================================================= */

  const ocorrenciasDaFaixa =
    useMemo(() => {
      if (!configuracaoFaixa) {
        return [];
      }

      return (
        Array.isArray(
          ocorrencias,
        )
          ? ocorrencias
          : []
      ).filter(
        (registro) =>
          registroPertenceFaixaDuracao(
            registro,
            configuracaoFaixa,
          ),
      );
    }, [
      ocorrencias,
      configuracaoFaixa,
    ]);

  /* =======================================================
     CLIQUE NA BARRA
  ======================================================= */

  const abrirFaixa =
    useCallback(
      (evento) => {
        const item =
          evento?.payload ||
          evento;

        const faixa =
          String(
            item?.faixa || "",
          ).trim();

        if (!faixa) {
          return;
        }

        setFaixaSelecionada(
          faixa,
        );
      },
      [],
    );

  const fecharFaixa =
    useCallback(() => {
      setFaixaSelecionada("");
    }, []);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <DashboardParadasCard
        title="Distribuição por duração"
        subtitle="Quantidade de paradas por faixa de tempo"
        icon={Timer}
        empty={vazio}
      >
        <div className="dp-distribuicao">
          {/* =============================================
              INSIGHT
          ============================================= */}

          {principalFaixa && (
            <div className="dp-distribuicao__insight">
              <span>
                Maior concentração
              </span>

              <strong>
                {principalFaixa.faixa}
              </strong>

              <small>
                {principalFaixa.ocorrencias.toLocaleString(
                  "pt-BR",
                )}{" "}
                ocorrências •{" "}
                {principalFaixa.percentual.toLocaleString(
                  "pt-BR",
                  {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  },
                )}
                % do total
              </small>
            </div>
          )}

          {/* =============================================
              GRÁFICO
          ============================================= */}

          <div className="dp-chart dp-chart--duracao dp-chart--duracao-clicavel">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={dadosGrafico}
                layout="vertical"
                margin={{
                  top: 4,
                  right: 44,
                  bottom: 4,
                  left: 18,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{
                    fontSize: 11,
                  }}
                />

                <YAxis
                  type="category"
                  dataKey="faixa"
                  width={92}
                  tick={{
                    fontSize: 11,
                  }}
                />

                <Tooltip
                  content={
                    <DistribuicaoTooltip />
                  }
                />

                <Bar
                  dataKey="ocorrencias"
                  name="Ocorrências"
                  radius={[
                    0,
                    6,
                    6,
                    0,
                  ]}
                  maxBarSize={34}
                  onClick={
                    abrirFaixa
                  }
                  className="dp-distribuicao-barra"
                >
                  {dadosGrafico.map(
                    (item) => (
                      <Cell
                        key={
                          item.faixa
                        }
                        fill={
                          item.faixa ===
                          faixaSelecionada
                            ? "#1e40af"
                            : "#1d4ed8"
                        }
                      />
                    ),
                  )}

                  <LabelList
                    dataKey="ocorrencias"
                    position="right"
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="dp-distribuicao__clique">
            Clique em uma barra para
            visualizar todas as ocorrências
            daquela faixa de duração.
          </div>
        </div>
      </DashboardParadasCard>

      <ModalOcorrenciasParadas
        aberto={Boolean(
          faixaSelecionada,
        )}
        titulo={
          faixaSelecionada
            ? `Faixa: ${faixaSelecionada}`
            : ""
        }
        subtitulo="Ocorrências desta faixa de duração dentro dos filtros atuais"
        eyebrow="Detalhamento por duração"
        ocorrencias={
          ocorrenciasDaFaixa
        }
        onFechar={fecharFaixa}
        icone={Timer}
      />
    </>
  );
}

export default memo(
  DistribuicaoDuracao,
);
