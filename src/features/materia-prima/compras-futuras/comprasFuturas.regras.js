import { paraNumeroOuNull, converterNumeroBrOuNull } from "@/shared/lib/numeros";
import { obterHojeISO } from "@/shared/lib/datas";

/* =========================================================
   COMPRAS FUTURAS: REGRAS (FUNÇÕES PURAS)

   Opções de status/tipo/frete, cálculo financeiro da compra,
   normalização do registro do banco e validações. O acesso ao
   Supabase fica em comprasFuturasService.js.
========================================================= */

export const STATUS_COMPRA_FUTURA = [
  {
    valor: "PREVISTA",

    nome: "Prevista",
  },

  {
    valor: "CONFIRMADA",

    nome: "Confirmada",
  },

  {
    valor: "RECEBIDA",

    nome: "Recebida",
  },

  {
    valor: "CANCELADA",

    nome: "Cancelada",
  },
];

export const TIPOS_CLASSIFICACAO = [
  {
    valor: "TIPO SP",

    nome: "TIPO SP",
  },

  {
    valor: "TIPO C",

    nome: "TIPO C",
  },
];

export const TIPOS_FRETE = [
  {
    valor: "",

    nome: "Não informado",
  },

  {
    valor: "CIF",

    nome: "CIF",
  },

  {
    valor: "FOB",

    nome: "FOB",
  },

  {
    valor: "SEM_FRETE",

    nome: "Sem frete",
  },
];

export const STATUS_VALIDOS = new Set(STATUS_COMPRA_FUTURA.map(({ valor }) => valor));

export const TIPOS_CLASSIFICACAO_VALIDOS = new Set(TIPOS_CLASSIFICACAO.map(({ valor }) => valor));

export const TIPOS_FRETE_VALIDOS = new Set(
  TIPOS_FRETE.map(({ valor }) => valor)

    .filter(Boolean),
);

export function arredondar(
  valor,

  casas = 2,
) {
  if (!Number.isFinite(valor)) {
    return null;
  }

  const fator = 10 ** casas;

  return Math.round((valor + Number.EPSILON) * fator) / fator;
}

export function textoOpcional(valor) {
  const texto = String(valor ?? "").trim();

  return texto || null;
}

export function calcularResumoFinanceiroCompra({
  quantidadeKg,

  precoUnitario,

  ipiPercentual,

  valorFrete,

  tipoFrete,

  valorDesconto,

  outrasDespesas,
} = {}) {
  const quantidade = converterNumeroBrOuNull(quantidadeKg);

  const preco = converterNumeroBrOuNull(precoUnitario);

  const ipi = converterNumeroBrOuNull(ipiPercentual);

  const freteInformado = converterNumeroBrOuNull(valorFrete);

  const desconto = converterNumeroBrOuNull(valorDesconto);

  const despesas = converterNumeroBrOuNull(outrasDespesas);

  const tipoFreteFinal = String(tipoFrete ?? "")
    .trim()

    .toUpperCase();

  const valorFreteFinal = tipoFreteFinal === "SEM_FRETE" ? 0 : freteInformado;

  const base = {
    precoUnitario:
      preco === null
        ? null
        : arredondar(
            preco,

            6,
          ),

    subtotalProdutos: null,

    ipiPercentual:
      ipi === null
        ? null
        : arredondar(
            ipi,

            4,
          ),

    valorIpi: null,

    valorFrete:
      valorFreteFinal === null
        ? null
        : arredondar(
            valorFreteFinal,

            2,
          ),

    tipoFrete: tipoFreteFinal || null,

    valorDesconto:
      desconto === null
        ? null
        : arredondar(
            desconto,

            2,
          ),

    outrasDespesas:
      despesas === null
        ? null
        : arredondar(
            despesas,

            2,
          ),

    valorTotal: null,

    custoEfetivoKg: null,
  };

  if (quantidade === null || quantidade <= 0 || preco === null) {
    return base;
  }

  const subtotalProdutos = arredondar(
    quantidade * preco,

    2,
  );

  const valorIpi = arredondar(
    (subtotalProdutos * (ipi ?? 0)) / 100,

    2,
  );

  const valorTotal = arredondar(
    subtotalProdutos + valorIpi + (valorFreteFinal ?? 0) + (despesas ?? 0) - (desconto ?? 0),

    2,
  );

  return {
    ...base,

    subtotalProdutos,

    valorIpi,

    valorTotal,

    custoEfetivoKg:
      valorTotal === null
        ? null
        : arredondar(
            valorTotal / quantidade,

            6,
          ),
  };
}

