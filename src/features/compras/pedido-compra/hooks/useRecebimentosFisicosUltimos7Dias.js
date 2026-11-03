import { useQuery } from "@tanstack/react-query";

import { buscarRecebimentosFisicosUltimos7Dias } from "../services/recebimentoFisico.service";

import { QUERY_KEY_RECEBIMENTO_FISICO } from "./useResumosRecebimentoFisico";

const TEMPO_DADOS_FRESCOS = 30 * 1000;

const TEMPO_CACHE_MEMORIA = 30 * 60 * 1000;

export function useRecebimentosFisicosUltimos7Dias() {
  const query = useQuery({
    queryKey: [...QUERY_KEY_RECEBIMENTO_FISICO, "ultimos-7-dias"],

    queryFn: buscarRecebimentosFisicosUltimos7Dias,

    staleTime: TEMPO_DADOS_FRESCOS,

    gcTime: TEMPO_CACHE_MEMORIA,

    refetchOnMount: true,

    refetchOnWindowFocus: false,

    refetchOnReconnect: true,

    placeholderData: (dadosAnteriores) => dadosAnteriores,

    retry: 1,
  });

  const recebimentos = Array.isArray(query.data) ? query.data : [];

  const pedidosUnicos = new Set(
    recebimentos
      .map((item) => Number(item?.cod_ped_compra))
      .filter((codigo) => Number.isFinite(codigo) && codigo > 0),
  );

  const itensUnicos = new Set(
    recebimentos.map((item) => `${item?.cod_ped_compra ?? ""}::${item?.codigo_item ?? ""}`),
  );

  return {
    ...query,

    recebimentos,

    indicadores: {
      pedidos: pedidosUnicos.size,

      lancamentos: recebimentos.length,

      itens: itensUnicos.size,
    },
  };
}
