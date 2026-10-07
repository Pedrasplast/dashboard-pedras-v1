import { useQuery } from "@tanstack/react-query";
import {
  INTERVALO_LEITURA_COMPRAS,
  QUERY_KEY_PEDIDOS_COMPRA,
} from "../constants/pedidosCompra.constants";
import { buscarPedidosCompra } from "../services/pedidosCompra.service";

export function usePedidosCompra() {
  const query = useQuery({
    queryKey: QUERY_KEY_PEDIDOS_COMPRA,
    queryFn: buscarPedidosCompra,
    refetchInterval: INTERVALO_LEITURA_COMPRAS,
    refetchIntervalInBackground: false,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 10 * 1000,
    retry: 1,
  });

  return {
    ...query,
    pedidos: Array.isArray(query.data?.pedidos) ? query.data.pedidos : [],
    estadoSincronizacao: query.data?.estadoSincronizacao ?? null,
    atualizadoEm: query.data?.atualizadoEm ?? null,
  };
}
