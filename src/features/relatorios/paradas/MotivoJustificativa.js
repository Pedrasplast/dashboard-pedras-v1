import {
  converterDuracaoParaSegundos,
  formatarSegundosComoDuracao,
} from "../utils/Duracao";

/* =====================================================
   PARADAS POR MOTIVO E JUSTIFICATIVA

   AGRUPAMENTO:
   motivo + justificativa

   INDICADORES:
   - Ocorrências
   - Tempo Total
   - Tempo Médio
   - % Impacto

   % Impacto =
   tempo da combinação motivo/justificativa
   dividido pelo tempo total parado filtrado
===================================================== */

export function agruparMotivoJustificativa(
  dados,
) {
  if (!Array.isArray(dados)) {
    return [];
  }

  const agrupado = new Map();

  dados.forEach((item) => {
    const tipo = String(
      item.tipo ?? "",
    ).trim();

    /*
     * Somente registros de parada.
     */
    if (
      tipo !== "1" &&
      tipo !== "2" &&
      tipo !== "3"
    ) {
      return;
    }

    /* =================================================
       MOTIVO
    ================================================= */

    const motivo =
      String(
        item.motivo ||
          "SEM MOTIVO INFORMADO",
      ).trim() ||
      "SEM MOTIVO INFORMADO";

    /* =================================================
       JUSTIFICATIVA
    ================================================= */

    const justificativa =
      String(
        item.justificativa ||
          "SEM JUSTIFICATIVA",
      ).trim() ||
      "SEM JUSTIFICATIVA";

    /* =================================================
       DURAÇÃO

       Usa somente a coluna oficial duracao.
    ================================================= */

    const duracaoSegundos =
      converterDuracaoParaSegundos(
        item.duracao,
      );

    /* =================================================
       CHAVE

       Mesmo motivo + mesma justificativa
       = uma única linha.
    ================================================= */

    const chaveMotivo =
      motivo.toLocaleUpperCase(
        "pt-BR",
      );

    const chaveJustificativa =
      justificativa.toLocaleUpperCase(
        "pt-BR",
      );

    const chave =
      `${chaveMotivo}|||${chaveJustificativa}`;

    if (!agrupado.has(chave)) {
      agrupado.set(chave, {
        motivo,
        justificativa,

        ocorrencias: 0,

        duracao_segundos: 0,
      });
    }

    const registro =
      agrupado.get(chave);

    registro.ocorrencias += 1;

    registro.duracao_segundos +=
      duracaoSegundos;
  });

  let resultado =
    Array.from(
      agrupado.values(),
    );

  /* =====================================================
     TEMPO TOTAL PARADO

     Representa 100% do período já filtrado.
  ===================================================== */

  const tempoTotalParado =
    resultado.reduce(
      (total, item) =>
        total +
        item.duracao_segundos,
      0,
    );

  /* =====================================================
     ORDENA PELO MAIOR IMPACTO
  ===================================================== */

  resultado.sort(
    (a, b) =>
      b.duracao_segundos -
      a.duracao_segundos,
  );

  /* =====================================================
     INDICADORES
  ===================================================== */

  return resultado.map(
    (item) => {
      const tempoMedioSegundos =
        item.ocorrencias > 0
          ? item.duracao_segundos /
            item.ocorrencias
          : 0;

      const percentualImpacto =
        tempoTotalParado > 0
          ? (
              item.duracao_segundos /
              tempoTotalParado
            ) *
            100
          : 0;

      return {
        motivo:
          item.motivo,

        justificativa:
          item.justificativa,

        ocorrencias:
          item.ocorrencias,

        tempo_total:
          formatarSegundosComoDuracao(
            item.duracao_segundos,
          ),

        tempo_medio:
          formatarSegundosComoDuracao(
            tempoMedioSegundos,
          ),

        percentual_impacto:
          percentualImpacto,

        duracao_segundos:
          item.duracao_segundos,
      };
    },
  );
}