/* =========================================================
   EXPORTAÇÃO - FUNÇÕES COMUNS AO PDF E AO EXCEL
========================================================= */

import { formatarDataHora } from "@/shared/lib/datas";

/** Linha de "TOTAL GERAL" (em qualquer coluna). */
export function linhaEhTotalGeral(item) {
  return Object.values(item || {}).some(
    (valor) =>
      String(valor ?? "")
        .trim()
        .toUpperCase() === "TOTAL GERAL",
  );
}

/** Data e hora atuais para o cabeçalho do arquivo ("DD/MM/AAAA, HH:MM"). */
export function obterDataHoraEmissao() {
  return formatarDataHora(new Date());
}
