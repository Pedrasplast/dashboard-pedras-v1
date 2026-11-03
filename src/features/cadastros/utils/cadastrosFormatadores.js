import { normalizarTexto } from "@/shared/lib/texto";
import { formatarNumero as formatarNumeroBase } from "@/shared/lib/formatar";

export { normalizarTexto };

export function formatarNumero(valor, casas = 3) {
  return formatarNumeroBase(valor, { maximo: casas, vazios: [null, undefined, ""], invalido: "-" });
}
