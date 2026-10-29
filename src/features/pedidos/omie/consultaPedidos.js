/* =========================================================
   CONSULTA DOS PEDIDOS PARA A TELA
   ---------------------------------------------------------
   SOMENTE SERVIDOR. Não consulta o Omie: lê apenas o
   Supabase, com a sessão do usuário.
========================================================= */

import { criarMapaNumeroPedidoExibicao } from "../numeroPedidoExibicao";
import { mapearPedidoParaTela } from "./pedidosOmie.regras";
import { criarClienteSupabaseUsuario } from "./supabaseServidor";

/*
 * Numeração visual de pedidos parciais: consulta todo o histórico em
 * páginas para que /1, /2... continue estável mesmo quando o pedido
 * original deixar de estar ativo.
 */
async function buscarRegistrosNumeracaoPedidos(supabase) {
  const registros = [];

  const tamanhoPagina = 1000;

  let inicio = 0;

  while (true) {
    const { data, error } = await supabase
      .from("pedidos_omie")
      .select(
        `
            codigo_pedido_omie,
            numero_pedido,
            criado_em
          `,
      )
      .order("criado_em", {
        ascending: true,
      })
      .order("codigo_pedido_omie", {
        ascending: true,
      })
      .range(inicio, inicio + tamanhoPagina - 1);

    if (error) {
      throw new Error(`Erro ao calcular a numeração visual dos pedidos: ${error.message}`);
    }

    const pagina = Array.isArray(data) ? data : [];

    registros.push(...pagina);

    if (pagina.length < tamanhoPagina) {
      break;
    }

    inicio += tamanhoPagina;
  }

  return registros;
}

export async function buscarPedidosParaTela(accessToken) {
  const supabase = criarClienteSupabaseUsuario(accessToken);

  const [resultadoPedidos, registrosNumeracaoPedidos, resultadoSincronizacao] = await Promise.all([
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

    buscarRegistrosNumeracaoPedidos(supabase),

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

  const mapaNumeroPedidoExibicao = criarMapaNumeroPedidoExibicao(registrosNumeracaoPedidos);

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
