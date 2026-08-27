import { converterNumeroDecimal } from "@/lib/numeros";

export const converterNumero = converterNumeroDecimal;

export function formatarNumero(valor) {
  return converterNumero(valor).toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
  });
}
