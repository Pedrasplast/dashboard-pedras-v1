import {
  formatarDataRelatorio,
} from "../utils/Data";

import {
  converterNumero,
  formatarNumero,
} from "../utils/Numeros";

/* =====================================================
   CADASTRO CENTRAL DAS COLUNAS DOS RELATÓRIOS
===================================================== */

export const COLUNAS_RELATORIO = {
  /* ===================================================
     GERAIS
  =================================================== */

  data: {
    titulo: "Data",
    larguraPdf: 22,
    larguraExcel: 14,

    valor: (item) =>
      formatarDataRelatorio(item),

    valorExcel: (item) =>
      formatarDataRelatorio(item),
  },

  injetora: {
    titulo: "Injetora",
    larguraPdf: 32,
    larguraExcel: 36,

    valor: (item) =>
      item.injetora || "-",

    valorExcel: (item) =>
      item.injetora || "",
  },

  produto: {
    titulo: "Produto",
    larguraPdf: 34,
    larguraExcel: 22,

    valor: (item) =>
      item.cod_prod ||
      item.produto ||
      "-",

    valorExcel: (item) =>
      item.cod_prod ||
      item.produto ||
      "",
  },

  mp: {
    titulo: "Matéria-Prima",
    larguraPdf: 38,
    larguraExcel: 24,

    valor: (item) =>
      item.mp ||
      item.materia_prima ||
      "-",

    valorExcel: (item) =>
      item.mp ||
      item.materia_prima ||
      "",
  },


  tipo: {
    titulo: "Tipo",
    larguraPdf: 22,
    larguraExcel: 18,

    valor: (item) => {
      const tipo =
        String(
          item.tipo || "",
        ).trim();

      if (tipo === "1") {
        return "Planejada";
      }

      if (tipo === "2") {
        return "Não Planejada";
      }

      if (tipo === "3") {
        return "Fora de Produção";
      }

      return tipo || "-";
    },

    valorExcel: (item) => {
      const tipo =
        String(
          item.tipo || "",
        ).trim();

      if (tipo === "1") {
        return "Planejada";
      }

      if (tipo === "2") {
        return "Não Planejada";
      }

      if (tipo === "3") {
        return "Fora de Produção";
      }

      return tipo;
    },
  },

  /* ===================================================
     PRODUÇÃO
  =================================================== */

  conforme: {
    titulo: "Conforme",
    larguraPdf: 25,
    larguraExcel: 18,
    formatoExcel: "#,##0",

    valor: (item) =>
      formatarNumero(
        item.conforme,
      ),

    valorExcel: (item) =>
      converterNumero(
        item.conforme,
      ),
  },

  danificada: {
    titulo: "Danificada",
    larguraPdf: 25,
    larguraExcel: 18,
    formatoExcel: "#,##0",

    valor: (item) =>
      formatarNumero(
        item.danificada,
      ),

    valorExcel: (item) =>
      converterNumero(
        item.danificada,
      ),
  },

  total_produzido: {
    titulo: "Total Produzido",
    larguraPdf: 30,
    larguraExcel: 18,
    formatoExcel: "#,##0",

    valor: (item) =>
      formatarNumero(
        item.total_produzido,
      ),

    valorExcel: (item) =>
      converterNumero(
        item.total_produzido,
      ),
  },

  peso: {
    titulo: "Peso",
    larguraPdf: 24,
    larguraExcel: 16,
    formatoExcel: "#,##0.0000",

    valor: (item) =>
      converterNumero(
        item.peso,
      ).toLocaleString(
        "pt-BR",
        {
          minimumFractionDigits: 4,
          maximumFractionDigits: 4,
        },
      ),

    valorExcel: (item) =>
      converterNumero(
        item.peso,
      ),
  },

  consumo_total: {
    titulo: "Consumo Total",
    larguraPdf: 30,
    larguraExcel: 20,
    formatoExcel: "#,##0.0000",

    valor: (item) =>
      converterNumero(
        item.consumo_total,
      ).toLocaleString(
        "pt-BR",
        {
          minimumFractionDigits: 4,
          maximumFractionDigits: 4,
        },
      ),

    valorExcel: (item) =>
      converterNumero(
        item.consumo_total,
      ),
  },

  gasto_unidade: {
    titulo: "Consumo por Unidade",
    larguraPdf: 34,
    larguraExcel: 22,
    formatoExcel: "0.000000",

    valor: (item) =>
      converterNumero(
        item.gasto_unidade,
      ).toLocaleString(
        "pt-BR",
        {
          minimumFractionDigits: 4,
          maximumFractionDigits: 6,
        },
      ),

    valorExcel: (item) =>
      converterNumero(
        item.gasto_unidade,
      ),
  },

  peso_total: {
    titulo: "Peso Total",
    larguraPdf: 28,
    larguraExcel: 18,
    formatoExcel: "#,##0.0000",

    valor: (item) =>
      converterNumero(
        item.peso_total,
      ).toLocaleString(
        "pt-BR",
        {
          minimumFractionDigits: 4,
          maximumFractionDigits: 4,
        },
      ),

    valorExcel: (item) =>
      converterNumero(
        item.peso_total,
      ),
  },

  /* ===================================================
     PARADAS
  =================================================== */


  motivo: {
    titulo: "Motivo",
    larguraPdf: 70,
    larguraExcel: 42,

    valor: (item) =>
      item.motivo || "-",

    valorExcel: (item) =>
      item.motivo || "",
  },

  
  justificativa: {
  titulo: "Justificativa",
  larguraPdf: 80,
  larguraExcel: 50,

  valor: (item) =>
    item.justificativa ||
    "Sem justificativa",

  valorExcel: (item) =>
    item.justificativa ||
    "Sem justificativa",
},


  ocorrencias: {
    titulo: "Ocorrências",
    larguraPdf: 27,
    larguraExcel: 16,
    formatoExcel: "#,##0",

    valor: (item) =>
      converterNumero(
        item.ocorrencias,
      ).toLocaleString(
        "pt-BR",
        {
          maximumFractionDigits: 0,
        },
      ),

    valorExcel: (item) =>
      converterNumero(
        item.ocorrencias,
      ),
  },

  tempo_total: {
    titulo: "Tempo Total",
    larguraPdf: 30,
    larguraExcel: 18,

    valor: (item) =>
      item.tempo_total ||
      "00:00:00",

    valorExcel: (item) =>
      item.tempo_total ||
      "00:00:00",
  },

  tempo_medio: {
    titulo: "Tempo Médio",
    larguraPdf: 30,
    larguraExcel: 18,

    valor: (item) =>
      item.tempo_medio ||
      "00:00:00",

    valorExcel: (item) =>
      item.tempo_medio ||
      "00:00:00",
  },

  percentual_impacto: {
    titulo: "% Impacto",
    larguraPdf: 27,
    larguraExcel: 16,
    formatoExcel: "0.00%",

    valor: (item) =>
      `${converterNumero(
        item.percentual_impacto,
      ).toLocaleString(
        "pt-BR",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        },
      )}%`,

    /*
     * No Excel:
     *
     * 35% precisa ser enviado como 0,35.
     */

    valorExcel: (item) =>
      converterNumero(
        item.percentual_impacto,
      ) / 100,
  },

  /* ===================================================
     OUTRAS
  =================================================== */

  duracao: {
    titulo: "Duração",
    larguraPdf: 25,
    larguraExcel: 16,

    valor: (item) =>
      item.duracao ||
      "-",

    valorExcel: (item) =>
      item.duracao ||
      "",
  },

  op: {
    titulo: "OP",
    larguraPdf: 25,
    larguraExcel: 18,

    valor: (item) =>
      item.op || "-",

    valorExcel: (item) =>
      item.op || "",
  },

  descricao: {
    titulo: "Descrição",
    larguraPdf: 48,
    larguraExcel: 48,

    valor: (item) =>
      item.descricao ||
      item.justificativa ||
      item.natureza ||
      item.motivo ||
      "-",

    valorExcel: (item) =>
      item.descricao ||
      item.justificativa ||
      item.natureza ||
      item.motivo ||
      "",
  },
};

/* =====================================================
   RETORNA AS COLUNAS CONFIGURADAS DE UM RELATÓRIO
===================================================== */

export function obterColunasRelatorio(
  relatorio,
) {
  if (
    !relatorio ||
    !Array.isArray(
      relatorio.colunas,
    )
  ) {
    return [];
  }

  return relatorio.colunas
    .map((chave) => {
      const configuracao =
        COLUNAS_RELATORIO[chave];

      if (!configuracao) {
        console.warn(
          `[Relatórios] Coluna "${chave}" não cadastrada.`,
        );

        return null;
      }

      return {
        chave,
        ...configuracao,
      };
    })
    .filter(Boolean);
}