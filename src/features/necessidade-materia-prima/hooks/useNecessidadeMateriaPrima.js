
import { useQuery } from "@tanstack/react-query";

import {
  buscarNecessidadeMateriaPrima,
} from "../services/necessidadeMateriaPrima.service";
import { useAtualizarAoAlterarMateriais } from "@/features/cadastros/materiais/hooks/useAtualizarAoAlterarMateriais";

const CINCO_MINUTOS = 5 * 60 * 1000;
const DEZ_MINUTOS = 10 * 60 * 1000;
const TRINTA_MINUTOS = 30 * 60 * 1000;

/* Chave única da consulta (usada também pelo Cadastro de Material). */
export const QUERY_KEY_NECESSIDADE_MP = Object.freeze([
  "compras",
  "necessidade-materia-prima",
  "planejamento-produtos-v2",
]);

export function useNecessidadeMateriaPrima() {
  /* Habilitou/desabilitou no Cadastro de Material: atualiza na hora. */
  useAtualizarAoAlterarMateriais(QUERY_KEY_NECESSIDADE_MP);

  return useQuery({
    queryKey: QUERY_KEY_NECESSIDADE_MP,

    queryFn: buscarNecessidadeMateriaPrima,

    staleTime: CINCO_MINUTOS,

    gcTime: TRINTA_MINUTOS,

    refetchInterval: DEZ_MINUTOS,

    refetchOnWindowFocus: true,

    retry: 1,
  });
}
