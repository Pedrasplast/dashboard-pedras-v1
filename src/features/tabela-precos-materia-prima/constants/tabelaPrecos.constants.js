
/* =========================================================
   TABELA DE PREÇOS — CONFIGURAÇÕES

   Configurações centralizadas do módulo.
========================================================= */

export const TABELA_PRECOS = Object.freeze({
  QUERY_KEY: ["compras", "tabela-precos-materia-prima"],

  VIEW_SUPABASE: "precos_materia_prima_omie",

  REGISTROS_POR_PAGINA: 500,

  STALE_TIME: 5 * 60 * 1000,

  REFRESH_INTERVAL: 10 * 60 * 1000,

  GC_TIME: 30 * 60 * 1000,
});

export const CAMPOS_TABELA_PRECOS = [
  "codigo_produto_omie",
  "codigo_produto",
  "descricao",
  "unidade",
  "ultima_compra",
  "ultimo_preco",
  "quantidade_ultima_compra",
  "quantidade_30d",
  "preco_medio_30d",
].join(",");

export const ORDENACOES_PRECOS = Object.freeze([
  {
    value: "descricao",
    label: "Material (A-Z)",
  },
  {
    value: "ultima_compra",
    label: "Compra mais recente",
  },
  {
    value: "maior_preco",
    label: "Maior preço",
  },
  {
    value: "menor_preco",
    label: "Menor preço",
  },
]);
