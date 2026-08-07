/* =====================================================
   UTILITÁRIOS NUMÉRICOS
===================================================== */

export function converterNumero(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return 0;
  }

  if (typeof valor === "number") {
    return Number.isFinite(valor)
      ? valor
      : 0;
  }

  const texto = String(valor)
    .trim()
    .replace(",", ".");

  const numero = Number.parseFloat(texto);

  return Number.isFinite(numero)
    ? numero
    : 0;
}

export function formatarNumero(valor) {
  return converterNumero(valor).toLocaleString(
    "pt-BR",
    {
      maximumFractionDigits: 2,
    },
  );
}