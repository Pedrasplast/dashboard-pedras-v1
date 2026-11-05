import { numeroOuNull } from "@/shared/lib/numeros";
import { formatarDataISO } from "@/shared/lib/datas";
import {
  formatarNumero as formatarNumeroBase,
  formatarMoeda as formatarMoedaBase,
  formatarKg as formatarKgBase,
  formatarDataISOParaBR,
} from "@/shared/lib/formatar";

export function numero(valor) {
  const convertido = Number(valor);

  return Number.isFinite(convertido) ? convertido : 0;
}

export { numeroOuNull };

export function formatarNumero(valor, casas = 0) {
  return formatarNumeroBase(valor, { casas });
}

export function formatarKg(valor, casas = 0) {
  return formatarKgBase(valor, { casas, vazios: [null, undefined] });
}

export function formatarMoeda(valor, casas = 2) {
  return formatarMoedaBase(valor, { casas, vazios: [null, undefined], invalido: "-" });
}

export function formatarMoedaKg(valor, casas = 3) {
  const moeda = formatarMoeda(valor, casas);

  return moeda === "-" ? "-" : `${moeda}/kg`;
}

export function formatarData(valor) {
  return formatarDataISOParaBR(valor);
}

export function formatarDataCurta(valor) {
  const data = formatarData(valor);

  return data === "-" ? "-" : data.slice(0, 5);
}

/* Período padrão do dashboard: do 1º ao último dia do mês atual. */
export function periodoMesAtual(hoje = new Date()) {
  return {
    dataInicial: formatarDataISO(new Date(hoje.getFullYear(), hoje.getMonth(), 1)),
    dataFinal: formatarDataISO(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)),
  };
}

export { formatarDataISO };

export function adicionarDias(dataISO, quantidade) {
  const [ano, mes, dia] = String(dataISO).split("-").map(Number);

  const data = new Date(ano, mes - 1, dia);

  data.setDate(data.getDate() + Number(quantidade || 0));

  return formatarDataISO(data);
}

export function obterPeriodoInicial() {
  const hoje = new Date();

  return {
    inicio: formatarDataISO(new Date(hoje.getFullYear(), hoje.getMonth(), 1)),

    fim: formatarDataISO(hoje),
  };
}

export function statusCompraAberta(status) {
  const valor = String(status ?? "")
    .trim()
    .toUpperCase();

  return valor === "PREVISTA" || valor === "CONFIRMADA";
}
