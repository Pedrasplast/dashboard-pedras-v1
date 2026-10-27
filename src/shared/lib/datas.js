/* =========================================================
   DATAS
   ---------------------------------------------------------
   Exibição: sempre no fuso do computador de quem acessa.
   Regras de negócio (turnos, agenda das rotinas, dia de
   consulta no banco) usam FUSO_BRASILIA explicitamente.
========================================================= */

export const FUSO_BRASILIA = "America/Sao_Paulo";

/** Hoje à meia-noite (fuso local). */
export function obterHoje() {
  const agora = new Date();

  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0, 0);
}

/** Date → "AAAA-MM-DD" pelo calendário local. */
export function formatarDataISOLocal(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

/** Hoje como "AAAA-MM-DD" (fuso local). */
export function obterHojeISO() {
  return formatarDataISOLocal(new Date());
}

export function obterAnoAtual() {
  return new Date().getFullYear();
}

/** Mês atual de 1 a 12. */
export function obterMesAtual() {
  return new Date().getMonth() + 1;
}

/**
 * "DD/MM/AAAA" vira data local; demais textos vão para `new Date`.
 * Vazio ou inválido vira `null`.
 */
export function converterData(dataTexto) {
  if (!dataTexto) {
    return null;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataTexto)) {
    const [dia, mes, ano] = dataTexto.split("/").map(Number);
    return new Date(ano, mes - 1, dia, 0, 0, 0, 0);
  }

  const data = new Date(dataTexto);
  return Number.isNaN(data.getTime()) ? null : data;
}

/**
 * Sempre devolve a meia-noite local do dia: aceita "DD/MM/AAAA", "AAAA-MM-DD..."
 * (o dia do texto, sem conversão de fuso) e outros formatos via `new Date`.
 */
export function converterDataLocal(valor) {
  if (!valor) {
    return null;
  }

  const texto = String(valor).trim();

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    const [dia, mes, ano] = texto.split("/").map(Number);
    return new Date(ano, mes - 1, dia, 0, 0, 0, 0);
  }

  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 0, 0, 0, 0);
  }

  const data = new Date(texto);

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  return new Date(data.getFullYear(), data.getMonth(), data.getDate(), 0, 0, 0, 0);
}

/** "AAAA-MM-DD" → "DD/MM/AAAA". Vazio vira "-"; formato diferente volta como texto. */
export function formatarDataBR(valor) {
  if (!valor) {
    return "-";
  }

  const [ano, mes, dia] = String(valor).split("-");

  if (!ano || !mes || !dia) {
    return String(valor);
  }

  return `${dia}/${mes}/${ano}`;
}

/** Como `formatarDataBR`, mas formato diferente volta o próprio valor recebido. */
export function formatarDataBROuOriginal(valor) {
  if (!valor) {
    return "-";
  }

  const [ano, mes, dia] = String(valor).split("-");

  if (!ano || !mes || !dia) {
    return valor;
  }

  return `${dia}/${mes}/${ano}`;
}

function paraDataValida(valor) {
  const data = valor instanceof Date ? valor : new Date(valor);

  return Number.isNaN(data.getTime()) ? null : data;
}

/** "HH:MM" no fuso local. Vazio ou inválido vira "-". */
export function formatarHora(valor) {
  if (!valor) {
    return "-";
  }

  const data = paraDataValida(valor);

  return data ? data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "-";
}

/** "DD/MM/AAAA, HH:MM" no fuso local. Vazio ou inválido vira "-". */
export function formatarDataHora(valor) {
  if (!valor) {
    return "-";
  }

  const data = paraDataValida(valor);

  return data
    ? data.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";
}

/** "DD/MM/AAAA, HH:MM:SS" no fuso local. Vazio ou inválido vira "-". */
export function formatarDataHoraCompleta(valor) {
  if (!valor) {
    return "-";
  }

  const data = new Date(valor);

  return Number.isNaN(data.getTime()) ? "-" : data.toLocaleString("pt-BR");
}
