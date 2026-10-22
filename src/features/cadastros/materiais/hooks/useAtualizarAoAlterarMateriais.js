import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabaseClient";

/* =========================================================
   ATUALIZAR AO ALTERAR O CADASTRO DE MATERIAL

   Escuta (Supabase Realtime) a tabela materia_prima_materiais.
   Quando alguém habilita/desabilita um material — nesta aba,
   em outra aba ou em outro computador — a consulta da tela é
   invalidada e recarregada na hora, sem F5.

   Várias alterações seguidas viram uma única recarga.
========================================================= */

const ESPERA_AGRUPAR_MS = 400;

let sequencia = 0;

export function useAtualizarAoAlterarMateriais(queryKey) {
  const queryClient = useQueryClient();
  const chaveRef = useRef(queryKey);
  chaveRef.current = queryKey;

  useEffect(() => {
    let temporizador = null;

    sequencia += 1;

    const canal = supabase
      .channel(`cadastro-materiais-${sequencia}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "materia_prima_materiais",
        },
        () => {
          clearTimeout(temporizador);

          temporizador = setTimeout(() => {
            void queryClient.invalidateQueries({
              queryKey: chaveRef.current,
              refetchType: "all",
            });
          }, ESPERA_AGRUPAR_MS);
        },
      )
      .subscribe();

    return () => {
      clearTimeout(temporizador);
      supabase.removeChannel(canal);
    };
  }, [queryClient]);
}
