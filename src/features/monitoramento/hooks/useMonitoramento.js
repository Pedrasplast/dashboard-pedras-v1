import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  buscarRotinas,
  buscarHistorico,
  buscarBanco,
  buscarResumo,
  buscarPainelDia,
  definirRotinaAtiva,
  rodarAgora,
} from "../services/monitoramento.service";
import { prepararRotinas, quantidadeAvisos } from "../utils/monitoramento.utils";
import {
  INTERVALO_ATUALIZACAO,
  TEMPO_DADOS_FRESCOS,
  QUERY_KEY_ROTINAS,
  QUERY_KEY_BANCO,
  QUERY_KEY_RESUMO,
  QUERY_KEY_PAINEL,
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

/*
 * Pausar / retomar. Atualiza a lista na hora (campo "ativa") e depois
 * busca de novo a lista e o aviso do menu, que ignora rotinas pausadas.
 */
export function useDefinirRotinaAtiva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rotina, ativa, motivo, retomarEm }) =>
      definirRotinaAtiva(rotina, ativa, { motivo, retomarEm }),
    onSuccess: (_resultado, { rotina, ativa }) => {
      queryClient.setQueryData(QUERY_KEY_ROTINAS, (lista) =>
        Array.isArray(lista)
          ? lista.map((r) => (r.rotina === rotina ? { ...r, ativa } : r))
          : lista,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_ROTINAS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_RESUMO });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_PAINEL });
    },
  });
}

/*
 * Rodar agora. A resposta da função chega segundos depois: a lista e o
 * painel são buscados de novo logo e mais uma vez após 20 s.
 */
const ESPERA_RESULTADO_MS = 20 * 1000;

export function useRodarAgora() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rotina }) => rodarAgora(rotina),
    onSettled: (_resultado, _erro, { rotina }) => {
      const atualizar = () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY_ROTINAS });
        queryClient.invalidateQueries({ queryKey: QUERY_KEY_PAINEL });
        queryClient.invalidateQueries({ queryKey: queryKeyHistorico(rotina) });
      };
      atualizar();
      setTimeout(atualizar, ESPERA_RESULTADO_MS);
    },
  });
}

/*
 * Painel do dia (linha do dia, termômetro do Omie, conferência completa).
 * Uma consulta de poucos kB, no mesmo ritmo da lista.
 */
export function usePainelDia() {
  return useQuery({
    queryKey: QUERY_KEY_PAINEL,
    queryFn: buscarPainelDia,
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
