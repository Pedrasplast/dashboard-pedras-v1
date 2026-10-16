
import { useQuery } from "@tanstack/react-query";

import {
  buscarNecessidadeMateriaPrima,
} from "../services/necessidadeMateriaPrima.service";

const CINCO_MINUTOS = 5 * 60 * 1000;
const DEZ_MINUTOS = 10 * 60 * 1000;
const TRINTA_MINUTOS = 30 * 60 * 1000;

export function useNecessidadeMateriaPrima() {
  return useQuery({
    queryKey: [
      "compras",
      "necessidade-materia-prima",
    ],

    queryFn: buscarNecessidadeMateriaPrima,

    staleTime: CINCO_MINUTOS,

    gcTime: TRINTA_MINUTOS,

    refetchInterval: DEZ_MINUTOS,

    refetchOnWindowFocus: true,

    retry: 1,
  });
}
