/* =========================================================
   RELATÓRIOS DE PEDIDOS
========================================================= */


/* =========================================================
   NORMALIZAR TEXTO
========================================================= */

function normalizarTexto(valor) {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}


/* =========================================================
   NÚMERO
========================================================= */

function converterNumero(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return 0;
  }

  if (typeof valor === "number") {
    return Number.isFinite(valor)
      ? valor
      : 0;
  }

  let texto = String(valor)
    .trim()
    .replace(/\s/g, "");

  if (
    texto.includes(",") &&
    texto.includes(".")
  ) {
    texto = texto
      .replace(/\./g, "")
      .replace(",", ".");
  } else {
    texto = texto.replace(",", ".");
  }

  const numero = Number(texto);

  return Number.isFinite(numero)
    ? numero
    : 0;
}


/* =========================================================
   NORMALIZAR DATA

   Retorna:
   AAAA-MM-DD
========================================================= */

export function normalizarDataPedido(valor) {
  if (!valor) {
    return null;
  }

  const texto =
    String(valor).trim();


  /* ISO */

  if (
    /^\d{4}-\d{2}-\d{2}/.test(texto)
  ) {
    return texto.slice(0, 10);
  }


  /* DD/MM/AAAA */

  const formatoBr =
    texto.match(
      /^(\d{2})\/(\d{2})\/(\d{4})/,
    );

  if (formatoBr) {
    return (
      `${formatoBr[3]}-` +
      `${formatoBr[2]}-` +
      `${formatoBr[1]}`
    );
  }


  /* OUTROS */

  const data =
    new Date(texto);

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return null;
  }

  const ano =
    data.getFullYear();

  const mes =
    String(
      data.getMonth() + 1,
    ).padStart(2, "0");

  const dia =
    String(
      data.getDate(),
    ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}


/* =========================================================
   DATA USADA NO FILTRO DE PEDIDOS

   IMPORTANTE:
   O período utiliza a PREVISÃO DE FATURAMENTO.
========================================================= */

export function obterDataPedidoRelatorio(item) {
  return normalizarDataPedido(
    item?.previsao ??
      item?.data_previsao ??
      item?.previsao_faturamento,
  );
}


/* =========================================================
   DATA DE HOJE
========================================================= */

