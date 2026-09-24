import { supabase } from "@/lib/supabaseClient";
import { buscarFornecedores } from "../fornecedores/fornecedoresService";

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

const STATUS_VALIDOS = new Set(
  STATUS_COMPRA_FUTURA.map(
    ({
      valor,
    }) => valor,
  ),
);

const TIPOS_FRETE_VALIDOS = new Set(
  TIPOS_FRETE
    .map(
      ({
        valor,
      }) => valor,
    )
    .filter(
      Boolean,
    ),
);

const CAMPOS_COMPRA_FUTURA = `
  id,
  data_compra,
  data_prevista,
  data_recebimento,
  fornecedor_id,
  quantidade_kg,
  numero_pedido,
  status,
  observacao,
  ativo,
  criado_em,
  atualizado_em,
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

function normalizarNumero(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  if (
    typeof valor ===
    "number"
  ) {
    return Number.isFinite(
      valor,
    )
      ? valor
      : null;
  }

  const texto =
    String(
      valor,
    )
      .trim()
      .replace(
        /\s/g,
        "",
      );

  if (!texto) {
    return null;
  }

  const normalizado =
    texto.includes(
      ",",
    )
      ? texto
          .replace(
            /\./g,
            "",
          )
          .replace(
            ",",
            ".",
          )
      : texto;

  const numero =
    Number(
      normalizado,
    );

  return Number.isFinite(
    numero,
  )
    ? numero
    : null;
}

function arredondar(
  valor,
  casas = 2,
) {
  if (
    !Number.isFinite(
      valor,
    )
  ) {
    return null;
  }

  const fator =
    10 ** casas;

  return (
    Math.round(
      (
        valor +
        Number.EPSILON
      ) *
      fator,
    ) /
    fator
  );
}

function numeroRegistroOuNull(
  valor,
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero =
    Number(
      valor,
    );

  return Number.isFinite(
    numero,
  )
    ? numero
    : null;
}

function textoOpcional(
  valor,
) {
  const texto =
    String(
      valor ?? "",
    ).trim();

  return (
    texto ||
    null
  );
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
  const quantidade =
    normalizarNumero(
      quantidadeKg,
    );

  const preco =
    normalizarNumero(
      precoUnitario,
    );

  const ipi =
    normalizarNumero(
      ipiPercentual,
    );

  const freteInformado =
    normalizarNumero(
      valorFrete,
    );

  const desconto =
    normalizarNumero(
      valorDesconto,
    );

  const despesas =
    normalizarNumero(
      outrasDespesas,
    );

  const tipoFreteFinal =
    String(
      tipoFrete ?? "",
    )
      .trim()
      .toUpperCase();

  const valorFreteFinal =
    tipoFreteFinal ===
    "SEM_FRETE"
      ? 0
      : freteInformado;

  const base = {
    precoUnitario:
      preco === null
        ? null
        : arredondar(
            preco,
            6,
          ),

    subtotalProdutos:
      null,

    ipiPercentual:
      ipi === null
        ? null
        : arredondar(
            ipi,
            4,
          ),

    valorIpi:
      null,

    valorFrete:
      valorFreteFinal === null
        ? null
        : arredondar(
            valorFreteFinal,
            2,
          ),

    tipoFrete:
      tipoFreteFinal ||
      null,

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

    valorTotal:
      null,

    custoEfetivoKg:
      null,
  };

  if (
    quantidade === null ||
    quantidade <= 0 ||
    preco === null
  ) {
    return base;
  }

  const subtotalProdutos =
    arredondar(
      quantidade *
      preco,
      2,
    );

  const valorIpi =
    arredondar(
      subtotalProdutos *
      (
        ipi ??
        0
      ) /
      100,
      2,
    );

  const valorTotal =
    arredondar(
      subtotalProdutos +
      valorIpi +
      (
        valorFreteFinal ??
        0
      ) +
      (
        despesas ??
        0
      ) -
      (
        desconto ??
        0
      ),
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
            valorTotal /
            quantidade,
            6,
          ),
  };
}

function normalizarCompra(
  registro,
) {
  if (!registro) {
    return null;
  }

  const id =
    registro.id;

  const dataCompra =
    String(
      registro
        .data_compra ??
        "",
    ).trim();

  const dataPrevista =
    String(
      registro
        .data_prevista ??
        "",
    ).trim();

  const fornecedorId =
    registro
      .fornecedor_id;

  const quantidadeKg =
    Number(
      registro
        .quantidade_kg,
    );

  const status =
    String(
      registro
        .status ??
        "",
    )
      .trim()
      .toUpperCase();

  if (
    id === null ||
    id === undefined ||
    !dataCompra ||
    !dataPrevista ||
    fornecedorId === null ||
    fornecedorId === undefined ||
    !Number.isFinite(
      quantidadeKg,
    ) ||
    !STATUS_VALIDOS.has(
      status,
    )
  ) {
    return null;
  }

  return {
    id,

    dataCompra,

    dataPrevista,

    dataRecebimento:
      registro
        .data_recebimento
        ? String(
            registro
              .data_recebimento,
          ).trim()
        : null,

    fornecedorId,

    quantidadeKg,

    numeroPedido:
      registro
        .numero_pedido ??
      "",

    status,

    observacao:
      registro
        .observacao ??
      "",

    ativo:
      registro
        .ativo !==
      false,

    criadoEm:
      registro
        .criado_em ??
      null,

    atualizadoEm:
      registro
        .atualizado_em ??
      null,

    precoUnitario:
      numeroRegistroOuNull(
        registro
          .preco_unitario,
      ),

    subtotalProdutos:
      numeroRegistroOuNull(
        registro
          .subtotal_produtos,
      ),

    ipiPercentual:
      numeroRegistroOuNull(
        registro
          .ipi_percentual,
      ),

    valorIpi:
      numeroRegistroOuNull(
        registro
          .valor_ipi,
      ),

    valorFrete:
      numeroRegistroOuNull(
        registro
          .valor_frete,
      ),

    tipoFrete:
      registro
        .tipo_frete ??
      "",

    valorDesconto:
      numeroRegistroOuNull(
        registro
          .valor_desconto,
      ),

    outrasDespesas:
      numeroRegistroOuNull(
        registro
          .outras_despesas,
      ),

    valorTotal:
      numeroRegistroOuNull(
        registro
          .valor_total,
      ),

    custoEfetivoKg:
      numeroRegistroOuNull(
        registro
          .custo_efetivo_kg,
      ),

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

export async function buscarComprasFuturas() {
  const [
    fornecedores,
    resultadoCompras,
  ] =
    await Promise.all([
      buscarFornecedores(),

      supabase
        .from(
          "materia_prima_compras_futuras",
        )
        .select(
          CAMPOS_COMPRA_FUTURA,
        )
        .eq(
          "ativo",
          true,
        )
        .order(
          "data_prevista",
          {
            ascending:
              true,
          },
        )
        .order(
          "id",
          {
            ascending:
              false,
          },
        ),
    ]);

  if (
    resultadoCompras.error
  ) {
    throw resultadoCompras.error;
  }

  const fornecedoresPorId =
    new Map(
      fornecedores.map(
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

  const compras =
    (
      Array.isArray(
        resultadoCompras.data,
      )
        ? resultadoCompras.data
        : []
    )
      .map(
        normalizarCompra,
      )
      .filter(
        Boolean,
      )
      .map(
        (
          compra,
        ) => {
          const fornecedor =
            fornecedoresPorId.get(
              String(
                compra
                  .fornecedorId,
              ),
            );

          return {
            ...compra,

            fornecedorNome:
              fornecedor
                ?.nome ??
              "Fornecedor não encontrado",

            fornecedorAtivo:
              fornecedor
                ?.ativo !==
              false,
          };
        },
      );

  return {
    compras,
    fornecedores,
  };
}

export async function salvarCompraFutura({
  id = null,

  dataCompra,

  dataPrevista,

  dataRecebimento = null,

  fornecedorId,

  quantidadeKg,

  numeroPedido = "",

  status = "CONFIRMADA",

  observacao = "",

  ativo = true,

  precoUnitario = null,

  ipiPercentual = null,

  valorFrete = null,

  tipoFrete = "",

  valorDesconto = null,

  outrasDespesas = null,

  numeroNf = "",

  condicaoPagamento = "",

  observacaoFinanceira = "",
}) {
  const dataCompraFinal =
    String(
      dataCompra ?? "",
    ).trim();

  const dataPrevistaFinal =
    String(
      dataPrevista ?? "",
    ).trim();

  const statusFinal =
    String(
      status ??
        "CONFIRMADA",
    )
      .trim()
      .toUpperCase();

  const quantidadeFinal =
    normalizarNumero(
      quantidadeKg,
    );

  const tipoFreteFinal =
    String(
      tipoFrete ??
        "",
    )
      .trim()
      .toUpperCase();

  if (!dataCompraFinal) {
    throw new Error(
      "Informe a data da compra.",
    );
  }

  if (!dataPrevistaFinal) {
    throw new Error(
      "Informe a data prevista de chegada.",
    );
  }

  if (
    dataPrevistaFinal <
    dataCompraFinal
  ) {
    throw new Error(
      "A data prevista não pode ser anterior à data da compra.",
    );
  }

  if (
    fornecedorId === null ||
    fornecedorId ===
      undefined ||
    fornecedorId === ""
  ) {
    throw new Error(
      "Selecione o fornecedor.",
    );
  }

  if (
    quantidadeFinal ===
      null ||
    quantidadeFinal <= 0
  ) {
    throw new Error(
      "Informe uma quantidade em kg maior que zero.",
    );
  }

  if (
    !STATUS_VALIDOS.has(
      statusFinal,
    )
  ) {
    throw new Error(
      "Status da compra inválido.",
    );
  }

  let dataRecebimentoFinal =
    dataRecebimento
      ? String(
          dataRecebimento,
        ).trim()
      : null;

  if (
    statusFinal ===
    "RECEBIDA"
  ) {
    if (
      !dataRecebimentoFinal
    ) {
      throw new Error(
        "Informe a data real de recebimento.",
      );
    }
  } else {
    dataRecebimentoFinal =
      null;
  }

  const precoFinal =
    normalizarNumero(
      precoUnitario,
    );

  const ipiFinal =
    normalizarNumero(
      ipiPercentual,
    );

  const freteFinal =
    normalizarNumero(
      valorFrete,
    );

  const descontoFinal =
    normalizarNumero(
      valorDesconto,
    );

  const despesasFinal =
    normalizarNumero(
      outrasDespesas,
    );

  if (
    precoFinal !==
      null &&
    precoFinal < 0
  ) {
    throw new Error(
      "O preço unitário não pode ser negativo.",
    );
  }

  if (
    ipiFinal !==
      null &&
    (
      ipiFinal < 0 ||
      ipiFinal > 100
    )
  ) {
    throw new Error(
      "O IPI deve estar entre 0% e 100%.",
    );
  }

  for (
    const [
      valor,
      nome,
    ] of [
      [
        freteFinal,
        "frete",
      ],
      [
        descontoFinal,
        "desconto",
      ],
      [
        despesasFinal,
        "outras despesas",
      ],
    ]
  ) {
    if (
      valor !==
        null &&
      valor < 0
    ) {
      throw new Error(
        `O valor de ${nome} não pode ser negativo.`,
      );
    }
  }

  if (
    tipoFreteFinal &&
    !TIPOS_FRETE_VALIDOS.has(
      tipoFreteFinal,
    )
  ) {
    throw new Error(
      "Tipo de frete inválido.",
    );
  }

  const financeiro =
    calcularResumoFinanceiroCompra({
      quantidadeKg:
        quantidadeFinal,

      precoUnitario:
        precoFinal,

      ipiPercentual:
        ipiFinal,

      valorFrete:
        freteFinal,

      tipoFrete:
        tipoFreteFinal,

      valorDesconto:
        descontoFinal,

      outrasDespesas:
        despesasFinal,
    });

  if (
    financeiro
      .valorTotal !==
      null &&
    financeiro
      .valorTotal < 0
  ) {
    throw new Error(
      "O valor total da compra não pode ser negativo. Revise o desconto informado.",
    );
  }

  const dadosSalvar = {
    data_compra:
      dataCompraFinal,

    data_prevista:
      dataPrevistaFinal,

    data_recebimento:
      dataRecebimentoFinal,

    fornecedor_id:
      fornecedorId,

    quantidade_kg:
      quantidadeFinal,

    numero_pedido:
      textoOpcional(
        numeroPedido,
      ),

    status:
      statusFinal,

    observacao:
      textoOpcional(
        observacao,
      ),

    ativo:
      Boolean(
        ativo,
      ),

    preco_unitario:
      financeiro
        .precoUnitario,

    subtotal_produtos:
      financeiro
        .subtotalProdutos,

    ipi_percentual:
      financeiro
        .ipiPercentual,

    valor_ipi:
      financeiro
        .valorIpi,

    valor_frete:
      financeiro
        .valorFrete,

    tipo_frete:
      financeiro
        .tipoFrete,

    valor_desconto:
      financeiro
        .valorDesconto,

    outras_despesas:
      financeiro
        .outrasDespesas,

    valor_total:
      financeiro
        .valorTotal,

    custo_efetivo_kg:
      financeiro
        .custoEfetivoKg,

    numero_nf:
      textoOpcional(
        numeroNf,
      ),

    condicao_pagamento:
      textoOpcional(
        condicaoPagamento,
      ),

    observacao_financeira:
      textoOpcional(
        observacaoFinanceira,
      ),

    atualizado_em:
      new Date()
        .toISOString(),
  };

  const consulta =
    supabase.from(
      "materia_prima_compras_futuras",
    );

  const {
    data,
    error,
  } =
    id !== null &&
    id !== undefined
      ? await consulta
          .update(
            dadosSalvar,
          )
          .eq(
            "id",
            id,
          )
          .select(
            CAMPOS_COMPRA_FUTURA,
          )
          .single()
      : await consulta
          .insert(
            dadosSalvar,
          )
          .select(
            CAMPOS_COMPRA_FUTURA,
          )
          .single();

  if (error) {
    throw error;
  }

  return normalizarCompra(
    data,
  );
}

export async function confirmarChegadaCompraFutura(
  id,
  dataRecebimento,
) {
  if (
    id === null ||
    id === undefined ||
    id === ""
  ) {
    throw new Error(
      "Compra futura não informada.",
    );
  }

  const dataRecebimentoFinal =
    String(
      dataRecebimento ?? "",
    ).trim();

  if (
    !dataRecebimentoFinal
  ) {
    throw new Error(
      "Informe a data real de chegada.",
    );
  }

  const hoje =
    new Date();

  const ano =
    hoje.getFullYear();

  const mes =
    String(
      hoje.getMonth() +
      1,
    ).padStart(
      2,
      "0",
    );

  const dia =
    String(
      hoje.getDate(),
    ).padStart(
      2,
      "0",
    );

  const dataHoje =
    `${ano}-${mes}-${dia}`;

  if (
    dataRecebimentoFinal >
    dataHoje
  ) {
    throw new Error(
      "A data da chegada não pode ser futura.",
    );
  }

  const {
    data: compraAtual,
    error: erroBusca,
  } =
    await supabase
      .from(
        "materia_prima_compras_futuras",
      )
      .select(
        "id, data_compra, status, ativo",
      )
      .eq(
        "id",
        id,
      )
      .eq(
        "ativo",
        true,
      )
      .maybeSingle();

  if (
    erroBusca
  ) {
    throw erroBusca;
  }

  if (
    !compraAtual
  ) {
    throw new Error(
      "A compra futura não foi encontrada ou está inativa.",
    );
  }

  const statusAtual =
    String(
      compraAtual
        .status ??
      "",
    )
      .trim()
      .toUpperCase();

  if (
    statusAtual !==
      "PREVISTA" &&
    statusAtual !==
      "CONFIRMADA"
  ) {
    throw new Error(
      statusAtual ===
        "RECEBIDA"
        ? "A chegada desta compra já foi confirmada."
        : "Esta compra não pode ter a chegada confirmada no status atual.",
    );
  }

  const dataCompra =
    String(
      compraAtual
        .data_compra ??
      "",
    ).trim();

  if (
    dataCompra &&
    dataRecebimentoFinal <
      dataCompra
  ) {
    throw new Error(
      "A data da chegada não pode ser anterior à data da compra.",
    );
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "materia_prima_compras_futuras",
      )
      .update({
        status:
          "RECEBIDA",

        data_recebimento:
          dataRecebimentoFinal,

        atualizado_em:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        id,
      )
      .eq(
        "ativo",
        true,
      )
      .eq(
        "status",
        statusAtual,
      )
      .select(
        CAMPOS_COMPRA_FUTURA,
      );

  if (error) {
    throw error;
  }

  if (
    !Array.isArray(
      data,
    ) ||
    data.length !==
      1
  ) {
    throw new Error(
      "A compra foi alterada por outro processo. Atualize a tela e tente novamente.",
    );
  }

  return normalizarCompra(
    data[0],
  );
}

export async function excluirCompraFutura(
  id,
) {
  if (
    id === null ||
    id === undefined
  ) {
    throw new Error(
      "Compra futura não informada.",
    );
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "materia_prima_compras_futuras",
      )
      .update({
        ativo:
          false,

        atualizado_em:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        id,
      )
      .eq(
        "ativo",
        true,
      )
      .select(
        "id",
      );

  if (error) {
    throw error;
  }

  if (
    !Array.isArray(
      data,
    ) ||
    data.length ===
      0
  ) {
    throw new Error(
      "A compra futura não foi encontrada ou já foi excluída.",
    );
  }

  return {
    id,

    excluida:
      true,
  };
}