/* =========================================================
   FORMATAÇÃO NUMÉRICA (pt-BR)
   ---------------------------------------------------------
   `numero.toLocaleString("pt-BR", opcoes)` cria um formatador
   novo a cada chamada. Aqui o Intl.NumberFormat é criado uma
   vez por combinação de opções e reaproveitado, com o mesmo
   resultado (é exatamente o que toLocaleString usa por dentro).
========================================================= */

import { converterNumeroFlexivel, paraNumero } from "./numeros";

const LOCALE = "pt-BR";
const formatadores = new Map();

function chaveOpcoes(opcoes) {
  if (!opcoes) {
    return "";
  }

  return Object.keys(opcoes)
    .sort()
    .map((chave) => `${chave}=${typeof opcoes[chave]}:${String(opcoes[chave])}`)
    .join("|");
}

/** Intl.NumberFormat pt-BR reaproveitado para as mesmas opções. */
export function obterFormatadorNumero(opcoes) {
  const chave = chaveOpcoes(opcoes);
  let formatador = formatadores.get(chave);

  if (!formatador) {
    formatador = new Intl.NumberFormat(LOCALE, opcoes);
    formatadores.set(chave, formatador);
  }

  return formatador;
}

/** Equivale a `numero.toLocaleString("pt-BR", opcoes)` para um número. */
export function formatarNumeroPtBR(numero, opcoes) {
  return obterFormatadorNumero(opcoes).format(numero);
}

/** Valor em reais com o número de casas pedido (padrão do Intl: 2). */
export function formatarReaisPtBR(numero, opcoes) {
  return formatarNumeroPtBR(numero, { style: "currency", currency: "BRL", ...opcoes });
}

/** Converte com `converterNumeroFlexivel` e mostra até `casas` decimais. */
export function formatarNumeroFlexivel(valor, casas = 2) {
  return formatarNumeroPtBR(converterNumeroFlexivel(valor), {
    maximumFractionDigits: casas,
  });
}

/** Converte com `paraNumero` (inválido vira 0) e mostra exatamente `casas` decimais. */
export function formatarNumeroCasasFixas(valor, casas = 0) {
  return formatarNumeroPtBR(paraNumero(valor), {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

/** Padrão do sistema para kg e percentual: sempre 2 casas decimais. */
export const DUAS_CASAS = Object.freeze({ minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Número com 2 casas fixas ("1.234,50"). */
export function formatarDuasCasas(numero) {
  return formatarNumeroPtBR(numero, DUAS_CASAS);
}
