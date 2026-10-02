import { useQuery } from "@tanstack/react-query";

import {
  buscarAnosFinanceiros,
  buscarPrevistoRealizadoFinanceiro,
} from "../services/financeiroPrevistoRealizadoService";


export default function useFinanceiroPrevistoRealizado({
  ano,
  mes,
  tipo,
  habilitado = true,
}) {
  const consultaAnos = useQuery({
    queryKey: [
      "financeiro-relatorios-anos",
    ],

    queryFn:
      buscarAnosFinanceiros,

    staleTime:
      5 * 60 * 1000,

    refetchOnWindowFocus:
      false,

    retry:
      1,
  });


  const consultaRelatorio = useQuery({
    queryKey: [
      "relatorio-financeiro-previsto-realizado",
      ano,
      mes,
      tipo,
    ],

    queryFn: () =>
      buscarPrevistoRealizadoFinanceiro({
        ano,
        mes,
        tipo,
      }),

    enabled: Boolean(
      habilitado &&
      ano &&
      mes,
    ),

    staleTime:
      30 * 1000,

    refetchOnWindowFocus:
      true,

    retry:
      1,
  });


  return {
    anosDisponiveis:
      consultaAnos.data || [],

    dados:
      consultaRelatorio.data || [],

    carregando:
      consultaRelatorio.isLoading,

    atualizando:
      consultaRelatorio.isFetching &&
      !consultaRelatorio.isLoading,

    erro:
      consultaRelatorio.isError
        ? consultaRelatorio.error
        : null,
  };
}