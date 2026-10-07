/* =========================================================
   ESTOQUE - CONSTANTES
========================================================= */


/* =========================================================
   PAGINAÇÃO DAS CONSULTAS AO SUPABASE
========================================================= */

export const TAMANHO_PAGINA_ESTOQUE =
  500;


/* =========================================================
   PAGINAÇÃO DA TABELA
========================================================= */

export const ITENS_POR_PAGINA_ESTOQUE =
  20;


/* =========================================================
   LOCAL PADRÃO

   MATRIZ / M.P.PROD.
========================================================= */

export const CODIGO_LOCAL_ESTOQUE_MATRIZ =
  "2333946061";


/* =========================================================
   TIPO DE ITEM OMIE

   04 = Produto acabado
========================================================= */

export const TIPO_ITEM_PRODUTO_ACABADO =
  "04";


/* =========================================================
   STATUS DE PEDIDO ABERTO
========================================================= */

export const STATUS_PEDIDO_ABERTO =
  "Pedido";


/* =========================================================
   FILTRO DE TODOS OS LOCAIS
========================================================= */

export const LOCAL_TODOS =
  "todos";


/* =========================================================
   SITUAÇÕES DO ESTOQUE
========================================================= */

export const SITUACAO_ESTOQUE =
  Object.freeze({
    TODOS:
      "todos",

    COM_SALDO:
      "com_saldo",

    SEM_SALDO:
      "sem_saldo",
  });


/* =========================================================
   INTERVALOS DO REACT QUERY
========================================================= */

export const INTERVALO_ATUALIZACAO_ESTOQUE =
  30 * 1000;


export const STALE_TIME_ESTOQUE =
  15 * 1000;


export const STALE_TIME_LOCAIS_ESTOQUE =
  5 * 60 * 1000;


/* =========================================================
   QUERY KEYS
========================================================= */

export const ESTOQUE_QUERY_KEYS =
  Object.freeze({
    LOCAIS:
      [
        "estoque-locais-ativos",
      ],

    PEDIDOS_ABERTOS:
      [
        "estoque-pedidos-abertos",
      ],

    STATUS_SINCRONIZACAO:
      [
        "estoque-status-sincronizacao",
      ],

    PRODUTOS:
      (
        codigoLocalEstoque,
      ) => [
        "estoque-produtos-acabados",
        codigoLocalEstoque,
      ],
  });