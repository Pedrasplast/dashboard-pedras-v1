import {
  converterDuracaoParaSegundos,
  formatarSegundosComoDuracao,
} from "../utils/Duracao";

import {
  converterNumero,
} from "../utils/Numeros";


/* =====================================================
   PRODUÇÃO POR INJETORA
===================================================== */

export function agruparProducaoPorInjetora(dados) {
  if (!Array.isArray(dados)) {
    return [];
  }

  const agrupado = new Map();


  /* =====================================================
     AGRUPAMENTO DOS DADOS
  ===================================================== */

  dados.forEach((item) => {
    const injetora =
      String(
        item.injetora || "SEM INJETORA",
      ).trim() || "SEM INJETORA";


    /*
     * Cria o registro da injetora
     * caso ainda não exista.
     */
    if (!agrupado.has(injetora)) {
      agrupado.set(injetora, {
        injetora,

        conforme: 0,

        danificada: 0,

        total_produzido: 0,

      });
    }


    const registro =
      agrupado.get(injetora);


    /* =================================================
       CONFORME
    ================================================= */

    const conforme =
      converterNumero(
        item.conforme,
      );


    /* =================================================
       DANIFICADA
    ================================================= */

    const danificada =
      converterNumero(
        item.danificada,
      );


    /* =================================================
       ACUMULADORES
    ================================================= */

    registro.conforme +=
      conforme;

    registro.danificada +=
      danificada;

    registro.total_produzido +=
      conforme + danificada;
  });


  /* =====================================================
     RESULTADO FINAL POR INJETORA
  ===================================================== */

  return Array.from(
    agrupado.values(),
  )
    .map((item) => {
  
      const qualidade =
        item.total_produzido > 0
          ? (
              item.conforme /
              item.total_produzido
            ) * 100
          : 0;


      return {
        ...item,
        qualidade,
      };
    })
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