import { normalizarTexto } from "@/shared/lib/texto";

export function formatarNumero(valor, casas = 3) {
  if (valor === null || valor === undefined || valor === "") return "-";
  const numero = Number(valor);
  return Number.isFinite(numero)
    ? numero.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: casas })
    : "-";
}
