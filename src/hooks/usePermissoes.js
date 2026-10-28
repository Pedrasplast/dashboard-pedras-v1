import { useCallback, useEffect, useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { useAuthContext } from "@/lib/auth-context";
import { buscarPermissoesUsuario } from "@/lib/permissoesService";

const SEM_PERMISSOES = {
  telas: new Set(),
  relatorios: new Set(),
};

/*
 * Permissões do usuário logado.
 *
 * Navbar, RotaProtegida, Home e Central de Relatórios usam este hook ao
 * mesmo tempo; o React Query faz uma única consulta e compartilha o
 * resultado. A cada 30 s, a próxima tela aberta confere de novo.
 */
export function usePermissoes() {
  const { user, isAdmin, loadingAuth, loadingPerfil } = useAuthContext();

  /*
   * ADMIN possui acesso total.
   * Não precisamos consultar permissões individuais.
   */
  const precisaConsultar = Boolean(!loadingAuth && !loadingPerfil && user && !isAdmin);

  const permissoesQuery = useQuery({
    queryKey: ["permissoes-usuario", user?.id],

    queryFn: () => buscarPermissoesUsuario(user.id),

    enabled: precisaConsultar,

    staleTime: 30 * 1000,

    refetchOnWindowFocus: false,

    retry: false,

    // Sets não passam pelo compartilhamento estrutural do React Query.
    structuralSharing: false,
  });

  useEffect(() => {
    if (permissoesQuery.error) {
      console.error("Erro ao carregar permissões:", permissoesQuery.error);
    }
  }, [permissoesQuery.error]);

  /*
   * Segurança:
   * em caso de erro, OPERADOR não recebe
   * acesso automaticamente.
   */
  const permissoes =
    precisaConsultar && permissoesQuery.data ? permissoesQuery.data : SEM_PERMISSOES;

  const loadingPermissoes =
    loadingAuth || loadingPerfil || (precisaConsultar && permissoesQuery.isPending);

  const podeAcessarTela = useCallback(
    (chave) => {
      if (!user) {
        return false;
      }

      if (isAdmin) {
        return true;
      }

      if (!chave) {
        return true;
      }

      return permissoes.telas.has(chave);
    },
    [user, isAdmin, permissoes],
  );

  const podeAcessarRelatorio = useCallback(
    (chave) => {
      if (!user) {
        return false;
      }

      if (isAdmin) {
        return true;
      }

      if (!chave) {
        return false;
      }

      return permissoes.relatorios.has(chave);
    },
    [user, isAdmin, permissoes],
  );

  const { refetch } = permissoesQuery;

  const recarregarPermissoes = useCallback(() => refetch(), [refetch]);

  return useMemo(
    () => ({
      permissoes,

      podeAcessarTela,
      podeAcessarRelatorio,

      loadingPermissoes,
      erroPermissoes: precisaConsultar ? permissoesQuery.error : null,

      recarregarPermissoes,
    }),
    [
      permissoes,
      podeAcessarTela,
      podeAcessarRelatorio,
      loadingPermissoes,
      precisaConsultar,
      permissoesQuery.error,
      recarregarPermissoes,
    ],
  );
}
