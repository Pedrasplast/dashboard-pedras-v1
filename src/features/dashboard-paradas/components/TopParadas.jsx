import { memo } from "react";

import {
  AlertTriangle,
  CalendarDays,
  Factory,
} from "lucide-react";

import DashboardParadasCard from "./DashboardParadasCard";

import {
  formatarDataCurta,
  formatarDuracaoResumida,
} from "../dashboardParadas.utils";

/* =========================================================
   TOP MAIORES PARADAS
========================================================= */

function TopParadas({
  dados = [],
}) {
  const lista =
    Array.isArray(dados)
      ? dados.slice(0, 5)
      : [];

  const vazio =
    lista.length === 0;

  return (
    <DashboardParadasCard
      title="Top 5 maiores paradas"
      subtitle="Eventos individuais com maior duração no período"
      icon={AlertTriangle}
      empty={vazio}
      contentClassName="dp-top-paradas-card-content"
    >
      <div className="dp-top-paradas">
        {lista.map(
          (
            item,
            indice,
          ) => (
            <article
              key={
                item.id ||
                `${item.data}-${item.injetora}-${indice}`
              }
              className="dp-top-paradas__item"
            >
              {/* =========================================
                  POSIÇÃO
              ========================================= */}

              <div className="dp-top-paradas__rank">
                <span>
                  {String(
                    indice + 1,
                  ).padStart(
                    2,
                    "0",
                  )}
                </span>
              </div>

              {/* =========================================
                  CONTEÚDO
              ========================================= */}

              <div className="dp-top-paradas__content">
                <div className="dp-top-paradas__top">
                  <div className="dp-top-paradas__machine">
                    <span className="dp-top-paradas__machine-icon">
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

                  <strong className="dp-top-paradas__duration">
                    {formatarDuracaoResumida(
                      item.duracao_segundos,
                    )}
                  </strong>
                </div>

                {/* =======================================
                    MOTIVO
                ======================================= */}

                <div className="dp-top-paradas__reason">
                  <strong>
                    {item.motivo}
                  </strong>

                  {item.tipo && (
                    <span className="dp-top-paradas__tipo">
                      Tipo {item.tipo}
                    </span>
                  )}
                </div>

                {/* =======================================
                    JUSTIFICATIVA
                ======================================= */}

                <p className="dp-top-paradas__justificativa">
                  {item.justificativa}
                </p>

                {/* =======================================
                    RODAPÉ
                ======================================= */}

                <div className="dp-top-paradas__meta">
                  <span>
                    <CalendarDays
                      size={13}
                      strokeWidth={2}
                      aria-hidden="true"
                    />

                    {formatarDataCurta(
                      item.data,
                    )}
                  </span>
                </div>
              </div>
            </article>
          ),
        )}
      </div>
    </DashboardParadasCard>
  );
}

export default memo(
  TopParadas,
);