import { useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabaseClient";

import {
  buscarFornecedoresCadastro,
  buscarFornecedorMateriaisCadastro,
  buscarMateriaisCadastro,
  buscarProdutosCadastro,
  salvarFornecedorCadastro,
  salvarMaterialCadastro,
  salvarMateriaisFornecedorCadastro,
  salvarProdutoCadastro,
} from "./cadastrosService";

import { buscarTabelaPrecos } from "@/features/tabela-precos-materia-prima/services/tabelaPrecos.service";

import { TABELA_PRECOS } from "@/features/tabela-precos-materia-prima/constants/tabelaPrecos.constants";

import { buscarNecessidadeMateriaPrima } from "@/features/necessidade-materia-prima/services/necessidadeMateriaPrima.service";

import { QUERY_KEY_NECESSIDADE_MP } from "@/features/necessidade-materia-prima/hooks/useNecessidadeMateriaPrima";
import { paraTexto } from "@/shared/lib/texto";

/* =====================================================
   CONFIGURAÇÕES
===================================================== */

const CHAVE_PRODUTOS = ["cadastros-produtos"];

const CHAVE_FORNECEDORES = ["cadastros-fornecedores"];

const CHAVE_MATERIAIS = ["cadastros-materiais"];

const CHAVE_FORNECEDOR_MATERIAIS = ["cadastros-fornecedor-materiais"];

const CHAVE_DESCRICOES = "cadastros-descricoes-estoque-omie";

const CHAVE_TABELA_PRECOS = TABELA_PRECOS.QUERY_KEY;

/* Mesma chave da tela de Necessidade (antes faltava o último
   item e a atualização não chegava na tela). */
const CHAVE_NECESSIDADE_COMPRA = QUERY_KEY_NECESSIDADE_MP;

const TAMANHO_LOTE = 80;

const UM_MINUTO = 60 * 1000;

const TRINTA_MINUTOS = 30 * 60 * 1000;

/* =====================================================
   UTILITÁRIOS
===================================================== */

function descricaoValida(valor) {
  const descricao = String(valor ?? "").trim();

  return descricao && descricao !== "-" ? descricao : "";
}

/* =====================================================
   CONSULTA DE DESCRIÇÃO INDIVIDUAL NO OMIE

   Mantém comportamento anterior.
===================================================== */

export async function buscarDescricaoProdutoEstoque(codigoProduto) {
  const codigo = paraTexto(codigoProduto);

  if (!codigo) {
    return "";
  }

  const { data, error } = await supabase
    .from("estoque_produto_acabado_omie")
    .select("descricao")
    .eq("codigo_produto", codigo)
    .eq("ativo", true)
    .order("atualizado_em", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return descricaoValida(data?.descricao);
}

/* =====================================================
   DESCRIÇÕES DE PRODUTOS CADASTRADOS

   Consulta em lotes para evitar carregar todo
   o estoque de produtos acabados.
===================================================== */

async function buscarDescricoesCadastro(codigos) {
  const mapa = {};

  for (let indice = 0; indice < codigos.length; indice += TAMANHO_LOTE) {
    const lote = codigos.slice(indice, indice + TAMANHO_LOTE);

    const { data, error } = await supabase
      .from("estoque_produto_acabado_omie")
      .select("codigo_produto, descricao")
      .eq("ativo", true)
      .in("codigo_produto", lote)
      .order("atualizado_em", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    for (const registro of data ?? []) {
      const codigo = paraTexto(registro.codigo_produto);

      const descricao = descricaoValida(registro.descricao);

      if (codigo && descricao && !Object.hasOwn(mapa, codigo)) {
        mapa[codigo] = descricao;
      }
    }
  }

  return mapa;
}

/* =====================================================
   HOOK PRINCIPAL
===================================================== */

export default function useCadastros() {
  const queryClient = useQueryClient();

  /* =================================================
     PRODUTOS
  ================================================= */

  const produtosQuery = useQuery({
    queryKey: CHAVE_PRODUTOS,

    queryFn: buscarProdutosCadastro,

    staleTime: UM_MINUTO,

    refetchOnMount: true,

    refetchOnWindowFocus: true,

    retry: 1,
  });

  /* =================================================
     FORNECEDORES
  ================================================= */

  const fornecedoresQuery = useQuery({
    queryKey: CHAVE_FORNECEDORES,

    queryFn: buscarFornecedoresCadastro,

    staleTime: UM_MINUTO,

    refetchOnMount: true,

    refetchOnWindowFocus: true,

    retry: 1,
  });

  /* =================================================
     MATERIAIS
  ================================================= */

  const materiaisQuery = useQuery({
    queryKey: CHAVE_MATERIAIS,

    queryFn: buscarMateriaisCadastro,

    staleTime: UM_MINUTO,

    refetchOnMount: true,

    refetchOnWindowFocus: true,

    retry: 1,
  });

  /* =================================================
     FORNECEDOR X MATERIAL
  ================================================= */

  const fornecedorMateriaisQuery = useQuery({
    queryKey: CHAVE_FORNECEDOR_MATERIAIS,

    queryFn: buscarFornecedorMateriaisCadastro,

    staleTime: UM_MINUTO,

    refetchOnMount: true,

    refetchOnWindowFocus: true,

    retry: 1,
  });

  /* =================================================
     CÓDIGOS DOS PRODUTOS
  ================================================= */

  const codigos = useMemo(
    () =>
      [
        ...new Set(
          (produtosQuery.data ?? [])
            .map((produto) => paraTexto(produto.codigoProduto))
            .filter(Boolean),
        ),
      ].sort(),

    [produtosQuery.data],
  );

  /* =================================================
     DESCRIÇÕES DO ESTOQUE
  ================================================= */

  const descricoesQuery = useQuery({
    queryKey: [CHAVE_DESCRICOES, codigos],

    queryFn: () => buscarDescricoesCadastro(codigos),

    enabled: produtosQuery.isSuccess && codigos.length > 0,

    staleTime: UM_MINUTO,

    refetchOnWindowFocus: true,

    retry: 1,
  });

  const descricoesEstoque = useMemo(() => descricoesQuery.data ?? {}, [descricoesQuery.data]);

  /* =================================================
     ASSOCIAR DESCRIÇÕES

     Não altera nomeProduto.
================================================= */

  const produtos = useMemo(
    () =>
      (produtosQuery.data ?? []).map((produto) => ({
        ...produto,

        descricaoEstoque: descricoesEstoque[paraTexto(produto.codigoProduto)] ?? "",
      })),

    [produtosQuery.data, descricoesEstoque],
  );

  /* =================================================
     ATUALIZAR NECESSIDADE DE COMPRA

     Executada em segundo plano.

     Não impede que o modal seja fechado.

     O cache é invalidado imediatamente.
     Em seguida, a consulta é executada
     mesmo se a tela estiver inativa.
================================================= */

  async function atualizarNecessidadeCompra() {
    await queryClient.invalidateQueries({
      queryKey: CHAVE_NECESSIDADE_COMPRA,
      exact: true,
      refetchType: "none",
    });

    await queryClient.fetchQuery({
      queryKey: CHAVE_NECESSIDADE_COMPRA,

      queryFn: buscarNecessidadeMateriaPrima,

      staleTime: 0,

      gcTime: TRINTA_MINUTOS,

      retry: 1,
    });
  }

  /* =================================================
     ATUALIZAR TABELA DE PREÇOS

     Executada em segundo plano depois de
     salvar um material.
================================================= */

  async function atualizarTabelaPrecos() {
    await queryClient.invalidateQueries({
      queryKey: CHAVE_TABELA_PRECOS,
      exact: true,
      refetchType: "none",
    });

    await queryClient.fetchQuery({
      queryKey: CHAVE_TABELA_PRECOS,

      queryFn: buscarTabelaPrecos,

      staleTime: 0,

      gcTime: TABELA_PRECOS.GC_TIME,

      retry: 1,
    });
  }

  /* =================================================
     EXECUTAR ATUALIZAÇÕES EM SEGUNDO PLANO

     Não faz parte da espera do mutation.

     Os erros são registrados sem transformar
     um salvamento bem-sucedido em falha.
================================================= */

  function executarEmSegundoPlano(operacoes, contexto) {
    void Promise.allSettled(operacoes.map((operacao) => Promise.resolve().then(operacao))).then(
      (resultados) => {
        resultados.forEach((resultado, indice) => {
          if (resultado.status === "rejected") {
            console.error(`[${contexto}] Erro na atualização ${indice + 1}:`, resultado.reason);
          }
        });
      },
    );
  }

  /* =================================================
     SALVAR PRODUTO

     OTIMIZAÇÃO:

     Antes:
     - Salvar no Supabase.
     - Esperar atualizar produtos.
     - Esperar atualizar descrições.
     - Esperar recalcular toda a necessidade.
     - Fechar modal.

     Agora:
     - Salvar no Supabase.
     - Iniciar atualizações em segundo plano.
     - Liberar imediatamente o modal.

     O retorno de onSuccess não é uma Promise.
================================================= */

  const salvarProdutoMutation = useMutation({
    mutationFn: salvarProdutoCadastro,

    onSuccess: () => {
      executarEmSegundoPlano(
        [
          () =>
            queryClient.invalidateQueries({
              queryKey: CHAVE_PRODUTOS,
              refetchType: "active",
            }),

          () =>
            queryClient.invalidateQueries({
              queryKey: [CHAVE_DESCRICOES],
              refetchType: "active",
            }),

          atualizarNecessidadeCompra,
        ],
        "Cadastro de Produto",
      );
    },
  });

  /* =================================================
     SALVAR FORNECEDOR

     Preserva funcionamento anterior.
================================================= */

  const salvarFornecedorMutation = useMutation({
    mutationFn: salvarFornecedorCadastro,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: CHAVE_FORNECEDORES,
      });

      await fornecedoresQuery.refetch();
    },
  });

  /* =================================================
     SALVAR MATERIAL

     Também não bloqueia mais o formulário
     enquanto atualiza a Tabela de Preços
     e a Necessidade de Compra.
================================================= */

  const salvarMaterialMutation = useMutation({
    mutationFn: salvarMaterialCadastro,

    onSuccess: () => {
      executarEmSegundoPlano(
        [
          () =>
            queryClient.invalidateQueries({
              queryKey: CHAVE_MATERIAIS,
              refetchType: "active",
            }),

          atualizarTabelaPrecos,

          atualizarNecessidadeCompra,
        ],
        "Cadastro de Material",
      );
    },
  });

  /* =================================================
     SALVAR FORNECEDOR X MATERIAL

     Mantido.
================================================= */

  const salvarMateriaisFornecedorMutation = useMutation({
    mutationFn: salvarMateriaisFornecedorCadastro,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: CHAVE_FORNECEDOR_MATERIAIS,
      });

      await fornecedorMateriaisQuery.refetch();
    },
  });

  /* =================================================
     RECARREGAR CADASTROS
================================================= */

  async function recarregar() {
    await Promise.all([
      produtosQuery.refetch(),

      fornecedoresQuery.refetch(),

      materiaisQuery.refetch(),

      fornecedorMateriaisQuery.refetch(),

      queryClient.invalidateQueries({
        queryKey: [CHAVE_DESCRICOES],
      }),
    ]);
  }

  /* =================================================
     RETORNO

     Interface preservada para CadastrosPage.
================================================= */

  return {
    produtos,

    fornecedores: fornecedoresQuery.data ?? [],

    materiais: materiaisQuery.data ?? [],

    fornecedorMateriais: fornecedorMateriaisQuery.data ?? [],

    descricoesEstoque,

    buscarDescricaoEstoque: buscarDescricaoProdutoEstoque,

    carregando:
      produtosQuery.isLoading ||
      fornecedoresQuery.isLoading ||
      materiaisQuery.isLoading ||
      fornecedorMateriaisQuery.isLoading,

    atualizando:
      produtosQuery.isFetching ||
      fornecedoresQuery.isFetching ||
      materiaisQuery.isFetching ||
      fornecedorMateriaisQuery.isFetching ||
      descricoesQuery.isFetching,

    buscandoDescricoesEstoque: descricoesQuery.isFetching,

    salvandoProduto: salvarProdutoMutation.isPending,

    salvandoFornecedor: salvarFornecedorMutation.isPending,

    salvandoMaterial: salvarMaterialMutation.isPending,

    salvandoMateriaisFornecedor: salvarMateriaisFornecedorMutation.isPending,

    erro:
      produtosQuery.error?.message ||
      fornecedoresQuery.error?.message ||
      materiaisQuery.error?.message ||
      fornecedorMateriaisQuery.error?.message ||
      "",

    erroDescricoesEstoque: descricoesQuery.error?.message || "",

    recarregar,

    salvarProduto: salvarProdutoMutation.mutateAsync,

    salvarFornecedor: salvarFornecedorMutation.mutateAsync,

    salvarMaterial: salvarMaterialMutation.mutateAsync,

    salvarMateriaisFornecedor: salvarMateriaisFornecedorMutation.mutateAsync,
  };
}
