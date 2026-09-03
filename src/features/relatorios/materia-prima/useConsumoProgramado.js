import {
  useQuery,
} from "@tanstack/react-query";

import {
  buscarConsumoProgramado,
  criarResultadoConsumoProgramadoVazio,
} from "./consumoProgramadoService";


export default function useConsumoProgramado({
  dataInicial,
  dataFinal,
  habilitado = true,
}) {
  const consulta =
    useQuery({
      queryKey: [
        "relatorio-consumo-programado",
        dataInicial,
        dataFinal,
      ],

      queryFn:
        () =>
          buscarConsumoProgramado({
            dataInicial,
            dataFinal,
          }),

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
      criarResultadoConsumoProgramadoVazio({
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
          "Não foi possível carregar o consumo programado."
        : "",

    recarregar:
      consulta.refetch,
  };
}