import { formatarNumero as formatarNumeroBase } from "@/shared/lib/formatar";

export { normalizarTexto } from "@/shared/lib/texto";

export function formatarNumero(valor) {
  return formatarNumeroBase(valor, { maximo: 3, invalido: "0" });
}
