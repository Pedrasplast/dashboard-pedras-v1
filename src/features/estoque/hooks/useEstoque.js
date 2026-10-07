import {
  useCallback,
  useMemo,
} from "react";

import {
  useQuery,
} from "@tanstack/react-query";

import {
  ESTOQUE_QUERY_KEYS,
  INTERVALO_ATUALIZACAO_ESTOQUE,
  STALE_TIME_ESTOQUE,
  STALE_TIME_LOCAIS_ESTOQUE,
} from "../constants/estoque.constants";

import {
  buscarEstoqueProdutos,
  buscarLocaisEstoqueAtivos,
  buscarPedidosAbertosProdutos,
  buscarStatusSincronizacaoEstoque,
} from "../services/estoqueService";


/* =========================================================
   HOOK DE ESTOQUE

   Responsabilidade:
   - coordenar React Query;
   - juntar loading / fetching / erros;
   - entregar dados prontos para a página.

   Não deve:
   - formatar dados;
   - filtrar tabela;
   - ordenar produtos;
   - calcular KPIs.
========================================================= */

export default function useEstoque({
  codigoLocalEstoque,
}) {
  /* =======================================================
     LOCAIS
  ======================================================= */

  const locaisQuery =
    useQuery({
      queryKey:
        ESTOQUE_QUERY_KEYS
          .LOCAIS,

      queryFn:
        buscarLocaisEstoqueAtivos,

      staleTime:
        STALE_TIME_LOCAIS_ESTOQUE,

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
      queryKey:
        ESTOQUE_QUERY_KEYS
          .PRODUTOS(
            codigoLocalEstoque,
          ),

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
        INTERVALO_ATUALIZACAO_ESTOQUE,

      refetchIntervalInBackground:
        false,

      refetchOnMount:
        true,

      refetchOnWindowFocus:
        true,

      staleTime:
        STALE_TIME_ESTOQUE,

      retry:
        1,
    });


  /* =======================================================
     PEDIDOS EM ABERTO
  ======================================================= */

  const pedidosQuery =
    useQuery({
      queryKey:
        ESTOQUE_QUERY_KEYS
          .PEDIDOS_ABERTOS,

      queryFn:
        buscarPedidosAbertosProdutos,

      refetchInterval:
        INTERVALO_ATUALIZACAO_ESTOQUE,

      refetchIntervalInBackground:
        false,

      refetchOnMount:
        true,

      refetchOnWindowFocus:
        true,

      staleTime:
        STALE_TIME_ESTOQUE,

      retry:
        1,
    });


  /* =======================================================
     STATUS DA SINCRONIZAÇÃO
  ======================================================= */

  const statusQuery =
    useQuery({
      queryKey:
        ESTOQUE_QUERY_KEYS
          .STATUS_SINCRONIZACAO,

      queryFn:
        buscarStatusSincronizacaoEstoque,

      refetchInterval:
        INTERVALO_ATUALIZACAO_ESTOQUE,

      refetchIntervalInBackground:
        false,

      refetchOnMount:
        true,

      refetchOnWindowFocus:
        true,

      staleTime:
        STALE_TIME_ESTOQUE,

      retry:
        1,
    });


  /* =======================================================
     RECARREGAR

     Mantemos disponível para casos futuros,
     mesmo que o botão manual tenha sido removido da UI.
  ======================================================= */

  const recarregar =
    useCallback(
      async () => {
        await Promise.all([
          estoqueQuery
            .refetch(),

          pedidosQuery
            .refetch(),

          statusQuery
            .refetch(),

          locaisQuery
            .refetch(),
        ]);
      },
      [
        estoqueQuery,
        pedidosQuery,
        statusQuery,
        locaisQuery,
      ],
    );


  /* =======================================================
     RESUMO DE PEDIDOS
  ======================================================= */

  const resumoPedidosAbertos =
    useMemo(
      () => ({
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
      }),
      [
        pedidosQuery.data,
      ],
    );


  /* =======================================================
     CARREGANDO
  ======================================================= */

  const carregando =
    locaisQuery.isLoading ||
    pedidosQuery.isLoading ||
    (
      Boolean(
        codigoLocalEstoque,
      ) &&
      estoqueQuery.isLoading
    );


  /* =======================================================
     ATUALIZANDO
  ======================================================= */

  const atualizando =
    estoqueQuery.isFetching ||
    pedidosQuery.isFetching ||
    statusQuery.isFetching ||
    locaisQuery.isFetching;


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

    resumoPedidosAbertos,

    statusSincronizacao:
      statusQuery.data ??
      null,

    carregando,

    atualizando,

    erro,

    recarregar,
  };
}