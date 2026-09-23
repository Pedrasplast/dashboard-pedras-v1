const TAMANHO_PAGINA_NUMERACAO = 1000;

function obterTimestampCriacao(valor) {
  if (!valor) {
    return Number.POSITIVE_INFINITY;
  }

  const timestamp = new Date(valor).getTime();

  return Number.isFinite(timestamp)
    ? timestamp
    : Number.POSITIVE_INFINITY;
}

export function criarMapaNumeroPedidoExibicao(registros) {
  const pedidosPorCodigo = new Map();

  for (const registro of registros ?? []) {
    const codigo = Number(
      registro?.codigo_pedido_omie ??
        registro?.codigoPedidoOmie ??
        registro?.codigoPedido,
    );

    const numeroPedido = String(
      registro?.numero_pedido ??
        registro?.pedidoOriginal ??
        registro?.pedido ??
        "",
    ).trim();

    if (
      !Number.isFinite(codigo) ||
      codigo <= 0 ||
      !numeroPedido
    ) {
      continue;
    }

    const criadoEm = obterTimestampCriacao(
      registro?.criado_em ??
        registro?.criadoEm ??
        registro?.data_pedido ??
        registro?.data,
    );

    const existente = pedidosPorCodigo.get(codigo);

    if (!existente || criadoEm < existente.criadoEm) {
      pedidosPorCodigo.set(codigo, {
        codigo,
        numeroPedido,
        criadoEm,
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

  const mapaExibicao = new Map();

  for (const [numeroPedido, grupo] of gruposPorNumero.entries()) {
    grupo.sort((pedidoA, pedidoB) => {
      if (pedidoA.criadoEm !== pedidoB.criadoEm) {
        return pedidoA.criadoEm - pedidoB.criadoEm;
      }

      return pedidoA.codigo - pedidoB.codigo;
    });

    grupo.forEach((pedido, indice) => {
      mapaExibicao.set(
        pedido.codigo,
        indice === 0
          ? numeroPedido
          : `${numeroPedido}/${indice}`,
      );
    });
  }

  return mapaExibicao;
}

export async function carregarMapaNumeroPedidoExibicao(supabase) {
  const registros = [];
  let inicio = 0;

  while (true) {
    const { data, error } = await supabase
      .from("pedidos_omie")
      .select("codigo_pedido_omie,numero_pedido,criado_em")
      .order("criado_em", { ascending: true })
      .order("codigo_pedido_omie", { ascending: true })
      .range(
        inicio,
        inicio + TAMANHO_PAGINA_NUMERACAO - 1,
      );

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

  return criarMapaNumeroPedidoExibicao(registros);
}
