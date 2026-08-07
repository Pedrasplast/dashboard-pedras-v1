import {
  converterDuracaoParaSegundos,
  formatarSegundosComoDuracao,
} from "../utils/Duracao";

/* =====================================================
   IMPACTO DAS PARADAS POR MOTIVO

   TIPOS:
   1 = Planejada
   2 = Não Planejada
   3 = Fora de Produção

   CAMPO DE TEMPO:
   duracao

   AGRUPAMENTO:
   motivo

   INDICADORES:
   - Ranking
   - Ocorrências
   - Tempo Total
   - Tempo Médio
   - % Impacto

   % IMPACTO =
   Tempo do motivo / Tempo total parado filtrado
===================================================== */

export function impactoParadasPorMotivo(dados) {
  if (!Array.isArray(dados)) {
    return [];
  }

  const agrupado = new Map();

  /* =====================================================
     AGRUPAMENTO
  ===================================================== */

  dados.forEach((item) => {
    const tipo = String(
      item.tipo ?? "",
    ).trim();

    /*
     * Somente registros classificados como parada.
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

    const motivoOriginal = String(
      item.motivo ||
        "SEM MOTIVO INFORMADO",
    ).trim();

    const motivo =
      motivoOriginal ||
      "SEM MOTIVO INFORMADO";

    /*
     * Normalização da chave.

     * Evita separar:
     *
     * Aguardando Mecânica
     * AGUARDANDO MECÂNICA
     * aguardando mecânica
     */

    const chave =
      motivo.toLocaleUpperCase(
        "pt-BR",
      );

    /* =================================================
       DURAÇÃO

       Utiliza SOMENTE a coluna duracao.
    ================================================= */

    const duracaoSegundos =
      converterDuracaoParaSegundos(
        item.duracao,
      );

    /* =================================================
       CRIA O GRUPO
    ================================================= */

    if (!agrupado.has(chave)) {
      agrupado.set(chave, {
        motivo,

        ocorrencias: 0,

        duracao_segundos: 0,
      });
    }

    const registro =
      agrupado.get(chave);

    /*
     * Toda parada conta como ocorrência,
     * inclusive se a duração estiver zerada.
     */

    registro.ocorrencias += 1;

    /*
     * Soma a duração da parada.
     */

    registro.duracao_segundos +=
      duracaoSegundos;
  });

  /* =====================================================
     ARRAY DOS MOTIVOS
  ===================================================== */

  let resultado = Array.from(
    agrupado.values(),
  );

  /* =====================================================
     TEMPO TOTAL PARADO

     Esta soma representa 100% do relatório.

     IMPORTANTE:
     Os dados já chegaram filtrados pela
     TelaRelatoriosPage.

     Portanto, se o usuário selecionar:
     - período
     - injetora
     - tipo

     o percentual será calculado somente
     sobre esse recorte.
  ===================================================== */

  const tempoTotalParado =
    resultado.reduce(
      (total, item) =>
        total +
        item.duracao_segundos,
      0,
    );

  /* =====================================================
     ORDENA MAIOR IMPACTO PRIMEIRO
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
      /* =================================================
         TEMPO MÉDIO

         tempo total / ocorrências
      ================================================= */

      const tempoMedioSegundos =
        item.ocorrencias > 0
          ? item.duracao_segundos /
            item.ocorrencias
          : 0;

      /* =================================================
         % IMPACTO

         tempo do motivo
         -------------------- × 100
         tempo total parado
      ================================================= */

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

        /*
         * Mantemos internamente para
         * futuras análises e gráficos.
         */

        duracao_segundos:
          item.duracao_segundos,

        tempo_medio_segundos:
          tempoMedioSegundos,
      };
    },
  );
}