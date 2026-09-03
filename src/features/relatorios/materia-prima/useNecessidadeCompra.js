import {
  useQuery,
} from "@tanstack/react-query";

/*import {
  buscarNecessidadeCompra,
  criarResultadoNecessidadeCompraVazio,
} from "./necessidadeCompraService";*/

import { buscarNecessidadeCompra, criarResultadoNecessidadeCompraVazio } from "./necessidadeCompraService";


/* =========================================================
   HOOK DO RELATÓRIO DE NECESSIDADE DE COMPRA
============================================================ */

export default function useNecessidadeCompra({
  dataInicial,
  dataFinal,
  habilitado = true,
}) {
  const consulta =
    useQuery({
      queryKey: [
        "relatorio-necessidade-compra-materia-prima",
        dataInicial,
        dataFinal,
      ],

      queryFn:
        () =>
          buscarNecessidadeCompra({
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
        30 * 1000,

      refetchOnWindowFocus:
        true,

      retry:
        1,
    });


  const dados =
    consulta.data ??
    criarResultadoNecessidadeCompraVazio({
      dataInicial,
      dataFinal,
    });


  return {
    dados,

    carregando:
      consulta.isLoading,

    atualizando:
      consulta.isFetching &&
      !consulta.isLoading,

    erro:
      consulta.isError
        ? consulta.error
            ?.message ||
          "Não foi possível calcular a necessidade de compra de matéria-prima."
        : "",

    recarregar:
      consulta.refetch,
  };
}