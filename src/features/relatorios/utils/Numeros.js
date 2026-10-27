import { converterNumeroDecimal } from "@/shared/lib/numeros";
import { formatarNumeroPtBR } from "@/shared/lib/formatar";

export const converterNumero = converterNumeroDecimal;

export function formatarNumero(valor) {
  return formatarNumeroPtBR(converterNumero(valor), {
    maximumFractionDigits: 2,
  });
}
