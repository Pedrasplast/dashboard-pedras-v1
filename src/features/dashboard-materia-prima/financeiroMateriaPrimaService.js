import {
  supabase,
} from "@/lib/supabaseClient";

import {
  buscarFornecedores,
} from "@/features/materia-prima/fornecedores/fornecedoresService";

import {
  numeroOuNull,
} from "./dashboardMateriaPrimaUtils.js";


const CAMPOS_FINANCEIROS = `
  id,
  data_compra,
  data_prevista,
  data_recebimento,
  fornecedor_id,
  material_id,
  tipo_material,
  quantidade_kg,
  numero_pedido,
  status,
  observacao,
  ativo,
  preco_unitario,
  subtotal_produtos,
  ipi_percentual,
  valor_ipi,
  valor_frete,
  tipo_frete,
  valor_desconto,
  outras_despesas,
  valor_total,
  custo_efetivo_kg,
  numero_nf,
  condicao_pagamento,
  observacao_financeira
`;


function normalizarRegistro(
  registro,
  fornecedoresPorId,
) {
  if (!registro) {
    return null;
  }

  const fornecedor =
    fornecedoresPorId.get(
      String(
        registro
          .fornecedor_id,
      ),
    );

  const quantidadeKg =
    numeroOuNull(
      registro
        .quantidade_kg,
    ) ??
    0;

  const precoUnitario =
    numeroOuNull(
      registro
        .preco_unitario,
    );

  const ipiPercentual =
    numeroOuNull(
      registro
        .ipi_percentual,
    );

  const subtotalBanco =
    numeroOuNull(
      registro
        .subtotal_produtos,
    );

  const subtotalProdutos =
    subtotalBanco !== null
      ? subtotalBanco
      : precoUnitario !== null &&
          quantidadeKg >
            0
        ? quantidadeKg *
          precoUnitario
        : null;

  const valorIpiBanco =
    numeroOuNull(
      registro
        .valor_ipi,
    );

  const valorIpi =
    valorIpiBanco !== null
      ? valorIpiBanco
      : subtotalProdutos !== null &&
          ipiPercentual !== null
        ? subtotalProdutos *
          ipiPercentual /
          100
        : 0;

  const valorFrete =
    numeroOuNull(
      registro
        .valor_frete,
    );

  const valorDesconto =
    numeroOuNull(
      registro
        .valor_desconto,
    );

  const outrasDespesas =
    numeroOuNull(
      registro
        .outras_despesas,
    );

  const valorTotalBanco =
    numeroOuNull(
      registro
        .valor_total,
    );

  const valorTotal =
    valorTotalBanco !== null
      ? valorTotalBanco
      : subtotalProdutos !== null
        ? subtotalProdutos +
          valorIpi +
          (valorFrete ?? 0) +
          (outrasDespesas ?? 0) -
          (valorDesconto ?? 0)
        : null;

  const custoEfetivoBanco =
    numeroOuNull(
      registro
        .custo_efetivo_kg,
    );

  const custoEfetivoKg =
    custoEfetivoBanco !== null
      ? custoEfetivoBanco
      : valorTotal !== null &&
          quantidadeKg >
            0
        ? valorTotal /
          quantidadeKg
        : null;

  return {
    id:
      registro.id,

    dataCompra:
      registro
        .data_compra ??
      null,

    dataPrevista:
      registro
        .data_prevista ??
      null,

    dataRecebimento:
      registro
        .data_recebimento ??
      null,

    fornecedorId:
      registro
        .fornecedor_id,

    fornecedorNome:
      fornecedor
        ?.nome ??
      "Fornecedor não encontrado",

    materialId:
      registro
        .material_id,

    tipoMaterial:
      String(
        registro
          .tipo_material ??
        "Material não informado",
      ).trim(),

    quantidadeKg,

    numeroPedido:
      registro
        .numero_pedido ??
      "",

    status:
      String(
        registro
          .status ??
        "",
      )
        .trim()
        .toUpperCase(),

    observacao:
      registro
        .observacao ??
      "",

    precoUnitario,

    subtotalProdutos,

    ipiPercentual,

    valorIpi,

    valorFrete,

    tipoFrete:
      registro
        .tipo_frete ??
      "",

    valorDesconto,

    outrasDespesas,

    valorTotal,

    custoEfetivoKg,

    numeroNf:
      registro
        .numero_nf ??
      "",

    condicaoPagamento:
      registro
        .condicao_pagamento ??
      "",

    observacaoFinanceira:
      registro
        .observacao_financeira ??
      "",
  };
}


function criarConsultaPeriodo({
  dataInicial,
  dataFinal,
  tipoData,
}) {
  const porRecebimento =
    tipoData ===
    "recebimento";

  const campoData =
    porRecebimento
      ? "data_recebimento"
      : "data_compra";

  let consulta =
    supabase
      .from(
        "materia_prima_compras_futuras",
      )
      .select(
        CAMPOS_FINANCEIROS,
      )
      .eq(
        "ativo",
        true,
      )
      .not(
        campoData,
        "is",
        null,
      )
      .gte(
        campoData,
        dataInicial,
      )
      .lte(
        campoData,
        dataFinal,
      );

  if (
    porRecebimento
  ) {
    consulta =
      consulta.eq(
        "status",
        "RECEBIDA",
      );
  }

  return consulta
    .order(
      campoData,
      {
        ascending:
          true,
      },
    )
    .order(
      "id",
      {
        ascending:
          true,
      },
    );
}


export async function buscarFinanceiroMateriaPrima({
  dataInicial,
  dataFinal,
  tipoData = "compra",
}) {
  if (
    !dataInicial ||
    !dataFinal
  ) {
    return {
      compras:
        [],

      recebimentos:
        [],
    };
  }

  const tipoDataNormalizado =
    tipoData ===
      "recebimento"
      ? "recebimento"
      : "compra";

  const [
    fornecedores,
    registrosResultado,
  ] =
    await Promise.all([
      buscarFornecedores(),

      criarConsultaPeriodo({
        dataInicial,
        dataFinal,
        tipoData:
          tipoDataNormalizado,
      }),
    ]);

  if (
    registrosResultado.error
  ) {
    throw registrosResultado.error;
  }

  const fornecedoresPorId =
    new Map(
      (
        Array.isArray(
          fornecedores,
        )
          ? fornecedores
          : []
      ).map(
        (
          fornecedor,
        ) => [
          String(
            fornecedor.id,
          ),
          fornecedor,
        ],
      ),
    );

  const registros =
    (
      Array.isArray(
        registrosResultado.data,
      )
        ? registrosResultado.data
        : []
    )
      .map(
        (
          registro,
        ) =>
          normalizarRegistro(
            registro,
            fornecedoresPorId,
          ),
      )
      .filter(
        Boolean,
      );

  const recebimentos =
    registros.filter(
      (
        item,
      ) =>
        item.status ===
          "RECEBIDA" &&
        Boolean(
          item.dataRecebimento,
        ),
    );

  return {
    compras:
      registros,

    recebimentos,
  };
}