import {
  useQuery,
} from "@tanstack/react-query";

import {
  buscarRelatorioEntradasComprasMateriaPrima,
  criarResultadoEntradasComprasVazio,
} from "../services/entradasComprasMateriaPrimaService";


const CHAVE_QUERY = [
  "relatorio",
  "materia-prima",
  "entradas-compras",
];


export default function useEntradasComprasMateriaPrima() {
  const consulta = useQuery({
    queryKey: CHAVE_QUERY,

    queryFn:
      buscarRelatorioEntradasComprasMateriaPrima,

    /*
     * Mantém os dados atuais por 5 minutos.
     * Assim, trocar de relatório e voltar não dispara
     * uma consulta nova toda vez.
     */
    staleTime:
      5 * 60 * 1000,

    gcTime:
      30 * 60 * 1000,

    refetchOnMount:
      true,

    refetchOnWindowFocus:
      false,

    refetchOnReconnect:
      true,

    retry:
      1,
  });


  return {
    dados:
      consulta.data ??
      criarResultadoEntradasComprasVazio(),

    carregando:
      consulta.isLoading,

    atualizando:
      consulta.isFetching &&
      !consulta.isLoading,

    erro:
      consulta.isError
        ? consulta.error?.message ||
          "Não foi possível carregar o relatório de entradas e compras."
        : "",
  };
}