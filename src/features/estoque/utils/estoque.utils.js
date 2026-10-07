/* =========================================================
   ESTOQUE - UTILITÁRIOS

   Este arquivo não conhece:
   - React
   - Supabase
   - React Query

   Apenas transforma valores e objetos.
========================================================= */


/* =========================================================
   NÚMERO
========================================================= */

export function numero(
  valor,
) {
  const convertido =
    Number(
      valor ??
        0,
    );


  return Number.isFinite(
    convertido,
  )
    ? convertido
    : 0;
}


/* =========================================================
   TEXTO
========================================================= */

export function texto(
  valor,
) {
  return String(
    valor ??
      "",
  ).trim();
}


/* =========================================================
   NORMALIZAR TEXTO PARA PESQUISA
========================================================= */

export function normalizarTexto(
  valor,
) {
  return texto(
    valor,
  )
    .toLowerCase()
    .normalize(
      "NFD",
    )
    .replace(
      /[\u0300-\u036f]/g,
      "",
    );
}


/* =========================================================
   NORMALIZAR CÓDIGO
========================================================= */

export function normalizarCodigo(
  valor,
) {
  return texto(
    valor,
  );
}


/* =========================================================
   FORMATAR NÚMERO
========================================================= */

export function formatarNumero(
  valor,
  casasMaximas = 3,
) {
  return numero(
    valor,
  ).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits:
        0,

      maximumFractionDigits:
        casasMaximas,
    },
  );
}


/* =========================================================
   FORMATAR DATA/HORA
========================================================= */

export function formatarDataHora(
  valor,
) {
  if (!valor) {
    return "Aguardando sincronização";
  }


  const data =
    new Date(
      valor,
    );


  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return "Aguardando sincronização";
  }


  return data.toLocaleString(
    "pt-BR",
    {
      day:
        "2-digit",

      month:
        "2-digit",

      hour:
        "2-digit",

      minute:
        "2-digit",
    },
  );
}


/* =========================================================
   MODO DA SINCRONIZAÇÃO
========================================================= */

export function obterModoSincronizacao(
  status,
) {
  const etapa =
    normalizarTexto(
      status?.etapa,
    );


  if (
    etapa.startsWith(
      "rapido",
    )
  ) {
    return "Rápida";
  }


  if (
    etapa ===
    "concluido"
  ) {
    return "Completa";
  }


  if (
    normalizarTexto(
      status?.status,
    ) ===
    "sincronizando"
  ) {
    return "Sincronizando";
  }


  return "Automática";
}


/* =========================================================
   NORMALIZAR ESTOQUE DO SUPABASE
========================================================= */

export function normalizarEstoque(
  registro,
) {
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
      registro?.ativo ===
      true,

    sincronizadoEm:
      registro?.sincronizado_em ??
      null,

    atualizadoEm:
      registro?.atualizado_em ??
      null,
  };
}


/* =========================================================
   NORMALIZAR LOCAL
========================================================= */

export function normalizarLocalEstoque(
  registro,
) {
  return {
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
      registro?.padrao ===
      true,
  };
}


/* =========================================================
   CONSOLIDAR ESTOQUE DE TODOS OS LOCAIS
========================================================= */

export function consolidarEstoque(
  registros = [],
) {
  const mapa =
    new Map();


  for (
    const item of
    registros
  ) {
    const chave =
      String(
        item.codigoProdutoOmie,
      );


    const atual =
      mapa.get(
        chave,
      );


    if (!atual) {
      mapa.set(
        chave,
        {
          ...item,

          codigoLocalEstoque:
            null,

          saldo:
            numero(
              item.saldo,
            ),

          fisico:
            numero(
              item.fisico,
            ),

          reservado:
            numero(
              item.reservado,
            ),

          pendente:
            numero(
              item.pendente,
            ),

          estoqueMinimo:
            numero(
              item.estoqueMinimo,
            ),
        },
      );


      continue;
    }


    atual.saldo +=
      numero(
        item.saldo,
      );


    atual.fisico +=
      numero(
        item.fisico,
      );


    atual.reservado +=
      numero(
        item.reservado,
      );


    atual.pendente +=
      numero(
        item.pendente,
      );


    atual.estoqueMinimo +=
      numero(
        item.estoqueMinimo,
      );


    if (
      item.sincronizadoEm &&
      (
        !atual.sincronizadoEm ||
        new Date(
          item.sincronizadoEm,
        ).getTime() >
          new Date(
            atual.sincronizadoEm,
          ).getTime()
      )
    ) {
      atual.sincronizadoEm =
        item.sincronizadoEm;
    }
  }


  return Array.from(
    mapa.values(),
  );
}


/* =========================================================
   AGRUPAR PEDIDOS EM ABERTO POR PRODUTO
========================================================= */

export function agruparPedidosPorProduto(
  registros = [],
) {
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
      normalizarCodigo(
        registro
          ?.codigo_produto,
      );


    const quantidade =
      numero(
        registro
          ?.quantidade,
      );


    const codigoPedido =
      registro
        ?.codigo_pedido_omie;


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


    const quantidadeAtual =
      porProduto.get(
        codigoProduto,
      ) ?? 0;


    porProduto.set(
      codigoProduto,

      quantidadeAtual +
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