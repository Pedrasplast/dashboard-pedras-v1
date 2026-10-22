import { supabase } from "@/lib/supabaseClient";

import { LIMITE_HISTORICO } from "../constants/monitoramento.constants";

/* =========================================================
   MONITORAMENTO — SERVIÇO

   Leitura somente pelas funções do banco (só administradores):
   - monitor_rotinas(): uma linha por rotina automática.
   - monitor_historico_execucoes(rotina): últimas execuções da rotina.
   A tabela monitor_execucoes não é acessível diretamente.
========================================================= */

export async function buscarRotinas() {
  const { data, error } = await supabase.rpc("monitor_rotinas");

  if (error) {
    throw new Error(`Erro ao consultar as rotinas: ${error.message}`);
  }

  return data ?? [];
}

export async function buscarHistorico(rotina) {
  const { data, error } = await supabase.rpc("monitor_historico_execucoes", {
    p_rotina: rotina,
    p_limite: LIMITE_HISTORICO,
  });

  if (error) {
    throw new Error(`Erro ao consultar o histórico: ${error.message}`);
  }

  return data ?? [];
}
