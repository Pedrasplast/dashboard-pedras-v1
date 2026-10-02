import { converterNumeroFlexivel, formatarNumeroFlexivel } from "@/lib/numeros";

import {
  COLUNAS_FINANCEIRO,
} from "../financeiro/config/financeiroColunas";

const converterNumero = converterNumeroFlexivel;
const formatarNumero = formatarNumeroFlexivel;

function formatarData(valor) {
  if (!valor) return "-";
  const texto = String(valor).trim();
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const br = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (br) return `${br[1]}/${br[2]}/${br[3]}`;
  return texto;
}

function converterDataExcel(valor) {
  if (!valor) return "";

  const texto = String(valor).trim();

  if (!texto) return "";

  if (texto.toLowerCase() === "a receber") {
    return "A receber";
  }

  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (iso) {
    return new Date(
      Number(iso[1]),
      Number(iso[2]) - 1,
      Number(iso[3]),
    );
  }

  const br = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})/);

  if (br) {
    return new Date(
      Number(br[3]),
      Number(br[2]) - 1,
      Number(br[1]),
    );
  }

  return texto;
}

function criarTituloAutomatico(chave) {
  return String(chave || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

// Retorna o número comercial exatamente como armazenado: sem separador de milhar.
function formatarIdentificadorPedido(valor) {
  if (valor === null || valor === undefined) return "-";
  return String(valor).trim() || "-";
}

export const COLUNAS_RELATORIO = {
  ...COLUNAS_FINANCEIRO,
  /* PRODUÇÃO */
  data: {
    titulo: "Data",
    larguraPdf: 22,
    valor: (item) => formatarData(item.inicio_dia || item.inicio || item.data),
  },
  injetora: {
    titulo: "Injetora",
    larguraPdf: 32,
    valor: (item) => item.injetora || "-",
  },
  produto: {
    titulo: "Produto",
    larguraPdf: 30,
    valor: (item) => item.cod_prod || item.produto || "-",
  },
  descricao_produto: {
    titulo: "Descrição do Produto",
    larguraPdf: 48,
    valor: (item) => item.descricao_produto || "-",
  },
  mp: {
    titulo: "Matéria-Prima",
    larguraPdf: 38,
    valor: (item) => item.mp || item.materia_prima || "-",
  },
  tipo: {
    titulo: "Tipo",
    larguraPdf: 20,
    valor: (item) => item.tipo || "-",
  },
  conforme: {
    titulo: "Conforme",
    larguraPdf: 24,
    valor: (item) => formatarNumero(item.conforme, 2),
  },
  danificada: {
    titulo: "Danificada",
    larguraPdf: 24,
    valor: (item) => formatarNumero(item.danificada, 2),
  },
  total_produzido: {
    titulo: "Total Produzido",
    larguraPdf: 28,
    valor: (item) => formatarNumero(item.total_produzido, 2),
  },
  duracao: {
    titulo: "Duração",
    larguraPdf: 25,
    valor: (item) => item.duracao || item.tempo || "-",
  },
  produtividade_hora: {
    titulo: "UN/H",
    larguraPdf: 22,
    valor: (item) => formatarNumero(item.produtividade_hora, 0),
  },
  qualidade: {
    titulo: "Qualidade",
    larguraPdf: 24,
    valor: (item) =>
      `${converterNumero(item.qualidade).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}%`,
  },
  op: {
    titulo: "OP",
    larguraPdf: 25,
    valor: (item) => item.op || "-",
  },
  descricao: {
    titulo: "Descrição",
    larguraPdf: 48,
    valor: (item) =>
      item.descricao || item.justificativa || item.natureza || item.motivo || "-",
  },
  pedidos_atendidos: {
    titulo: "Pedidos Atendidos",
    larguraPdf: 48,
    valor: (item) => formatarIdentificadorPedido(item.pedidos_atendidos),
  },

  /* PARADAS */
  motivo: {
    titulo: "Motivo",
    larguraPdf: 48,
    valor: (item) => item.motivo || "-",
  },
  justificativa: {
    titulo: "Justificativa",
    larguraPdf: 58,
    valor: (item) => item.justificativa || "-",
  },
  ocorrencias: {
    titulo: "Ocorrências",
    larguraPdf: 25,
    valor: (item) => formatarNumero(item.ocorrencias, 0),
  },
  tempo_total: {
    titulo: "Tempo Total",
    larguraPdf: 27,
    valor: (item) => item.tempo_total || "-",
  },
  tempo_medio: {
    titulo: "Tempo Médio",
    larguraPdf: 27,
    valor: (item) => item.tempo_medio || "-",
  },
  percentual_impacto: {
    titulo: "Impacto",
    larguraPdf: 24,
    valor: (item) =>
      `${converterNumero(item.percentual_impacto).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}%`,
  },

  /* MATÉRIA-PRIMA */
  quantidade_mp: {
    titulo: "Qtd. MP",
    larguraPdf: 24,
    valor: (item) => formatarNumero(item.quantidade_mp, 2),
  },
  peso_unitario: {
    titulo: "Peso Unitário",
    larguraPdf: 28,
    valor: (item) =>
      converterNumero(item.peso_unitario).toLocaleString("pt-BR", {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }),
  },
  consumo_total: {
    titulo: "Consumo Total",
    larguraPdf: 30,
    valor: (item) =>
      converterNumero(item.consumo_total).toLocaleString("pt-BR", {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }),
  },
  gasto_unidade: {
    titulo: "Gasto por Unidade",
    larguraPdf: 34,
    valor: (item) =>
      converterNumero(item.gasto_unidade).toLocaleString("pt-BR", {
        minimumFractionDigits: 4,
        maximumFractionDigits: 6,
      }),
  },


  /* ENTRADAS E COMPRAS DE MATÉRIA-PRIMA */
  recebido: {
    titulo: "Recebido",
    larguraPdf: 24,
    larguraExcel: 14,
    valor: (item) => formatarData(item.recebido),
    valorExcel: (item) => converterDataExcel(item.recebido),
    formatoExcel: "dd/mm/yyyy",
  },
  emissao: {
    titulo: "Emissão",
    larguraPdf: 24,
    larguraExcel: 14,
    valor: (item) => formatarData(item.emissao),
    valorExcel: (item) => converterDataExcel(item.emissao),
    formatoExcel: "dd/mm/yyyy",
  },
  previsao_recebimento: {
    titulo: "Previsão de Recebimento",
    larguraPdf: 34,
    larguraExcel: 20,
    valor: (item) => formatarData(item.previsao_recebimento),
    valorExcel: (item) => converterDataExcel(item.previsao_recebimento),
    formatoExcel: "dd/mm/yyyy",
  },
  fornecedor_mp: {
    titulo: "Fornecedor",
    larguraPdf: 42,
    larguraExcel: 30,
    valor: (item) => item.fornecedor_mp || "-",
    valorExcel: (item) => item.fornecedor_mp || "-",
  },
  material_mp: {
    titulo: "Material",
    larguraPdf: 20,
    larguraExcel: 18,
    valor: (item) => item.material_mp || "-",
    valorExcel: (item) => item.material_mp || "-",
  },
  quantidade_kg: {
    titulo: "Quantidade",
    larguraPdf: 25,
    larguraExcel: 17,
    valor: (item) =>
      `${formatarNumero(item.quantidade_kg, 3)} kg`,
    valorExcel: (item) => converterNumero(item.quantidade_kg),
    formatoExcel: "#,##0",
  },
  preco: {
    titulo: "Preço",
    larguraPdf: 31,
    larguraExcel: 18,
    valor: (item) => {
      if (item.preco === null || item.preco === undefined || item.preco === "") {
        return "-";
      }

      return `${converterNumero(item.preco).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      })}/kg`;
    },
    valorExcel: (item) =>
      item.preco === null || item.preco === undefined || item.preco === ""
        ? null
        : converterNumero(item.preco),
    formatoExcel: "[$R$-416] #,##0.00",
  },
  ipi: {
    titulo: "IPI",
    larguraPdf: 18,
    larguraExcel: 12,
    valor: (item) => {
      if (item.ipi === null || item.ipi === undefined || item.ipi === "") {
        return "-";
      }

      return `${converterNumero(item.ipi).toLocaleString("pt-BR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}%`;
    },
    valorExcel: (item) =>
      item.ipi === null || item.ipi === undefined || item.ipi === ""
        ? null
        : converterNumero(item.ipi) / 100,
    formatoExcel: "0.00%",
  },
  total: {
    titulo: "Total",
    larguraPdf: 32,
    larguraExcel: 18,
    valor: (item) =>
      converterNumero(item.total).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    valorExcel: (item) => converterNumero(item.total),
    formatoExcel: "[$R$-416] #,##0.00",
  },
  /* PEDIDOS */
  pedido: {
    titulo: "Pedido",
    larguraPdf: 22,
    valor: (item) => item.pedido || "-",
  },
  cliente: {
    titulo: "Cliente",
    larguraPdf: 42,
    valor: (item) => item.cliente || "-",
  },
  data_pedido: {
    titulo: "Data do Pedido",
    larguraPdf: 25,
    valor: (item) => formatarData(item.data_pedido),
  },
  previsao: {
    titulo: "Previsão Faturamento",
    larguraPdf: 29,
    valor: (item) => formatarData(item.previsao),
  },
  dias_atraso: {
    titulo: "Dias em Atraso",
    larguraPdf: 24,
    valor: (item) => formatarNumero(item.dias_atraso, 0),
  },
  codigo_produto: {
    titulo: "Código",
    larguraPdf: 28,
    valor: (item) => item.codigo_produto || item.codigoProduto || "-",
  },
  produto_pedido: {
    titulo: "Produto",
    larguraPdf: 62,
    valor: (item) => item.produto_pedido || item.produto || "-",
  },
  quantidade: {
    titulo: "Quantidade",
    larguraPdf: 25,
    valor: (item) => formatarNumero(item.quantidade, 3),
  },
  unidade: {
    titulo: "Un.",
    larguraPdf: 16,
    valor: (item) => item.unidade || "-",
  },
  vendedor: {
    titulo: "Vendedor",
    larguraPdf: 32,
    valor: (item) => item.vendedor || "-",
  },
  status: {
    titulo: "Status",
    larguraPdf: 24,
    valor: (item) => item.status || "-",
  },
  pedidos: {
    titulo: "Pedidos",
    larguraPdf: 48,
    // Nunca converter para número: pode conter "3036, 3109".
    valor: (item) => formatarIdentificadorPedido(item.pedidos),
  },
};

export function obterColunasRelatorio(relatorio) {
  if (!relatorio || !Array.isArray(relatorio.colunas)) return [];

  return relatorio.colunas.map((chave) => {
    const configuracao = COLUNAS_RELATORIO[chave];
    if (configuracao) return { chave, ...configuracao };

    return {
      chave,
      titulo: criarTituloAutomatico(chave),
      larguraPdf: 30,
      valor: (item) => {
        const valor = item?.[chave];
        return valor === null || valor === undefined || valor === ""
          ? "-"
          : String(valor);
      },
    };
  });
}