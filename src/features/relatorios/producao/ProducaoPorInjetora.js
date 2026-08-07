import {
  converterDuracaoParaSegundos,
  formatarSegundosComoDuracao,
} from "../utils/duracao";

import {
  converterNumero,
} from "../utils/numeros";

/* =====================================================
   PRODUÇÃO POR INJETORA
===================================================== */

export function agruparProducaoPorInjetora(dados) {
  if (!Array.isArray(dados)) {
    return [];
  }

  const agrupado = new Map();

  dados.forEach((item) => {
    const injetora =
      String(
        item.injetora || "SEM INJETORA",
      ).trim() || "SEM INJETORA";

    if (!agrupado.has(injetora)) {
      agrupado.set(injetora, {
        injetora,

        conforme: 0,

        danificada: 0,

        total_produzido: 0,

        duracaoSegundos: 0,

        duracao: "00:00:00",
      });
    }

    const registro =
      agrupado.get(injetora);

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
    .sort((a, b) =>
      a.injetora.localeCompare(
        b.injetora,
        "pt-BR",
        {
          numeric: true,
          sensitivity: "base",
        },
      ),
    );
}