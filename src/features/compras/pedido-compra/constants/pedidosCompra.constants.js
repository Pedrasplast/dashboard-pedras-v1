export const PEDIDOS_COMPRA_POR_PAGINA = 8;

export const INTERVALO_LEITURA_COMPRAS =
  20 * 1000;

export const QUERY_KEY_PEDIDOS_COMPRA = [
  "compras-documentos-front",
];

export const TIPOS_DOCUMENTO =
  Object.freeze({
    TODOS: "todos",
    PEDIDO: "PEDIDO",
    REQUISICAO: "REQUISICAO",
  });

export const SITUACOES_RECEBIMENTO =
  Object.freeze({
    TODOS: "todos",

    EM_ABERTO: "EM_ABERTO",

    EM_ATRASO: "EM_ATRASO",

    RECEBIDO_PARCIALMENTE:
      "RECEBIDO_PARCIALMENTE",

    RECEBIDO: "RECEBIDO",
  });