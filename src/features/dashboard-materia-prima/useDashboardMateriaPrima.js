import {
  useQuery,
} from "@tanstack/react-query";

import {
  buscarFinanceiroMateriaPrima,
} from "./financeiroMateriaPrimaService.js";


function criarResultadoVazio({
  dataInicial,
  dataFinal,
  tipoData,
}) {
  return {
    periodo: {
      dataInicial:
        dataInicial ||
        null,

      dataFinal:
        dataFinal ||
        null,

      tipoData:
        tipoData ||
        "compra",
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
  tipoData = "compra",
  habilitado = true,
}) {
  const consulta =
    useQuery({
      queryKey: [
        "dashboard-materia-prima-financeiro",
        dataInicial,
        dataFinal,
        tipoData,
      ],

      queryFn:
        async () => {
          const financeiro =
            await buscarFinanceiroMateriaPrima({
              dataInicial,
              dataFinal,
              tipoData,
            });

          return {
            periodo: {
              dataInicial,
              dataFinal,
              tipoData,
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
        tipoData,
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