import { QueryClient } from "@tanstack/react-query";

import { createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

/*
 * Inicializa uma única vez o sistema
 * global de atualização automática.
 */
import "./lib/atualizadorSistema";

/* =========================================================
   QUERY CLIENT
========================================================= */

/*
 * No navegador mantemos uma única instância do QueryClient.
 *
 * Isso evita perder o cache do React Query caso o router seja
 * recriado durante a navegação da aplicação.
 *
 * No servidor continuamos criando uma instância isolada por
 * execução para não compartilhar cache entre requisições.
 */
let queryClientBrowser: QueryClient | undefined;

function obterQueryClient() {
  if (typeof window === "undefined") {
    return new QueryClient();
  }

  if (!queryClientBrowser) {
    queryClientBrowser = new QueryClient();
  }

  return queryClientBrowser;
}

/* =========================================================
   ROUTER
========================================================= */

export const getRouter = () => {
  const queryClient = obterQueryClient();

  const router = createRouter({
    routeTree,

    context: {
      queryClient,
    },

    scrollRestoration: true,

    defaultPreloadStaleTime: 0,
  });

  return router;
};
