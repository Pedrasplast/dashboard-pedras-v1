import { formatarNumeroPtBR } from "@/shared/lib/formatar";
export { normalizarTexto } from "@/shared/lib/texto";

export function formatarNumero(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "0";
  }

  return formatarNumeroPtBR(numero, {
    maximumFractionDigits: 3,
  });
}
