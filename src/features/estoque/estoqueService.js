import { supabase } from "@/lib/supabaseClient";

const TAMANHO_PAGINA = 500;

/* =========================================================
   UTILITÁRIOS
========================================================= */

function numero(valor) {
  const convertido = Number(valor ?? 0);

  return Number.isFinite(convertido)
    ? convertido
    : 0;
}

function texto(valor) {
  return String(valor ?? "").trim();
}

/* =========================================================
   NORMALIZAR ESTOQUE
========================================================= */

function normalizarEstoque(registro) {
  return {
    id:
      registro?.id ??
      null,

    codigoProdutoOmie:
      numero(
        registro?.codigo_produto_omie,
      ),

    codigoIntegracao:
      texto(
        registro?.codigo_integracao,
      ),

    codigoProduto:
      texto(
        registro?.codigo_produto,
      ),

    descricao:
      texto(
        registro?.descricao,
      ),

    tipoItem:
      texto(
        registro?.tipo_item,
      ),

    codigoLocalEstoque:
      numero(
        registro?.codigo_local_estoque,
      ),

    precoUnitario:
      numero(
        registro?.preco_unitario,
      ),

    saldo:
      numero(
        registro?.saldo,
      ),

    cmc:
      numero(
        registro?.cmc,
      ),

    pendente:
      numero(
        registro?.pendente,
      ),

    estoqueMinimo:
      numero(
        registro?.estoque_minimo,
      ),

    reservado:
      numero(
        registro?.reservado,
      ),

    fisico:
      numero(
        registro?.fisico,
      ),

    dataPosicao:
      registro?.data_posicao ??
      null,

    ativo:
      registro?.ativo === true,

    sincronizadoEm:
      registro?.sincronizado_em ??
      null,

    atualizadoEm:
      registro?.atualizado_em ??
      null,
  };
}

/* =========================================================
   LOCAIS DE ESTOQUE
========================================================= */

export async function buscarLocaisEstoqueAtivos() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "locais_estoque_omie",
      )
      .select(`
        codigo_local_estoque,
        codigo,
        descricao,
        padrao,
        inativo
      `)
      .eq(
        "inativo",
        false,
      )
      .order(
        "padrao",
        {
          ascending: false,
        },
      )
      .order(
        "codigo",
        {
          ascending: true,
        },
      );

  if (error) {
    throw new Error(
      `Erro ao carregar locais de estoque: ${error.message}`,
    );
  }

  return (
    Array.isArray(data)
      ? data
      : []
  ).map(
    (registro) => ({
      codigoLocalEstoque:
        numero(
          registro?.codigo_local_estoque,
        ),

      codigo:
        texto(
          registro?.codigo,
        ),

      descricao:
        texto(
          registro?.descricao,
        ),

      padrao:
        registro?.padrao === true,
    }),
  );
}

/* =========================================================
   ESTOQUE
========================================================= */

export async function buscarEstoqueProdutos({
  codigoLocalEstoque,
}) {
  const registros = [];

  let inicio = 0;

  while (true) {
    const fim =
      inicio +
      TAMANHO_PAGINA -
      1;

    let consulta =
      supabase
        .from(
          "estoque_produto_acabado_omie",
        )
        .select(`
          id,
          codigo_produto_omie,
          codigo_integracao,
          codigo_produto,
          descricao,
          tipo_item,
          codigo_local_estoque,
          preco_unitario,
          saldo,
          cmc,
          pendente,
          estoque_minimo,
          reservado,
          fisico,
          data_posicao,
          ativo,
          sincronizado_em,
          atualizado_em
        `)
        .eq(
          "tipo_item",
          "04",
        )
        .eq(
          "ativo",
          true,
        )
        .order(
          "codigo_produto",
          {
            ascending: true,
          },
        );

    if (
      codigoLocalEstoque !==
        "todos" &&
      codigoLocalEstoque !==
        null &&
      codigoLocalEstoque !==
        undefined &&
      codigoLocalEstoque !==
        ""
    ) {
      consulta =
        consulta.eq(
          "codigo_local_estoque",
          Number(
            codigoLocalEstoque,
          ),
        );
    }

    consulta =
      consulta.range(
        inicio,
        fim,
      );

    const {
      data,
      error,
    } =
      await consulta;

    if (error) {
      throw new Error(
        `Erro ao carregar estoque: ${error.message}`,
      );
    }

    const lote =
      Array.isArray(data)
        ? data
        : [];

    registros.push(
      ...lote,
    );

    if (
      lote.length <
      TAMANHO_PAGINA
    ) {
      break;
    }

    inicio +=
      TAMANHO_PAGINA;
  }

  return registros.map(
    normalizarEstoque,
  );
}

