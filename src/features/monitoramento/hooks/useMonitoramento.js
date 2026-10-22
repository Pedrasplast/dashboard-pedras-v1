import { useQuery } from "@tanstack/react-query";

import { buscarRotinas, buscarHistorico } from "../services/monitoramento.service";
import { prepararRotinas } from "../utils/monitoramento.utils";
import {
  INTERVALO_ATUALIZACAO,
  TEMPO_DADOS_FRESCOS,
  QUERY_KEY_ROTINAS,
  queryKeyHistorico,
} from "../constants/monitoramento.constants";

export function useRotinas() {
  return useQuery({
    queryKey: QUERY_KEY_ROTINAS,
    queryFn: buscarRotinas,
    select: prepararRotinas,
    staleTime: TEMPO_DADOS_FRESCOS,
    refetchInterval: INTERVALO_ATUALIZACAO,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

/* Histórico só é buscado quando o usuário abre a rotina. */
export function useHistoricoRotina(rotina, aberto) {
  return useQuery({
    queryKey: queryKeyHistorico(rotina),
    queryFn: () => buscarHistorico(rotina),
    enabled: Boolean(rotina) && aberto,
    staleTime: TEMPO_DADOS_FRESCOS,
  });
}
