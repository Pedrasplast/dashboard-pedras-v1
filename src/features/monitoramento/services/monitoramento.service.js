import { supabase } from "@/lib/supabaseClient";

import { LIMITE_HISTORICO } from "../constants/monitoramento.constants";

/* =========================================================
   MONITORAMENTO — SERVIÇO

   Leitura somente pelas funções do banco (só administradores):
   - monitor_rotinas(): uma linha por rotina automática.
   - monitor_historico_execucoes(rotina): últimas execuções da rotina.
   - monitor_banco(): tamanho do banco (gravado 1x por dia).
   - monitor_resumo(): contagem de rotinas com erro (aviso do menu).
   - monitor_definir_rotina_ativa(rotina, ativa, motivo, retomar_em):
     pausa (com motivo e "até quando") ou retoma.
   - monitor_rodar_agora(rotina): dispara na hora (com trava).
   - monitor_painel_dia(): linha do dia, termômetro do Omie e
     progresso da conferência completa, numa consulta pequena.
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

export async function buscarBanco() {
  const { data, error } = await supabase.rpc("monitor_banco");

  if (error) {
    throw new Error(`Erro ao consultar o tamanho do banco: ${error.message}`);
  }

  return data?.[0] ?? null;
}

/*
 * Pausa (ativa = false) ou retoma (ativa = true) a rotina no agendador.
 * Na pausa: motivo opcional e retomarEm (Date) para voltar sozinha.
 */
export async function definirRotinaAtiva(rotina, ativa, { motivo = null, retomarEm = null } = {}) {
  const { error } = await supabase.rpc("monitor_definir_rotina_ativa", {
    p_rotina: rotina,
    p_ativa: Boolean(ativa),
    p_motivo: ativa ? null : motivo || null,
    p_retomar_em: ativa || !retomarEm ? null : new Date(retomarEm).toISOString(),
  });

  if (error) {
    throw new Error(`Não foi possível ${ativa ? "retomar" : "pausar"} a rotina: ${error.message}`);
  }

  return Boolean(ativa);
}

export async function buscarResumo() {
  const { data, error } = await supabase.rpc("monitor_resumo");

  if (error) {
    throw new Error(`Erro ao consultar o resumo do monitoramento: ${error.message}`);
  }

  return data?.[0] ?? { rotinas_com_erro: 0, banco_nivel: null };
}

/* Dispara a rotina agora. { disparada: false } = o comando não tinha o que fazer. */
export async function rodarAgora(rotina) {
  const { data, error } = await supabase.rpc("monitor_rodar_agora", { p_rotina: rotina });

  if (error) {
    throw new Error(error.message);
  }

  return { disparada: Boolean(data?.disparada) };
}

export async function buscarPainelDia() {
  const { data, error } = await supabase.rpc("monitor_painel_dia");

  if (error) {
    throw new Error(`Erro ao consultar o painel do dia: ${error.message}`);
  }

  return data ?? null;
}
