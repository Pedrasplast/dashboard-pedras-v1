import { normalizarTexto } from "@/shared/lib/texto";
import { formatarNumeroPtBR } from "@/shared/lib/formatar";

export function formatarNumero(valor, casas = 3) {
  if (valor === null || valor === undefined || valor === "") return "-";
  const numero = Number(valor);
  return Number.isFinite(numero)
    ? formatarNumeroPtBR(numero, { minimumFractionDigits: 0, maximumFractionDigits: casas })
    : "-";
}

/** Percentual da receita com até 4 casas ("12,3456%"). Inválido vira "0%". */
export function formatarPercentual(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "0%";
  }

  return `${formatarNumeroPtBR(numero, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })}%`;
}
