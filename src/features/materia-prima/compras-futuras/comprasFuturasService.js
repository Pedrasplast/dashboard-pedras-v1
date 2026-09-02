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


const STATUS_VALIDOS =
  new Set(
    STATUS_COMPRA_FUTURA.map(
      (
        status,
      ) =>
        status.valor,
    ),
  );


/* =========================================================
   UTILITÁRIOS
========================================================= */

function normalizarQuantidade(
  valor,
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }


  const texto =
    String(
      valor,
    ).trim();


  let textoNormalizado =
    texto;


  if (
    texto.includes(
      ",",
    )
  ) {
    textoNormalizado =
      texto
        .replace(
          /\./g,
          "",
        )
        .replace(
          ",",
          ".",
        );
  }


  const numero =
    Number(
      textoNormalizado,
    );


  return Number.isFinite(
    numero,
  )
    ? numero
    : null;
}


function normalizarCompra(
  registro,
) {
  if (!registro) {
    return null;
  }


  const id =
    registro?.id;

  const dataCompra =
    String(
      registro
        ?.data_compra ??
        "",
    ).trim();

  const dataPrevista =
    String(
      registro
        ?.data_prevista ??
        "",
    ).trim();

  const dataRecebimento =
    registro
      ?.data_recebimento
      ? String(
          registro
            .data_recebimento,
        ).trim()
      : null;

  const fornecedorId =
    registro
      ?.fornecedor_id;

  const quantidadeKg =
    Number(
      registro
        ?.quantidade_kg,
    );

  const status =
    String(
      registro
        ?.status ??
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

    dataRecebimento,

    fornecedorId,

    quantidadeKg,

    numeroPedido:
      registro
        ?.numero_pedido ??
      "",

    status,

    observacao:
      registro
        ?.observacao ??
      "",

    ativo:
      registro
        ?.ativo !==
      false,

    criadoEm:
      registro
        ?.criado_em ??
      null,

    atualizadoEm:
      registro
        ?.atualizado_em ??
      null,
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
          `
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
            atualizado_em
          `,
        )
        .order(
          "data_prevista",
          {
            ascending: true,
          },
        )
        .order(
          "id",
          {
            ascending: false,
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
                compra.fornecedorId,
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
    normalizarQuantidade(
      quantidadeKg,
    );

  const numeroPedidoFinal =
    String(
      numeroPedido ?? "",
    ).trim();

  const observacaoFinal =
    String(
      observacao ?? "",
    ).trim();


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
    fornecedorId === undefined ||
    fornecedorId === ""
  ) {
    throw new Error(
      "Selecione o fornecedor.",
    );
  }


  if (
    quantidadeFinal ===
      null ||
    quantidadeFinal <=
      0
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
    /*
     * Compra que deixou de ser RECEBIDA
     * não deve manter uma data de
     * recebimento antiga.
     */
    dataRecebimentoFinal =
      null;
  }


  const agora =
    new Date()
      .toISOString();


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

    atualizado_em:
      agora,
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
          `
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
            atualizado_em
          `,
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
        `
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
          atualizado_em
        `,
      )
      .single();


  if (error) {
    throw error;
  }


  return normalizarCompra(
    data,
  );
}