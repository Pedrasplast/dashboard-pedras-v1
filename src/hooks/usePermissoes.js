import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuthContext } from "@/lib/auth-context";
import { supabase } from "@/lib/supabaseClient";

export function usePermissoes() {
  const {
    user,
    isAdmin,
    loadingAuth,
    loadingPerfil,
  } = useAuthContext();

  const [telasPermitidas, setTelasPermitidas] =
    useState(new Set());

  const [relatoriosPermitidos, setRelatoriosPermitidos] =
    useState(new Set());

  const [loadingPermissoes, setLoadingPermissoes] =
    useState(true);

  const [erroPermissoes, setErroPermissoes] =
    useState(null);

  const carregarPermissoes =
    useCallback(async () => {
      if (loadingAuth || loadingPerfil) {
        return;
      }

      if (!user) {
        setTelasPermitidas(new Set());
        setRelatoriosPermitidos(new Set());
        setErroPermissoes(null);
        setLoadingPermissoes(false);

        return;
      }

      /*
       * ADMIN possui acesso total.
       * Não precisamos consultar permissões individuais.
       */
      if (isAdmin) {
        setTelasPermitidas(new Set());
        setRelatoriosPermitidos(new Set());
        setErroPermissoes(null);
        setLoadingPermissoes(false);

        return;
      }

      try {
        setLoadingPermissoes(true);
        setErroPermissoes(null);

        const [
          respostaTelas,
          respostaPermissoesTelas,
          respostaRelatorios,
          respostaPermissoesRelatorios,
        ] = await Promise.all([
          supabase
            .from("telas_sistema")
            .select("id, chave, ativo")
            .eq("ativo", true),

          supabase
            .from("usuario_permissoes")
            .select(
              "tela_id, permitido"
            )
            .eq(
              "usuario_id",
              user.id
            ),

          supabase
            .from("relatorios_sistema")
            .select("id, chave, ativo")
            .eq("ativo", true),

          supabase
            .from(
              "usuario_relatorio_permissoes"
            )
            .select(
              "relatorio_id, permitido"
            )
            .eq(
              "usuario_id",
              user.id
            ),
        ]);

        if (respostaTelas.error) {
          throw respostaTelas.error;
        }

        if (respostaPermissoesTelas.error) {
          throw respostaPermissoesTelas.error;
        }

        if (respostaRelatorios.error) {
          throw respostaRelatorios.error;
        }

        if (
          respostaPermissoesRelatorios.error
        ) {
          throw respostaPermissoesRelatorios.error;
        }

        /* =============================================
           TELAS
        ============================================= */

        const telasPorId = new Map();

        for (
          const tela of
          respostaTelas.data || []
        ) {
          telasPorId.set(
            String(tela.id),
            tela.chave
          );
        }

        const novasTelasPermitidas =
          new Set();

        for (
          const permissao of
          respostaPermissoesTelas.data || []
        ) {
          if (!permissao.permitido) {
            continue;
          }

          const chave =
            telasPorId.get(
              String(
                permissao.tela_id
              )
            );

          if (chave) {
            novasTelasPermitidas.add(
              chave
            );
          }
        }

        /* =============================================
           RELATÓRIOS
        ============================================= */

        const relatoriosPorId =
          new Map();

        for (
          const relatorio of
          respostaRelatorios.data || []
        ) {
          relatoriosPorId.set(
            String(relatorio.id),
            relatorio.chave
          );
        }

        const novosRelatoriosPermitidos =
          new Set();

        for (
          const permissao of
          respostaPermissoesRelatorios.data ||
          []
        ) {
          if (!permissao.permitido) {
            continue;
          }

          const chave =
            relatoriosPorId.get(
              String(
                permissao.relatorio_id
              )
            );

          if (chave) {
            novosRelatoriosPermitidos.add(
              chave
            );
          }
        }

        setTelasPermitidas(
          novasTelasPermitidas
        );

        setRelatoriosPermitidos(
          novosRelatoriosPermitidos
        );
      } catch (error) {
        console.error(
          "Erro ao carregar permissões:",
          error
        );

        /*
         * Segurança:
         * em caso de erro, OPERADOR não recebe
         * acesso automaticamente.
         */
        setTelasPermitidas(new Set());
        setRelatoriosPermitidos(new Set());

        setErroPermissoes(error);
      } finally {
        setLoadingPermissoes(false);
      }
    }, [
      user,
      isAdmin,
      loadingAuth,
      loadingPerfil,
    ]);

  useEffect(() => {
    carregarPermissoes();
  }, [carregarPermissoes]);

  const podeAcessarTela =
    useCallback(
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

        return telasPermitidas.has(
          chave
        );
      },
      [
        user,
        isAdmin,
        telasPermitidas,
      ]
    );

  const podeAcessarRelatorio =
    useCallback(
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

        return relatoriosPermitidos.has(
          chave
        );
      },
      [
        user,
        isAdmin,
        relatoriosPermitidos,
      ]
    );

  const permissoes = useMemo(
    () => ({
      telas: telasPermitidas,
      relatorios:
        relatoriosPermitidos,
    }),
    [
      telasPermitidas,
      relatoriosPermitidos,
    ]
  );

  return {
    permissoes,

    podeAcessarTela,
    podeAcessarRelatorio,

    loadingPermissoes,
    erroPermissoes,

    recarregarPermissoes:
      carregarPermissoes,
  };
}