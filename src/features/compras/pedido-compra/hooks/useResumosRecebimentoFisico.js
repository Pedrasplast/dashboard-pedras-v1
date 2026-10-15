import {
  useQuery,
} from "@tanstack/react-query";

import {
  buscarResumosRecebimentoFisico,
} from "../services/recebimentoFisico.service";

export const QUERY_KEY_RECEBIMENTO_FISICO = [
  "pedidos-compra",
  "recebimento-fisico",
];

const TEMPO_DADOS_FRESCOS =
  30 * 1000;

const TEMPO_CACHE_MEMORIA =
  30 * 60 * 1000;

function normalizarCodigos(
  codigosPedidos = [],
) {
  return [
    ...new Set(
      codigosPedidos
        .map(Number)
        .filter(
          (codigo) =>
            Number.isFinite(
              codigo,
            ) &&
            codigo > 0,
        ),
    ),
  ].sort(
    (a, b) => a - b,
  );
}

function transformarEmMapa(
  dados = [],
) {
  const mapa = {};

  for (const item of dados) {
    const codigo = Number(
      item?.cod_ped_compra,
    );

    if (
      !Number.isFinite(codigo) ||
      codigo <= 0
    ) {
      continue;
    }

    mapa[
      String(codigo)
    ] = item;
  }

  return mapa;
}

export function useResumosRecebimentoFisico(
  codigosPedidos = [],
  {
    enabled = true,
  } = {},
) {
  const codigosNormalizados =
    normalizarCodigos(
      codigosPedidos,
    );

  const assinaturaCodigos =
    codigosNormalizados.join(
      ",",
    );

  const query = useQuery({
    queryKey: [
      ...QUERY_KEY_RECEBIMENTO_FISICO,
      "resumos",
      assinaturaCodigos,
    ],

    queryFn: async () => {
      const dados =
        await buscarResumosRecebimentoFisico(
          codigosNormalizados,
        );

      return transformarEmMapa(
        dados,
      );
    },

    enabled:
      Boolean(enabled) &&
      codigosNormalizados.length > 0,

    staleTime:
      TEMPO_DADOS_FRESCOS,

    gcTime:
      TEMPO_CACHE_MEMORIA,

    refetchOnMount:
      true,

    refetchOnWindowFocus:
      false,

    refetchOnReconnect:
      true,

    placeholderData: (
      dadosAnteriores,
    ) => dadosAnteriores,

    retry:
      1,
  });

  return {
    ...query,

    resumos:
      query.data ?? {},
  };
}
