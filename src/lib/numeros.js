export function converterNumeroFlexivel(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return 0;
  }

  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : 0;
  }

  let texto = String(valor).trim().replace(/\s/g, "");

  if (texto.includes(",") && texto.includes(".")) {
    texto = texto.replace(/\./g, "").replace(",", ".");
  } else {
    texto = texto.replace(",", ".");
  }

  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : 0;
}

export function formatarNumeroFlexivel(valor, casas = 2) {
  return converterNumeroFlexivel(valor).toLocaleString("pt-BR", {
    maximumFractionDigits: casas,
  });
}

/**
 * Conversão simples usada nos dados de produção.
 * Mantém a semântica histórica baseada em parseFloat.
 */
export function converterNumeroDecimal(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return 0;
  }

  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : 0;
  }

  const numero = Number.parseFloat(String(valor).trim().replace(",", "."));
  return Number.isFinite(numero) ? numero : 0;
}
