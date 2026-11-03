import { converterNumeroDecimal } from "@/shared/lib/numeros";
import { formatarNumero as formatarNumeroBase } from "@/shared/lib/formatar";

export const converterNumero = converterNumeroDecimal;

export function formatarNumero(valor) {
  return formatarNumeroBase(valor, { maximo: 2, ler: "decimal" });
}
