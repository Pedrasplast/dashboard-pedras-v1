/* =========================================================
   API DO OMIE
   ---------------------------------------------------------
   SOMENTE SERVIDOR. Chamada genérica, paginação e as
   consultas de pedidos, clientes, vendedores e etapas.
========================================================= */

const URL_PEDIDOS = "https://app.omie.com.br/api/v1/produtos/pedido/";

const URL_CLIENTES = "https://app.omie.com.br/api/v1/geral/clientes/";

const URL_VENDEDORES = "https://app.omie.com.br/api/v1/geral/vendedores/";

const URL_ETAPAS = "https://app.omie.com.br/api/v1/produtos/etapafat/";

const TEMPO_LIMITE_MS = 30000;

async function chamarOmie({ url, call, param, appKey, appSecret }) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, TEMPO_LIMITE_MS);

  try {
    const resposta = await fetch(url, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      signal: controller.signal,

      body: JSON.stringify({
        call,

        app_key: appKey,

        app_secret: appSecret,

        param: [param],
      }),
    });

    const texto = await resposta.text();

    let dados;

    try {
      dados = texto ? JSON.parse(texto) : {};
    } catch {
      throw new Error("O Omie retornou uma resposta inválida.");
    }

    if (!resposta.ok || dados?.faultstring || dados?.faultcode) {
      const mensagem =
        dados?.faultstring ||
        dados?.description ||
        dados?.message ||
        `Erro HTTP ${resposta.status}`;

      throw new Error(`Erro Omie: ${mensagem}`);
    }

    return dados;
  } catch (erro) {
    if (erro?.name === "AbortError") {
      throw new Error("A consulta ao Omie excedeu o tempo limite.");
    }

    throw erro;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Chama `call` página a página até `total_de_paginas`, entregando cada
 * resposta a `aoReceberPagina`. `pagina` vai sempre na frente dos parâmetros.
 */
async function percorrerPaginasOmie({ url, call, param, appKey, appSecret, aoReceberPagina }) {
  let pagina = 1;

  let totalPaginas = 1;

  do {
    const resposta = await chamarOmie({
      url,

      call,

      appKey,

      appSecret,

      param: {
        pagina,

        ...param,
      },
    });

    aoReceberPagina(resposta);

    totalPaginas = Number(resposta?.total_de_paginas ?? 1);

    pagina += 1;
  } while (pagina <= totalPaginas);
}

export async function listarPedidosOmie({ appKey, appSecret }) {
  const pedidos = [];

  await percorrerPaginasOmie({
    url: URL_PEDIDOS,

    call: "ListarPedidos",

    appKey,

    appSecret,

    param: {
      registros_por_pagina: 100,

      apenas_importado_api: "N",

      apenas_resumo: "N",
    },

    aoReceberPagina: (resposta) => {
      const registros = Array.isArray(resposta?.pedido_venda_produto)
        ? resposta.pedido_venda_produto
        : [];

      pedidos.push(...registros);
    },
  });

  return pedidos;
}

/** Nome dos clientes dos pedidos, consultados em lotes de 50 códigos. */
export async function buscarClientes({ pedidos, appKey, appSecret }) {
  const codigos = [
    ...new Set(
      pedidos
        .map((pedido) => Number(pedido?.cabecalho?.codigo_cliente))
        .filter((codigo) => Number.isFinite(codigo) && codigo > 0),
    ),
  ];

  const clientes = new Map();

  const TAMANHO_LOTE = 50;

  for (let indice = 0; indice < codigos.length; indice += TAMANHO_LOTE) {
    const lote = codigos.slice(indice, indice + TAMANHO_LOTE);

    const resposta = await chamarOmie({
      url: URL_CLIENTES,

      call: "ListarClientesResumido",

      appKey,

      appSecret,

      param: {
        pagina: 1,

        registros_por_pagina: 50,

        apenas_importado_api: "N",

        clientesPorCodigo: lote.map((codigo) => ({
          codigo_cliente_omie: codigo,
        })),
      },
    });

    const registros = Array.isArray(resposta?.clientes_cadastro_resumido)
      ? resposta.clientes_cadastro_resumido
      : [];

    for (const cliente of registros) {
      const codigo = Number(cliente?.codigo_cliente);

      if (!Number.isFinite(codigo)) {
        continue;
      }

      const nome =
        cliente?.razao_social?.trim() || cliente?.nome_fantasia?.trim() || `Cliente ${codigo}`;

      clientes.set(codigo, nome);
    }
  }

  return clientes;
}

export async function buscarVendedores({ appKey, appSecret }) {
  const vendedores = new Map();

  await percorrerPaginasOmie({
    url: URL_VENDEDORES,

    call: "ListarVendedores",

    appKey,

    appSecret,

    param: {
      registros_por_pagina: 100,

      apenas_importado_api: "N",
    },

    aoReceberPagina: (resposta) => {
      const registros = Array.isArray(resposta?.cadastro) ? resposta.cadastro : [];

      for (const vendedor of registros) {
        const codigo = Number(vendedor?.codigo);

        if (!Number.isFinite(codigo)) {
          continue;
        }

        vendedores.set(codigo, vendedor?.nome?.trim() || `Vendedor ${codigo}`);
      }
    },
  });

  return vendedores;
}

export async function buscarEtapas({ appKey, appSecret }) {
  const etapas = new Map();

  await percorrerPaginasOmie({
    url: URL_ETAPAS,

    call: "ListarEtapasFaturamento",

    appKey,

    appSecret,

    param: {
      registros_por_pagina: 100,
    },

    aoReceberPagina: (resposta) => {
      const cadastros = Array.isArray(resposta?.cadastros) ? resposta.cadastros : [];

      for (const cadastro of cadastros) {
        const lista = Array.isArray(cadastro?.etapas) ? cadastro.etapas : [];

        for (const etapa of lista) {
          if (!etapa?.cCodigo) {
            continue;
          }

          etapas.set(
            String(etapa.cCodigo),

            etapa?.cDescricao?.trim() || etapa?.cDescrPadrao?.trim() || `Etapa ${etapa.cCodigo}`,
          );
        }
      }
    },
  });

  return etapas;
}
