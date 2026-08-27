import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabaseClient";

import { buscarPedidosOmie } from "./omie.functions";
import { PEDIDOS_VAZIOS } from "./pedidos.utils";

export const CHAVE_PEDIDOS_SUPABASE = Object.freeze(["pedidos-supabase"]);

async function consultarPedidosSupabase() {
  const { data: sessaoData, error: sessaoErro } = await supabase.auth.getSession();

  if (sessaoErro) {
    throw new Error("Não foi possível validar sua sessão.");
  }

  const accessToken = sessaoData?.session?.access_token;
  if (!accessToken) {
    throw new Error("Sua sessão expirou. Entre novamente no sistema.");
  }

  return buscarPedidosOmie({ data: { accessToken } });
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
    pedidos: Array.isArray(consulta.data?.pedidos)
      ? consulta.data.pedidos
      : PEDIDOS_VAZIOS,
  };
}
