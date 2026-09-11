import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  buscarFornecedoresCadastro,
  buscarProdutosCadastro,
  salvarFornecedorCadastro,
  salvarProdutoCadastro,
} from "./cadastrosService";

/* =========================================================
   HOOK
========================================================= */

export default function useCadastros() {
  const queryClient =
    useQueryClient();

  /* =======================================================
     PRODUTOS
  ======================================================= */

  const produtosQuery =
    useQuery({
      queryKey: [
        "cadastros-produtos",
      ],

      queryFn:
        buscarProdutosCadastro,

      staleTime:
        60 * 1000,

      refetchOnMount:
        true,

      refetchOnWindowFocus:
        true,

      retry:
        1,
    });

  /* =======================================================
     FORNECEDORES
  ======================================================= */

  const fornecedoresQuery =
    useQuery({
      queryKey: [
        "cadastros-fornecedores",
      ],

      queryFn:
        buscarFornecedoresCadastro,

      staleTime:
        60 * 1000,

      refetchOnMount:
        true,

      refetchOnWindowFocus:
        true,

      retry:
        1,
    });

  /* =======================================================
     SALVAR PRODUTO
  ======================================================= */

  const salvarProdutoMutation =
    useMutation({
      mutationFn:
        salvarProdutoCadastro,

      onSuccess:
        async () => {
          await queryClient.invalidateQueries({
            queryKey: [
              "cadastros-produtos",
            ],
          });

          await produtosQuery.refetch();
        },
    });

  /* =======================================================
     SALVAR FORNECEDOR
  ======================================================= */

  const salvarFornecedorMutation =
    useMutation({
      mutationFn:
        salvarFornecedorCadastro,

      onSuccess:
        async () => {
          await queryClient.invalidateQueries({
            queryKey: [
              "cadastros-fornecedores",
            ],
          });

          await fornecedoresQuery.refetch();
        },
    });

  /* =======================================================
     RECARREGAR
  ======================================================= */

  async function recarregar() {
    await Promise.all([
      produtosQuery.refetch(),
      fornecedoresQuery.refetch(),
    ]);
  }

  /* =======================================================
     ERRO
  ======================================================= */

  const erro =
    produtosQuery.error?.message ||
    fornecedoresQuery.error?.message ||
    "";

  /* =======================================================
     RETORNO
  ======================================================= */

  return {
    produtos:
      produtosQuery.data ??
      [],

    fornecedores:
      fornecedoresQuery.data ??
      [],

    carregando:
      produtosQuery.isLoading ||
      fornecedoresQuery.isLoading,

    atualizando:
      produtosQuery.isFetching ||
      fornecedoresQuery.isFetching,

    salvandoProduto:
      salvarProdutoMutation.isPending,

    salvandoFornecedor:
      salvarFornecedorMutation.isPending,

    erro,

    recarregar,

    salvarProduto:
      salvarProdutoMutation.mutateAsync,

    salvarFornecedor:
      salvarFornecedorMutation.mutateAsync,
  };
}