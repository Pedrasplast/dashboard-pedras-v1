/* =========================================================
   EVOLUÇÃO MENSAL DO FINANCEIRO — REGRAS
   ---------------------------------------------------------
   Funções puras e constantes usadas pela tela; movidas do
   componente sem alteração.
========================================================= */

import { formatarNumeroPtBR } from "@/shared/lib/formatar";
import { paraNumero } from "@/shared/lib/numeros";

/* =========================================================
   MESES
========================================================= */

export const MESES = Object.freeze([
  { valor: 1, nome: "Janeiro" },
  { valor: 2, nome: "Fevereiro" },
  { valor: 3, nome: "Março" },
  { valor: 4, nome: "Abril" },
  { valor: 5, nome: "Maio" },
  { valor: 6, nome: "Junho" },
  { valor: 7, nome: "Julho" },
  { valor: 8, nome: "Agosto" },
  { valor: 9, nome: "Setembro" },
  { valor: 10, nome: "Outubro" },
  { valor: 11, nome: "Novembro" },
  { valor: 12, nome: "Dezembro" },
]);

/* =========================================================
   AUXILIARES
========================================================= */

export function formatarMoeda(valor) {
  return formatarNumeroPtBR(paraNumero(valor), {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatarMoedaCompacta(valor) {
  return formatarNumeroPtBR(paraNumero(valor), {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  });
}

export function formatarPercentual(valor) {
  if (valor === null || valor === undefined || !Number.isFinite(Number(valor))) {
    return "-";
  }

  return `${formatarNumeroPtBR(Number(valor), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

export function calcularPercentual(numerador, denominador) {
  const base = paraNumero(denominador);

  if (base === 0) {
    return null;
  }

  return (paraNumero(numerador) / Math.abs(base)) * 100;
}
