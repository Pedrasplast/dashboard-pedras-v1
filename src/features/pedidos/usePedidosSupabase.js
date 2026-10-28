import { useQuery } from "@tanstack/react-query";

import { obterTokenAcesso } from "@/lib/sessao";
import { supabase } from "@/lib/supabaseClient";

import { buscarPedidosOmie } from "./omie.functions";
import { PEDIDOS_VAZIOS } from "./constants/pedidos.constants";
import { carregarMapaNumeroPedidoExibicao } from "./numeroPedidoExibicao";

export const CHAVE_PEDIDOS_SUPABASE = Object.freeze([
  "pedidos-supabase-relatorios",
  "numeracao-visual-v1",
]);

async function consultarPedidosSupabase() {
  const accessToken = await obterTokenAcesso();

  const [respostaPedidos, mapaNumeroPedidoExibicao] = await Promise.all([
    buscarPedidosOmie({
      data: { accessToken },
    }),

    carregarMapaNumeroPedidoExibicao(supabase),
  ]);

  const pedidosOriginais = Array.isArray(respostaPedidos?.pedidos) ? respostaPedidos.pedidos : [];

  const pedidos = pedidosOriginais.map((pedido) => {
    const codigoPedidoOmie = Number(
      pedido?.codigoPedidoOmie ??
        pedido?.codigoPedido ??
        pedido?.codigo_pedido_omie ??
        pedido?.codigo_pedido,
    );

    const numeroOriginal = String(
      pedido?.pedidoOriginal ?? pedido?.pedido ?? pedido?.numero_pedido ?? "",
    ).trim();

    const numeroExibicao =
      mapaNumeroPedidoExibicao.get(codigoPedidoOmie) ?? pedido?.pedidoExibicao ?? numeroOriginal;

    return {
      ...pedido,

      // Mantém o número recebido do Omie disponível.
      pedidoOriginal: numeroOriginal,

      // Número destinado apenas à apresentação/relatórios.
      pedidoExibicao: numeroExibicao,

      // Os relatórios antigos já leem `pedido`.
      // Substituímos apenas na resposta em memória, nunca no banco.
      pedido: numeroExibicao,
    };
  });

  return {
    ...respostaPedidos,
    pedidos,
  };
}

export function usePedidosSupabase(opcoes = {}) {
  const consulta = useQuery({
    queryKey: CHAVE_PEDIDOS_SUPABASE,
    queryFn: consultarPedidosSupabase,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 1,
    staleTime: 30 * 1000,
    ...opcoes,
  });

  return {
    ...consulta,
    pedidos: Array.isArray(consulta.data?.pedidos) ? consulta.data.pedidos : PEDIDOS_VAZIOS,
  };
}
