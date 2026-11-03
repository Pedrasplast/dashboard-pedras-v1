/* =========================================================
   CONSULTA DOS PEDIDOS PARA A TELA
   ---------------------------------------------------------
   SOMENTE SERVIDOR. Não consulta o Omie: lê apenas o
   Supabase, com a sessão do usuário.
========================================================= */

import { carregarMapaNumeroPedidoExibicao } from "../numeroPedidoExibicao";
import { mapearPedidoParaTela } from "./pedidosOmie.regras";
import { criarClienteSupabaseUsuario } from "./supabaseServidor";

/*
 * Numeração visual de pedidos parciais: usa todo o histórico para que
 * /1, /2... continue estável mesmo quando o pedido original deixar de
 * estar ativo.
 */
async function carregarNumeracaoVisual(supabase) {
  try {
    return await carregarMapaNumeroPedidoExibicao(supabase);
  } catch (error) {
    throw new Error(`Erro ao calcular a numeração visual dos pedidos: ${error?.message}`);
  }
}

/**
 * `comNumeracao: false` devolve `pedidoExibicao` igual ao número do Omie, sem
 * ler o histórico (usado pela Home, que só conta pedidos).
 */
export async function buscarPedidosParaTela(accessToken, { comNumeracao = true } = {}) {
  const supabase = criarClienteSupabaseUsuario(accessToken);

  const [resultadoPedidos, mapaNumeroPedidoExibicao, resultadoSincronizacao] = await Promise.all([
    supabase
      .from("pedidos_omie")
      .select(
        `
                  chave_item,
                  codigo_pedido_omie,
                  numero_pedido,
                  cliente,
                  data_pedido,
                  previsao,
                  codigo_produto,
                  produto,
                  quantidade,
                  unidade,
                  vendedor,
                  valor,
                  codigo_etapa,
                  status
                `,
      )
      .eq("ativo", true)
      .order("previsao", {
        ascending: true,

        nullsFirst: false,
      })
      .order("numero_pedido", {
        ascending: true,
      }),

    comNumeracao ? carregarNumeracaoVisual(supabase) : new Map(),

    supabase
      .from("sincronizacao_omie")
      .select(
        `
                  ultima_sincronizacao,
                  status,
                  quantidade_pedidos,
                  quantidade_itens,
                  duracao_ms,
                  mensagem
                `,
      )
      .eq("id", 1)
      .maybeSingle(),
  ]);

  if (resultadoPedidos.error) {
    throw new Error(`Erro ao consultar pedidos: ${resultadoPedidos.error.message}`);
  }

  if (resultadoSincronizacao.error) {
    throw new Error(`Erro ao consultar sincronização: ${resultadoSincronizacao.error.message}`);
  }

  const registros = Array.isArray(resultadoPedidos.data) ? resultadoPedidos.data : [];

  const pedidos = registros.map((registro) =>
    mapearPedidoParaTela(registro, mapaNumeroPedidoExibicao),
  );

  const sincronizacao = resultadoSincronizacao.data;

  return {
    pedidos,

    quantidadePedidos: sincronizacao?.quantidade_pedidos ?? 0,

    quantidadeLinhas: pedidos.length,

    atualizadoEm: sincronizacao?.ultima_sincronizacao ?? null,

    statusSincronizacao: sincronizacao?.status ?? "aguardando",

    mensagemSincronizacao: sincronizacao?.mensagem ?? "",
  };
}
