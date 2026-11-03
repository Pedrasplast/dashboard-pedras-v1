import { createServerFn } from "@tanstack/react-start";

import { buscarPedidosParaTela } from "./omie/consultaPedidos";
import { validarEntradaSessao, validarSessao } from "./omie/supabaseServidor";

/* =========================================================
   FUNÇÕES DE SERVIDOR DOS PEDIDOS OMIE

   O código que roda aqui fica na pasta omie/ e é SOMENTE
   SERVIDOR. A sincronização com o Omie é feita pelas Edge
   Functions do Supabase (sincronizar-pedidos-omie e
   reconciliar-status-pedidos-omie), agendadas no pg_cron.
========================================================= */

/*
 * Pedidos para a tela. IMPORTANTE: não consulta o Omie, apenas o Supabase.
 */
export const buscarPedidosOmie = createServerFn({
  method: "POST",
})
  .validator(validarEntradaSessao)
  .handler(async ({ data }) => {
    await validarSessao(data.accessToken);

    return buscarPedidosParaTela(data.accessToken);
  });
