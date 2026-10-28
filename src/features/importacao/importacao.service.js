import { supabase } from "@/lib/supabaseClient";

/* =========================================================
   IMPORTAÇÃO DA ABA BANCO
========================================================= */

export async function inserirLoteImportacao(tabelaDestino, lote) {
  const { error } = await supabase.from(tabelaDestino).insert(lote);

  if (error) {
    throw error;
  }
}
