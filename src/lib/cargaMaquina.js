import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabaseClient";

const TAMANHO_PAGINA = 1000;

/*
 * Busca todos os registros de carga_maquina.
 *
 * A paginação contorna o limite padrão de mil
 * registros por consulta do Supabase.
 */
export async function buscarCargaMaquina() {
  const todosOsDados = [];
  let pagina = 0;

  for (;;) {
    const inicioPagina = pagina * TAMANHO_PAGINA;
    const fimPagina = inicioPagina + TAMANHO_PAGINA - 1;

    const { data, error } = await supabase
      .from("carga_maquina")
      .select("*")
      .range(inicioPagina, fimPagina);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      break;
    }

    todosOsDados.push(...data);

    if (data.length < TAMANHO_PAGINA) {
      break;
    }

    pagina += 1;
  }

  return todosOsDados;
}

export const chaveCargaMaquina = ["carga_maquina"];

/*
 * Hook compartilhado entre Dashboard e Relatórios.
 *
 * O cache do React Query evita refazer a paginação
 * completa a cada navegação entre as telas.
 */
export function useCargaMaquina(opcoes = {}) {
  const consulta = useQuery({
    queryKey: chaveCargaMaquina,
    queryFn: buscarCargaMaquina,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...opcoes,
  });

  return {
    dados: consulta.data ?? [],
    loading: consulta.isPending,
    erro: consulta.error
      ? consulta.error.message ||
        "Não foi possível carregar os dados de produção."
      : "",
    recarregar: consulta.refetch,
  };
}
