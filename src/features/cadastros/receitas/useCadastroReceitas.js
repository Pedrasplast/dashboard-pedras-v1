import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  alterarStatusCadastroReceita,
  buscarCadastroReceitas,
  salvarCadastroReceita,
} from "./cadastroReceitasService";


const CHAVE_CADASTRO_RECEITAS =
  ["cadastro-receitas"];


/* =========================================================
   HOOK
========================================================= */

export default function useCadastroReceitas() {
  const queryClient =
    useQueryClient();


  /* =======================================================
     CONSULTA
  ======================================================= */

  const cadastroQuery =
    useQuery({
      queryKey:
        CHAVE_CADASTRO_RECEITAS,

      queryFn:
        buscarCadastroReceitas,

      /*
       * A tela sempre confere os dados novamente
       * quando for aberta.
       */
      staleTime: 0,

      refetchOnMount:
        "always",

      /*
       * Ao voltar para a janela/aba do sistema,
       * os dados são conferidos automaticamente.
       */
      refetchOnWindowFocus:
        true,

      /*
       * Se a conexão cair e retornar,
       * as receitas são recarregadas.
       */
      refetchOnReconnect:
        true,

      retry:
        1,
    });


  /* =======================================================
     ATUALIZAÇÃO AUTOMÁTICA
  ======================================================= */

  async function atualizarDados() {
    /*
     * Invalida a consulta ativa.
     *
     * O TanStack Query já dispara o novo carregamento,
     * portanto não precisamos fazer invalidate + refetch
     * manualmente e gerar duas requisições.
     */
    await queryClient.invalidateQueries({
      queryKey:
        CHAVE_CADASTRO_RECEITAS,

      refetchType:
        "active",
    });
  }


  /* =======================================================
     SALVAR
  ======================================================= */

  const salvarMutation =
    useMutation({
      mutationFn:
        salvarCadastroReceita,

      onSuccess:
        atualizarDados,
    });


  /* =======================================================
     ALTERAR STATUS
  ======================================================= */

  const alterarStatusMutation =
    useMutation({
      mutationFn:
        alterarStatusCadastroReceita,

      onSuccess:
        atualizarDados,
    });


  /* =======================================================
     RETORNO
  ======================================================= */

  return {
    receitas:
      cadastroQuery.data?.receitas ??
      [],

    fornecedores:
      cadastroQuery.data?.fornecedores ??
      [],

    carregando:
      cadastroQuery.isLoading,

    atualizando:
      cadastroQuery.isFetching,

    erro:
      cadastroQuery.error?.message ??
      "",

    salvando:
      salvarMutation.isPending,

    alterandoStatus:
      alterarStatusMutation.isPending,

    salvarReceita:
      salvarMutation.mutateAsync,

    alterarStatusReceita:
      alterarStatusMutation.mutateAsync,
  };
}