/* =========================================================
   PEDIDOS EM ABERTO

   IMPORTANTE:
   Esta é exatamente a mesma regra utilizada para representar
   os pedidos atualmente em aberto:

   ativo = true
   status = "Pedido"
========================================================= */

export async function buscarPedidosAbertosProdutos() {
  const registros = [];

  let inicio = 0;

  while (true) {
    const fim =
      inicio +
      TAMANHO_PAGINA -
      1;

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "pedidos_omie",
        )
        .select(`
          id,
          codigo_pedido_omie,
          codigo_produto,
          quantidade
        `)
        .eq(
          "ativo",
          true,
        )
        .eq(
          "status",
          "Pedido",
        )
        .order(
          "id",
          {
            ascending: true,
          },
        )
        .range(
          inicio,
          fim,
        );

    if (error) {
      throw new Error(
        `Erro ao carregar pedidos em aberto: ${error.message}`,
      );
    }

    const lote =
      Array.isArray(data)
        ? data
        : [];

    registros.push(
      ...lote,
    );

    if (
      lote.length <
      TAMANHO_PAGINA
    ) {
      break;
    }

    inicio +=
      TAMANHO_PAGINA;
  }

  /* =======================================================
     AGRUPAR POR PRODUTO
  ======================================================= */

  const porProduto =
    new Map();

  const pedidosDistintos =
    new Set();

  let quantidadeTotal =
    0;

  for (
    const registro of
    registros
  ) {
    const codigoProduto =
      texto(
        registro?.codigo_produto,
      );

    const quantidade =
      numero(
        registro?.quantidade,
      );

    const codigoPedido =
      registro?.codigo_pedido_omie;

    if (
      codigoPedido !==
        null &&
      codigoPedido !==
        undefined
    ) {
      pedidosDistintos.add(
        String(
          codigoPedido,
        ),
      );
    }

    quantidadeTotal +=
      quantidade;

    if (!codigoProduto) {
      continue;
    }

    const atual =
      porProduto.get(
        codigoProduto,
      ) ?? 0;

    porProduto.set(
      codigoProduto,
      atual +
        quantidade,
    );
  }

  const itens =
    Array.from(
      porProduto.entries(),
    ).map(
      ([
        codigoProduto,
        quantidade,
      ]) => ({
        codigoProduto,
        quantidade,
      }),
    );

  return {
    itens,

    quantidadeTotal,

    pedidosDistintos:
      pedidosDistintos.size,

    linhas:
      registros.length,
  };
}

/* =========================================================
   STATUS DA SINCRONIZAÇÃO
========================================================= */

export async function buscarStatusSincronizacaoEstoque() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "sincronizacao_estoque_omie",
      )
      .select(`
        id,
        ultima_sincronizacao,
        inicio_em,
        fim_em,
        status,
        etapa,
        pagina_atual,
        total_paginas,
        quantidade_produtos,
        duracao_ms,
        mensagem,
        atualizado_em
      `)
      .eq(
        "id",
        1,
      )
      .maybeSingle();

  if (error) {
    throw new Error(
      `Erro ao carregar status da sincronização: ${error.message}`,
    );
  }

  return data ?? null;
}