export function normalizarCompra(registro) {
  if (!registro) {
    return null;
  }

  const id = registro.id;

  const dataCompra = String(registro.data_compra ?? "").trim();

  const dataPrevista = String(registro.data_prevista ?? "").trim();

  const fornecedorId = registro.fornecedor_id;

  const materialId = registro.material_id;

  const quantidadeKg = Number(registro.quantidade_kg);

  const status = String(registro.status ?? "")
    .trim()

    .toUpperCase();

  if (
    id === null ||
    id === undefined ||
    !dataCompra ||
    !dataPrevista ||
    fornecedorId === null ||
    fornecedorId === undefined ||
    materialId === null ||
    materialId === undefined ||
    !Number.isFinite(quantidadeKg) ||
    !STATUS_VALIDOS.has(status)
  ) {
    return null;
  }

  return {
    id,

    dataCompra,

    dataPrevista,

    dataRecebimento: registro.data_recebimento ? String(registro.data_recebimento).trim() : null,

    fornecedorId,

    materialId,

    tipoMaterial: registro.tipo_material ?? "",

    tipoClassificacao: registro.tipo_classificacao ?? "",

    quantidadeKg,

    numeroPedido: registro.numero_pedido ?? "",

    status,

    observacao: registro.observacao ?? "",

    ativo: registro.ativo !== false,

    criadoEm: registro.criado_em ?? null,

    atualizadoEm: registro.atualizado_em ?? null,

    precoUnitario: paraNumeroOuNull(registro.preco_unitario),

    subtotalProdutos: paraNumeroOuNull(registro.subtotal_produtos),

    ipiPercentual: paraNumeroOuNull(registro.ipi_percentual),

    valorIpi: paraNumeroOuNull(registro.valor_ipi),

    valorFrete: paraNumeroOuNull(registro.valor_frete),

    tipoFrete: registro.tipo_frete ?? "",

    valorDesconto: paraNumeroOuNull(registro.valor_desconto),

    outrasDespesas: paraNumeroOuNull(registro.outras_despesas),

    valorTotal: paraNumeroOuNull(registro.valor_total),

    custoEfetivoKg: paraNumeroOuNull(registro.custo_efetivo_kg),

    numeroNf: registro.numero_nf ?? "",

    condicaoPagamento: registro.condicao_pagamento ?? "",

    observacaoFinanceira: registro.observacao_financeira ?? "",
  };
}

/* =========================================================
   SALVAR: VALIDAÇÃO ANTES DE CONSULTAR O BANCO

   Datas, fornecedor e material. Lança o erro na mesma ordem
   em que a tela sempre mostrou.
========================================================= */

export function validarIdentificacaoCompra({ dataCompra, dataPrevista, fornecedorId, materialId }) {
  const dataCompraFinal = String(dataCompra ?? "").trim();

  const dataPrevistaFinal = String(dataPrevista ?? "").trim();

  const materialIdFinal = Number(materialId);

  if (!dataCompraFinal) {
    throw new Error("Informe a data da compra.");
  }

  if (!dataPrevistaFinal) {
    throw new Error("Informe a data prevista de chegada.");
  }

  if (dataPrevistaFinal < dataCompraFinal) {
    throw new Error("A data prevista não pode ser anterior à data da compra.");
  }

  if (fornecedorId === null || fornecedorId === undefined || fornecedorId === "") {
    throw new Error("Selecione o fornecedor.");
  }

  if (!Number.isFinite(materialIdFinal)) {
    throw new Error("Selecione o material.");
  }

  return { dataCompraFinal, dataPrevistaFinal, materialIdFinal };
}

/* =========================================================
   SALVAR: VALIDAÇÃO DO RESTANTE E REGISTRO A GRAVAR

   Chamada depois de conferir no banco que o material está
   ativo e vinculado ao fornecedor.
========================================================= */

