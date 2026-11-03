/* =========================================================
   PEDIDOS DE COMPRA — REGRAS DA TELA
   ---------------------------------------------------------
   Funções puras e constantes usadas pela tela; movidas do
   componente sem alteração.
========================================================= */

import { TIPOS_DOCUMENTO, SITUACOES_RECEBIMENTO } from "./constants/pedidosCompra.constants";
import { converterDataLocal } from "@/shared/lib/datas";

export const FILTROS_INICIAIS = Object.freeze({
  pesquisa: "",

  tipoDocumento: TIPOS_DOCUMENTO.TODOS,

  fornecedor: "todos",

  comprador: "todos",

  recebimento: SITUACOES_RECEBIMENTO.TODOS,

  recebimentoFisico: "TODOS",

  dataInicio: "",

  dataFim: "",
});

export const CARDS_RESUMO = Object.freeze({
  ABERTOS: "abertos",

  ATRASADOS: "atrasados",

  VALOR_ABERTO: "valor-aberto",

  PROXIMOS_7_DIAS: "proximos-7-dias",

  HOJE: "hoje",

  REQUISICOES_TOTAL: "requisicoes-total",

  REQUISICOES_VALOR: "requisicoes-valor",

  REQUISICOES_ITENS: "requisicoes-itens",

  REQUISICOES_PROXIMOS_7_DIAS: "requisicoes-proximos-7-dias",

  RECEBIMENTOS_FISICOS_7_DIAS: "recebimentos-fisicos-7-dias",
});

export function ehPedido(documento) {
  return documento?.tipo_documento === TIPOS_DOCUMENTO.PEDIDO;
}

export function ehRequisicao(documento) {
  return documento?.tipo_documento === TIPOS_DOCUMENTO.REQUISICAO;
}

export function estaEntreHojeE7Dias(documento, hoje, limite) {
  if (ehPedido(documento) && Number(documento?.saldo ?? 0) <= 0) {
    return false;
  }

  const previsao = converterDataLocal(documento?.data_previsao);

  return Boolean(previsao && previsao >= hoje && previsao <= limite);
}

export function estaPrevistoParaHoje(documento, hoje) {
  if (ehPedido(documento) && Number(documento?.saldo ?? 0) <= 0) {
    return false;
  }

  const previsao = converterDataLocal(documento?.data_previsao);

  return Boolean(previsao && previsao.getTime() === hoje.getTime());
}

export function documentoAtendeCard(documento, cardId, hoje, limite) {
  if (ehPedido(documento)) {
    switch (cardId) {
      case CARDS_RESUMO.ABERTOS:
      case CARDS_RESUMO.VALOR_ABERTO:
        return Number(documento?.saldo ?? 0) > 0;

      case CARDS_RESUMO.ATRASADOS:
        return documento?.situacao_recebimento === SITUACOES_RECEBIMENTO.EM_ATRASO;

      case CARDS_RESUMO.PROXIMOS_7_DIAS:
        return estaEntreHojeE7Dias(documento, hoje, limite);

      case CARDS_RESUMO.HOJE:
        return estaPrevistoParaHoje(documento, hoje);

      default:
        return false;
    }
  }

  if (!ehRequisicao(documento)) {
    return false;
  }

  switch (cardId) {
    case CARDS_RESUMO.REQUISICOES_TOTAL:
    case CARDS_RESUMO.REQUISICOES_VALOR:
      return true;

    case CARDS_RESUMO.REQUISICOES_ITENS:
      return Array.isArray(documento?.itens) && documento.itens.length > 0;

    case CARDS_RESUMO.REQUISICOES_PROXIMOS_7_DIAS:
      return estaEntreHojeE7Dias(documento, hoje, limite);

    case CARDS_RESUMO.REQUISICOES_HOJE:
      return estaPrevistoParaHoje(documento, hoje);

    default:
      return false;
  }
}

export function documentoEstaNoPeriodo(documento, dataInicio, dataFim) {
  if (!dataInicio && !dataFim) {
    return true;
  }

  const dataDocumento = converterDataLocal(documento?.data_inclusao || documento?.data_previsao);

  if (!dataDocumento) {
    return false;
  }

  const inicio = dataInicio ? converterDataLocal(dataInicio) : null;

  const fim = dataFim ? converterDataLocal(dataFim) : null;

  if (inicio && dataDocumento < inicio) {
    return false;
  }

  if (fim && dataDocumento > fim) {
    return false;
  }

  return true;
}

export function obterSituacaoRecebimentoFisicoVisual(pedido, resumoManual) {
  const itens = Array.isArray(pedido?.itens) ? pedido.itens : [];

  if (!itens.length) {
    return resumoManual?.situacao_recebimento_fisico || "NAO_RECEBIDO";
  }

  let todosCompletosOmie = true;
  let algumRecebimentoOmie = false;

  for (const item of itens) {
    const quantidade = Math.max(Number(item?.quantidade ?? 0), 0);

    const recebidoOmie = Math.min(Math.max(Number(item?.quantidade_recebida ?? 0), 0), quantidade);

    if (recebidoOmie > 0) {
      algumRecebimentoOmie = true;
    }

    if (quantidade <= 0 || recebidoOmie < quantidade) {
      todosCompletosOmie = false;
    }
  }

  const situacaoManual = resumoManual?.situacao_recebimento_fisico || "NAO_RECEBIDO";

  if (todosCompletosOmie || situacaoManual === "COMPLETO") {
    return "COMPLETO";
  }

  if (algumRecebimentoOmie || situacaoManual === "PARCIAL") {
    return "PARCIAL";
  }

  return "NAO_RECEBIDO";
}
