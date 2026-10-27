import { paraNumero, paraNumeroOuNull } from "@/shared/lib/numeros";
import { formatarDataISOLocal, formatarDataBR } from "@/shared/lib/datas";
import { formatarNumeroPtBR, formatarNumeroCasasFixas } from "@/shared/lib/formatar";

export function formatarKg(valor, casas = 0) {
  if (valor === null || valor === undefined) {
    return "-";
  }

  return `${formatarNumeroCasasFixas(valor, casas)} kg`;
}

export function formatarMoeda(valor, casas = 2) {
  if (valor === null || valor === undefined || !Number.isFinite(Number(valor))) {
    return "-";
  }

  return formatarNumeroPtBR(Number(valor), {
    style: "currency",

    currency: "BRL",

    minimumFractionDigits: casas,

    maximumFractionDigits: casas,
  });
}

export function formatarMoedaKg(valor, casas = 3) {
  const moeda = formatarMoeda(valor, casas);

  return moeda === "-" ? "-" : `${moeda}/kg`;
}

export function formatarDataCurta(valor) {
  const data = formatarDataBR(valor);

  return data === "-" ? "-" : data.slice(0, 5);
}

/* Período padrão do dashboard: do 1º ao último dia do mês atual. */
export function periodoMesAtual(hoje = new Date()) {
  return {
    dataInicial: formatarDataISOLocal(new Date(hoje.getFullYear(), hoje.getMonth(), 1)),
    dataFinal: formatarDataISOLocal(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)),
  };
}

export function adicionarDias(dataISO, quantidade) {
  const [ano, mes, dia] = String(dataISO).split("-").map(Number);

  const data = new Date(ano, mes - 1, dia);

  data.setDate(data.getDate() + Number(quantidade || 0));

  return formatarDataISOLocal(data);
}

export function obterPeriodoInicial() {
  const hoje = new Date();

  return {
    inicio: formatarDataISOLocal(new Date(hoje.getFullYear(), hoje.getMonth(), 1)),

    fim: formatarDataISOLocal(hoje),
  };
}

export function statusCompraAberta(status) {
  const valor = String(status ?? "")
    .trim()
    .toUpperCase();

  return valor === "PREVISTA" || valor === "CONFIRMADA";
}
