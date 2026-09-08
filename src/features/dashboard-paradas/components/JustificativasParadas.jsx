import { memo, useMemo } from "react";

import {
  FileWarning,
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
   JUSTIFICATIVAS
========================================================= */

function JustificativasParadas({
  dados = [],
}) {
  const lista =
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
    lista.length === 0;

  return (
    <DashboardParadasCard
      title="Principais justificativas"
      subtitle="Detalhamento das causas com maior impacto em tempo parado"
      icon={FileWarning}
      empty={vazio}
      contentClassName="dp-justificativas-card-content"
    >
      <div className="dp-justificativas">
        <div className="dp-justificativas__table-wrapper">
          <table className="dp-justificativas__table">
            <thead>
              <tr>
                <th>
                  #
                </th>

                <th>
                  Motivo
                </th>

                <th>
                  Justificativa
                </th>

                <th>
                  Paradas
                </th>

                <th>
                  Tempo total
                </th>

                <th>
                  Tempo médio
                </th>

                <th>
                  Impacto
                </th>
              </tr>
            </thead>

            <tbody>
              {lista.map(
                (
                  item,
                  indice,
                ) => (
                  <tr
                    key={`${item.motivo}-${item.justificativa}-${indice}`}
                  >
                    <td>
                      <span className="dp-justificativas__position">
                        {indice + 1}
                      </span>
                    </td>

                    <td>
                      <strong className="dp-justificativas__motivo">
                        {item.motivo}
                      </strong>
                    </td>

                    <td>
                      <span className="dp-justificativas__texto">
                        {item.justificativa}
                      </span>
                    </td>

                    <td>
                      {formatarNumero(
                        item.ocorrencias,
                      )}
                    </td>

                    <td>
                      <strong>
                        {formatarDuracaoResumida(
                          item.duracao_segundos,
                        )}
                      </strong>
                    </td>

                    <td>
                      {formatarDuracaoResumida(
                        item.tempo_medio_segundos,
                      )}
                    </td>

                    <td>
                      <span className="dp-justificativas__impacto">
                        {formatarPercentual(
                          item.percentual_impacto,
                        )}
                        %
                      </span>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardParadasCard>
  );
}

export default memo(
  JustificativasParadas,
);