import { createServerFn } from "@tanstack/react-start";

import { buscarPedidosParaTela } from "./omie/consultaPedidos";
import { executarSincronizacaoPedidos } from "./omie/sincronizacaoPedidos";
import { validarEntradaSessao, validarSessao } from "./omie/supabaseServidor";

/* =========================================================
   FUNÇÕES DE SERVIDOR DOS PEDIDOS OMIE

   O código que roda aqui fica na pasta omie/ e é SOMENTE
   SERVIDOR (chave secreta do Supabase e credenciais do Omie).
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

/*
 * Sincronização manual: esta é a função que realmente conversa com o Omie.
 */
export const sincronizarPedidosOmie = createServerFn({
  method: "POST",
})
  .validator(validarEntradaSessao)
  .handler(async ({ data }) => {
    /* Impede chamada anônima. */
    await validarSessao(data.accessToken);

    return await executarSincronizacaoPedidos();
  });
