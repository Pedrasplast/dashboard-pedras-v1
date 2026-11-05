import { useQuery } from "@tanstack/react-query";

import { QUERY_KEY_PEDIDOS_COMPRA } from "../constants/pedidosCompra.constants";

import { buscarPedidosCompra } from "../services/pedidosCompra.service";

/* =========================================================
   CONFIGURACAO DE ATUALIZACAO
========================================================= */

/*
 * O Supabase recebe as alteracoes do Omie pelo processo
 * incremental aproximadamente a cada 1 minuto.
 *
 * A tela consulta o Supabase a cada 30 segundos para que,
 * assim que a sincronizacao terminar, o usuario veja os
 * dados novos rapidamente sem precisar atualizar a pagina.
 */
/*
 * Os pedidos de compra sao sincronizados com o Omie a cada 5 minutos
 * e as requisicoes a cada 10 minutos. Consultar a cada 30 segundos
 * baixava a lista inteira 10 vezes entre uma sincronizacao e outra,
 * sem nenhum dado novo, e era a maior fonte de egress do projeto.
 *
 * A tela continua atualizando ao voltar para a aba e ao reconectar.
 */
const INTERVALO_ATUALIZACAO_TELA = 5 * 60 * 1000;

/*
 * Depois de 15 segundos os dados podem ser considerados
 * passivos de nova verificacao.
 *
 * Isso nao remove os dados atuais da tela.
 */
/*
 * Ao voltar para a aba, so recarrega se o dado tiver mais de
 * 2 minutos. Antes eram 15 segundos: cada troca de aba baixava
 * a lista inteira de novo.
 */
const TEMPO_DADOS_FRESCOS = 2 * 60 * 1000;

/*
 * Mantem a ultima resposta em memoria por 30 minutos.
 *
 * Se o usuario sair de Compras e voltar, a tabela aparece
 * imediatamente enquanto uma nova leitura acontece.
 */
const TEMPO_CACHE_MEMORIA = 30 * 60 * 1000;

/* =========================================================
   HOOK
========================================================= */

export function usePedidosCompra() {
  const query = useQuery({
    queryKey: QUERY_KEY_PEDIDOS_COMPRA,

    queryFn: buscarPedidosCompra,

    /* =====================================================
         DADOS FRESCOS
      ===================================================== */

    /*
     * Permite uma nova verificacao apos 15 segundos.
     *
     * O dado anterior continua disponivel enquanto isso.
     */
    staleTime: TEMPO_DADOS_FRESCOS,

    /* =====================================================
         CACHE
      ===================================================== */

    /*
     * Mantem os dados em memoria por 30 minutos mesmo
     * depois que o usuario sai da tela.
     */
    gcTime: TEMPO_CACHE_MEMORIA,

    /* =====================================================
         ATUALIZACAO AUTOMATICA
      ===================================================== */

    /*
     * Consulta o Supabase a cada 30 segundos enquanto
     * a tela de Compras estiver aberta.
     *
     * IMPORTANTE:
     * esta consulta NAO chama o Omie diretamente.
     *
     * Ela apenas verifica se o Supabase recebeu alguma
     * atualizacao nova.
     */
    refetchInterval: INTERVALO_ATUALIZACAO_TELA,

    /*
     * Nao continua consultando enquanto a aba do navegador
     * estiver totalmente em segundo plano.
     *
     * Ao voltar para a aba existe um refetch imediato.
     */
    refetchIntervalInBackground: false,

    /* =====================================================
         AO ENTRAR NA TELA
      ===================================================== */

    /*
     * Exibe o cache imediatamente, mas verifica o Supabase
     * novamente ao montar a tela.
     */
    refetchOnMount: true,

    /* =====================================================
         AO VOLTAR PARA A ABA
      ===================================================== */

    /*
     * Se o usuario ficar em outra aba e retornar,
     * consulta imediatamente o Supabase.
     */
    refetchOnWindowFocus: true,

    /* =====================================================
         RECONEXAO
      ===================================================== */

    /*
     * Se a internet cair e voltar, consulta novamente
     * para garantir que nenhum dado atualizado fique
     * apenas no servidor.
     */
    refetchOnReconnect: true,

    /* =====================================================
         MANTER TABELA VISIVEL DURANTE REFRESH
      ===================================================== */

    /*
     * Durante uma nova consulta, mantemos os pedidos
     * anteriores na tela.
     *
     * Dessa forma a pagina nao pisca e nao volta para
     * estado de loading.
     */
    placeholderData: (dadosAnteriores) => dadosAnteriores,

    /* =====================================================
         TENTATIVAS
      ===================================================== */

    retry: 1,
  });

  /* =========================================================
     RETORNO PADRONIZADO
  ========================================================= */

  return {
    ...query,

    /*
     * Lista de pedidos.
     */
    pedidos: Array.isArray(query.data?.pedidos) ? query.data.pedidos : [],

    /*
     * Estado atual da sincronizacao Omie / Supabase.
     */
    estadoSincronizacao: query.data?.estadoSincronizacao ?? null,

    /*
     * Data/hora da ultima atualizacao informada pelo service.
     */
    atualizadoEm: query.data?.atualizadoEm ?? null,
  };
}
