import {
  useQuery,
} from "@tanstack/react-query";

import {
  buscarConsumoProgramado,
} from "@/features/relatorios/materia-prima/consumoProgramadoService";

import {
  buscarNecessidadeCompra,
} from "@/features/relatorios/materia-prima/necessidadeCompraService";


/* =========================================================
   RESULTADO VAZIO
========================================================= */

function criarResultadoVazio({
  dataInicial,
  dataFinal,
}) {
  return {
    periodo: {
      dataInicial:
        dataInicial || null,

      dataFinal:
        dataFinal || null,
    },

    necessidade: {
      resumo: {
        fornecedoresAnalisados:
          0,

        fornecedoresComprar:
          0,

        fornecedoresCriticos:
          0,

        fornecedoresAtencao:
          0,

        fornecedoresSemSaldo:
          0,

        fornecedoresSemParametros:
          0,

        comprasFuturasKg:
          0,

        consumoProgramadoKg:
          0,

        necessidadeCompraKg:
          0,

        consumoSemReceitaKg:
          0,
      },

      fornecedores:
        [],
    },

    consumo: {
      resumo: {
        injetorasProgramadas:
          0,

        fornecedoresEnvolvidos:
          0,

        programacoes:
          0,

        horasProgramadas:
          0,

        ciclosCompletos:
          0,

        pecasPrevistas:
          0,

        consumoTotalKg:
          0,

        consumoDistribuidoKg:
          0,

        consumoSemReceitaKg:
          0,

        programacoesSemReceita:
          0,

        programacoesLegadas:
          0,

        programacoesComParametrosInvalidos:
          0,
      },

      programacoes:
        [],

      porInjetora:
        [],

      porFornecedor:
        [],

      semReceita:
        [],
    },
  };
}


/* =========================================================
   HOOK
========================================================= */

export default function useDashboardMateriaPrima({
  dataInicial,
  dataFinal,
  habilitado = true,
}) {
  const consulta =
    useQuery({
      queryKey: [
        "dashboard-materia-prima-gerencial",
        dataInicial,
        dataFinal,
      ],

      queryFn:
        async () => {
          const [
            necessidade,
            consumo,
          ] =
            await Promise.all([
              buscarNecessidadeCompra({
                dataInicial,
                dataFinal,
              }),

              buscarConsumoProgramado({
                dataInicial,
                dataFinal,
              }),
            ]);


          return {
            periodo: {
              dataInicial,
              dataFinal,
            },

            necessidade,
            consumo,
          };
        },

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
          "Não foi possível carregar o dashboard gerencial de matéria-prima."
        : "",

    recarregar:
      consulta.refetch,
  };
}