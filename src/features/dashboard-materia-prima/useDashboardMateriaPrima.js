import {
  useQuery,
} from "@tanstack/react-query";

import {
  buscarFinanceiroMateriaPrima,
} from "./financeiroMateriaPrimaService.js";


function criarResultadoVazio({
  dataInicial,
  dataFinal,
}) {
  return {
    periodo: {
      dataInicial:
        dataInicial ||
        null,

      dataFinal:
        dataFinal ||
        null,
    },

    financeiro: {
      compras:
        [],

      recebimentos:
        [],
    },
  };
}


export default function useDashboardMateriaPrima({
  dataInicial,
  dataFinal,
  habilitado = true,
}) {
  const consulta =
    useQuery({
      queryKey: [
        "dashboard-materia-prima-financeiro",
        dataInicial,
        dataFinal,
      ],

      queryFn:
        async () => {
          const financeiro =
            await buscarFinanceiroMateriaPrima({
              dataInicial,
              dataFinal,
            });

          return {
            periodo: {
              dataInicial,
              dataFinal,
            },

            financeiro,
          };
        },

      enabled:
        Boolean(
          habilitado &&
          dataInicial &&
          dataFinal,
        ),

      staleTime:
        30 *
        1000,

      refetchOnWindowFocus:
        true,

      retry:
        1,
    });

  return {
    dados:
      consulta.data ??
      criarResultadoVazio({
        dataInicial,
        dataFinal,
      }),

    carregando:
      consulta.isLoading,

    atualizando:
      consulta.isFetching &&
      !consulta.isLoading,

    erro:
      consulta.isError
        ? consulta.error
            ?.message ||
          "Não foi possível carregar o financeiro de matéria-prima."
        : "",

    recarregar:
      consulta.refetch,
  };
}
