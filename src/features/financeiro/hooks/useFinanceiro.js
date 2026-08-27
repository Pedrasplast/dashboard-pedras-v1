import {
  useQuery,
} from "@tanstack/react-query";

import {
  buscarDetalhesFinanceiro,
  buscarResumoFinanceiro,
  buscarStatusSincronizacaoFinanceiro,
} from "../services/financeiro.service";


/* =========================================================
   CONFIGURAÇÕES DE CACHE
========================================================= */

const TRINTA_MINUTOS =
  30 * 60 * 1000;

const UMA_HORA =
  60 * 60 * 1000;


/* =========================================================
   CHAVES DO REACT QUERY
========================================================= */

export const financeiroQueryKeys = {
  todos: [
    "financeiro",
  ],

  resumo: (
    ano,
    mes,
  ) => [
    "financeiro",
    "resumo",
    Number(ano),
    Number(mes),
  ],

  detalhes: (
    ano,
    mes,
    codigoCategoria,
  ) => [
    "financeiro",
    "detalhes",
    Number(ano),
    Number(mes),
    String(
      codigoCategoria ??
        "",
    ),
  ],

  sincronizacao: [
    "financeiro",
    "sincronizacao",
  ],
};


/* =========================================================
   NORMALIZAR RESUMO
========================================================= */

function normalizarResumo(
  registros,
) {
  if (
    !Array.isArray(
      registros,
    )
  ) {
    return [];
  }

  return registros.map(
    (registro) => ({
      ...registro,

      ano:
        Number(
          registro.ano ??
            0,
        ),

      mes:
        Number(
          registro.mes ??
            0,
        ),

      valor_previsto:
        Number(
          registro.valor_previsto ??
            0,
        ),

      valor_realizado:
        Number(
          registro.valor_realizado ??
            0,
        ),
    }),
  );
}


/* =========================================================
   NORMALIZAR DETALHES
========================================================= */

function normalizarDetalhes(
  registros,
) {
  if (
    !Array.isArray(
      registros,
    )
  ) {
    return [];
  }

  return registros.map(
    (registro) => ({
      ...registro,

      ano:
        Number(
          registro.ano ??
            0,
        ),

      mes:
        Number(
          registro.mes ??
            0,
        ),

      codigo_titulo_omie:
        registro.codigo_titulo_omie
          ? Number(
              registro.codigo_titulo_omie,
            )
          : null,

      codigo_cliente_fornecedor_omie:
        registro.codigo_cliente_fornecedor_omie
          ? Number(
              registro.codigo_cliente_fornecedor_omie,
            )
          : null,

      valor_documento:
        Number(
          registro.valor_documento ??
            0,
        ),

      valor_pago:
        Number(
          registro.valor_pago ??
            0,
        ),

      valor_aberto:
        Number(
          registro.valor_aberto ??
            0,
        ),

      valor_componente:
        Number(
          registro.valor_componente ??
            0,
        ),

      percentual_categoria:
        registro.percentual_categoria ==
        null
          ? null
          : Number(
              registro.percentual_categoria,
            ),
    }),
  );
}


/* =========================================================
   RESUMO FINANCEIRO
========================================================= */

export function useFinanceiroResumo(
  ano,
  mes,
) {
  const anoNumero =
    Number(
      ano,
    );

  const mesNumero =
    Number(
      mes,
    );

  const periodoValido =
    Number.isInteger(
      anoNumero,
    ) &&
    anoNumero >= 2000 &&
    anoNumero <= 2100 &&
    Number.isInteger(
      mesNumero,
    ) &&
    mesNumero >= 1 &&
    mesNumero <= 12;

  return useQuery({
    queryKey:
      financeiroQueryKeys.resumo(
        anoNumero,
        mesNumero,
      ),

    queryFn: async () => {
      const registros =
        await buscarResumoFinanceiro(
          anoNumero,
          mesNumero,
        );

      return normalizarResumo(
        registros,
      );
    },

    enabled:
      periodoValido,

    staleTime:
      TRINTA_MINUTOS,

    gcTime:
      UMA_HORA,

    refetchOnWindowFocus:
      false,

    refetchOnReconnect:
      true,

    retry:
      1,
  });
}


/* =========================================================
   DETALHAMENTO
========================================================= */

export function useFinanceiroDetalhes({
  ano,
  mes,
  codigoCategoria,
  habilitado = true,
}) {
  const anoNumero =
    Number(
      ano,
    );

  const mesNumero =
    Number(
      mes,
    );

  const codigo =
    String(
      codigoCategoria ??
        "",
    ).trim();

  const podeConsultar =
    habilitado &&
    Number.isInteger(
      anoNumero,
    ) &&
    anoNumero >= 2000 &&
    anoNumero <= 2100 &&
    Number.isInteger(
      mesNumero,
    ) &&
    mesNumero >= 1 &&
    mesNumero <= 12 &&
    Boolean(
      codigo,
    );

  return useQuery({
    queryKey:
      financeiroQueryKeys.detalhes(
        anoNumero,
        mesNumero,
        codigo,
      ),

    queryFn: async () => {
      const registros =
        await buscarDetalhesFinanceiro({
          ano:
            anoNumero,

          mes:
            mesNumero,

          codigoCategoria:
            codigo,
        });

      return normalizarDetalhes(
        registros,
      );
    },

    enabled:
      podeConsultar,

    staleTime:
      TRINTA_MINUTOS,

    gcTime:
      UMA_HORA,

    refetchOnWindowFocus:
      false,

    refetchOnReconnect:
      true,

    retry:
      1,
  });
}


/* =========================================================
   STATUS DA SINCRONIZAÇÃO
========================================================= */

export function useFinanceiroSincronizacao() {
  return useQuery({
    queryKey:
      financeiroQueryKeys.sincronizacao,

    queryFn:
      buscarStatusSincronizacaoFinanceiro,

    staleTime:
      5 * 60 * 1000,

    gcTime:
      UMA_HORA,

    refetchOnWindowFocus:
      false,

    refetchOnReconnect:
      true,

    retry:
      1,
  });
}