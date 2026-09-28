/* =========================================================
   FORMATADORES
========================================================= */

function valorInvalido(valor) {
  return valor === null || valor === undefined || !Number.isFinite(Number(valor));
}

function formatarNumero(valor, casas) {
  return Number(valor ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

function formatarReais(valor, casas) {
  if (valorInvalido(valor)) {
    return "-";
  }

  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

/** "2026-09-28" -> "28/09/2026" */
export function formatarData(valor) {
  if (!valor) {
    return "-";
  }

  const [ano, mes, dia] = valor.split("-");

  return `${dia}/${mes}/${ano}`;
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
  if (valorInvalido(valor)) {
    return "-";
  }

  return `${formatarNumero(valor, 2)}%`;
}
