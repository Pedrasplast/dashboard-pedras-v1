
import { useQuery } from "@tanstack/react-query";

import { buscarTabelaPrecos } from "../services/tabelaPrecos.service";

import {
  TABELA_PRECOS,
} from "../constants/tabelaPrecos.constants";

/* =========================================================
   CONSULTA REATIVA DE PREÇOS
========================================================= */

export function useTabelaPrecos() {
  return useQuery({
    queryKey: TABELA_PRECOS.QUERY_KEY,

    queryFn: buscarTabelaPrecos,

    staleTime: TABELA_PRECOS.STALE_TIME,

    gcTime: TABELA_PRECOS.GC_TIME,

    refetchInterval:
      TABELA_PRECOS.REFRESH_INTERVAL,

    refetchOnWindowFocus: true,

    retry: 1,
  });
}
