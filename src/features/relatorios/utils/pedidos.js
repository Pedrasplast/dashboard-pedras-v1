/* =========================================================
   RELATÓRIOS - NÚMERO DO PEDIDO
========================================================= */

/** Número que o usuário vê (o de exibição, quando existir). */
export function obterNumeroPedidoVisual(item) {
  return String(
    item?.pedidoExibicao ??
      item?.pedido_exibicao ??
      item?.pedido ??
      item?.numero_pedido ??
      item?.codigoPedido ??
      item?.codigo_pedido ??
      "",
  ).trim();
}

/** Número original do pedido no Omie. */
export function obterNumeroPedidoOriginal(item) {
  return String(
    item?.pedidoOriginal ??
      item?.numero_pedido ??
      item?.pedido ??
      item?.codigoPedido ??
      item?.codigo_pedido ??
      "",
  ).trim();
}
