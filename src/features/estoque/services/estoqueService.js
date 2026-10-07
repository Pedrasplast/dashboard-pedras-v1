import {
  supabase,
} from "@/lib/supabaseClient";

import {
  LOCAL_TODOS,
  STATUS_PEDIDO_ABERTO,
  TAMANHO_PAGINA_ESTOQUE,
  TIPO_ITEM_PRODUTO_ACABADO,
} from "../constants/estoque.constants";

import {
  agruparPedidosPorProduto,
  normalizarEstoque,
  normalizarLocalEstoque,
} from "../utils/estoque.utils";


/* =========================================================
   EXECUTAR CONSULTA PAGINADA

   Responsável apenas por repetir consultas com .range()
   enquanto houver registros.

   O callback recebe:
   - início
   - fim
========================================================= */

async function buscarTodasPaginas(
  executarConsulta,
) {
  const registros =
    [];


  let inicio =
    0;


  while (true) {
    const fim =
      inicio +
      TAMANHO_PAGINA_ESTOQUE -
      1;


    const {
      data,
      error,
    } =
      await executarConsulta({
        inicio,
        fim,
      });


    if (error) {
      throw error;
    }


    const lote =
      Array.isArray(
        data,
      )
        ? data
        : [];


    registros.push(
      ...lote,
    );


    if (
      lote.length <
      TAMANHO_PAGINA_ESTOQUE
    ) {
      break;
    }


    inicio +=
      TAMANHO_PAGINA_ESTOQUE;
  }


  return registros;
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
          ascending:
            false,
        },
      )
      .order(
        "codigo",
        {
          ascending:
            true,
        },
      );


  if (error) {
    throw new Error(
      `Erro ao carregar locais de estoque: ${error.message}`,
    );
  }


  const registros =
    Array.isArray(
      data,
    )
      ? data
      : [];


  return registros.map(
    normalizarLocalEstoque,
  );
}


/* =========================================================
   ESTOQUE
========================================================= */

export async function buscarEstoqueProdutos({
  codigoLocalEstoque,
}) {
  try {
    const registros =
      await buscarTodasPaginas(
        async ({
          inicio,
          fim,
        }) => {
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
                TIPO_ITEM_PRODUTO_ACABADO,
              )
              .eq(
                "ativo",
                true,
              )
              .order(
                "codigo_produto",
                {
                  ascending:
                    true,
                },
              );


          const filtrarLocal =
            codigoLocalEstoque !==
              LOCAL_TODOS &&
            codigoLocalEstoque !==
              null &&
            codigoLocalEstoque !==
              undefined &&
            codigoLocalEstoque !==
              "";


          if (
            filtrarLocal
          ) {
            consulta =
              consulta.eq(
                "codigo_local_estoque",
                Number(
                  codigoLocalEstoque,
                ),
              );
          }


          return consulta.range(
            inicio,
            fim,
          );
        },
      );


    return registros.map(
      normalizarEstoque,
    );

  } catch (error) {
    throw new Error(
      `Erro ao carregar estoque: ${
        error?.message ||
        "erro desconhecido"
      }`,
    );
  }
}


/* =========================================================
   PEDIDOS EM ABERTO
========================================================= */

export async function buscarPedidosAbertosProdutos() {
  try {
    const registros =
      await buscarTodasPaginas(
        ({
          inicio,
          fim,
        }) =>
          supabase
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
              STATUS_PEDIDO_ABERTO,
            )
            .order(
              "id",
              {
                ascending:
                  true,
              },
            )
            .range(
              inicio,
              fim,
            ),
      );


    return agruparPedidosPorProduto(
      registros,
    );

  } catch (error) {
    throw new Error(
      `Erro ao carregar pedidos em aberto: ${
        error?.message ||
        "erro desconhecido"
      }`,
    );
  }
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


  return data ??
    null;
}