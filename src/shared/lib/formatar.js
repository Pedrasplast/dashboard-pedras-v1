import { converterNumeroDecimal, converterNumeroFlexivel } from "./numeros";

/* =========================================================
   FORMATADORES (pt-BR)

   Cada combinação de opções cria o Intl.NumberFormat /
   Intl.DateTimeFormat uma vez só e reaproveita: em tabelas
   grandes isso é bem mais rápido que toLocaleString.

   Opções comuns de número, moeda, percentual e kg:
   - casas:   casas decimais fixas (mínimo = máximo).
   - minimo / maximo: faixa de casas decimais
                      (padrão: minimo 0, maximo = minimo).
   - ler:     como interpretar o valor
              "estrito"  → Number(valor) (padrão)
              "flexivel" → aceita "1.234,56" e "1,5"
              "decimal"  → parseFloat com vírgula ("1,5")
   - vazios / vazio: valores tratados como vazios (ex.:
              [null, undefined, ""]) e o texto que mostram
              (padrão "-").
   - invalido: texto para número inválido (NaN, "abc").
              Sem ele, inválido vira 0 formatado.
========================================================= */

const IDIOMA = "pt-BR";
const cacheNumero = new Map();
const cacheData = new Map();

export function obterFormatadorNumero(opcoes) {
  const chave = JSON.stringify(opcoes);

  if (!cacheNumero.has(chave)) {
    cacheNumero.set(chave, new Intl.NumberFormat(IDIOMA, opcoes));
  }

  return cacheNumero.get(chave);
}

export function obterFormatadorData(opcoes) {
  const chave = JSON.stringify(opcoes);

  if (!cacheData.has(chave)) {
    cacheData.set(chave, new Intl.DateTimeFormat(IDIOMA, opcoes));
  }

  return cacheData.get(chave);
}

const LEITORES = {
  estrito: Number,
  flexivel: converterNumeroFlexivel,
  decimal: converterNumeroDecimal,
};

/**
 * Converte e aplica as regras de vazio/inválido.
 * Retorna { numero } para formatar, ou { texto } quando o valor é vazio/inválido
 * e há um texto definido para esse caso.
 */
function prepararNumero(valor, { ler = "estrito", vazios, vazio = "-", invalido }) {
  if (vazios?.includes(valor)) {
    return { texto: vazio };
  }

  const numero = LEITORES[ler](valor);

  if (!Number.isFinite(numero)) {
    return invalido === undefined ? { numero: 0 } : { texto: invalido };
  }

  return { numero };
}

function faixaCasas({ casas, minimo, maximo }) {
  const min = minimo ?? casas ?? 0;
  const max = maximo ?? casas ?? min;

  return { minimumFractionDigits: min, maximumFractionDigits: max };
}

/** 1234.5 → "1.234,5" (casas e vazio configuráveis). */
export function formatarNumero(valor, opcoes = {}) {
  const { numero, texto } = prepararNumero(valor, opcoes);

  if (texto !== undefined) {
    return texto;
  }

  return obterFormatadorNumero(faixaCasas(opcoes)).format(numero);
}

/** 12.5 → "12,5%". O texto de vazio volta sem "%". */
export function formatarPercentual(valor, opcoes = {}) {
  const { numero, texto } = prepararNumero(valor, opcoes);

  if (texto !== undefined) {
    return texto;
  }

  return `${obterFormatadorNumero(faixaCasas(opcoes)).format(numero)}%`;
}

/** 1234 → "1.234 kg". O texto de vazio volta sem "kg". */
export function formatarKg(valor, opcoes = {}) {
  const { numero, texto } = prepararNumero(valor, opcoes);

  if (texto !== undefined) {
    return texto;
  }

  return `${obterFormatadorNumero(faixaCasas(opcoes)).format(numero)} kg`;
}

/** 1234.5 → "R$ 1.234,50" (2 casas por padrão). */
export function formatarMoeda(valor, opcoes = {}) {
  const { numero, texto } = prepararNumero(valor, opcoes);

  if (texto !== undefined) {
    return texto;
  }

  const casas = faixaCasas({ casas: 2, ...opcoes });

  return obterFormatadorNumero({ style: "currency", currency: "BRL", ...casas }).format(numero);
}

/* =========================================================
   DATAS
========================================================= */

/** "2026-09-28" (ou "2026-09-28T…") → "28/09/2026"; vazio → "-". */
export function formatarDataISOParaBR(valor, { vazio = "-", invalido } = {}) {
  if (!valor) {
    return vazio;
  }

  const [ano, mes, dia] = String(valor).split("-");

  if (!ano || !mes || !dia) {
    return invalido === undefined ? String(valor) : invalido;
  }

  return `${dia}/${mes}/${ano}`;
}

/**
 * Data e hora em pt-BR: "28/09/2026 14:05" (padrão do Intl: "28/09/2026, 14:05").
 * - ano: inclui o ano (padrão true)
 * - segundos: inclui segundos (padrão false)
 * - fuso: timeZone (ex.: "America/Sao_Paulo"); sem ele usa o do computador
 * - hour12: repassado ao Intl quando definido
 * - vazio: texto para valor vazio ou data inválida (padrão "-")
 */
export function formatarDataHora(
  valor,
  { ano = true, segundos = false, fuso, hour12, vazio = "-" } = {},
) {
  if (!valor) {
    return vazio;
  }

  const data = valor instanceof Date ? valor : new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return vazio;
  }

  const opcoes = {
    day: "2-digit",
    month: "2-digit",
    ...(ano ? { year: "numeric" } : {}),
    hour: "2-digit",
    minute: "2-digit",
    ...(segundos ? { second: "2-digit" } : {}),
    ...(fuso ? { timeZone: fuso } : {}),
    ...(hour12 === undefined ? {} : { hour12 }),
  };

  return obterFormatadorData(opcoes).format(data);
}
