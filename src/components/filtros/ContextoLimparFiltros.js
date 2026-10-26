import { createContext, useContext, useEffect } from "react";

/* =========================================================
   BOTÃO "LIMPAR" PADRÃO DOS RELATÓRIOS

   Dentro do layout padrão dos relatórios (LayoutRelatorio),
   o componente de filtros não desenha um botão próprio de
   limpar: ele entrega a ação ao layout, que mostra o botão
   "Limpar" padrão junto de PDF/Excel. Fora dos relatórios
   (ex.: dashboards) não há contexto e nada muda.
========================================================= */

export const ContextoLimparFiltros = createContext(null);

/** true quando os filtros estão dentro do layout padrão dos relatórios. */
export function useLimparNoLayout() {
  return useContext(ContextoLimparFiltros) !== null;
}

/** Registra a ação de limpar no layout (quando houver). */
export function useRegistrarLimpar(limpar, possuiFiltroAtivo) {
  const registrar = useContext(ContextoLimparFiltros);

  useEffect(() => {
    if (!registrar) return undefined;
    registrar({ limpar, possuiFiltroAtivo: Boolean(possuiFiltroAtivo) });
    return () => registrar(null);
  }, [registrar, limpar, possuiFiltroAtivo]);
}
