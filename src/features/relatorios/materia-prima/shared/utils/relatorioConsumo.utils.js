/* =========================================================
   UTILITÁRIOS COMPARTILHADOS
   Consumo Programado por Fornecedor / por Injetora
========================================================= */

export function hojeIso() {
  const agora = new Date();

  const ano = agora.getFullYear();

  const mes = String(agora.getMonth() + 1).padStart(2, "0");

  const dia = String(agora.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}


export function somarDias(dataIso, dias) {
  const [ano, mes, dia] = dataIso.split("-").map(Number);

  const data = new Date(ano, mes - 1, dia + dias, 12);

  return [
    data.getFullYear(),
    String(data.getMonth() + 1).padStart(2, "0"),
    String(data.getDate()).padStart(2, "0"),
  ].join("-");
}


export function periodoInicial() {
  const inicio = hojeIso();

  return {
    inicio,
    fim: somarDias(inicio, 7),
  };
}


export function formatarData(valor) {
  if (!valor) {
    return "-";
  }

  const [ano, mes, dia] = String(valor).split("-");

  return ano && mes && dia
    ? `${dia}/${mes}/${ano}`
    : String(valor);
}


export function formatarNumero(valor, casas = 0) {
  return Number(valor ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}


export function formatarKg(valor) {
  return `${formatarNumero(valor, 3)} kg`;
}


export function formatarHoras(valor, legado = false) {
  if (legado || valor === null || valor === undefined) {
    return "Legado";
  }

  return `${formatarNumero(valor, 2)} h`;
}
