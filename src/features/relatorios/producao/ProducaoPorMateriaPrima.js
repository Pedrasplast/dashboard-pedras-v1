import {
  converterNumero,
} from "../utils/Numeros";

/* =====================================================
   CONSUMO DE MATÉRIA-PRIMA POR PRODUTO

   AGRUPAMENTO:
   CÓDIGO DO PRODUTO + MATÉRIA-PRIMA
===================================================== */

export function agruparProducaoPorMateriaPrima(
  dados,
) {
  if (!Array.isArray(dados)) {
    return [];
  }

  const agrupado = new Map();

  dados.forEach((item) => {
    /* =================================================
       IDENTIFICAÇÃO
    ================================================= */

    const produto =
      String(
        item.cod_prod ||
          item.produto ||
          "SEM PRODUTO",
      ).trim() ||
      "SEM PRODUTO";

    const mp =
      String(
        item.mp ||
          item.materia_prima ||
          "SEM MATÉRIA-PRIMA",
      ).trim() ||
      "SEM MATÉRIA-PRIMA";

    /*
     * CHAVE DE AGRUPAMENTO
     *
     * Mesmo código + mesma MP
     * = mesma linha.
     */

    const chave =
      `${produto}|||${mp}`;

    /* =================================================
       CAMPOS REAIS DO BANCO
    ================================================= */

    const conforme =
      converterNumero(
        item.conforme,
      );

    const danificada =
      converterNumero(
        item.danificada,
      );

    const peso =
      converterNumero(
        item.peso,
      );

    const consumido =
      converterNumero(
        item.consumido,
      );

    /* =================================================
       CRIA GRUPO
    ================================================= */

    if (!agrupado.has(chave)) {
      agrupado.set(chave, {
        produto,
        cod_prod: produto,

        mp,

        conforme: 0,

        danificada: 0,

        total_produzido: 0,

        peso: 0,

        consumo_total: 0,
      });
    }

    const registro =
      agrupado.get(chave);

    /* =================================================
       PRODUÇÃO
    ================================================= */

    registro.conforme +=
      conforme;

    registro.danificada +=
      danificada;

    registro.total_produzido +=
      conforme + danificada;

    /* =================================================
       PESO

       Não soma.

       Apenas traz o peso válido daquele código.
    ================================================= */

    if (peso > 0) {
      registro.peso =
        peso;
    }

    /* =================================================
       CONSUMO DO BANCO
    ================================================= */

    registro.consumo_total +=
      consumido;

    /* =================================================
       MATERIAL GASTO NAS DANIFICADAS

       Pelo exemplo que você mostrou:

       conforme = 960
       peso = 0,2855
       consumido = 274,0800

       960 × 0,2855 = 274,0800

       Portanto o banco não incluiu as 13 danificadas.
    ================================================= */

    registro.consumo_total +=
      danificada *
      peso;
  });

  /* =====================================================
     CÁLCULOS FINAIS
  ===================================================== */

  const resultado =
    Array.from(
      agrupado.values(),
    ).map((item) => {
      /* =================================================
         CONSUMO POR UNIDADE

         Consideramos conformes + danificadas,
         pois ambas consumiram matéria-prima.
      ================================================= */

      const gastoUnidade =
        item.total_produzido > 0
          ? item.consumo_total /
            item.total_produzido
          : 0;

      /* =================================================
         PESO TOTAL PRODUZIDO
      ================================================= */

      const pesoTotal =
        item.total_produzido *
        item.peso;

      return {
        ...item,

        gasto_unidade:
          gastoUnidade,

        peso_total:
          pesoTotal,
      };
    });

  /* =====================================================
     ORDENA POR PRODUTO E DEPOIS MP
  ===================================================== */

  resultado.sort((a, b) => {
    const comparacaoProduto =
      a.produto.localeCompare(
        b.produto,
        "pt-BR",
        {
          numeric: true,
          sensitivity: "base",
        },
      );

    if (
      comparacaoProduto !== 0
    ) {
      return comparacaoProduto;
    }

    return a.mp.localeCompare(
      b.mp,
      "pt-BR",
      {
        numeric: true,
        sensitivity: "base",
      },
    );
  });

  return resultado;
}