function obterHojeIso() {
  const hoje =
    new Date();

  const ano =
    hoje.getFullYear();

  const mes =
    String(
      hoje.getMonth() + 1,
    ).padStart(2, "0");

  const dia =
    String(
      hoje.getDate(),
    ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}


/* =========================================================
   DIAS DE ATRASO
========================================================= */

export function calcularDiasAtrasoPedido(previsao) {
  const dataIso =
    normalizarDataPedido(previsao);

  if (!dataIso) {
    return 0;
  }

  const hojeIso =
    obterHojeIso();

  if (
    dataIso >= hojeIso
  ) {
    return 0;
  }


  const [
    anoPrevisao,
    mesPrevisao,
    diaPrevisao,
  ] =
    dataIso
      .split("-")
      .map(Number);


  const [
    anoHoje,
    mesHoje,
    diaHoje,
  ] =
    hojeIso
      .split("-")
      .map(Number);


  const dataPrevisao =
    new Date(
      anoPrevisao,
      mesPrevisao - 1,
      diaPrevisao,
    );


  const dataHoje =
    new Date(
      anoHoje,
      mesHoje - 1,
      diaHoje,
    );


  return Math.floor(
    (
      dataHoje.getTime() -
      dataPrevisao.getTime()
    ) /
      (
        1000 *
        60 *
        60 *
        24
      ),
  );
}


/* =========================================================
   PEDIDO ATRASADO
========================================================= */

export function pedidoEstaAtrasadoRelatorio(item) {
  const status =
    normalizarTexto(
      item?.status,
    );

  if (
    status !== "pedido"
  ) {
    return false;
  }

  return (
    calcularDiasAtrasoPedido(
      item?.previsao,
    ) > 0
  );
}


/* =========================================================
   CHAVE ÚNICA DO PEDIDO
========================================================= */

function obterChavePedido(item) {
  return String(
    item?.codigoPedido ??
      item?.codigo_pedido ??
      item?.pedido ??
      item?.numero_pedido ??
      item?.id ??
      "",
  );
}


/* =========================================================
   NORMALIZAR ITEM
========================================================= */

function normalizarItemPedido(item) {
  return {

    pedido:
      item?.pedido ??
      item?.numero_pedido ??
      item?.codigoPedido ??
      item?.codigo_pedido ??
      "-",


    cliente:
      item?.cliente ??
      item?.nome_cliente ??
      "-",


    data_pedido:
      normalizarDataPedido(
        item?.data ??
          item?.data_pedido,
      ),


    previsao:
      obterDataPedidoRelatorio(
        item,
      ),


    codigo_produto:
      item?.codigoProduto ??
      item?.codigo_produto ??
      item?.codigo ??
      "-",


    produto_pedido:
      item?.produto ??
      item?.descricao_produto ??
      item?.descricao ??
      "-",


    quantidade:
      converterNumero(
        item?.quantidade,
      ),


    unidade:
      item?.unidade ??
      item?.un ??
      "-",


    vendedor:
      item?.vendedor ??
      item?.nome_vendedor ??
      "-",


    status:
      item?.status ??
      "-",


    dias_atraso:
      calcularDiasAtrasoPedido(
        item?.previsao,
      ),
  };
}


/* =========================================================
   1. PEDIDOS DETALHADOS
========================================================= */

export function prepararPedidosDetalhados(dados = []) {
  if (
    !Array.isArray(dados)
  ) {
    return [];
  }

  return dados
    .map(
      normalizarItemPedido,
    )
    .sort(
      (a, b) => {

        const dataA =
          a.previsao ||
          "9999-12-31";

        const dataB =
          b.previsao ||
          "9999-12-31";


        if (
          dataA !== dataB
        ) {
          return dataA.localeCompare(
            dataB,
          );
        }


        return String(
          a.pedido,
        ).localeCompare(
          String(
            b.pedido,
          ),
          "pt-BR",
          {
            numeric: true,
          },
        );
      },
    );
}


/* =========================================================
   2. PEDIDOS ATRASADOS
========================================================= */

export function prepararPedidosAtrasados(dados = []) {
  if (
    !Array.isArray(dados)
  ) {
    return [];
  }

  return dados
    .filter(
      pedidoEstaAtrasadoRelatorio,
    )
    .map(
      normalizarItemPedido,
    )
    .sort(
      (a, b) => {

        if (
          b.dias_atraso !==
          a.dias_atraso
        ) {
          return (
            b.dias_atraso -
            a.dias_atraso
          );
        }


        return String(
          a.pedido,
        ).localeCompare(
          String(
            b.pedido,
          ),
          "pt-BR",
          {
            numeric: true,
          },
        );
      },
    );
}


/* =========================================================
   3. PRODUTOS AGRUPADOS POR CÓDIGO
========================================================= */

export function agruparPedidosPorCodigoProduto(dados = []) {
  if (!Array.isArray(dados)) {
    return [];
  }

  const mapa = new Map();

  for (const item of dados) {
    const codigo =
      String(
        item?.codigoProduto ??
          item?.codigo_produto ??
          item?.codigo ??
          "-",
      ).trim() || "-";

    const quantidade =
      converterNumero(
        item?.quantidade,
      );

    /*
     * Número visível do pedido.
     * Exemplo: 3037
     */
    const numeroPedido =
      String(
        item?.pedido ??
          item?.numero_pedido ??
          item?.codigoPedido ??
          item?.codigo_pedido ??
          "",
      ).trim();

    if (!mapa.has(codigo)) {
      mapa.set(
        codigo,
        {
          codigo_produto:
            codigo,

          produto_pedido:
            item?.produto ??
            item?.descricao_produto ??
            item?.descricao ??
            "-",

          unidade:
            item?.unidade ??
            item?.un ??
            "-",

          quantidade:
            0,

          _pedidos:
            new Set(),
        },
      );
    }

    const grupo =
      mapa.get(codigo);

    /*
     * Soma a quantidade total
     */
    grupo.quantidade +=
      quantidade;

    /*
     * Guarda os números dos pedidos,
     * sem duplicar.
     */
    if (numeroPedido) {
      grupo._pedidos.add(
        numeroPedido,
      );
    }
  }

  return [
    ...mapa.values(),
  ]
    .map(
      (grupo) => {
        /*
         * Ordena os pedidos numericamente.
         */
        const pedidosOrdenados =
          [
            ...grupo._pedidos,
          ].sort(
            (a, b) =>
              String(a).localeCompare(
                String(b),
                "pt-BR",
                {
                  numeric: true,
                },
              ),
          );

        return {
          codigo_produto:
            grupo.codigo_produto,

          produto_pedido:
            grupo.produto_pedido,

          unidade:
            grupo.unidade,

          quantidade:
            grupo.quantidade,

          /*
           * Quantos pedidos diferentes
           * precisam do produto.
           */
          pedidos:
            pedidosOrdenados.length,

          /*
           * Quais são esses pedidos.
           */
          pedidos_atendidos:
            pedidosOrdenados.join(
              ", ",
            ),
        };
      },
    )

    /*
     * Maior quantidade primeiro
     */
    .sort(
      (a, b) =>
        b.quantidade -
        a.quantidade,
    );
}

/* =========================================================
   4. PRODUTOS AGRUPADOS POR DATA DE FATURAMENTO
========================================================= */

export function agruparPedidosPorDataProduto(dados = []) {
  if (
    !Array.isArray(dados)
  ) {
    return [];
  }

  const mapa =
    new Map();


  for (
    const item of dados
  ) {

    const previsao =
      obterDataPedidoRelatorio(
        item,
      ) ||
      "Sem data";


    const codigo =
      String(
        item?.codigoProduto ??
          item?.codigo_produto ??
          item?.codigo ??
          "-",
      ).trim() || "-";


    const quantidade =
      converterNumero(
        item?.quantidade,
      );


    const chavePedido =
      obterChavePedido(
        item,
      );


    const chave =
      `${previsao}||${codigo}`;


    if (
      !mapa.has(chave)
    ) {

      mapa.set(
        chave,
        {
          previsao,

          codigo_produto:
            codigo,

          produto_pedido:
            item?.produto ??
            item?.descricao_produto ??
            item?.descricao ??
            "-",

          unidade:
            item?.unidade ??
            item?.un ??
            "-",

          quantidade:
            0,

          _pedidos:
            new Set(),
        },
      );
    }


    const grupo =
      mapa.get(chave);


    grupo.quantidade +=
      quantidade;


    if (
      chavePedido
    ) {
      grupo
        ._pedidos
        .add(
          chavePedido,
        );
    }
  }


  return [
    ...mapa.values(),
  ]
    .map(
      (grupo) => ({
        previsao:
          grupo.previsao,

        codigo_produto:
          grupo.codigo_produto,

        produto_pedido:
          grupo.produto_pedido,

        unidade:
          grupo.unidade,

        quantidade:
          grupo.quantidade,

        pedidos:
          grupo._pedidos.size,
      }),
    )
    .sort(
      (a, b) => {

        const dataA =
          a.previsao === "Sem data"
            ? "9999-12-31"
            : a.previsao;


        const dataB =
          b.previsao === "Sem data"
            ? "9999-12-31"
            : b.previsao;


        if (
          dataA !== dataB
        ) {
          return dataA.localeCompare(
            dataB,
          );
        }


        return String(
          a.codigo_produto,
        ).localeCompare(
          String(
            b.codigo_produto,
          ),
          "pt-BR",
          {
            numeric: true,
          },
        );
      },
    );
}