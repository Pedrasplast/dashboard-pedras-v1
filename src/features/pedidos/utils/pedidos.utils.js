import {
  calcularDiasAtraso,
  converterDataCalendario,
  obterHoje,
} from "./date.utils";
import { normalizarTexto } from "./format.utils";

export function pedidoEhCancelado(pedido) {
  return normalizarTexto(pedido?.status) === "cancelado";
}

export function pedidoEstaAtrasado(pedido) {
  return (
    normalizarTexto(pedido?.status) === "pedido" &&
    calcularDiasAtraso(pedido?.previsao) > 0
  );
}

export function formatarTextoAtraso(dias) {
  return dias === 1 ? "1 dia em atraso" : `${dias} dias em atraso`;
}

export function obterClasseStatus(status) {
  const texto = normalizarTexto(status);

  if (texto.includes("cancel")) {
    return "status-cancelado";
  }

  if (texto.includes("separa")) {
    return "status-separacao";
  }

  if (texto.includes("liber")) {
    return "status-liberado";
  }

  if (texto === "pedido" || texto.includes("aberto")) {
    return "status-aberto";
  }

  return "status-padrao";
}

export function obterChavePedido(pedido) {
  return String(
    pedido?.codigoPedido ||
      pedido?.codigo_pedido ||
      pedido?.pedido ||
      pedido?.numero_pedido ||
      pedido?.id ||
      "",
  );
}

export function obterCodigoPedidoOmie(pedido) {
  const codigo = Number(
    pedido?.codigoPedidoOmie ??
      pedido?.codigoPedido ??
      pedido?.codigo_pedido_omie ??
      pedido?.codigo_pedido ??
      null,
  );

  if (!Number.isFinite(codigo) || codigo <= 0) {
    return null;
  }

  return codigo;
}

export function obterTimestampNotificacao(notificacao) {
  const valor = notificacao?.atualizado_em ?? notificacao?.criado_em ?? null;

  if (!valor) {
    return 0;
  }

  const timestamp = new Date(valor).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function criarMapaNotificacoes(notificacoes = []) {
  const mapa = new Map();

  for (const notificacao of notificacoes) {
    const codigo = Number(notificacao?.codigo_pedido_omie);

    if (Number.isFinite(codigo) && codigo > 0) {
      mapa.set(codigo, notificacao);
    }
  }

  return mapa;
}

export function obterVendedores(pedidos = []) {
  return [
    ...new Set(
      pedidos
        .map((pedido) => pedido.vendedor)
        .filter((nome) => nome && nome !== "-"),
    ),
  ].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function obterStatusDisponiveis(pedidos = []) {
  return [
    ...new Set(pedidos.map((pedido) => pedido.status).filter(Boolean)),
  ].sort((a, b) => String(a).localeCompare(String(b), "pt-BR"));
}

export function filtrarPedidos(pedidos, { pesquisa, vendedor, status }) {
  const termo = normalizarTexto(pesquisa);

  return pedidos.filter((pedido) => {
    const correspondePesquisa =
      !termo ||
      normalizarTexto(pedido?.pedidoExibicao ?? pedido?.pedido).includes(termo) ||
      normalizarTexto(pedido?.cliente).includes(termo) ||
      normalizarTexto(pedido?.produto).includes(termo) ||
      normalizarTexto(pedido?.codigoProduto).includes(termo);

    const correspondeVendedor =
      vendedor === "todos" || pedido?.vendedor === vendedor;

    const correspondeStatus =
      status === "todos" ||
      normalizarTexto(pedido?.status) === normalizarTexto(status);

    return correspondePesquisa && correspondeVendedor && correspondeStatus;
  });
}

export function obterPedidosUnicos(pedidos = []) {
  const mapa = new Map();

  for (const pedido of pedidos) {
    const chave = obterChavePedido(pedido);

    if (chave && !mapa.has(chave)) {
      mapa.set(chave, pedido);
    }
  }

  return [...mapa.values()];
}

export function ordenarPedidosUnicosPorNotificacao(
  pedidos,
  notificacoesPorPedido,
) {
  const lista = [...pedidos];
  const ordemOriginal = new Map();

  lista.forEach((pedido, indice) => {
    ordemOriginal.set(obterChavePedido(pedido), indice);
  });

  return lista.sort((pedidoA, pedidoB) => {
    const codigoA = obterCodigoPedidoOmie(pedidoA);
    const codigoB = obterCodigoPedidoOmie(pedidoB);

    const notificacaoA = codigoA ? notificacoesPorPedido.get(codigoA) : null;
    const notificacaoB = codigoB ? notificacoesPorPedido.get(codigoB) : null;

    const pendenteA = Boolean(notificacaoA);
    const pendenteB = Boolean(notificacaoB);

    if (pendenteA && !pendenteB) {
      return -1;
    }

    if (!pendenteA && pendenteB) {
      return 1;
    }

    if (pendenteA && pendenteB) {
      const dataA = obterTimestampNotificacao(notificacaoA);
      const dataB = obterTimestampNotificacao(notificacaoB);

      if (dataA !== dataB) {
        return dataB - dataA;
      }
    }

    const indiceA = ordemOriginal.get(obterChavePedido(pedidoA)) ?? 0;
    const indiceB = ordemOriginal.get(obterChavePedido(pedidoB)) ?? 0;

    return indiceA - indiceB;
  });
}

export function obterLinhasDaPagina(
  pedidosFiltrados,
  pedidosUnicosDaPagina,
) {
  const ordemPagina = new Map();

  pedidosUnicosDaPagina.forEach((pedido, indice) => {
    ordemPagina.set(obterChavePedido(pedido), indice);
  });

  const chavesPedidosDaPagina = new Set(
    pedidosUnicosDaPagina.map((pedido) => obterChavePedido(pedido)),
  );

  return pedidosFiltrados
    .filter((pedido) =>
      chavesPedidosDaPagina.has(obterChavePedido(pedido)),
    )
    .sort((a, b) => {
      const ordemA = ordemPagina.get(obterChavePedido(a)) ?? 0;
      const ordemB = ordemPagina.get(obterChavePedido(b)) ?? 0;

      return ordemA - ordemB;
    });
}

export function agruparPedidos(pedidos = []) {
  const mapa = new Map();

  for (const pedido of pedidos) {
    const chave = obterChavePedido(pedido);

    if (!mapa.has(chave)) {
      mapa.set(chave, {
        chave,
        itens: [],
      });
    }

    mapa.get(chave).itens.push(pedido);
  }

  return [...mapa.values()];
}

export function somarQuantidade(pedidos = []) {
  return pedidos.reduce((total, pedido) => {
    const quantidade = Number(pedido?.quantidade);

    if (!Number.isFinite(quantidade)) {
      return total;
    }

    return total + quantidade;
  }, 0);
}

export function contarPedidosAtrasados(pedidosUnicos = []) {
  return pedidosUnicos.filter((pedido) => pedidoEstaAtrasado(pedido)).length;
}

export function contarFaturamentosProximos7Dias(pedidosUnicos = []) {
  const hoje = obterHoje();
  const limite = new Date(hoje);

  limite.setDate(limite.getDate() + 7);

  return pedidosUnicos.filter((pedido) => {
    if (normalizarTexto(pedido?.status) !== "pedido") {
      return false;
    }

    const previsao = converterDataCalendario(pedido?.previsao);

    if (!previsao) {
      return false;
    }

    previsao.setHours(0, 0, 0, 0);

    return previsao >= hoje && previsao <= limite;
  }).length;
}
