export function normalizarTexto(valor) {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function formatarNumero(valor, casas = 3) {
  if (valor === null || valor === undefined || valor === "") return "-";
  const numero = Number(valor);
  return Number.isFinite(numero)
    ? numero.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: casas })
    : "-";
}
