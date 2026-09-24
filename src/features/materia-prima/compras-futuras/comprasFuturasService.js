import { supabase } from "@/lib/supabaseClient";

import {
  buscarFornecedores,
} from "../fornecedores/fornecedoresService";


/* =========================================================
   STATUS
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


const STATUS_VALIDOS =
  new Set(
    STATUS_COMPRA_FUTURA.map(
      (
        status,
      ) =>
        status.valor,
    ),
  );


const TIPOS_FRETE_VALIDOS =
  new Set(
    TIPOS_FRETE
      .map(
        (
          tipo,
        ) =>
          tipo.valor,
      )
      .filter(
        Boolean,
      ),
  );


/* =========================================================
   CAMPOS
========================================================= */

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


/* =========================================================
   UTILITÁRIOS
========================================================= */

function normalizarNumero(
  valor,
) {
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


/* =========================================================
   CÁLCULO FINANCEIRO
========================================================= */

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
      valorFreteFinal ===
        null
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
        (ipi ?? 0) /
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


  const custoEfetivoKg =
    valorTotal === null
      ? null
      : arredondar(
          valorTotal /
            quantidade,
          6,
        );


  return {
    ...base,

    subtotalProdutos,

    valorIpi,

    valorTotal,

    custoEfetivoKg,
  };
}


/* =========================================================
   NORMALIZAR COMPRA
========================================================= */

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
    fornecedorId ===
      undefined ||
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


/* =========================================================
   BUSCAR COMPRAS
========================================================= */

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
    new Map();


  fornecedores.forEach(
    (
      fornecedor,
    ) => {
      fornecedoresPorId.set(
        String(
          fornecedor.id,
        ),
        fornecedor,
      );
    },
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
        (
          registro,
        ) => {
          const compra =
            normalizarCompra(
              registro,
            );


          if (!compra) {
            return null;
          }


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
      )
      .filter(
        Boolean,
      );


  return {
    compras,

    fornecedores,
  };
}


/* =========================================================
   SALVAR COMPRA
========================================================= */

export async function salvarCompraFutura({
  id = null,

  dataCompra,

  dataPrevista,

  dataRecebimento = null,

  fornecedorId,

  quantidadeKg,

  numeroPedido = "",

  status = "PREVISTA",

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
        "PREVISTA",
    )
      .trim()
      .toUpperCase();


  const quantidadeFinal =
    normalizarNumero(
      quantidadeKg,
    );


  const numeroPedidoFinal =
    String(
      numeroPedido ??
        "",
    ).trim();


  const observacaoFinal =
    String(
      observacao ??
        "",
    ).trim();


  const tipoFreteFinal =
    String(
      tipoFrete ??
        "",
    )
      .trim()
      .toUpperCase();


  let dataRecebimentoFinal =
    dataRecebimento
      ? String(
          dataRecebimento,
        ).trim()
      : null;


  /* =======================================================
     VALIDAÇÕES
  ======================================================= */

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
    precoFinal !== null &&
    precoFinal < 0
  ) {
    throw new Error(
      "O preço unitário não pode ser negativo.",
    );
  }


  if (
    ipiFinal !== null &&
    (
      ipiFinal < 0 ||
      ipiFinal > 100
    )
  ) {
    throw new Error(
      "O IPI deve estar entre 0% e 100%.",
    );
  }


  const valores =
    [
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
    ];


  for (
    const [
      valor,
      nome,
    ] of valores
  ) {
    if (
      valor !== null &&
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


  /* =======================================================
     CÁLCULOS
  ======================================================= */

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
      .valorTotal <
      0
  ) {
    throw new Error(
      "O valor total da compra não pode ser negativo. Revise o desconto informado.",
    );
  }


  /* =======================================================
     PAYLOAD
  ======================================================= */

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
      numeroPedidoFinal ||
      null,

    status:
      statusFinal,

    observacao:
      observacaoFinal ||
      null,

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


  /* =======================================================
     EDITAR
  ======================================================= */

  if (
    id !== null &&
    id !== undefined
  ) {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "materia_prima_compras_futuras",
        )
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
        .single();


    if (error) {
      throw error;
    }


    return normalizarCompra(
      data,
    );
  }


  /* =======================================================
     NOVA
  ======================================================= */

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "materia_prima_compras_futuras",
      )
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


/* =========================================================
   EXCLUSÃO LÓGICA
========================================================= */

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