import { supabase } from "@/lib/supabaseClient";
import { carregarMapaNumeroPedidoExibicao } from "../numeroPedidoExibicao";

export async function buscarPedidosDiretoSupabase() {
  const [resultadoPedidos, mapaNumeroPedidoExibicao, resultadoSincronizacao] =
    await Promise.all([
      supabase
        .from("pedidos_omie")
        .select(`
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
        `)
        .eq("ativo", true)
        .order("previsao", {
          ascending: true,
          nullsFirst: false,
        })
        .order("numero_pedido", {
          ascending: true,
        }),

      carregarMapaNumeroPedidoExibicao(supabase),

      supabase
        .from("sincronizacao_omie")
        .select(`
          ultima_sincronizacao,
          status,
          quantidade_pedidos,
          quantidade_itens,
          duracao_ms,
          mensagem
        `)
        .eq("id", 1)
        .maybeSingle(),
    ]);

  if (resultadoPedidos.error) {
    throw new Error(
      `Erro ao consultar pedidos: ${resultadoPedidos.error.message}`,
    );
  }

  if (resultadoSincronizacao.error) {
    throw new Error(
      `Erro ao consultar sincronização: ${resultadoSincronizacao.error.message}`,
    );
  }

  const registros = Array.isArray(resultadoPedidos.data)
    ? resultadoPedidos.data
    : [];

  const pedidos = registros.map((registro) => ({
    id: registro.chave_item,
    codigoPedido: registro.codigo_pedido_omie,
    codigoPedidoOmie: registro.codigo_pedido_omie,
    codigo_pedido_omie: registro.codigo_pedido_omie,
    pedido: registro.numero_pedido,
    numero_pedido: registro.numero_pedido,
    pedidoExibicao:
      mapaNumeroPedidoExibicao.get(Number(registro.codigo_pedido_omie)) ||
      registro.numero_pedido,
    cliente: registro.cliente || "-",
    data: registro.data_pedido || null,
    previsao: registro.previsao || null,
    codigoProduto: registro.codigo_produto || "",
    produto: registro.produto || "",
    quantidade: Number(registro.quantidade ?? 0),
    unidade: registro.unidade || "",
    vendedor: registro.vendedor || "-",
    valor: Number(registro.valor ?? 0),
    codigoEtapa: registro.codigo_etapa || "",
    status: registro.status || "Pedido",
  }));

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

export async function buscarNotificacoesPendentes() {
  const { data, error } = await supabase.rpc(
    "listar_notificacoes_pedidos_nao_lidas",
    { p_limite: 100 },
  );

  if (error) throw error;

  return Array.isArray(data) ? data : [];
}

export async function marcarPedidoComoVisualizado(codigoPedido) {
  const { data, error } = await supabase.rpc(
    "marcar_pedido_como_visualizado",
    { p_codigo_pedido_omie: codigoPedido },
  );

  if (error) throw error;
  return data === true;
}

export function assinarNotificacoesPedidos({ onChange }) {
  const canal = supabase
    .channel("pedidos-page-notificacoes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "pedidos_notificacoes",
      },
      onChange,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(canal);
  };
}
