import {
  converterNumeroFlexivel,
} from "@/lib/numeros";


const converterNumero =
  converterNumeroFlexivel;


function valorVazio(valor) {
  return (
    valor === null ||
    valor === undefined ||
    valor === ""
  );
}


function formatarMoeda(valor) {
  if (valorVazio(valor)) {
    return "-";
  }

  const numero = converterNumero(valor);

  return numero.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );
}


function formatarPercentual(valor) {
  if (valorVazio(valor)) {
    return "-";
  }

  const numero = converterNumero(valor);

  return `${numero.toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}%`;
}


export const COLUNAS_FINANCEIRO = {
  codigo_categoria: {
    titulo:
      "Código Categoria",

    larguraPdf:
      27,

    larguraExcel:
      18,

    larguraTabela:
      "14%",

    valor: (item) =>
      String(
        item?.codigo_categoria ?? "",
      ).trim() || "-",

    valorExcel: (item) =>
      String(
        item?.codigo_categoria ?? "",
      ).trim() || "-",
  },


  categoria_financeira: {
    titulo:
      "Categoria Financeira",

    larguraPdf:
      52,

    larguraExcel:
      42,

    larguraTabela:
      "26%",

    valor: (item) =>
      item?.categoria_financeira ||
      item?.categoria ||
      "-",

    valorExcel: (item) =>
      item?.categoria_financeira ||
      item?.categoria ||
      "-",
  },


  tipo_financeiro: {
    titulo:
      "Tipo",

    larguraPdf:
      20,

    larguraExcel:
      14,

    larguraTabela:
      "12%",

    valor: (item) =>
      item?.tipo_financeiro ||
      item?.tipo ||
      "-",

    valorExcel: (item) =>
      item?.tipo_financeiro ||
      item?.tipo ||
      "-",
  },


  valor_previsto: {
    titulo:
      "Valor Previsto",

    larguraPdf:
      31,

    larguraExcel:
      18,

    larguraTabela:
      "15%",

    numerica:
      true,

    valor: (item) =>
      formatarMoeda(
        item?.valor_previsto,
      ),

    valorExcel: (item) =>
      converterNumero(
        item?.valor_previsto,
      ),

    formatoExcel:
      '[$R$-416] #,##0.00;[Red]-[$R$-416] #,##0.00',
  },


  valor_realizado: {
    titulo:
      "Valor Realizado",

    larguraPdf:
      31,

    larguraExcel:
      18,

    larguraTabela:
      "15%",

    numerica:
      true,

    valor: (item) =>
      formatarMoeda(
        item?.valor_realizado,
      ),

    valorExcel: (item) =>
      converterNumero(
        item?.valor_realizado,
      ),

    formatoExcel:
      '[$R$-416] #,##0.00;[Red]-[$R$-416] #,##0.00',
  },


  variacao: {
    titulo:
      "Variação",

    larguraPdf:
      31,

    larguraExcel:
      18,

    larguraTabela:
      "15%",

    numerica:
      true,

    valor: (item) =>
      formatarMoeda(
        item?.variacao,
      ),

    valorExcel: (item) =>
      converterNumero(
        item?.variacao,
      ),

    formatoExcel:
      '[$R$-416] #,##0.00;[Red]-[$R$-416] #,##0.00',
  },


  variacao_percentual: {
    titulo:
      "Variação Percentual",

    larguraPdf:
      31,

    larguraExcel:
      20,

    larguraTabela:
      "15%",

    numerica:
      true,

    valor: (item) =>
      formatarPercentual(
        item?.variacao_percentual,
      ),

    valorExcel: (item) => {
      if (
        valorVazio(
          item?.variacao_percentual,
        )
      ) {
        return null;
      }

      return (
        converterNumero(
          item.variacao_percentual,
        ) / 100
      );
    },

    formatoExcel:
      '0.00%;[Red]-0.00%',
  },


  excesso_previsto: {
    titulo:
      "Excesso sobre o Previsto",

    larguraPdf:
      34,

    larguraExcel:
      22,

    larguraTabela:
      "17%",

    numerica:
      true,

    valor: (item) =>
      formatarMoeda(
        item?.excesso_previsto,
      ),

    valorExcel: (item) =>
      converterNumero(
        item?.excesso_previsto,
      ),

    formatoExcel:
      '[$R$-416] #,##0.00;[Red]-[$R$-416] #,##0.00',
  },


  excesso_percentual: {
    titulo:
      "Excesso Percentual",

    larguraPdf:
      29,

    larguraExcel:
      20,

    larguraTabela:
      "15%",

    numerica:
      true,

    valor: (item) =>
      formatarPercentual(
        item?.excesso_percentual,
      ),

    valorExcel: (item) => {
      if (
        valorVazio(
          item?.excesso_percentual,
        )
      ) {
        return null;
      }

      return (
        converterNumero(
          item.excesso_percentual,
        ) / 100
      );
    },

    formatoExcel:
      '0.00%;[Red]-0.00%',
  },
};


export const CHAVES_COLUNAS_FINANCEIRO = [
  "codigo_categoria",
  "categoria_financeira",
  "tipo_financeiro",
  "valor_previsto",
  "valor_realizado",
  "variacao",
  "variacao_percentual",
];


export function obterColunasFinanceiro({
  incluirTipo = false,
} = {}) {
  return CHAVES_COLUNAS_FINANCEIRO
    .filter(
      (chave) =>
        incluirTipo ||
        chave !== "tipo_financeiro",
    )
    .map((chave) => ({
      chave,
      ...COLUNAS_FINANCEIRO[chave],
    }));
}
