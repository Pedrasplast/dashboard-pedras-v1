/* =========================================================
   CONVERSÕES NUMÉRICAS
   ---------------------------------------------------------
   Cada função tem uma regra exata, usada por telas diferentes.
   Antes de alterar uma regra, veja quem a importa: mudar o
   tratamento de vazio, vírgula ou ponto muda números na tela.
========================================================= */

/** Number(valor) quando finito; senão 0. `null`, `""` e `undefined` viram 0. */
export function paraNumero(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

/** Number(valor) quando finito; senão `padrao`. */
export function paraNumeroOu(valor, padrao = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : padrao;
}

/** `null` para vazio (`null`, `undefined`, `""`) ou não numérico; senão o número. */
export function paraNumeroOuNull(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

/** Verdadeiro para `null`, `undefined` ou valor que não vira número finito. */
export function ehNumeroInvalido(valor) {
  return valor === null || valor === undefined || !Number.isFinite(Number(valor));
}

/**
 * Aceita "1.234,56", "1234,56" e "1234.56" (com vírgula e ponto, o ponto é milhar).
 * Vazio ou inválido vira 0.
 */
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

/** Mesma regra de `converterNumeroFlexivel`, mas vazio ou inválido vira `null`. */
export function converterNumeroFlexivelOuNull(valor) {
  const texto = String(valor ?? "").trim();

  if (!texto) {
    return null;
  }

  let normalizado = texto.replace(/\s/g, "");

  if (normalizado.includes(",") && normalizado.includes(".")) {
    normalizado = normalizado.replace(/\./g, "").replace(",", ".");
  } else {
    normalizado = normalizado.replace(",", ".");
  }

  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}

/**
 * Formato brasileiro estrito: se houver vírgula, ela é o decimal e os pontos são milhar
 * ("1.234,5" → 1234.5). Sem vírgula, pontos seguidos de grupos de exatamente 3 dígitos
 * também são milhar ("1.000" → 1000, "12.500.000" → 12500000); fora isso, o ponto é
 * decimal ("8.5" → 8.5, "0.125" → 0.125, "1.2345" → 1.2345). Vazio ou inválido vira `null`.
 */
export function converterNumeroBrOuNull(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : null;
  }

  const texto = String(valor).trim().replace(/\s/g, "");

  if (!texto) {
    return null;
  }

  const pontosSaoMilhar = texto.includes(",") || /^-?[1-9]\d{0,2}(\.\d{3})+$/.test(texto);
  const normalizado = pontosSaoMilhar ? texto.replace(/\./g, "").replace(",", ".") : texto;
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}

/**
 * Conversão histórica dos dados de produção, baseada em parseFloat
 * ("12abc" → 12). Vazio ou inválido vira 0.
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

/** Valor numérico para exibir em campo de formulário: ponto vira vírgula; vazio vira "". */
export function numeroParaCampo(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return "";
  }

  return String(valor).replace(".", ",");
}
