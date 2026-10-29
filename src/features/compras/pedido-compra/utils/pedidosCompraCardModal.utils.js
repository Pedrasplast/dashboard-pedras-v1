/* =========================================================
   REGRAS DO MODAL DE DETALHES DOS CARDS DE PEDIDOS DE COMPRA
   ---------------------------------------------------------
   Valor do indicador, totais do resumo e agrupamento dos
   recebimentos físicos. Sem React.
========================================================= */

import { formatarMoeda } from "./pedidosCompra.utils";

export function obterValorPrincipal(cardId, indicadores) {
  switch (cardId) {
    case "abertos":
      return String(indicadores?.abertos ?? 0);

    case "atrasados":
      return String(indicadores?.atrasados ?? 0);

    case "valor-aberto":
      return formatarMoeda(indicadores?.valorEmAberto ?? 0);

    case "proximos-7-dias":
      return String(indicadores?.proximos7Dias ?? 0);

    case "hoje":
      return String(indicadores?.hoje ?? 0);

    case "requisicoes-total":
      return String(indicadores?.total ?? 0);

    case "requisicoes-valor":
      return formatarMoeda(indicadores?.valorTotal ?? 0);

    case "requisicoes-itens":
      return String(indicadores?.itens ?? 0);

    case "requisicoes-proximos-7-dias":
      return String(indicadores?.proximos7Dias ?? 0);

    case "recebimentos-fisicos-7-dias":
      return String(indicadores?.pedidos ?? 0);

    default:
      return "0";
  }
}

/** Código do produto sem o prefixo "OMIE" usado na tabela da página. */
export function obterCodigoProduto(item) {
  return (
    String(item?.codigo_comercial ?? "").trim() || String(item?.codigo_produto ?? "").trim() || "-"
  );
}

export function obterDocumentoId(documento) {
  return String(
    documento?.documento_id ??
      documento?.cod_ped_compra ??
      documento?.cod_req_compra ??
      documento?.numero_pedido ??
      documento?.numero_requisicao ??
      documento?.numero_documento ??
      "",
  );
}

/** Totais do resumo do modal: valor total, valor em aberto e quantidade de itens. */
export function calcularResumoDocumentos(documentos) {
  return documentos.reduce(
    (acc, documento) => {
      acc.valorTotal += Number(documento?.valorTotal ?? 0);

      acc.valorEmAberto += Number(documento?.valorEmAberto ?? 0);

      acc.itens += Number(documento?.quantidade_itens ?? documento?.itens?.length ?? 0);

      return acc;
    },

    {
      valorTotal: 0,

      valorEmAberto: 0,

      itens: 0,
    },
  );
}

/** Pedidos distintos, lançamentos e itens distintos dos recebimentos físicos. */
export function calcularResumoRecebimentosFisicos(recebimentosFisicos) {
  const pedidosUnicos = new Set();

  const itensUnicos = new Set();

  for (const item of recebimentosFisicos) {
    const codigoPedido = Number(item?.cod_ped_compra);

    if (Number.isFinite(codigoPedido) && codigoPedido > 0) {
      pedidosUnicos.add(codigoPedido);
    }

    itensUnicos.add(`${item?.cod_ped_compra ?? ""}::${item?.codigo_item ?? ""}`);
  }

  return {
    pedidos: pedidosUnicos.size,

    lancamentos: recebimentosFisicos.length,

    itens: itensUnicos.size,
  };
}

/** Agrupa os recebimentos por pedido, na ordem em que cada pedido aparece. */
export function agruparRecebimentosPorPedido(recebimentos) {
  const gruposPorPedido = new Map();

  for (const recebimento of recebimentos) {
    const chavePedido = String(
      recebimento?.cod_ped_compra ?? recebimento?.numero_pedido ?? recebimento?.id ?? "",
    );

    if (!gruposPorPedido.has(chavePedido)) {
      gruposPorPedido.set(chavePedido, []);
    }

    gruposPorPedido.get(chavePedido).push(recebimento);
  }

  return Array.from(gruposPorPedido.entries());
}