export function montarDadosCompraFutura({
  dataCompraFinal,
  dataPrevistaFinal,
  materialIdFinal,
  dataRecebimento,
  fornecedorId,
  quantidadeKg,
  numeroPedido,
  tipoClassificacao,
  status,
  observacao,
  ativo,
  precoUnitario,
  ipiPercentual,
  valorFrete,
  tipoFrete,
  valorDesconto,
  outrasDespesas,
  numeroNf,
  condicaoPagamento,
  observacaoFinanceira,
}) {
  const statusFinal = String(status ?? "CONFIRMADA")
    .trim()
    .toUpperCase();

  const quantidadeFinal = converterNumeroBrOuNull(quantidadeKg);

  const tipoClassificacaoFinal = String(tipoClassificacao ?? "")
    .trim()
    .toUpperCase();

  const tipoFreteFinal = String(tipoFrete ?? "")
    .trim()
    .toUpperCase();

  if (quantidadeFinal === null || quantidadeFinal <= 0) {
    throw new Error("Informe uma quantidade em kg maior que zero.");
  }

  if (!TIPOS_CLASSIFICACAO_VALIDOS.has(tipoClassificacaoFinal)) {
    throw new Error("Selecione o tipo do material.");
  }

  if (!STATUS_VALIDOS.has(statusFinal)) {
    throw new Error("Status da compra inválido.");
  }

  let dataRecebimentoFinal = dataRecebimento ? String(dataRecebimento).trim() : null;

  if (statusFinal === "RECEBIDA") {
    if (!dataRecebimentoFinal) {
      throw new Error("Informe a data real de recebimento.");
    }
  } else {
    dataRecebimentoFinal = null;
  }

  const precoFinal = converterNumeroBrOuNull(precoUnitario);

  const ipiFinal = converterNumeroBrOuNull(ipiPercentual);

  const freteFinal = converterNumeroBrOuNull(valorFrete);

  const descontoFinal = converterNumeroBrOuNull(valorDesconto);

  const despesasFinal = converterNumeroBrOuNull(outrasDespesas);

  if (precoFinal !== null && precoFinal < 0) {
    throw new Error("O preço unitário não pode ser negativo.");
  }

  if (ipiFinal !== null && (ipiFinal < 0 || ipiFinal > 100)) {
    throw new Error("O IPI deve estar entre 0% e 100%.");
  }

  for (const [valor, nome] of [
    [freteFinal, "frete"],
    [descontoFinal, "desconto"],
    [despesasFinal, "outras despesas"],
  ]) {
    if (valor !== null && valor < 0) {
      throw new Error(`O valor de ${nome} não pode ser negativo.`);
    }
  }

  if (tipoFreteFinal && !TIPOS_FRETE_VALIDOS.has(tipoFreteFinal)) {
    throw new Error("Tipo de frete inválido.");
  }

  const financeiro = calcularResumoFinanceiroCompra({
    quantidadeKg: quantidadeFinal,
    precoUnitario: precoFinal,
    ipiPercentual: ipiFinal,
    valorFrete: freteFinal,
    tipoFrete: tipoFreteFinal,
    valorDesconto: descontoFinal,
    outrasDespesas: despesasFinal,
  });

  if (financeiro.valorTotal !== null && financeiro.valorTotal < 0) {
    throw new Error("O valor total da compra não pode ser negativo. Revise o desconto informado.");
  }

  return {
    data_compra: dataCompraFinal,
    data_prevista: dataPrevistaFinal,
    data_recebimento: dataRecebimentoFinal,
    fornecedor_id: fornecedorId,
    material_id: materialIdFinal,
    tipo_classificacao: tipoClassificacaoFinal,
    quantidade_kg: quantidadeFinal,
    numero_pedido: textoOpcional(numeroPedido),
    status: statusFinal,
    observacao: textoOpcional(observacao),
    ativo: Boolean(ativo),
    preco_unitario: financeiro.precoUnitario,
    subtotal_produtos: financeiro.subtotalProdutos,
    ipi_percentual: financeiro.ipiPercentual,
    valor_ipi: financeiro.valorIpi,
    valor_frete: financeiro.valorFrete,
    tipo_frete: financeiro.tipoFrete,
    valor_desconto: financeiro.valorDesconto,
    outras_despesas: financeiro.outrasDespesas,
    valor_total: financeiro.valorTotal,
    custo_efetivo_kg: financeiro.custoEfetivoKg,
    numero_nf: textoOpcional(numeroNf),
    condicao_pagamento: textoOpcional(condicaoPagamento),
    observacao_financeira: textoOpcional(observacaoFinanceira),
    atualizado_em: new Date().toISOString(),
  };
}

/* =========================================================
   CONFIRMAR CHEGADA
========================================================= */

// Antes de consultar o banco: compra e data informadas, e a data não pode ser futura.
export function validarDataChegada(id, dataRecebimento) {
  if (id === null || id === undefined || id === "") {
    throw new Error("Compra futura não informada.");
  }

  const dataRecebimentoFinal = String(dataRecebimento ?? "").trim();

  if (!dataRecebimentoFinal) {
    throw new Error("Informe a data real de chegada.");
  }

  if (dataRecebimentoFinal > obterHojeISO()) {
    throw new Error("A data da chegada não pode ser futura.");
  }

  return dataRecebimentoFinal;
}

// Com a compra lida do banco: só Prevista/Confirmada, e a chegada não antes da compra.
export function validarCompraParaChegada(compraAtual, dataRecebimentoFinal) {
  if (!compraAtual) {
    throw new Error("A compra futura não foi encontrada ou está inativa.");
  }

  const statusAtual = String(compraAtual.status ?? "")
    .trim()
    .toUpperCase();

  if (statusAtual !== "PREVISTA" && statusAtual !== "CONFIRMADA") {
    throw new Error(
      statusAtual === "RECEBIDA"
        ? "A chegada desta compra já foi confirmada."
        : "Esta compra não pode ter a chegada confirmada no status atual.",
    );
  }

  const dataCompra = String(compraAtual.data_compra ?? "").trim();

  if (dataCompra && dataRecebimentoFinal < dataCompra) {
    throw new Error("A data da chegada não pode ser anterior à data da compra.");
  }

  return statusAtual;
}
