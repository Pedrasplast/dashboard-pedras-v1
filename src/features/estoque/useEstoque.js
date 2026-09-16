import {
  useQuery,
} from "@tanstack/react-query";

import {
  buscarEstoqueProdutos,
  buscarLocaisEstoqueAtivos,
  buscarPedidosAbertosProdutos,
  buscarStatusSincronizacaoEstoque,
} from "./estoqueService";

/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const INTERVALO_ATUALIZACAO =
  30 * 1000;

/* =========================================================
   HOOK
========================================================= */

export default function useEstoque({
  codigoLocalEstoque,
}) {
  /* =======================================================
     LOCAIS
  ======================================================= */

  const locaisQuery =
    useQuery({
      queryKey: [
        "estoque-locais-ativos",
      ],

      queryFn:
        buscarLocaisEstoqueAtivos,

      staleTime:
        5 *
        60 *
        1000,

      refetchOnWindowFocus:
        true,

      retry:
        1,
    });

  /* =======================================================
     ESTOQUE
  ======================================================= */

  const estoqueQuery =
    useQuery({
      queryKey: [
        "estoque-produtos-acabados",
        codigoLocalEstoque,
      ],

      queryFn:
        () =>
          buscarEstoqueProdutos({
            codigoLocalEstoque,
          }),

      enabled:
        Boolean(
          codigoLocalEstoque,
        ),

      refetchInterval:
        INTERVALO_ATUALIZACAO,

      refetchIntervalInBackground:
        false,

      refetchOnMount:
        true,

      refetchOnWindowFocus:
        true,

      staleTime:
        15 *
        1000,

      retry:
        1,
    });

  /* =======================================================
     PEDIDOS EM ABERTO
  ======================================================= */

  const pedidosQuery =
    useQuery({
      queryKey: [
        "estoque-pedidos-abertos",
      ],

      queryFn:
        buscarPedidosAbertosProdutos,

      refetchInterval:
        INTERVALO_ATUALIZACAO,

      refetchIntervalInBackground:
        false,

      refetchOnMount:
        true,

      refetchOnWindowFocus:
        true,

      staleTime:
        15 *
        1000,

      retry:
        1,
    });

  /* =======================================================
     STATUS SINCRONIZAÇÃO
  ======================================================= */

  const statusQuery =
    useQuery({
      queryKey: [
        "estoque-status-sincronizacao",
      ],

      queryFn:
        buscarStatusSincronizacaoEstoque,

      refetchInterval:
        INTERVALO_ATUALIZACAO,

      refetchIntervalInBackground:
        false,

      refetchOnMount:
        true,

      refetchOnWindowFocus:
        true,

      staleTime:
        15 *
        1000,

      retry:
        1,
    });

  /* =======================================================
     RECARREGAR
  ======================================================= */

  async function recarregar() {
    await Promise.all([
      estoqueQuery.refetch(),
      pedidosQuery.refetch(),
      statusQuery.refetch(),
      locaisQuery.refetch(),
    ]);
  }

  /* =======================================================
     ERRO
  ======================================================= */

  const erro =
    estoqueQuery
      .error
      ?.message ||
    pedidosQuery
      .error
      ?.message ||
    locaisQuery
      .error
      ?.message ||
    statusQuery
      .error
      ?.message ||
    "";

  /* =======================================================
     RETORNO
  ======================================================= */

  return {
    locais:
      locaisQuery.data ??
      [],

    estoque:
      estoqueQuery.data ??
      [],

    pedidosAbertos:
      pedidosQuery
        .data
        ?.itens ??
      [],

    resumoPedidosAbertos: {
      quantidadeTotal:
        pedidosQuery
          .data
          ?.quantidadeTotal ??
        0,

      pedidosDistintos:
        pedidosQuery
          .data
          ?.pedidosDistintos ??
        0,

      linhas:
        pedidosQuery
          .data
          ?.linhas ??
        0,
    },

    statusSincronizacao:
      statusQuery.data ??
      null,

    carregando:
      locaisQuery.isLoading ||
      pedidosQuery.isLoading ||
      (
        Boolean(
          codigoLocalEstoque,
        ) &&
        estoqueQuery.isLoading
      ),

    atualizando:
      estoqueQuery.isFetching ||
      pedidosQuery.isFetching ||
      statusQuery.isFetching ||
      locaisQuery.isFetching,

    erro,

    recarregar,
  };
}