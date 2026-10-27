import { formatarKg, formatarMoeda } from "../dashboardMateriaPrimaUtils.js";
import {
  formatarNumeroPtBR,
  formatarNumeroCasasFixas,
  formatarDuasCasas,
} from "@/shared/lib/formatar";

/* =========================================================
   PERCENTUAL
========================================================= */

export function formatarPercentual(valor) {
  if (valor === null || valor === undefined || !Number.isFinite(Number(valor))) {
    return "-";
  }

  return `${formatarDuasCasas(Number(valor))}%`;
}

/* =========================================================
   DIAS
========================================================= */

export function formatarDias(valor) {
  if (valor === null || valor === undefined || !Number.isFinite(Number(valor))) {
    return "-";
  }

  return `${formatarNumeroCasasFixas(valor, 1)} dias`;
}

/* =========================================================
   MOEDA COMPACTA

   Utilizada nos rankings onde existe pouco espaço.
========================================================= */

export function formatarMoedaCompacta(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "R$ 0";
  }

  if (Math.abs(numero) >= 1000000) {
    return `R$ ${formatarNumeroPtBR(numero / 1000000, {
      minimumFractionDigits: 1,

      maximumFractionDigits: 1,
    })} mi`;
  }

  if (Math.abs(numero) >= 1000) {
    return `R$ ${formatarNumeroPtBR(numero / 1000, {
      minimumFractionDigits: 0,

      maximumFractionDigits: 1,
    })} mil`;
  }

  return formatarMoeda(numero, 0);
}

/* =========================================================
   MOEDA COMPLETA

   Utilizada no gráfico mensal.

   Exemplos:
   R$ 848.388
   R$ 1.100.000

   Nunca exibe:
   mil
   mi
========================================================= */

export function formatarMoedaCompleta(valor, casas = 0) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "R$ 0";
  }

  return formatarNumeroPtBR(numero, {
    style: "currency",

    currency: "BRL",

    minimumFractionDigits: casas,

    maximumFractionDigits: casas,
  });
}

/* =========================================================
   KG COMPACTO

   Utilizado nos rankings por fornecedor.
========================================================= */

export function formatarKgCompacto(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "0 kg";
  }

  if (Math.abs(numero) >= 1000000) {
    return `${formatarDuasCasas(numero / 1000000)} mi kg`;
  }

  if (Math.abs(numero) >= 1000) {
    return `${formatarDuasCasas(numero / 1000)} mil kg`;
  }

  return formatarKg(numero);
}

/* =========================================================
   KG COMPLETO

   Utilizado no gráfico mensal.

   Exemplos:
   113.800 kg
   204.580 kg
========================================================= */

export function formatarKgCompleto(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "0 kg";
  }

  return `${formatarDuasCasas(numero)} kg`;
}
