import { useMemo } from "react";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

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

/* =====================================================
   CONFIGURAÇÕES
===================================================== */

const CHAVE_PRODUTOS = ["cadastros-produtos"];

const CHAVE_FORNECEDORES = ["cadastros-fornecedores"];

const CHAVE_MATERIAIS = ["cadastros-materiais"];

const CHAVE_FORNECEDOR_MATERIAIS =
  ["cadastros-fornecedor-materiais"];

const CHAVE_DESCRICOES = "cadastros-descricoes-estoque-omie";

const TAMANHO_LOTE = 80;

/* =====================================================
   TRATAMENTO DOS DADOS
===================================================== */

function codigoValido(valor) {
  return String(valor ?? "").trim();
}

function descricaoValida(valor) {
  const descricao = String(valor ?? "").trim();

  return descricao && descricao !== "-"
    ? descricao
    : "";
}

/* =====================================================
   CONSULTA PONTUAL

   Utilizada para preencher automaticamente
   a descrição de um novo produto.

   Relacionamento:

   codigoProduto
        ↓
   estoque_produto_acabado_omie.codigo_produto
        ↓
   descricao
===================================================== */

export async function buscarDescricaoProdutoEstoque(
  codigoProduto,
) {
  const codigo = codigoValido(codigoProduto);

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
   CONSULTAR DESCRIÇÕES DOS PRODUTOS CADASTRADOS

   Busca somente os códigos presentes no cadastro.

   Evita carregar todo o estoque do Omie.
===================================================== */

async function buscarDescricoesCadastro(codigos) {
  const mapa = {};

  for (
    let indice = 0;
    indice < codigos.length;
    indice += TAMANHO_LOTE
  ) {
    const lote = codigos.slice(
      indice,
      indice + TAMANHO_LOTE,
    );

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
      const codigo = codigoValido(
        registro.codigo_produto,
      );

      const descricao = descricaoValida(
        registro.descricao,
      );

      if (
        codigo &&
        descricao &&
        !Object.hasOwn(mapa, codigo)
      ) {
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

    staleTime: 60 * 1000,

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

    staleTime: 60 * 1000,

    refetchOnMount: true,

    refetchOnWindowFocus: true,

    retry: 1,
  });

  /* =================================================
     MATERIAIS
  ================================================= */

  const materiaisQuery = useQuery({
    queryKey:
      CHAVE_MATERIAIS,

    queryFn:
      buscarMateriaisCadastro,

    staleTime:
      60 * 1000,

    refetchOnMount:
      true,

    refetchOnWindowFocus:
      true,

    retry:
      1,
  });

  /* =================================================
     FORNECEDOR X MATERIAL
  ================================================= */

  const fornecedorMateriaisQuery = useQuery({
    queryKey:
      CHAVE_FORNECEDOR_MATERIAIS,

    queryFn:
      buscarFornecedorMateriaisCadastro,

    staleTime:
      60 * 1000,

    refetchOnMount:
      true,

    refetchOnWindowFocus:
      true,

    retry:
      1,
  });

  /* =================================================
     CÓDIGOS DOS PRODUTOS

     Evita códigos vazios e repetidos.
  ================================================= */

  const codigos = useMemo(
    () =>
      [
        ...new Set(
          (produtosQuery.data ?? [])
            .map((produto) =>
              codigoValido(produto.codigoProduto),
            )
            .filter(Boolean),
        ),
      ].sort(),

    [produtosQuery.data],
  );

  /* =================================================
     BUSCAR DESCRIÇÕES NO ESTOQUE OMIE
  ================================================= */

  const descricoesQuery = useQuery({
    queryKey: [CHAVE_DESCRICOES, codigos],

    queryFn: () => buscarDescricoesCadastro(codigos),

    enabled:
      produtosQuery.isSuccess &&
      codigos.length > 0,

    staleTime: 60 * 1000,

    refetchOnWindowFocus: true,

    retry: 1,
  });

  const descricoesEstoque = descricoesQuery.data ?? {};

  /* =================================================
     ASSOCIAR DESCRIÇÕES AOS PRODUTOS

     IMPORTANTE:

     Não modifica nomeProduto.

     Apenas adiciona descricaoEstoque ao objeto
     utilizado na interface.
  ================================================= */

  const produtos = useMemo(
    () =>
      (produtosQuery.data ?? []).map((produto) => ({
        ...produto,

        descricaoEstoque:
          descricoesEstoque[
            codigoValido(produto.codigoProduto)
          ] ?? "",
      })),

    [
      produtosQuery.data,
      descricoesEstoque,
    ],
  );

  /* =================================================
     SALVAR PRODUTO

     Mantém o serviço e a rotina de salvamento
     já existentes.
  ================================================= */

  const salvarProdutoMutation = useMutation({
    mutationFn: salvarProdutoCadastro,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: CHAVE_PRODUTOS,
      });

      await queryClient.invalidateQueries({
        queryKey: [CHAVE_DESCRICOES],
      });

      await produtosQuery.refetch();
    },
  });

  /* =================================================
     SALVAR FORNECEDOR

     Mantido.
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
  ================================================= */

  const salvarMaterialMutation = useMutation({
    mutationFn:
      salvarMaterialCadastro,

    onSuccess:
      async () => {
        await queryClient.invalidateQueries({
          queryKey:
            CHAVE_MATERIAIS,
        });

        await materiaisQuery.refetch();
      },
  });

  /* =================================================
     SALVAR FORNECEDOR X MATERIAL
  ================================================= */

  const salvarMateriaisFornecedorMutation =
    useMutation({
      mutationFn:
        salvarMateriaisFornecedorCadastro,

      onSuccess:
        async () => {
          await queryClient.invalidateQueries({
            queryKey:
              CHAVE_FORNECEDOR_MATERIAIS,
          });

          await fornecedorMateriaisQuery.refetch();
        },
    });

  /* =================================================
     RECARREGAR
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
  ================================================= */

  return {
    produtos,

    fornecedores: fornecedoresQuery.data ?? [],

    materiais: materiaisQuery.data ?? [],

    fornecedorMateriais:
      fornecedorMateriaisQuery.data ?? [],

    /* Descrições do estoque Omie */

    descricoesEstoque,

    buscarDescricaoEstoque:
      buscarDescricaoProdutoEstoque,

    /* Carregamento */

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

    buscandoDescricoesEstoque:
      descricoesQuery.isFetching,

    /* Salvamento */

    salvandoProduto:
      salvarProdutoMutation.isPending,

    salvandoFornecedor:
      salvarFornecedorMutation.isPending,

    salvandoMaterial:
      salvarMaterialMutation.isPending,

    salvandoMateriaisFornecedor:
      salvarMateriaisFornecedorMutation.isPending,

    /* Erros */

    erro:
      produtosQuery.error?.message ||
      fornecedoresQuery.error?.message ||
      materiaisQuery.error?.message ||
      fornecedorMateriaisQuery.error?.message ||
      "",

    erroDescricoesEstoque:
      descricoesQuery.error?.message || "",

    /* Ações */

    recarregar,

    salvarProduto:
      salvarProdutoMutation.mutateAsync,

    salvarFornecedor:
      salvarFornecedorMutation.mutateAsync,

    salvarMaterial:
      salvarMaterialMutation.mutateAsync,

    salvarMateriaisFornecedor:
      salvarMateriaisFornecedorMutation.mutateAsync,
  };
}