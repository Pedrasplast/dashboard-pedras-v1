import { useCallback, useEffect, useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { useContextoAuth } from "@/lib/ProvedorAuth";
import { buscarPermissoesUsuario } from "@/lib/permissoes.service";

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
  const { usuario, ehAdmin, carregandoAuth, carregandoPerfil } = useContextoAuth();

  /*
   * ADMIN possui acesso total.
   * Não precisamos consultar permissões individuais.
   */
  const precisaConsultar = Boolean(!carregandoAuth && !carregandoPerfil && usuario && !ehAdmin);

  const permissoesQuery = useQuery({
    queryKey: ["permissoes-usuario", usuario?.id],

    queryFn: () => buscarPermissoesUsuario(usuario.id),

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

  const carregandoPermissoes =
    carregandoAuth || carregandoPerfil || (precisaConsultar && permissoesQuery.isPending);

  const podeAcessarTela = useCallback(
    (chave) => {
      if (!usuario) {
        return false;
      }

      if (ehAdmin) {
        return true;
      }

      if (!chave) {
        return true;
      }

      return permissoes.telas.has(chave);
    },
    [usuario, ehAdmin, permissoes],
  );

  const podeAcessarRelatorio = useCallback(
    (chave) => {
      if (!usuario) {
        return false;
      }

      if (ehAdmin) {
        return true;
      }

      if (!chave) {
        return false;
      }

      return permissoes.relatorios.has(chave);
    },
    [usuario, ehAdmin, permissoes],
  );

  const { refetch } = permissoesQuery;

  const recarregarPermissoes = useCallback(() => refetch(), [refetch]);

  return useMemo(
    () => ({
      permissoes,

      podeAcessarTela,
      podeAcessarRelatorio,

      carregandoPermissoes,
      erroPermissoes: precisaConsultar ? permissoesQuery.error : null,

      recarregarPermissoes,
    }),
    [
      permissoes,
      podeAcessarTela,
      podeAcessarRelatorio,
      carregandoPermissoes,
      precisaConsultar,
      permissoesQuery.error,
      recarregarPermissoes,
    ],
  );
}
