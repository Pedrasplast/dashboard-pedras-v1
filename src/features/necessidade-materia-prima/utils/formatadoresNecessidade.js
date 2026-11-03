import {
  formatarPercentual as formatarPercentualBase,
  formatarMoeda as formatarMoedaBase,
  formatarNumero as formatarNumeroBase,
} from "@/shared/lib/formatar";

/* ============================================================
   NECESSIDADE DE MATÉRIA-PRIMA — FORMATAÇÃO
   Padrão visual: 2 casas decimais em todos os valores.
   Os cálculos continuam usando precisão original.
============================================================ */

function formatarDecimal(valor) {
  return formatarNumeroBase(valor, {
    casas: 2,
    vazios: [null, undefined, ""],
    vazio: "—",
    invalido: "—",
  });
}

export function formatarQuantidade(valor) {
  return formatarDecimal(valor);
}

export function formatarPesoKgUn(valor) {
  return formatarDecimal(valor);
}

export function formatarConsumo(valor) {
  return formatarDecimal(valor);
}

export function formatarKg(valor) {
  return formatarDecimal(valor);
}

export function formatarPercentual(valor) {
  return formatarPercentualBase(valor, {
    casas: 2,
    vazios: [null, undefined, ""],
    vazio: "—",
    invalido: "—",
  });
}

export function formatarMoeda(valor) {
  return formatarMoedaBase(valor, { vazios: [null, undefined, ""], vazio: "—", invalido: "—" });
}

export function formatarPrecoUnitario(valor) {
  return formatarMoeda(valor);
}
