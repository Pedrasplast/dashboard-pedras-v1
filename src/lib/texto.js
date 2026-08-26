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
