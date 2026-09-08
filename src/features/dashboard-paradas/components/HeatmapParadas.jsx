import { memo, useMemo } from "react";

import {
  Clock3,
} from "lucide-react";

import DashboardParadasCard from "./DashboardParadasCard";

import {
  formatarDuracaoResumida,
} from "../dashboardParadas.utils";

/* =========================================================
   UTILITÁRIOS
========================================================= */

function obterChaveCelula(
  diaIndice,
  faixa,
) {
  return `${diaIndice}|${faixa}`;
}

function limitar(
  valor,
  minimo,
  maximo,
) {
  return Math.min(
    maximo,
    Math.max(
      minimo,
      valor,
    ),
  );
}

/* =========================================================
   INTENSIDADE

   Não usamos cores diretamente no JSX.
   Apenas classes de intensidade que serão estilizadas
   depois no CSS.
========================================================= */

function obterClasseIntensidade(
  ocorrencias,
  maxOcorrencias,
) {
  const quantidade =
    Number(
      ocorrencias || 0,
    );

  const maximo =
    Number(
      maxOcorrencias || 0,
    );

  if (
    quantidade <= 0 ||
    maximo <= 0
  ) {
    return "nivel-0";
  }

  const proporcao =
    limitar(
      quantidade / maximo,
      0,
      1,
    );

  if (proporcao <= 0.2) {
    return "nivel-1";
  }

  if (proporcao <= 0.4) {
    return "nivel-2";
  }

  if (proporcao <= 0.6) {
    return "nivel-3";
  }

  if (proporcao <= 0.8) {
    return "nivel-4";
  }

  return "nivel-5";
}

/* =========================================================
   HEATMAP
========================================================= */

function HeatmapParadas({
  dados,
}) {
  const dias =
    Array.isArray(
      dados?.dias,
    )
      ? dados.dias
      : [];

  const faixas =
    Array.isArray(
      dados?.faixas,
    )
      ? dados.faixas
      : [];

  const celulas =
    Array.isArray(
      dados?.celulas,
    )
      ? dados.celulas
      : [];

  const maxOcorrencias =
    Number(
      dados?.maxOcorrencias || 0,
    );

  /* =======================================================
     MAPA DE ACESSO RÁPIDO

     Em vez de procurar com .find() em cada célula,
     criamos um Map uma única vez.
  ======================================================= */

  const mapaCelulas =
    useMemo(() => {
      const mapa =
        new Map();

      for (
        const item
        of celulas
      ) {
        const chave =
          obterChaveCelula(
            item.dia_indice,
            item.faixa,
          );

        mapa.set(
          chave,
          item,
        );
      }

      return mapa;
    }, [
      celulas,
    ]);

  /* =======================================================
     MAIOR CONCENTRAÇÃO
  ======================================================= */

  const maiorConcentracao =
    useMemo(() => {
      if (
        celulas.length === 0
      ) {
        return null;
      }

      return celulas.reduce(
        (maior, item) => {
          if (!maior) {
            return item;
          }

          if (
            item.ocorrencias >
            maior.ocorrencias
          ) {
            return item;
          }

          return maior;
        },
        null,
      );
    }, [
      celulas,
    ]);

  const vazio =
    celulas.length === 0 ||
    maxOcorrencias <= 0;

  return (
    <DashboardParadasCard
      title="Concentração das paradas"
      subtitle="Distribuição dos inícios das paradas por dia da semana e horário"
      icon={Clock3}
      empty={vazio}
      contentClassName="dp-heatmap-card-content"
    >
      <div className="dp-heatmap">
        {/* =================================================
            INSIGHT PRINCIPAL
        ================================================= */}

        {maiorConcentracao && (
          <div className="dp-heatmap__insight">
            <span>
              Maior concentração registrada
            </span>

            <strong>
              {maiorConcentracao.dia}
              {" • "}
              {maiorConcentracao.faixa_label}
            </strong>

            <small>
              {Number(
                maiorConcentracao.ocorrencias,
              ).toLocaleString(
                "pt-BR",
              )}{" "}
              ocorrências
              {" • "}
              {formatarDuracaoResumida(
                maiorConcentracao.duracao_segundos,
              )}{" "}
              acumulados
            </small>
          </div>
        )}

        {/* =================================================
            MATRIZ
        ================================================= */}

        <div className="dp-heatmap__scroll">
          <div
            className="dp-heatmap__grid"
            style={{
              gridTemplateColumns:
                `82px repeat(${faixas.length}, minmax(72px, 1fr))`,
            }}
          >
            {/* =============================================
                CABEÇALHO VAZIO
            ============================================= */}

            <div className="dp-heatmap__corner">
              Dia
            </div>

            {/* =============================================
                HORÁRIOS
            ============================================= */}

            {faixas.map(
              (faixa) => (
                <div
                  key={
                    faixa.id
                  }
                  className="dp-heatmap__header"
                >
                  {faixa.label}
                </div>
              ),
            )}

            {/* =============================================
                LINHAS POR DIA
            ============================================= */}

            {dias.map(
              (
                dia,
                diaIndice,
              ) => (
                <MemoLinhaHeatmap
                  key={`${dia}-${diaIndice}`}
                  dia={dia}
                  diaIndice={diaIndice}
                  faixas={faixas}
                  mapaCelulas={mapaCelulas}
                  maxOcorrencias={maxOcorrencias}
                />
              ),
            )}
          </div>
        </div>

        {/* =================================================
            LEGENDA
        ================================================= */}

        <div className="dp-heatmap__legend">
          <span>
            Menor concentração
          </span>

          <div className="dp-heatmap__legend-scale">
            <i className="nivel-1" />
            <i className="nivel-2" />
            <i className="nivel-3" />
            <i className="nivel-4" />
            <i className="nivel-5" />
          </div>

          <span>
            Maior concentração
          </span>
        </div>
      </div>
    </DashboardParadasCard>
  );
}

