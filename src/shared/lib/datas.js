/** Hoje à meia-noite, no fuso do computador. */
export function obterHoje() {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0, 0);
}

export function obterAnoAtual() {
  return new Date().getFullYear();
}

/** Date → "AAAA-MM-DD" no fuso do computador; "" para data inválida. */
export function formatarDataISO(data) {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
    return "";
  }

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

/** Data de hoje como "AAAA-MM-DD", no fuso do computador. */
export function dataHojeLocal() {
  return formatarDataISO(new Date());
}

const DIAS_SEMANA_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

/**
 * Dia da semana abreviado ("seg", "ter"...) de uma data "AAAA-MM-DD".
 * Calcula pela própria data (sem fuso), então não muda de dia à noite.
 * Retorna "" para valor vazio ou inválido.
 */
export function diaSemanaCurto(valorISO) {
  const m = String(valorISO ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "";
  const data = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (data.getUTCDate() !== Number(m[3])) return "";
  return DIAS_SEMANA_CURTOS[data.getUTCDay()];
}
