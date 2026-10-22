import { useQuery } from "@tanstack/react-query";

import {
  buscarRotinas,
  buscarHistorico,
  buscarBanco,
  buscarResumo,
} from "../services/monitoramento.service";
import { prepararRotinas, quantidadeAvisos } from "../utils/monitoramento.utils";
import {
  INTERVALO_ATUALIZACAO,
  TEMPO_DADOS_FRESCOS,
  QUERY_KEY_ROTINAS,
  QUERY_KEY_BANCO,
  QUERY_KEY_RESUMO,
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

export function useBancoDados() {
  return useQuery({
    queryKey: QUERY_KEY_BANCO,
    queryFn: buscarBanco,
    staleTime: TEMPO_DADOS_FRESCOS,
    refetchInterval: INTERVALO_ATUALIZACAO,
    refetchIntervalInBackground: false,
  });
}

/*
 * Aviso no menu do administrador. Uma consulta pequena (~40 ms) a cada
 * 5 min, só para administradores e só com a aba visível.
 */
export function useAvisosMonitoramento(habilitado) {
  return useQuery({
    queryKey: QUERY_KEY_RESUMO,
    queryFn: buscarResumo,
    select: quantidadeAvisos,
    enabled: Boolean(habilitado),
    staleTime: TEMPO_DADOS_FRESCOS,
    refetchInterval: INTERVALO_ATUALIZACAO,
    refetchIntervalInBackground: false,
    retry: false,
  });
}
