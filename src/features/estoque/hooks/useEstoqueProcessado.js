import {
  useMemo,
} from "react";

import {
  LOCAL_TODOS,
  SITUACAO_ESTOQUE,
} from "../constants/estoque.constants";

import {
  consolidarEstoque,
  normalizarCodigo,
  normalizarTexto,
  numero,
} from "../utils/estoque.utils";


/* =========================================================
   MAPA DE PEDIDOS POR PRODUTO

   IMPORTANTE:
   pedidosAbertos já chega consolidado pelo service.
   Portanto, não somamos novamente aqui.
========================================================= */

function criarMapaPedidos(
  pedidosAbertos,
) {
  const mapa =
    new Map();


  for (
    const item of
    pedidosAbertos
  ) {
    const codigo =
      normalizarCodigo(
        item?.codigoProduto,
      );


    if (!codigo) {
      continue;
    }


    mapa.set(
      codigo,
      numero(
        item?.quantidade,
      ),
    );
  }


  return mapa;
}


/* =========================================================
   PRIORIDADE DA ORDENAÇÃO

   0 = estoque + pedidos
   1 = estoque sem pedidos
   2 = sem estoque + pedidos
   3 = sem estoque e sem pedidos
========================================================= */

function obterGrupoPrioridade({
  estoque,
  pedidos,
}) {
  if (
    estoque > 0 &&
    pedidos > 0
  ) {
    return 0;
  }


  if (
    estoque > 0 &&
    pedidos === 0
  ) {
    return 1;
  }


  if (
    estoque === 0 &&
    pedidos > 0
  ) {
    return 2;
  }


  return 3;
}


/* =========================================================
   HOOK
========================================================= */

