import {
  formatarNumero as formatarNumeroBase,
  formatarPercentual as formatarPercentualBase,
  formatarMoeda as formatarMoedaBase,
  formatarDataISOParaBR,
} from "@/shared/lib/formatar";

/* =========================================================
   FORMATADORES — Entradas e Compras Futuras de matéria-prima
========================================================= */

function formatarNumero(valor, casas) {
  return formatarNumeroBase(valor, { casas });
}

function formatarReais(valor, casas) {
  return formatarMoedaBase(valor, { casas, vazios: [null, undefined], invalido: "-" });
}

/** "2026-09-28" -> "28/09/2026" */
export function formatarData(valor) {
  return formatarDataISOParaBR(valor);
}

/** 1234 -> "1.234" */
export function formatarQuantidade(valor) {
  return formatarNumero(valor, 0);
}

/** 1234 -> "1.234 kg" */
export function formatarKg(valor) {
  return `${formatarQuantidade(valor)} kg`;
}

/** 1234.5 -> "R$ 1.234,50" */
export function formatarMoeda(valor) {
  return formatarReais(valor, 2);
}

/** Preço por kg usa o mesmo formato da moeda (2 casas). */
export const formatarPrecoKg = formatarMoeda;

/** 12.3456 -> "R$ 12,346" */
export function formatarCustoKg(valor) {
  return formatarReais(valor, 3);
}

/** 6.5 -> "6,50%" */
export function formatarPercentual(valor) {
  return formatarPercentualBase(valor, { casas: 2, vazios: [null, undefined], invalido: "-" });
}
