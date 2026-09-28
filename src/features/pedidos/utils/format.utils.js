export { normalizarTexto } from "@/lib/texto";

export function formatarNumero(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "0";
  }

  return numero.toLocaleString("pt-BR", {
    maximumFractionDigits: 3,
  });
}
