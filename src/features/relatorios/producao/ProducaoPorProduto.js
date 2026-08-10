import {
  converterDuracaoParaSegundos,
  formatarSegundosComoDuracao,
} from "../utils/Duracao";

import {
  converterNumero,
} from "../utils/Numeros";

/* =====================================================
   PRODUÇÃO POR PRODUTO

   AGRUPA POR:

   - Produto
   - Injetora

   INDICADORES:

   - Conforme
   - Danificada
   - Total Produzido
   - Duração
   - Produtividade (UN/H)
   - Qualidade (%)
===================================================== */

export function agruparProducaoPorProduto(dados) {
  if (!Array.isArray(dados)) {
    return [];
  }

  const agrupado = new Map();

  /* =====================================================
     AGRUPAMENTO
  ===================================================== */

  dados.forEach((item) => {
    /* =================================================
       PRODUTO
    ================================================= */

    const produto =
      String(
        item.cod_prod ||
        item.produto ||
        "SEM PRODUTO",
      ).trim() || "SEM PRODUTO";

    /* =================================================
       INJETORA
    ================================================= */

    const injetora =
      String(
        item.injetora ||
        "SEM INJETORA",
      ).trim() || "SEM INJETORA";

    /* =================================================
       CHAVE

       Agrupa somente:

       PRODUTO + INJETORA
    ================================================= */

    const chave =
      `${produto}|||${injetora}`;

    /* =================================================
       CRIA O GRUPO
    ================================================= */

    if (!agrupado.has(chave)) {
      agrupado.set(chave, {
        produto,

        cod_prod: produto,

        injetora,

        conforme: 0,

        danificada: 0,

        total_produzido: 0,

        duracaoSegundos: 0,

        duracao: "00:00:00",

        produtividade_hora: 0,

        qualidade: 0,
      });
    }

    const registro =
      agrupado.get(chave);

    /* =================================================
       VALORES
    ================================================= */

    const conforme =
      converterNumero(
        item.conforme,
      );

    const danificada =
      converterNumero(
        item.danificada,
      );

    /* =================================================
       SOMA PRODUÇÃO
    ================================================= */

    registro.conforme +=
      conforme;

    registro.danificada +=
      danificada;

    registro.total_produzido +=
      conforme + danificada;

    /* =================================================
       SOMA DURAÇÃO
    ================================================= */

    registro.duracaoSegundos +=
      converterDuracaoParaSegundos(
        item.duracao,
      );
  });

  /* =====================================================
     RESULTADO FINAL
  ===================================================== */

  return Array.from(
    agrupado.values(),
  )
    .map((item) => {
      /* =================================================
         HORAS DECIMAIS

         Exemplo:

         7200 segundos = 2 horas
      ================================================= */

      const horas =
        item.duracaoSegundos > 0
          ? item.duracaoSegundos / 3600
          : 0;

      /* =================================================
         PRODUTIVIDADE

         Total produzido
         ----------------
         Horas trabalhadas

         Resultado = UN/H
      ================================================= */

      const produtividade_hora =
        horas > 0
          ? item.total_produzido / horas
          : 0;

      /* =================================================
         QUALIDADE

         Conforme
         ---------------- × 100
         Total Produzido
      ================================================= */

      const qualidade =
        item.total_produzido > 0
          ? (
              item.conforme /
              item.total_produzido
            ) * 100
          : 0;

      return {
        ...item,

        duracao:
          formatarSegundosComoDuracao(
            item.duracaoSegundos,
          ),

        produtividade_hora,

        qualidade,
      };
    })

    /* =====================================================
       ORDENAÇÃO
    ===================================================== */

    .sort((a, b) => {
      const produto =
        a.produto.localeCompare(
          b.produto,
          "pt-BR",
          {
            numeric: true,
            sensitivity: "base",
          },
        );

      if (produto !== 0) {
        return produto;
      }

      return a.injetora.localeCompare(
        b.injetora,
        "pt-BR",
        {
          numeric: true,
          sensitivity: "base",
        },
      );
    });
}