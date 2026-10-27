import { formatarNumeroPtBR, formatarDuasCasas } from "@/shared/lib/formatar";

export function formatarNumero(valor, casas = 3) {
  if (valor === null || valor === undefined || valor === "") return "-";
  const numero = Number(valor);
  return Number.isFinite(numero)
    ? formatarNumeroPtBR(numero, { minimumFractionDigits: 0, maximumFractionDigits: casas })
    : "-";
}

/** Percentual da receita com 2 casas ("12,35%"). Inválido vira "0%". */
export function formatarPercentual(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "0%";
  }

  return `${formatarDuasCasas(numero)}%`;
}
