import {
  memo,
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  Clock3,
} from "lucide-react";

import DashboardParadasCard from "./DashboardParadasCard";
import ModalOcorrenciasParadas from "./ModalOcorrenciasParadas";

import {
  formatarDuracaoResumida,
} from "../dashboardParadas.utils";

import "./HeatmapParadas.css";

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
  const [
    celulaSelecionada,
    setCelulaSelecionada,
  ] = useState(null);

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
            Number(
              item.ocorrencias || 0,
            ) >
            Number(
              maior.ocorrencias || 0,
            )
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

  /* =======================================================
     ABRIR / FECHAR MODAL
  ======================================================= */

  const abrirCelula =
    useCallback(
      (
        dia,
        diaIndice,
        faixa,
        celula,
      ) => {
        const registros =
          Array.isArray(
            celula?.registros,
          )
            ? celula.registros
            : [];

        /*
         * A célula só abre quando existem registros.
         * Estes são exatamente os mesmos registros
         * usados por consolidarParadas() para gerar
         * quantidade e duração da célula.
         */
        if (
          registros.length === 0
        ) {
          return;
        }

        setCelulaSelecionada({
          dia,
          diaIndice,
          faixa,
          celula,
        });
      },
      [],
    );

  const fecharCelula =
    useCallback(() => {
      setCelulaSelecionada(
        null,
      );
    }, []);

  /* =======================================================
     OCORRÊNCIAS EXATAS DA CÉLULA

     Não recalcula:
     - data;
     - dia da semana;
     - timezone;
     - horário;
     - faixa.

     Isso evita divergência entre Heatmap e Modal.
  ======================================================= */

  const ocorrenciasSelecionadas =
    useMemo(() => {
      const registros =
        celulaSelecionada
          ?.celula
          ?.registros;

      return Array.isArray(
        registros,
      )
        ? registros
        : [];
    }, [
      celulaSelecionada,
    ]);

  /* =======================================================
     TÍTULO DO MODAL
  ======================================================= */

  const tituloModal =
    useMemo(() => {
      if (
        !celulaSelecionada
      ) {
        return "";
      }

      const faixaLabel =
        celulaSelecionada
          .faixa?.label ||
        celulaSelecionada
          .faixa?.id ||
        "";

      return (
        `${celulaSelecionada.dia}` +
        (
          faixaLabel
            ? ` • ${faixaLabel}`
            : ""
        )
      );
    }, [
      celulaSelecionada,
    ]);

  const vazio =
    celulas.length === 0 ||
    maxOcorrencias <= 0;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <DashboardParadasCard
        title="Concentração das paradas"
        subtitle="Distribuição dos inícios das paradas por dia da semana e horário"
        icon={Clock3}
        empty={vazio}
        contentClassName="dp-heatmap-card-content"
      >
        <div className="dp-heatmap">
          {/* =============================================
              INSIGHT PRINCIPAL
          ============================================= */}

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

          {/* =============================================
              MATRIZ
          ============================================= */}

          <div className="dp-heatmap__scroll">
            <div
              className="dp-heatmap__grid"
              style={{
                "--dp-heatmap-columns":
                  faixas.length,
              }}
            >
              <div className="dp-heatmap__corner">
                Dia
              </div>

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
                    celulaSelecionada={celulaSelecionada}
                    onSelecionarCelula={abrirCelula}
                  />
                ),
              )}
            </div>
          </div>

          {/* =============================================
              LEGENDA
          ============================================= */}

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

          <div className="dp-drilldown__clique">
            Clique em uma célula com ocorrências
            para visualizar exatamente os registros
            que formaram aquele valor.
          </div>
        </div>
      </DashboardParadasCard>

      <ModalOcorrenciasParadas
        aberto={Boolean(
          celulaSelecionada,
        )}
        titulo={tituloModal}
        subtitulo="Registros exatos utilizados na consolidação desta célula"
        eyebrow="Detalhamento da concentração"
        ocorrencias={
          ocorrenciasSelecionadas
        }
        onFechar={
          fecharCelula
        }
        icone={Clock3}
      />
    </>
  );
}

/* =========================================================
   LINHA DO HEATMAP
========================================================= */

function LinhaHeatmap({
  dia,
  diaIndice,
  faixas,
  mapaCelulas,
  maxOcorrencias,
  celulaSelecionada,
  onSelecionarCelula,
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

          const registros =
            Array.isArray(
              celula?.registros,
            )
              ? celula.registros
              : [];

          /*
           * Usa o tamanho da lista real como fonte da
           * verdade para a quantidade exibida.
           */
          const ocorrencias =
            registros.length;

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

          const clicavel =
            ocorrencias > 0;

          const selecionada =
            Boolean(
              celulaSelecionada &&
              celulaSelecionada
                .diaIndice ===
                diaIndice &&
              celulaSelecionada
                .faixa?.id ===
                faixa.id,
            );

          const titulo =
            clicavel
              ? [
                  `${dia} • ${faixa.label}`,
                  `${ocorrencias} ocorrências`,
                  `${formatarDuracaoResumida(
                    duracaoSegundos,
                  )} de tempo acumulado`,
                  "Clique para visualizar os registros",
                ].join(" | ")
              : `${dia} • ${faixa.label} | Sem ocorrências`;

          function selecionar() {
            if (
              !clicavel
            ) {
              return;
            }

            onSelecionarCelula(
              dia,
              diaIndice,
              faixa,
              celula,
            );
          }

          function aoPressionarTecla(
            evento,
          ) {
            if (
              !clicavel
            ) {
              return;
            }

            if (
              evento.key ===
                "Enter" ||
              evento.key ===
                " "
            ) {
              evento.preventDefault();

              selecionar();
            }
          }

          return (
            <div
              key={
                faixa.id
              }
              className={[
                "dp-heatmap__cell",
                classe,
                clicavel
                  ? "is-clickable"
                  : "",
                selecionada
                  ? "is-selected"
                  : "",
              ]
                .filter(
                  Boolean,
                )
                .join(" ")}
              title={titulo}
              aria-label={titulo}
              role={
                clicavel
                  ? "button"
                  : undefined
              }
              tabIndex={
                clicavel
                  ? 0
                  : undefined
              }
              onClick={
                clicavel
                  ? selecionar
                  : undefined
              }
              onKeyDown={
                clicavel
                  ? aoPressionarTecla
                  : undefined
              }
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
