import {
  useQuery,
} from "@tanstack/react-query";

import {
  buscarFinanceiroMateriaPrima,
} from "./financeiroMateriaPrimaService.js";

import {
  buscarFinanceiroMateriaPrimaOmie,
} from "./financeiroMateriaPrimaOmieService.js";

import {
  ORIGEM_OMIE,
} from "./origemOmie.js";


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
  origem = ORIGEM_OMIE,
  habilitado = true,
}) {
  /* Origem dos dados: "manual" (tela de compras) ou "omie". */
  const buscar =
    origem === ORIGEM_OMIE
      ? buscarFinanceiroMateriaPrimaOmie
      : buscarFinanceiroMateriaPrima;

  const consulta =
    useQuery({
      queryKey: [
        "dashboard-materia-prima-financeiro",
        dataInicial,
        dataFinal,
        tipoData,
        origem,
      ],

      queryFn:
        async () => {
          const financeiro =
            await buscar({
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