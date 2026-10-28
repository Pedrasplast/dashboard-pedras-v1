const TAMANHO_PAGINA_NUMERACAO = 1000;

export function obterTimestampCriacao(valor) {
  if (!valor) {
    return Number.POSITIVE_INFINITY;
  }

  const timestamp = new Date(valor).getTime();

  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY;
}

/*
 * Pedidos desdobrados no Omie mantêm o mesmo número. O mais antigo
 * fica com o número original e os seguintes recebem /1, /2...
 * (desempate pelo código do pedido).
 */
export function criarMapaMetadadosPedidoExibicao(registros) {
  const pedidosPorCodigo = new Map();

  for (const registro of registros ?? []) {
    const codigo = Number(
      registro?.codigo_pedido_omie ?? registro?.codigoPedidoOmie ?? registro?.codigoPedido,
    );

    const numeroPedido = String(
      registro?.numero_pedido ?? registro?.pedidoOriginal ?? registro?.pedido ?? "",
    ).trim();

    if (!Number.isFinite(codigo) || codigo <= 0 || !numeroPedido) {
      continue;
    }

    const criadoEmOriginal =
      registro?.criado_em ?? registro?.criadoEm ?? registro?.data_pedido ?? registro?.data ?? null;

    const criadoEm = obterTimestampCriacao(criadoEmOriginal);

    const existente = pedidosPorCodigo.get(codigo);

    if (!existente || criadoEm < existente.criadoEm) {
      pedidosPorCodigo.set(codigo, {
        codigo,
        numeroPedido,
        criadoEm,
        criadoEmOriginal,
      });
    }
  }

  const gruposPorNumero = new Map();

  for (const pedido of pedidosPorCodigo.values()) {
    if (!gruposPorNumero.has(pedido.numeroPedido)) {
      gruposPorNumero.set(pedido.numeroPedido, []);
    }

    gruposPorNumero.get(pedido.numeroPedido).push(pedido);
  }

  const mapaMetadados = new Map();

  for (const [numeroPedido, grupo] of gruposPorNumero.entries()) {
    grupo.sort((pedidoA, pedidoB) => {
      if (pedidoA.criadoEm !== pedidoB.criadoEm) {
        return pedidoA.criadoEm - pedidoB.criadoEm;
      }

      return pedidoA.codigo - pedidoB.codigo;
    });

    const total = grupo.length;

    const partes = grupo.map((pedido, indice) => ({
      codigo_pedido_omie: pedido.codigo,
      numero_pedido: numeroPedido,
      numero_exibicao: indice === 0 ? numeroPedido : `${numeroPedido}/${indice}`,
      indice,
      criado_em: pedido.criadoEmOriginal,
    }));

    grupo.forEach((pedido, indice) => {
      mapaMetadados.set(pedido.codigo, {
        codigoPedidoOmie: pedido.codigo,
        numeroOriginal: numeroPedido,
        numeroExibicao: partes[indice].numero_exibicao,
        indice,
        total,
        desdobrado: total > 1,
        ehOriginal: indice === 0,
        quantidadeDerivados: Math.max(0, total - 1),
        partes,
      });
    });
  }

  return mapaMetadados;
}

// Código do pedido -> número exibido ("123", "123/1"...).
export function criarMapaNumeroPedidoExibicao(registros) {
  const mapaExibicao = new Map();

  for (const [codigo, metadados] of criarMapaMetadadosPedidoExibicao(registros)) {
    mapaExibicao.set(codigo, metadados.numeroExibicao);
  }

  return mapaExibicao;
}

async function buscarRegistrosNumeracaoPedidos(supabase) {
  const registros = [];
  let inicio = 0;

  while (true) {
    const { data, error } = await supabase
      .from("pedidos_omie")
      .select("codigo_pedido_omie,numero_pedido,criado_em")
      .order("criado_em", { ascending: true })
      .order("codigo_pedido_omie", { ascending: true })
      .range(inicio, inicio + TAMANHO_PAGINA_NUMERACAO - 1);

    if (error) {
      throw error;
    }

    const pagina = Array.isArray(data) ? data : [];

    registros.push(...pagina);

    if (pagina.length < TAMANHO_PAGINA_NUMERACAO) {
      break;
    }

    inicio += TAMANHO_PAGINA_NUMERACAO;
  }

  return registros;
}

export async function carregarMapaNumeroPedidoExibicao(supabase) {
  return criarMapaNumeroPedidoExibicao(await buscarRegistrosNumeracaoPedidos(supabase));
}

export async function carregarMapaMetadadosPedidoExibicao(supabase) {
  return criarMapaMetadadosPedidoExibicao(await buscarRegistrosNumeracaoPedidos(supabase));
}
