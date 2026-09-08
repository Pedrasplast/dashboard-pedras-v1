import { memo, useMemo } from "react";

import {
  Factory,
} from "lucide-react";

import DashboardParadasCard from "./DashboardParadasCard";

import {
  formatarDuracaoResumida,
} from "../dashboardParadas.utils";

/* =========================================================
   FORMATAÇÕES
========================================================= */

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

/* =========================================================
   RANKING
========================================================= */

function RankingInjetoras({
  dados = [],
}) {
  const ranking =
    useMemo(
      () =>
        (
          Array.isArray(dados)
            ? dados
            : []
        ).slice(0, 10),
      [dados],
    );

  const vazio =
    ranking.length === 0;

  /* =======================================================
     MAIOR TEMPO

     Usado para criar a barra proporcional dentro da tabela.
  ======================================================= */

  const maiorTempo =
    useMemo(
      () =>
        ranking.reduce(
          (maior, item) =>
            Math.max(
              maior,
              Number(
                item?.duracao_segundos,
              ) || 0,
            ),
          0,
        ),
      [ranking],
    );

  return (
    <DashboardParadasCard
      title="Ranking das injetoras"
      subtitle="Máquinas ordenadas pelo maior tempo total de parada"
      icon={Factory}
      empty={vazio}
      contentClassName="dp-ranking-card-content"
    >
      <div className="dp-ranking">
        <div className="dp-ranking__table-wrapper">
          <table className="dp-ranking__table">
            <thead>
              <tr>
                <th>
                  #
                </th>

                <th>
                  Injetora
                </th>

                <th>
                  Tempo parado
                </th>

                <th>
                  Paradas
                </th>

                <th>
                  Tempo médio
                </th>

                <th>
                  Maior parada
                </th>

                <th>
                  Impacto
                </th>
              </tr>
            </thead>

            <tbody>
              {ranking.map(
                (
                  item,
                  indice,
                ) => {
                  const percentualBarra =
                    maiorTempo > 0
                      ? (
                          item.duracao_segundos /
                          maiorTempo
                        ) * 100
                      : 0;

                  return (
                    <tr
                      key={
                        item.injetora
                      }
                    >
                      {/* =================================
                          POSIÇÃO
                      ================================= */}

                      <td>
                        <span className="dp-ranking__position">
                          {indice + 1}
                        </span>
                      </td>

                      {/* =================================
                          INJETORA
                      ================================= */}

                      <td>
                        <div className="dp-ranking__machine">
                          <span className="dp-ranking__machine-icon">
                            <Factory
                              size={15}
                              strokeWidth={2}
                              aria-hidden="true"
                            />
                          </span>

                          <strong>
                            {item.injetora}
                          </strong>
                        </div>
                      </td>

                      {/* =================================
                          TEMPO TOTAL
                      ================================= */}

                      <td>
                        <div className="dp-ranking__impact">
                          <strong>
                            {formatarDuracaoResumida(
                              item.duracao_segundos,
                            )}
                          </strong>

                          <div className="dp-ranking__bar">
                            <span
                              className="dp-ranking__bar-value"
                              style={{
                                width: `${Math.max(
                                  2,
                                  percentualBarra,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* =================================
                          OCORRÊNCIAS
                      ================================= */}

                      <td>
                        {formatarNumero(
                          item.ocorrencias,
                        )}
                      </td>

                      {/* =================================
                          TEMPO MÉDIO
                      ================================= */}

                      <td>
                        {formatarDuracaoResumida(
                          item.tempo_medio_segundos,
                        )}
                      </td>

                      {/* =================================
                          MAIOR PARADA
                      ================================= */}

                      <td>
                        {formatarDuracaoResumida(
                          item.maior_parada_segundos,
                        )}
                      </td>

                      {/* =================================
                          IMPACTO
                      ================================= */}

                      <td>
                        <span className="dp-ranking__impact-badge">
                          {formatarPercentual(
                            item.percentual_impacto,
                          )}
                          %
                        </span>
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardParadasCard>
  );
}

export default memo(
  RankingInjetoras,
);