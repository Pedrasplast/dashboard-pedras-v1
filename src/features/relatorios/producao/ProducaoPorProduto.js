import {  converterDuracaoParaSegundos,  formatarSegundosComoDuracao,} from "../utils/Duracao";

import {  converterNumero,} from "../utils/Numeros";

/* =====================================================
   PRODUÇÃO POR PRODUTO

   AGRUPA POR:
   - Produto
   - Injetora
   - Matéria-Prima
===================================================== */

export function agruparProducaoPorProduto(dados) {
  if (!Array.isArray(dados)) {
    return [];
  }

  const agrupado = new Map();

  dados.forEach((item) => {
    const produto =
      String(
        item.cod_prod ||
          item.produto ||
          "SEM PRODUTO",
      ).trim() || "SEM PRODUTO";

    const injetora =
      String(
        item.injetora ||
          "SEM INJETORA",
      ).trim() || "SEM INJETORA";

    const mp =
      String(
        item.mp ||
          item.materia_prima ||
          "SEM MATÉRIA-PRIMA",
      ).trim() || "SEM MATÉRIA-PRIMA";

    const chave =
      `${produto}|||${injetora}|||${mp}`;

    if (!agrupado.has(chave)) {
      agrupado.set(chave, {
        produto,
        cod_prod: produto,

        injetora,

        mp,
        materia_prima: mp,

        conforme: 0,

        danificada: 0,

        total_produzido: 0,

        duracaoSegundos: 0,

        duracao: "00:00:00",
      });
    }

    const registro =
      agrupado.get(chave);

    const conforme =
      converterNumero(item.conforme);

    const danificada =
      converterNumero(item.danificada);

    registro.conforme +=
      conforme;

    registro.danificada +=
      danificada;

    registro.total_produzido +=
      conforme + danificada;

    registro.duracaoSegundos +=
      converterDuracaoParaSegundos(
        item.duracao,
      );
  });

  return Array.from(
    agrupado.values(),
  )
    .map((item) => ({
      ...item,

      duracao:
        formatarSegundosComoDuracao(
          item.duracaoSegundos,
        ),
    }))
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

      const injetora =
        a.injetora.localeCompare(
          b.injetora,
          "pt-BR",
          {
            numeric: true,
            sensitivity: "base",
          },
        );

      if (injetora !== 0) {
        return injetora;
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
}