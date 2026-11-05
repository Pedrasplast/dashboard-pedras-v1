export function normalizarTexto(valor, { compactarEspacos = false } = {}) {
  let texto = String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (compactarEspacos) {
    texto = texto.replace(/\s+/g, " ");
  }

  return texto;
}

/** Código de produto/material para comparação: sem espaços nas pontas e em maiúsculas. */
export function normalizarCodigo(valor) {
  return String(valor ?? "")
    .trim()
    .toUpperCase();
}
