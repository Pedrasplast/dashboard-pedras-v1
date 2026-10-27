/* =========================================================
   TEXTO
========================================================= */

const ACENTOS = /[̀-ͯ]/g;

/** String(valor) sem espaços nas pontas; `null`/`undefined` viram "". */
export function paraTexto(valor) {
  return String(valor ?? "").trim();
}

/** Para comparar e buscar: sem espaços nas pontas, minúsculo e sem acentos. */
export function normalizarTexto(valor) {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(ACENTOS, "");
}

/** Como `normalizarTexto`, e ainda reduz qualquer sequência de espaços a um só. */
export function normalizarTextoCompacto(valor) {
  return normalizarTexto(valor).replace(/\s+/g, " ");
}

/** Minúsculo e sem acentos, preservando os espaços das pontas. */
export function normalizarTextoSemAparar(valor) {
  return String(valor ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(ACENTOS, "");
}

/** Códigos de produto/material: sem espaços nas pontas e em maiúsculas. */
export function normalizarCodigo(valor) {
  return String(valor ?? "")
    .trim()
    .toUpperCase();
}

/** Comparador para `sort` de textos em pt-BR (os dois valores precisam ser strings). */
export function ordenarTexto(a, b) {
  return a.localeCompare(b, "pt-BR");
}
