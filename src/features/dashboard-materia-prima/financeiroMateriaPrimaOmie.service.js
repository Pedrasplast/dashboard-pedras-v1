import { supabase } from "@/lib/supabaseClient";

import { CAMPOS_OMIE, VIEW_OMIE, montarFinanceiroOmie } from "./origemOmie.js";

/* =========================================================
   FINANCEIRO MATÉRIA-PRIMA — ORIGEM OMIE

   Lê a view dashboard_mp_compras_omie (rotina
   sincronizar-dashboard-mp-omie). Não toca na base manual.
========================================================= */

const LIMITE = 5000;

export async function buscarFinanceiroMateriaPrimaOmie({
  dataInicial,
  dataFinal,
  tipoData = "compra",
}) {
  if (!dataInicial || !dataFinal) {
    return { compras: [], recebimentos: [] };
  }

  const porRecebimento = tipoData === "recebimento";

  let consulta = supabase.from(VIEW_OMIE).select(CAMPOS_OMIE);

  if (porRecebimento) {
    // Recebido em (NF de entrada) no período; sem NF, a previsão de entrega.
    consulta = consulta
      .gt("quantidade_recebida", 0)
      .or(
        `and(data_recebimento.gte.${dataInicial},data_recebimento.lte.${dataFinal}),` +
          `and(data_recebimento.is.null,data_previsao.gte.${dataInicial},data_previsao.lte.${dataFinal})`,
      );
  } else {
    consulta = consulta.gte("data_inclusao", dataInicial).lte("data_inclusao", dataFinal);
  }

  const { data, error } = await consulta
    .order("data_inclusao", { ascending: true })
    .order("cod_ped_compra", { ascending: true })
    .order("codigo_item", { ascending: true })
    .limit(LIMITE);

  if (error) throw error;

  return montarFinanceiroOmie(data, {
    dataInicial,
    dataFinal,
    tipoData: porRecebimento ? "recebimento" : "compra",
  });
}
