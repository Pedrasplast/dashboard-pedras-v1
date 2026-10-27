import { paraNumeroOuNull } from "@/shared/lib/numeros";

/* ============================================================
   NECESSIDADE DE MATÉRIA-PRIMA — FORMATAÇÃO
   Padrão visual: 2 casas decimais em todos os valores.
   Os cálculos continuam usando precisão original.
============================================================ */

const idioma = "pt-BR";

const decimal = new Intl.NumberFormat(idioma, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const moeda = new Intl.NumberFormat(idioma, {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatarDecimal(valor) {
  const numero = paraNumeroOuNull(valor);
  return numero === null ? "—" : decimal.format(numero);
}

export function formatarQuantidade(valor) {
  return formatarDecimal(valor);
}

export function formatarPesoKgUn(valor) {
  return formatarDecimal(valor);
}

export function formatarConsumo(valor) {
  return formatarDecimal(valor);
}

export function formatarKg(valor) {
  return formatarDecimal(valor);
}

export function formatarPercentual(valor) {
  const numero = paraNumeroOuNull(valor);
  return numero === null ? "—" : `${decimal.format(numero)}%`;
}

export function formatarMoeda(valor) {
  const numero = paraNumeroOuNull(valor);
  return numero === null ? "—" : moeda.format(numero);
}

export function formatarPrecoUnitario(valor) {
  return formatarMoeda(valor);
}
