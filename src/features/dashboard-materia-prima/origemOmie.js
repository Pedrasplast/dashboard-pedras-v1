/* =========================================================
   DASHBOARD MATÉRIA-PRIMA — ORIGEM OMIE

   Converte os itens da view dashboard_mp_compras_omie para o
   mesmo formato da base manual, para que cards, gráficos e
   tabelas funcionem sem mudança.

   Regras (22/10):
   - Data da compra = inclusão do pedido no Omie.
   - Recebimento = quantidade recebida do item; parcial conta
     só o que chegou (valores proporcionais).
   - Data de recebimento = "Recebido em" da NF de entrada;
     sem NF, a previsão de entrega.
   - Fornecedor = nome como está no Omie.
   - Material = Cadastro de Material quando o código bate;
     senão a descrição do Omie.
========================================================= */

export const ORIGEM_MANUAL = "manual";
export const ORIGEM_OMIE = "omie";

/* Padrão da tela: Omie (22/10). Manual fica para comparação. */
export const ORIGENS_DADOS = Object.freeze([
  { value: ORIGEM_OMIE, label: "Omie" },
  { value: ORIGEM_MANUAL, label: "Manual (tela de compras)" },
]);

export const VIEW_OMIE = "dashboard_mp_compras_omie";

export const CAMPOS_OMIE = [
  "cod_ped_compra",
  "codigo_item",
  "numero_pedido",
  "data_inclusao",
  "data_previsao",
  "codigo_fornecedor",
  "fornecedor_nome",
  "condicao_pagamento",
  "codigo_produto",
  "descricao",
  "material_id",
  "material_nome",
  "quantidade",
  "quantidade_recebida",
  "situacao_recebimento",
  "preco_unitario",
  "valor_mercadoria",
  "valor_ipi",
  "ipi_percentual",
  "valor_desconto",
  "valor_frete",
  "valor_outras_despesas",
  "valor_total",
  "data_recebimento",
  "numeros_nf",
  "encerrado",
].join(",");

function numeroOuNull(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

function texto(valor) {
  return String(valor ?? "").trim();
}

/** Data de recebimento: NF de entrada; sem NF, previsão de entrega. */
export function dataRecebimentoOmie(registro) {
  if (!(numeroOuNull(registro?.quantidade_recebida) > 0)) return null;
  return registro?.data_recebimento || registro?.data_previsao || null;
}

function base(registro) {
  const materialId =
    registro.material_id !== null && registro.material_id !== undefined
      ? registro.material_id
      : `omie-${texto(registro.codigo_produto) || "sem-codigo"}`;

  return {
    dataCompra: registro.data_inclusao ?? null,
    dataPrevista: registro.data_previsao ?? null,
    dataRecebimento: dataRecebimentoOmie(registro),
    fornecedorId: texto(registro.codigo_fornecedor) || "sem-fornecedor",
    fornecedorNome: texto(registro.fornecedor_nome) || "Fornecedor não encontrado",
    materialId,
    tipoMaterial:
      texto(registro.material_nome) || texto(registro.descricao) || "Material não informado",
    numeroPedido: texto(registro.numero_pedido),
    observacao: "",
    tipoFrete: "",
    numeroNf: texto(registro.numeros_nf),
    condicaoPagamento: texto(registro.condicao_pagamento),
    observacaoFinanceira: "",
    ipiPercentual: numeroOuNull(registro.ipi_percentual),
    precoUnitario: numeroOuNull(registro.preco_unitario),
  };
}

function valores(registro, fator) {
  const quantidade = (numeroOuNull(registro.quantidade) ?? 0) * fator;
  const subtotal = numeroOuNull(registro.valor_mercadoria);
  const ipi = numeroOuNull(registro.valor_ipi);
  const frete = numeroOuNull(registro.valor_frete);
  const desconto = numeroOuNull(registro.valor_desconto);
  const outras = numeroOuNull(registro.valor_outras_despesas);
  const total = numeroOuNull(registro.valor_total);
  const vezes = (v) => (v === null ? null : v * fator);
  const valorTotal = vezes(total);

  return {
    quantidadeKg: quantidade,
    subtotalProdutos: vezes(subtotal),
    valorIpi: vezes(ipi) ?? 0,
    valorFrete: vezes(frete),
    valorDesconto: vezes(desconto),
    outrasDespesas: vezes(outras),
    valorTotal,
    custoEfetivoKg: valorTotal !== null && quantidade > 0 ? valorTotal / quantidade : null,
  };
}

/**
 * Compra (pedido inteiro). Recebido por completo = RECEBIDA; encerrado no
 * Omie = ENCERRADA (conta nos totais, mas não como em aberto); senão em aberto.
 */
export function statusCompraOmie(registro) {
  if (texto(registro?.situacao_recebimento).toUpperCase() === "RECEBIDO") return "RECEBIDA";
  if (registro?.encerrado === true) return "ENCERRADA";
  return "CONFIRMADA";
}

export function normalizarCompraOmie(registro) {
  if (!registro) return null;
  return {
    id: `omie-${registro.cod_ped_compra}-${registro.codigo_item}`,
    ...base(registro),
    ...valores(registro, 1),
    status: statusCompraOmie(registro),
  };
}

/** Recebimento: só a quantidade recebida (parcial proporcional). */
export function normalizarRecebimentoOmie(registro) {
  if (!registro) return null;
  const quantidade = numeroOuNull(registro.quantidade) ?? 0;
  const recebida = numeroOuNull(registro.quantidade_recebida) ?? 0;
  if (!(quantidade > 0) || !(recebida > 0)) return null;
  const fator = Math.min(recebida / quantidade, 1);
  const item = {
    id: `omie-rec-${registro.cod_ped_compra}-${registro.codigo_item}`,
    ...base(registro),
    ...valores(registro, fator),
    status: "RECEBIDA",
  };
  return item.dataRecebimento ? item : null;
}

/** Recebimento dentro do período [de, ate] (aaaa-mm-dd). */
export function recebimentoNoPeriodo(item, de, ate) {
  const data = item?.dataRecebimento;
  return Boolean(data) && data >= de && data <= ate;
}

/**
 * Monta { compras, recebimentos } no formato do dashboard.
 * - tipoData "compra": compras pela data de inclusão; recebimentos delas.
 * - tipoData "recebimento": compras = recebimentos no período.
 */
export function montarFinanceiroOmie(registros, { dataInicial, dataFinal, tipoData }) {
  const lista = Array.isArray(registros) ? registros : [];

  if (tipoData === "recebimento") {
    const recebimentos = lista
      .map(normalizarRecebimentoOmie)
      .filter((item) => item && recebimentoNoPeriodo(item, dataInicial, dataFinal));
    return { compras: recebimentos, recebimentos };
  }

  const compras = lista.map(normalizarCompraOmie).filter(Boolean);
  const recebimentos = lista.map(normalizarRecebimentoOmie).filter(Boolean);
  return { compras, recebimentos };
}
