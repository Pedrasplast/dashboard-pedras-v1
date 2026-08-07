/* =====================================================
   UTILITÁRIOS DE DATA
===================================================== */

/*
 * Campo oficial utilizado pelos relatórios:
 *
 * 1. inicio_dia
 * 2. inicio
 * 3. data
 *
 * O retorno sempre será:
 *
 * YYYY-MM-DD
 */

export function obterDataDoRegistro(item) {
  const valor =
    item?.inicio_dia ||
    item?.inicio ||
    item?.data ||
    null;

  if (!valor) {
    return null;
  }

  const texto = String(valor).trim();

  /*
   * Formatos:
   *
   * 2026-07-01
   * 2026-07-01 08:15:25+00
   * 2026-07-01T08:15:25
   */

  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
    return texto.slice(0, 10);
  }

  /*
   * Formatos:
   *
   * 01/07/2026
   * 01/07/2026 08:15
   * 01/07/26
   */

  const match = texto.match(
    /^(\d{2})\/(\d{2})\/(\d{2,4})/,
  );

  if (!match) {
    return null;
  }

  const dia = match[1];
  const mes = match[2];

  let ano = match[3];

  if (ano.length === 2) {
    ano = `20${ano}`;
  }

  return `${ano}-${mes}-${dia}`;
}

/*
 * Retorna a data no padrão brasileiro.
 */

export function formatarDataRelatorio(item) {
  const data = obterDataDoRegistro(item);

  if (!data) {
    return "-";
  }

  return data
    .split("-")
    .reverse()
    .join("/");
}