/* =========================================================
   LINHA DO HEATMAP

   Separada para evitar deixar o componente principal
   muito grande.
========================================================= */

function LinhaHeatmap({
  dia,
  diaIndice,
  faixas,
  mapaCelulas,
  maxOcorrencias,
}) {
  return (
    <>
      <div className="dp-heatmap__day">
        {dia}
      </div>

      {faixas.map(
        (faixa) => {
          const chave =
            obterChaveCelula(
              diaIndice,
              faixa.id,
            );

          const celula =
            mapaCelulas.get(
              chave,
            );

          const ocorrencias =
            Number(
              celula?.ocorrencias ||
                0,
            );

          const duracaoSegundos =
            Number(
              celula?.duracao_segundos ||
                0,
            );

          const classe =
            obterClasseIntensidade(
              ocorrencias,
              maxOcorrencias,
            );

          const titulo =
            ocorrencias > 0
              ? [
                  `${dia} • ${faixa.label}`,
                  `${ocorrencias} ocorrências`,
                  `${formatarDuracaoResumida(
                    duracaoSegundos,
                  )} de tempo acumulado`,
                ].join(" | ")
              : `${dia} • ${faixa.label} | Sem ocorrências`;

          return (
            <div
              key={
                faixa.id
              }
              className={[
                "dp-heatmap__cell",
                classe,
              ].join(" ")}
              title={titulo}
              aria-label={titulo}
            >
              <strong>
                {ocorrencias}
              </strong>

              {ocorrencias >
                0 && (
                <small>
                  {formatarDuracaoResumida(
                    duracaoSegundos,
                  )}
                </small>
              )}
            </div>
          );
        },
      )}
    </>
  );
}

const MemoLinhaHeatmap =
  memo(
    LinhaHeatmap,
  );

export default memo(
  HeatmapParadas,
);