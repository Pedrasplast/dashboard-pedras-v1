/* =========================================================
   DASHBOARD DE PARADAS - FORMATADORES
   ---------------------------------------------------------
   Formato numérico usado em todos os cards e gráficos de
   paradas. Vazio/0 aparece como "0".
========================================================= */

import { formatarNumeroPtBR } from "@/shared/lib/formatar";

/** Inteiro sem casas decimais ("1.235"). */
export function formatarNumero(valor) {
  return formatarNumeroPtBR(Number(valor || 0), {
    maximumFractionDigits: 0,
  });
}

/** Sempre 1 casa decimal, sem o símbolo "%" ("12,5"). */
export function formatarPercentual(valor) {
  return formatarNumeroPtBR(Number(valor || 0), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
