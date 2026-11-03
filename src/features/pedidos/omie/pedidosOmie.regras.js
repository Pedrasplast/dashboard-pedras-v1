/* =========================================================
   REGRAS DOS PEDIDOS DO OMIE
   ---------------------------------------------------------
   Conversão pura: linha da tabela pedidos_omie → pedido da
   tela. A gravação da tabela é feita pela Edge Function
   sincronizar-pedidos-omie (Supabase), não por este projeto.
========================================================= */

/** "AAAA-MM-DD…" → "DD/MM/AAAA"; vazio → ""; outro formato volta como está. */
export function converterDataIsoParaBrasileira(valor) {
  if (!valor) {
    return "";
  }

  const texto = String(valor);

  const partes = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!partes) {
    return texto;
  }

  return `${partes[3]}/${partes[2]}/${partes[1]}`;
}

/** Linha da tabela pedidos_omie no formato usado pela tela de pedidos. */
export function mapearPedidoParaTela(registro, mapaNumeroPedidoExibicao) {
  return {
    id: registro.chave_item,

    codigoPedido: registro.codigo_pedido_omie,

    pedido: registro.numero_pedido,

    pedidoExibicao:
      mapaNumeroPedidoExibicao.get(Number(registro.codigo_pedido_omie)) || registro.numero_pedido,

    cliente: registro.cliente || "-",

    data: converterDataIsoParaBrasileira(registro.data_pedido),

    previsao: converterDataIsoParaBrasileira(registro.previsao),

    codigoProduto: registro.codigo_produto || "",

    produto: registro.produto || "",

    quantidade: Number(registro.quantidade ?? 0),

    unidade: registro.unidade || "",

    vendedor: registro.vendedor || "-",

    valor: Number(registro.valor ?? 0),

    codigoEtapa: registro.codigo_etapa || "",

    status: registro.status || "Pedido",
  };
}
