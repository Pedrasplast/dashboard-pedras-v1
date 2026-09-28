import { useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  INTERVALO_LEITURA_SUPABASE,
  INTERVALO_NOTIFICACOES,
  QUERY_KEY_NOTIFICACOES,
  QUERY_KEY_PEDIDOS,
} from "../constants/pedidos.constants";
import {
  assinarNotificacoesPedidos,
  buscarNotificacoesPendentes,
  buscarPedidosDiretoSupabase,
  marcarPedidoComoVisualizado as marcarPedidoComoVisualizadoService,
} from "../services/pedidos.service";
import {
  criarMapaNotificacoes,
  obterCodigoPedidoOmie,
} from "../utils/pedidos.utils";

export function usePedidosData() {
  const {
    data: respostaPedidos,
    error: erroConsulta,
    isLoading,
    isFetching,
    refetch: refetchPedidos,
  } = useQuery({
    queryKey: QUERY_KEY_PEDIDOS,
    queryFn: buscarPedidosDiretoSupabase,
    refetchInterval: INTERVALO_LEITURA_SUPABASE,
    refetchIntervalInBackground: false,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 10 * 1000,
    retry: 1,
  });

  const {
    data: notificacoesPendentes = [],
    refetch: refetchNotificacoes,
  } = useQuery({
    queryKey: QUERY_KEY_NOTIFICACOES,
    queryFn: buscarNotificacoesPendentes,
    refetchInterval: INTERVALO_NOTIFICACOES,
    refetchIntervalInBackground: false,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 10 * 1000,
    retry: 1,
  });

  const notificacoesPorPedido = useMemo(
    () => criarMapaNotificacoes(notificacoesPendentes),
    [notificacoesPendentes],
  );

  useEffect(() => {
    return assinarNotificacoesPedidos({
      onChange: (payload) => {
        const notificacao = payload?.new;

        // DELETE ou notificação desativada: só precisamos atualizar os badges.
        if (!notificacao || notificacao.notificar !== true) {
          void refetchNotificacoes();
          return;
        }

        // Pedido novo/alterado: atualiza badges e dados da tabela.
        void refetchNotificacoes();
        void refetchPedidos();
      },
    });
  }, [refetchNotificacoes, refetchPedidos]);

  const marcarPedidoComoVisualizado = useCallback(
    async (pedido) => {
      const codigoPedido = obterCodigoPedidoOmie(pedido);
      if (!codigoPedido) return;

      if (!notificacoesPorPedido.has(codigoPedido)) {
        return;
      }

      try {
        const marcado = await marcarPedidoComoVisualizadoService(codigoPedido);

        if (!marcado) {
          console.warn("O pedido não pôde ser marcado como visualizado.");
          return;
        }

        await refetchNotificacoes();

        window.dispatchEvent(
          new CustomEvent("pedidos-notificacoes-atualizadas"),
        );
      } catch (error) {
        console.error("Erro ao marcar pedido como visualizado:", error);
      }
    },
    [notificacoesPorPedido, refetchNotificacoes],
  );

  return {
    respostaPedidos,
    pedidos: Array.isArray(respostaPedidos?.pedidos)
      ? respostaPedidos.pedidos
      : [],
    erroConsulta,
    isLoading,
    isFetching,
    notificacoesPorPedido,
    marcarPedidoComoVisualizado,
  };
}
