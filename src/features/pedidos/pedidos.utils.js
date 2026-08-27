import { normalizarTexto } from "@/lib/texto";

export const PEDIDOS_VAZIOS = Object.freeze([]);

export function converterData(dataTexto) {
  if (!dataTexto) {
    return null;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataTexto)) {
    const [dia, mes, ano] = dataTexto.split("/").map(Number);
    return new Date(ano, mes - 1, dia, 0, 0, 0, 0);
  }

  const data = new Date(dataTexto);
  return Number.isNaN(data.getTime()) ? null : data;
}

export function obterHoje() {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0, 0);
}

export function obterProximaAtualizacao(dataAtual) {
  const agora = dataAtual instanceof Date ? dataAtual : new Date();
  const proxima = new Date(agora);
  proxima.setSeconds(0, 0);

  const proximoMinuto = (Math.floor(agora.getMinutes() / 15) + 1) * 15;

  if (proximoMinuto >= 60) {
    proxima.setHours(proxima.getHours() + 1, 0, 0, 0);
  } else {
    proxima.setMinutes(proximoMinuto, 0, 0);
  }

  return proxima;
}

export function formatarData(dataTexto) {
  if (!dataTexto) {
    return "-";
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataTexto)) {
    return dataTexto;
  }

  const data = converterData(dataTexto);
  return data ? data.toLocaleDateString("pt-BR") : "-";
}

export function formatarHorario(dataTexto) {
  if (!dataTexto) {
    return "-";
  }

  const data = dataTexto instanceof Date ? dataTexto : new Date(dataTexto);
  if (Number.isNaN(data.getTime())) {
    return "-";
  }

  return data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatarDataHora(dataTexto) {
  if (!dataTexto) {
    return "-";
  }

  const data = dataTexto instanceof Date ? dataTexto : new Date(dataTexto);
  if (Number.isNaN(data.getTime())) {
    return "-";
  }

  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function calcularDiasAtraso(previsao) {
  const dataPrevisao = converterData(previsao);
  if (!dataPrevisao) {
    return 0;
  }

  const hoje = obterHoje();
  dataPrevisao.setHours(0, 0, 0, 0);
  const diferencaMs = hoje.getTime() - dataPrevisao.getTime();

  return diferencaMs <= 0
    ? 0
    : Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
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

export function formatarNumeroPedido(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero)
    ? numero.toLocaleString("pt-BR", { maximumFractionDigits: 3 })
    : "0";
}

export function obterClasseStatus(status) {
  const texto = normalizarTexto(status);

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
  return String(pedido?.codigoPedido || pedido?.pedido || pedido?.id);
}

export function agruparItensPorPedido(itens) {
  const mapa = new Map();

  for (const item of itens) {
    const chave = obterChavePedido(item);
    if (!mapa.has(chave)) {
      mapa.set(chave, { chave, itens: [] });
    }
    mapa.get(chave).itens.push(item);
  }

  return [...mapa.values()];
}

export function obterPedidosUnicos(itens) {
  const mapa = new Map();

  for (const item of itens) {
    const chave = obterChavePedido(item);
    if (!mapa.has(chave)) {
      mapa.set(chave, item);
    }
  }

  return [...mapa.values()];
}