export default function useEstoqueProcessado({
  estoque = [],

  pedidosAbertos = [],

  resumoPedidosAbertos = {},

  locais = [],

  localSelecionado,

  pesquisa,

  situacao,
}) {
  /* =======================================================
     PEDIDOS POR PRODUTO
  ======================================================= */

  const pedidosPorProduto =
    useMemo(
      () =>
        criarMapaPedidos(
          pedidosAbertos,
        ),
      [
        pedidosAbertos,
      ],
    );


  /* =======================================================
     ESTOQUE PARA EXIBIÇÃO

     Quando o usuário seleciona "todos",
     consolida todos os locais por produto.
  ======================================================= */

  const estoqueExibicao =
    useMemo(
      () => {
        if (
          localSelecionado ===
          LOCAL_TODOS
        ) {
          return consolidarEstoque(
            estoque,
          );
        }


        return estoque;
      },
      [
        estoque,
        localSelecionado,
      ],
    );


  /* =======================================================
     INDICADORES
  ======================================================= */

  const indicadores =
    useMemo(
      () => {
        const produtos =
          new Set(
            estoqueExibicao.map(
              (item) =>
                String(
                  item.codigoProdutoOmie,
                ),
            ),
          );


        const comSaldo =
          estoqueExibicao.filter(
            (item) =>
              numero(
                item.saldo,
              ) !==
              0,
          ).length;


        const saldoTotal =
          estoqueExibicao.reduce(
            (
              total,
              item,
            ) =>
              total +
              numero(
                item.saldo,
              ),
            0,
          );


        return {
          produtos:
            produtos.size,

          comSaldo,

          saldoTotal,

          quantidadePedidosAbertos:
            numero(
              resumoPedidosAbertos
                ?.quantidadeTotal,
            ),

          pedidosAbertos:
            numero(
              resumoPedidosAbertos
                ?.pedidosDistintos,
            ),
        };
      },
      [
        estoqueExibicao,
        resumoPedidosAbertos,
      ],
    );


  /* =======================================================
     FILTRAR + PREPARAR LINHAS

     Cada linha passa a possuir:

     saldo
       = estoque atual vindo do Omie

     quantidadePedidos
       = quantidade atualmente em pedidos abertos

     saldoDisponivel
       = estoque - pedidos em aberto
  ======================================================= */

  const estoqueFiltrado =
    useMemo(
      () => {
        const termo =
          normalizarTexto(
            pesquisa,
          );


        const linhas =
          estoqueExibicao
            .filter(
              (item) => {
                const estoqueAtual =
                  numero(
                    item.saldo,
                  );


                if (
                  situacao ===
                    SITUACAO_ESTOQUE
                      .COM_SALDO &&
                  estoqueAtual ===
                    0
                ) {
                  return false;
                }


                if (
                  situacao ===
                    SITUACAO_ESTOQUE
                      .SEM_SALDO &&
                  estoqueAtual !==
                    0
                ) {
                  return false;
                }


                if (!termo) {
                  return true;
                }


                const conteudo =
                  normalizarTexto(
                    `${
                      item.codigoProduto
                    } ${
                      item.codigoIntegracao
                    } ${
                      item.descricao
                    }`,
                  );


                return conteudo.includes(
                  termo,
                );
              },
            )
            .map(
              (item) => {
                const codigo =
                  normalizarCodigo(
                    item.codigoProduto,
                  );


                const estoqueAtual =
                  numero(
                    item.saldo,
                  );


                const quantidadePedidos =
                  numero(
                    pedidosPorProduto.get(
                      codigo,
                    ),
                  );


                const saldoDisponivel =
                  estoqueAtual -
                  quantidadePedidos;


                return {
                  ...item,

                  quantidadePedidos,

                  saldoDisponivel,
                };
              },
            );


        /* =================================================
           ORDENAÇÃO

           1. possui estoque + pedidos
           2. possui estoque sem pedidos
           3. sem estoque + pedidos
           4. sem estoque / sem pedidos

           Dentro do mesmo grupo:
           - maior quantidade em pedidos
           - maior estoque
           - descrição A → Z
        ================================================= */

        return [
          ...linhas,
        ].sort(
          (
            itemA,
            itemB,
          ) => {
            const estoqueA =
              numero(
                itemA.saldo,
              );


            const estoqueB =
              numero(
                itemB.saldo,
              );


            const pedidosA =
              numero(
                itemA
                  .quantidadePedidos,
              );


            const pedidosB =
              numero(
                itemB
                  .quantidadePedidos,
              );


            const grupoA =
              obterGrupoPrioridade({
                estoque:
                  estoqueA,

                pedidos:
                  pedidosA,
              });


            const grupoB =
              obterGrupoPrioridade({
                estoque:
                  estoqueB,

                pedidos:
                  pedidosB,
              });


            /* =============================================
               1. GRUPO
            ============================================= */

            if (
              grupoA !==
              grupoB
            ) {
              return (
                grupoA -
                grupoB
              );
            }


            /* =============================================
               2. PEDIDOS EM ABERTO
            ============================================= */

            if (
              pedidosA !==
              pedidosB
            ) {
              return (
                pedidosB -
                pedidosA
              );
            }


            /* =============================================
               3. ESTOQUE
            ============================================= */

            if (
              estoqueA !==
              estoqueB
            ) {
              return (
                estoqueB -
                estoqueA
              );
            }


            /* =============================================
               4. DESCRIÇÃO
            ============================================= */

            return String(
              itemA.descricao ??
                "",
            ).localeCompare(
              String(
                itemB.descricao ??
                  "",
              ),
              "pt-BR",
              {
                sensitivity:
                  "base",
              },
            );
          },
        );
      },
      [
        estoqueExibicao,
        pesquisa,
        situacao,
        pedidosPorProduto,
      ],
    );


  /* =======================================================
     LOCAL ATUAL
  ======================================================= */

  const localAtual =
    useMemo(
      () => {
        if (
          localSelecionado ===
          LOCAL_TODOS
        ) {
          return "Todos os locais ativos";
        }


        const local =
          locais.find(
            (item) =>
              String(
                item.codigoLocalEstoque,
              ) ===
              String(
                localSelecionado,
              ),
          );


        return local
          ? `${local.codigo} — ${local.descricao}`
          : "Local de estoque";
      },
      [
        locais,
        localSelecionado,
      ],
    );


  /* =======================================================
     RETORNO
  ======================================================= */

  return {
    estoqueExibicao,

    estoqueFiltrado,

    indicadores,

    localAtual,
  };
}