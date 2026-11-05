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
