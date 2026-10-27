/* =========================================================
   DASHBOARD DE PARADAS - FORMATADORES
   ---------------------------------------------------------
   Formato numérico usado em todos os cards e gráficos de
   paradas. Aceita número ou texto ("1.234,5"); vazio ou
   inválido aparece como 0.
========================================================= */

import { formatarNumeroPtBR, formatarDuasCasas } from "@/shared/lib/formatar";
import { converterNumeroFlexivel } from "@/shared/lib/numeros";

/** Inteiro sem casas decimais ("1.235"). */
export function formatarNumero(valor) {
  return formatarNumeroPtBR(converterNumeroFlexivel(valor), {
    maximumFractionDigits: 0,
  });
}

/** Sempre 2 casas decimais, sem o símbolo "%" ("12,50"). */
export function formatarPercentual(valor) {
  return formatarDuasCasas(converterNumeroFlexivel(valor));
}
