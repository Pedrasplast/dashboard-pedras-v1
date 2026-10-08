import { useQuery } from "@tanstack/react-query";
import {
  INTERVALO_LEITURA_COMPRAS,
  QUERY_KEY_PEDIDOS_COMPRA,
} from "../constants/pedidosCompra.constants";
import { buscarPedidosCompra } from "../services/pedidosCompra.service";

const TEMPO_DADOS_FRESCOS =
  5 * 60 * 1000;

const TEMPO_CACHE_MEMORIA =
  30 * 60 * 1000;

export function usePedidosCompra() {
  const query = useQuery({
    queryKey: QUERY_KEY_PEDIDOS_COMPRA,
    queryFn: buscarPedidosCompra,

    /*
     * Enquanto os dados estiverem dentro de 5 minutos,
     * voltar para a tela de Compras reutiliza o cache sem
     * bloquear a interface com uma nova leitura imediata.
     */
    staleTime: TEMPO_DADOS_FRESCOS,

    /*
     * Mantem os dados em memoria por 30 minutos mesmo quando
     * o usuario sai da tela. Ao voltar, a tabela reaparece
     * imediatamente com o ultimo resultado conhecido.
     */
    gcTime: TEMPO_CACHE_MEMORIA,

    /*
     * A atualizacao periodica continua acontecendo enquanto
     * a tela estiver aberta, sem esconder os dados existentes.
     */
    refetchInterval: INTERVALO_LEITURA_COMPRAS,
    refetchIntervalInBackground: false,

    /*
     * Evita refetch automatico apenas porque o componente foi
     * montado novamente ou porque o usuario voltou para a aba.
     */
    refetchOnMount: false,
    refetchOnWindowFocus: false,

    /*
     * Se a conexao cair e voltar, faz uma nova leitura para
     * garantir que a tela seja atualizada.
     */
    refetchOnReconnect: true,

    /*
     * Durante qualquer nova leitura mantemos o resultado
     * anterior visivel. O usuario ve apenas o indicador
     * "atualizando", sem a tela voltar para loading.
     */
    placeholderData: (
      dadosAnteriores,
    ) => dadosAnteriores,

    retry: 1,
  });

  return {
    ...query,

    pedidos:
      Array.isArray(
        query.data?.pedidos,
      )
        ? query.data.pedidos
        : [],

    estadoSincronizacao:
      query.data
        ?.estadoSincronizacao ??
      null,

    atualizadoEm:
      query.data?.atualizadoEm ??
      null,
  };
}