/* ============================================================
   NECESSIDADE DE MATÉRIA-PRIMA
   FORMATAÇÃO DE VALORES

   Responsável exclusivamente pela apresentação.

   Não arredonda dados utilizados nos cálculos.
   Não consulta Supabase nem Omie.
   Não modifica os valores recebidos.

   PADRÕES:
   Quantidade      8.124
   KG/UN           2,780
   Consumo         22.584,72
   Estoque (kg)    16.038,566
   Percentual      100%
   Moeda           R$ 168.234,73
============================================================ */

const LOCALE = "pt-BR";

const FORMATO_QUANTIDADE = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

const FORMATO_PESO_UNITARIO = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const FORMATO_CONSUMO = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const FORMATO_KG = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const FORMATO_PERCENTUAL = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const FORMATO_MOEDA = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const FORMATO_PRECO_UNITARIO = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

/* ============================================================
   CONVERSÃO PARA EXIBIÇÃO

   Distingue:
   - 0: valor válido
   - null/undefined: ausência de informação
============================================================ */

function obterNumero(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  const convertido = Number(valor);

  return Number.isFinite(convertido) ? convertido : null;
}

function aplicarFormato(valor, formatador) {
  const convertido = obterNumero(valor);

  if (convertido === null) {
    return "—";
  }

  return formatador.format(convertido);
}

/* ============================================================
   QUANTIDADE

   Utilização:
   Quantidade de unidades nos pedidos.
============================================================ */

export function formatarQuantidade(valor) {
  return aplicarFormato(valor, FORMATO_QUANTIDADE);
}

/* ============================================================
   PESO UNITÁRIO (KG/UN)

   Exatamente 3 casas decimais.
============================================================ */

export function formatarPesoKgUn(valor) {
  return aplicarFormato(valor, FORMATO_PESO_UNITARIO);
}

/* ============================================================
   CONSUMO

   Exatamente 2 casas decimais.
============================================================ */

export function formatarConsumo(valor) {
  return aplicarFormato(valor, FORMATO_CONSUMO);
}

/* ============================================================
   VALORES EM QUILOGRAMAS

   Exatamente 3 casas decimais.

   Utilização:
   - Estoque API
   - Compras futuras
   - Saldo projetado
   - Estoque-teto, quando apresentado
   - Necessidade de compra
============================================================ */

export function formatarKg(valor) {
  return aplicarFormato(valor, FORMATO_KG);
}

/* ============================================================
   PERCENTUAL DE COMPRA
============================================================ */

export function formatarPercentual(valor) {
  const convertido = obterNumero(valor);

  if (convertido === null) {
    return "—";
  }

  return `${FORMATO_PERCENTUAL.format(convertido)}%`;
}

/* ============================================================
   VALOR MONETÁRIO TOTAL

   Exatamente 2 casas decimais.
============================================================ */

export function formatarMoeda(valor) {
  return aplicarFormato(valor, FORMATO_MOEDA);
}

/* ============================================================
   PREÇO UNITÁRIO

   Até 4 casas decimais para preservar a
   visualização de preços por kg mais precisos.
============================================================ */

export function formatarPrecoUnitario(valor) {
  return aplicarFormato(valor, FORMATO_PRECO_UNITARIO);
}
