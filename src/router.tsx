import {
  QueryClient,
} from "@tanstack/react-query";

import {
  createRouter,
} from "@tanstack/react-router";

import {
  routeTree,
} from "./routeTree.gen";


/*
 * Inicializa uma única vez o sistema
 * global de atualização automática.
 */
import "./lib/atualizadorSistema";


export const getRouter =
  () => {
    const queryClient =
      new QueryClient();


    const router =
      createRouter({
        routeTree,

        context: {
          queryClient,
        },

        scrollRestoration:
          true,

        defaultPreloadStaleTime:
          0,
      });


    return router;
  };